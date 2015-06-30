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

function Inspector(proxyHostPort, opts) {
  opts = opts || {}
  var proxyHostPort = proxyHostPort.split(':');
  var proxyHost = proxyHostPort[0] || 'localhost';
  var proxyPort = proxyHostPort[1] || 5050;
  var path = opts.path || '/spectral/inspect';

  logger('inspector').log('Connecting to ' + proxyHost + ':' + proxyPort);

  http.get({
      hostname: proxyHost,
      port: proxyPort,
      path: path,
    }, function(res) {
      logger('inspector').log(res);
    }).on('connect', function(err) {
      logger('inspector').log('Connected to ' + proxyHost + ':' + proxyPort);
    }).on('error', function(err) {
      logger('inspector').log('Failed to connect to ' + proxyHost + ':' + proxyPort);
      logger('inspector').log(err.message);
    });

}


module.exports = function(proxyHostPort, opts) {
  return new Inspector(proxyHostPort, opts);
}
