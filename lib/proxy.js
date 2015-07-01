/*
 * Copyright (c) 2015 Dickson Tam
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 */

var http = require('http');
var logger = require('./logger.js');
var screener = require('./screener.js');

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

  server.listen(opts.port);
}

Proxy.prototype.close = function() {
  this.proxy.close();
}

Proxy.prototype.request = function(req, res) {
  var to = parseHostPort(req.headers['host']);

  if (req.url == '/spectral/inspect') {
    logger('proxy').log('Client connected to /spectral/inspect API endpoint');
    this.apiRequest(req, res);
  } else if (opts.target) {
    this.proxyRequest(req, res, opts.target);
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
