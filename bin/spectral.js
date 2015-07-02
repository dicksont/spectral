#!/usr/bin/env node
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

var program = require('commander')
  .version('0.0.0')

var logger = require('../lib/logger.js');

program
  .command('proxy [target-hostname-port]')
  .option('-P, --port <port>', 'local port to bind to')
  .option('-H, --hostname <hostname>', 'only bind proxy requests coming in on the interface associated with this hostname')
  .action(function(target, opts) {
    var proxy = require('../lib/proxy.js');

    opts = opts || {}
    opts.port = opts.port || 5050;

    if (target) {
      opts.target = target;
    }

    proxy.createServer(opts);
  });


program
  .command('inspect <proxy-hostname-port>')
  .action(function(target, opts) {
    var createInspector = require('../lib/inspector.js');
    createInspector(target);
  })


program.parse(process.argv);
