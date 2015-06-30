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
