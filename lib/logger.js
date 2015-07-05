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



var chalk = require('chalk');
var string = require('string-etc').wrap(['pad', 'chunk']);
var padder = require('./padder.js');
var http = require('http');

var _thread = null;
var logct = 0;
var columnWidth = 100;

function formatRawHeaders(req) {
  var headers = req.rawHeaders || [];
  var str = "";
  for (var i=0; i < headers.length; i+=2) {
    var extraPadding = headers[i].length + 2
    var chunks = string(headers[i+1]).chunk(columnWidth - (extraPadding + padder.padding));
    str += ((i >0)? padder.pad('') : '') + chalk.bold(headers[i] + ': ') + chunks.shift() + "\r\n";

    padder.adjustPadding(extraPadding);

    while (chunks.length > 0) {
      str += padder.pad('') + chunks.shift() + "\r\n";
    }

    padder.adjustPadding(-1 * extraPadding);
  }
  return str;
}


module.exports = function(thread) {

  function logLine(line) {
    var header;

    if (thread == _thread || thread == 'request' || thread == 'response') {
      header = padder.pad('');
    } else {
      header = logct? '\n' : '';
      header += padder.pad('[' + thread + ']');
    }

    console.log(header + line);
  }

  function log(msg) {
    if (msg instanceof http.IncomingMessage) {
      logIncomingMessage(msg);
    } else {
      logLine(msg);
    }



    _thread = thread;
    logct++;
  }

  function logIncomingMessage(msg) {
    var socket = msg.socket;
    var oldpad;

    if (thread == 'request') {
      oldpad = padder.setPadding(0);
      logLine(new Date());

      /*logLine(socket.remoteAddress + ' ->' + socket.localAddress);
      logLine(socket.remotePort + ' -> ' + socket.localPort);
      padder.adjustPadding(3);
      */
      logLine(chalk.bold.red(msg.method + ' ' + msg.url + ' HTTP/' + msg.httpVersion));

    } else if (thread == 'response') {
      oldpad = padder.setPadding(3);

      /*logLine(socket.remoteAddress + ' -> ' +  socket.localAddress);
      logLine(socket.remotePort + ' -> ' + socket.localPort);

      padder.adjustPadding(3);
      */
      logLine(chalk.bold.red('HTTP/' + msg.httpVersion + ' ' + msg.statusCode + ' ' + msg.statusMessage));

    }


    log(formatRawHeaders(msg));
    padder.setPadding(oldpad);
  }

  return {
   log: log
  }

}
