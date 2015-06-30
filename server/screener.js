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


function createScreener(oreq, ores, opts) {

  function passAllFilter(req, res) {
    return true;
  };

  opts = opts || {};

  var filter = opts.filter || passAllFilter;
  var count = opts.count || 1;

  return function(req, res) {

    if (!count || !filter(req,res)) return count;

    ores.writeHead(200, {
      'Server' : 'spectral-0.0.1',
      'Transfer-Encoding': 'chunked',
      'Content-Type' : 'text/plain',
      'Cache-Control' : 'private, max-age=0, no-cache'
    });

    (res || req).addListener('data', function(chunk) {
      ores.write(chunk, 'binary');
    });

    if (--count == 0) ores.end();

    return count;
  }
}

module.exports = createScreener;
