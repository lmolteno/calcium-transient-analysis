/**
 * Copyright 2017 John Hurliman <jhurliman.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Produces the same result as numpy.convolve(array, weights, 'same');
 */
export function convolve(array: number[], weights: number[]) {
  if (weights.length % 2 !== 1)
    throw new Error('weights array must have an odd length');

  var al = array.length;
  var wl = weights.length;
  var offset = ~~(wl / 2);
  var output = new Array(al);

  for (var i = 0; i < al; i++) {
    var kmin = (i >= offset) ? 0 : offset - i;
    var kmax = (i + offset < al) ? wl - 1 : al - 1 - i + offset;

    output[i] = 0;
    for (var k = kmin; k <= kmax; k++)
      output[i] += array[i - offset + k] * weights[k];
  }

  return output;
}
