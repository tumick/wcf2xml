'use strict';

/**
 * Helper module with a little set of functions for bignum arithmetic.
 * @module
 */

/**
 * Convert ordinary number to big number (array of bytes or, in other words, 256-based digits)
 * @function
 * @param {number} n - The number to convert
 * @returns {[]} Array of bytes representation of given number
 */
exports.n2a = function(n){
  var a = [];
  do {
    a.push(n & 0xff);
    n >>>= 8;
  } while (n > 0);
  return a;
};

/**
 * Add two big numbers
 * @function
 * @param {[]} a - The first summand
 * @param {[]} b - The second summand
 * @returns {[]} Sum of a and b
 */
exports.add = function(a, b){
  var c = [];
  var i, n1, n2;
  if(a.length > b.length){
    n1 = a;
    n2 = b;
  } else {
    n1 = b;
    n2 = a;
  }
  for(i = 0; i < n1.length; i++)
    c.push(n1[i]);
  c.push(0);
  for(i = 0; i < n2.length; i++){
    c[i] += n2[i];
    if(c[i] >= 0x100) {
      c[i + 1] += c[i] >>> 8;
      c[i] &= 0xff;
    }
  }
  if(c.length > 1 && c[c.length - 1] == 0)
    c.pop();
  return c;
};

/**
 * Subtract two big numbers (return zero if the first argument is smaller then the second)
 * @function
 * @param {[]} a - The first operand of subtraction (minuend)
 * @param {[]} b - The second operand of subtraction (subtrahend)
 * @returns {[]} Residual of a subtract b
 */
exports.sub = function(a, b){
  if(exports.cmp(a, b) <= 0)
    return [0];
  var c = [];
  var i = 0;
  var d;
  while(i < b.length){
    d = a[i];
    if(d < b[i]){
      d += 0x100;
      a[i + 1]--;
    }
    c[i] = d - b[i];
    i++;
  }
  while(i < a.length){
    d = a[i];
    if(d < 0){
      d += 0x100;
      a[i + 1]--;
    }
    c[i] = d;
    i++;
  }
  if(c.length > 1 && c[c.length - 1] == 0)
    c.pop();
  return c;
};

/**
 * Multiply two big numbers
 * @function
 * @param {[]} a - The first multiplier
 * @param {[]} b - The second multiplier
 * @returns {[]} Multiplication of a and b
 */
exports.mul = function(a, b){
  var c = [];
  var i, j;
  for(i = 0; i < a.length * b.length; i++)
    c.push(0);
  var d;
  for(i = 0; i < a.length; i++)
    for(j = 0; j < b.length; j++) {
      d = a[i] * b[j];
      c[i + j] += d & 0xff;
      c[i + j + 1] += d >>> 8;
    }
  for(i = 0; i < c.length - 1; i++)
    if(c[i] >= 0x100) {
      c[i + 1] += c[i] >>> 8;
      c[i] &= 0xff;
    }
  while(c.length > 1 && c[c.length - 1] == 0)
    c.pop();
  return c;
};

/**
 * Compare two big numbers (return 1 if the first is greater, -1 if the second is greater, 0 if number are equal
 * @function
 * @param {[]} a - The first number to compare
 * @param {[]} b - The second number to compare
 * @returns {number} Comparison result: 1 if a > b, 0 if a == b, -1 if a < b
 */
exports.cmp = function(a, b){
  if(a.length > b.length)
    return 1;
  if(b.length > a.length)
    return -1;
  for(var i = a.length - 1; i >= 0; i--) {
    if (a[i] > b[i])
      return 1;
    if (b[i] > a[i])
      return -1;
  }
  return 0;
};

/**
 * "Shift left" big number at specified 256-based positions
 * @function
 * @param {[]} n - The number to shift
 * @param {number} d - Amount of positions to shift left
 * @returns {[]} n shifted left by d 256-based position
 */
exports.shl = function(n, d){
  for(var i = 0; i < d; i++)
    n.unshift(0);
  return n;
};

/**
 * Make a copy of big number
 * @function
 * @param {[]} n - Number to copy
 * @returns {[]} A copy of n
 */
exports.copy = function(n){
  var a = [];
  for(var i = 0; i < n.length; i++)
    a[i] = n[i];
  return a;
};

/**
 * Returns hexadecimal (16-based) representation of given big number
 * @function
 * @param {[]} n - Number to represent
 * @returns {string} Hexadecimal representation of n
 */
exports.hex = function(n){
  var res = '';
  for(var i = n.length - 1; i >= 0; i--)
    res += exports.md(n[i].toString(16), i == n.length - 1 ? 1 : 2);
  return res;
};

/**
 * Returns true if big number is equal to zero, false otherwise
 * @function
 * @param {[]} n - Number to compare with zero
 * @returns {boolean} true if n == 0, false otherwise
 */
exports.zero = function(n){
  return n.length == 0 || n.length == 1 && n[0] == 0;
};

/**
 * Returns decimal (10-based) representation of big number
 * If the second argument (size) specified and is greater then zero,
 * treat given big number as signed with size count of 256-based digits
 * (e.g.: 8 for 64-bit integers)
 * @function
 * @param {[]} n - Number to represent
 * @param {number} [size] - Amount of bytes to treat given number as signed (e.g.: 8 for 64-bit signed integers)
 * @returns {string} Decimal representation of n
 */
exports.dec = function(n, size){
  if(!size || n.length < size || n.length == size && n[size - 1] < 0x80)
    return decu(n);
  var a = [];
  for(var i = 0; i < size; i++)
    a.push(0);
  a.push(1);
  return "-" + decu(exports.sub(a, n.slice(0, size)));
};

/**
 * Given string representation v of number left-pads with zeroes to reach d digits
 * @function
 * @param {string} v - String representation of number
 * @param {number} d - Minimum count of digits
 * @returns {string} Same number as v, but left-padded with zeroes to reach d digits
 */
exports.md = function(v, d){
  var a = v.length && v.charAt(0) == "-" ? 1 : 0;
  while(v.length < d + a) {
    if (v.charAt(0) == "-")
      v = "-0" + v.slice(1);
    else
      v = "0" + v;
  }
  return v;
};

/**
 * Helper function: returns decimal (10-based) representation of unsigned big number
 * @param {[]} n - Number to represent
 * @returns {string} Decimal representation of n treated as unsigned
 */
function decu(n){
  var res = "";
  var a = exports.copy(n);
  var dm;
  while(!exports.zero(a)){
    dm = div10(a);
    a = dm.div;
    res = dm.mod + res;
  }
  if(!res.length)
    return "0";
  return res;
}

/**
 * Helper function: find div and mod of a given big number divided by 10
 * @param {[]} n - Number (dividend) to divide by 10 (divisor)
 * @returns {{div: number, mod: number}} Result of division n by 10, consisting of div (quotient) and mod (remainder)
 */
function div10(n){
  var c = [];
  var i = n.length - 1;
  var d = n[i];
  do {
    if(d < 10 && i > 0)
      d = d * 0x100 + n[--i];
    c.unshift((d - (d % 10))/10);
    d = d % 10;
  } while (i > 0);
  while(c.length > 1 && c[c.length - 1] == 0)
    c.pop();
  return {
    div: c,
    mod: d
  }
}
