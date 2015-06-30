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
var extend = require('extend');
var logger = require('../common/logger.js');
var screener = require('./screener.js');

function Proxy(opts) {

  if (typeof(opts) == "number") {
      opts = { targetPort: opts };
  }

  this.cfg = opts = opts || {};
  opts.port = opts.port || 5050;
  opts.targetHost = opts.targetHost || 'localhost';
  opts.targetPort = opts.targetPort || 8080;

  this.screeners = [];
  this.request = this.request.bind(this);

  var server = this.server = http.createServer(this.request);

  server.on('listening', function() {
    logger('spectral').log('Created proxy server');
    logger('spectral').log('Forwarding requests on ' + opts.port + ' => ' + opts.targetHost + ":" + opts.targetPort);
  });

  server.on('error', function(err) {
    if (err.code == 'EADDRINUSE' && err.syscall == 'listen') {
      logger('spectral').log('ERROR! Server unable to bind to port: ' + opts.port);
    } else {
      logger('spectral').log(JSON.stringify(err));
      process.exit();
    }

  })

  server.listen(opts.port);

;
}

Proxy.prototype.close = function() {
  this.proxy.close();
}

Proxy.prototype.request = function(req, res) {
  if (req.url == '/spectral/screen') {
    this.apiRequest(req, res);
  } else {
    this.proxyRequest(req, res);
  }

}

Proxy.prototype.proxyRequest = function(req, res) {

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
    hostname: this.cfg.targetHost,
    port: this.cfg.targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers
  });


  mreq.on('error', function(err) {
    logger('spectral').log('Failed to connect to ' + cfg.targetHost + ':' + this.cfg.targetPort);
    logger('spectral').log(err.message);
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
