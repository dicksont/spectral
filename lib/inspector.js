/*
 * Copyright (c) 2015, Dickson Tam
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. All advertising materials mentioning features or use of this software
 *    must display the following acknowledgement:
 *    This product includes software developed by Dickson Tam.
 * 4. Neither the name of Dickson Tam nor the names of its contributors may be
 *    used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY Dickson Tam ''AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL Dickson Tam BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
