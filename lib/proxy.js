/*
 * Copyright (c) 2015, Dickson Tam
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of Dickson Tam nor the names of its contributors may be
 *    used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 */






var http = require('http');
var logger = require('./logger.js');
var screener = require('./screener.js');
var dns = require('dns');
var dns = require('dnscache')({enable: true});

function parseHostPort(str, defaults) {

  var host = 'localhost';
  var port = 8080;
  var parts = str.split(':');

  if (parts.length > 1) {
    host = parts[0];
    port = parts[1];
  } else if (!isNaN(Number.parseInt(parts[0]))) {
    port = parts[0];

    if (!defaults.host)
      throw new Error('spectral: Unable to determine host in string: ' + str);

    host = defaults.host;

  } else {
    host = parts[0];

    if (!defaults.port)
      throw new Error('spectral: Unable to determine port in string: ' + str);

    port = defaults.port;
  }

  return {
    host: host,
    port: +port
  }
}


function Proxy(opts) {


  opts = opts || {};
  this.cfg = opts;
  opts.port = opts.port || 5050;

  opts.target  = (opts.target == undefined)? undefined : parseHostPort(opts.target, { host: 'localhost', port: '8080'});

  this.screeners = [];
  this.request = this.request.bind(this);

  var server = this.server = http.createServer(this.request);

  server.on('listening', function() {
    logger('proxy').log('Created proxy server');

    if (opts.target) {
      logger('proxy').log('Forwarding requests on ' + opts.port + ' => ' + opts.target.host + ":" + opts.target.port);
    } else {
      logger('proxy').log('Proxying requests on ' + opts.port);
    }

  });

  server.on('error', function(err) {
    if (err.code == 'EADDRINUSE' && err.syscall == 'listen') {
      logger('proxy').log('ERROR! Server unable to bind to port:' + opts.port);
    } else {
      logger('proxy').log(JSON.stringify(err));
      process.exit();
    }

  })

  if (opts.hostname) {
    server.listen(opts.port, opts.hostname);
  } else {
    server.listen(opts.port);
  }


}


Proxy.prototype.setLocalInterfaces = function(hostname) {
  var self = this;
  this.interfaces = [];
  if (hostname) {
    dns.lookup(hostname, function(err, address, family) {
      if (err) return;
      this.interfaces.push(address);
    });
  }
}



Proxy.prototype.close = function() {
  this.proxy.close();
}

Proxy.prototype.request = function(req, res) {

  var to = parseHostPort(req.headers['host']);

  if (req.url == '/spectral/inspect') {
    logger('proxy').log('Client connected to /spectral/inspect API endpoint');
    this.apiRequest(req, res);
  } else if (this.cfg.target) {
    this.proxyRequest(req, res, this.cfg.target);
  } else {

    if (to.host != 'localhost') {
      this.proxyRequest(req, res, to);
    } else {
      this.apiRequest(req, res);
    }

  }

}

Proxy.prototype.proxyRequest = function(req, res, target) {

  var screeners = this.screeners;

  function screen(req, res) {
    for (var i=screeners.length - 1; i >= 0; i--) {
      if (screeners[i](req) == 0) {
        screeners.splice(i,1);
      }
    }
  }

  function proxyResponse(mres) {

      mres.addListener('data', function(chunk) {
          res.write(chunk, 'binary');
      });

      mres.addListener('end', function() {
        logger('response').log(mres);
        res.end();
      })

      screen(mres);
      res.writeHead(mres.statusCode, mres.headers);

  }

  logger('request').log(req);

  screen(req);

  var mreq = http.request({
    hostname: target.host,
    port: target.port,
    path: req.url,
    method: req.method,
    headers: req.headers
  });


  mreq.on('error', function(err) {
    logger('proxy').log('Failed to connect to ' + mreq.hostname + ':' + mreq.port);
    logger('proxy').log(err.message);
  });

  mreq.on('response', proxyResponse);

  req.addListener('data', function(chunk) {
    mreq.write(chunk, 'binary');
  });

  req.addListener('end', function() {
    mreq.end();
  });
}

Proxy.prototype.apiRequest = function(req, res) {
  this.screeners.push(screener(req, res));
}


function createServer(opts) {
  return new Proxy(opts);
}

module.exports = {
  createServer: createServer
}
