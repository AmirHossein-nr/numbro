(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.numbro = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
;(function (globalObject) {
  'use strict';

/*
 *      bignumber.js v8.1.1
 *      A JavaScript library for arbitrary-precision arithmetic.
 *      https://github.com/MikeMcl/bignumber.js
 *      Copyright (c) 2019 Michael Mclaughlin <M8ch88l@gmail.com>
 *      MIT Licensed.
 *
 *      BigNumber.prototype methods     |  BigNumber methods
 *                                      |
 *      absoluteValue            abs    |  clone
 *      comparedTo                      |  config               set
 *      decimalPlaces            dp     |      DECIMAL_PLACES
 *      dividedBy                div    |      ROUNDING_MODE
 *      dividedToIntegerBy       idiv   |      EXPONENTIAL_AT
 *      exponentiatedBy          pow    |      RANGE
 *      integerValue                    |      CRYPTO
 *      isEqualTo                eq     |      MODULO_MODE
 *      isFinite                        |      POW_PRECISION
 *      isGreaterThan            gt     |      FORMAT
 *      isGreaterThanOrEqualTo   gte    |      ALPHABET
 *      isInteger                       |  isBigNumber
 *      isLessThan               lt     |  maximum              max
 *      isLessThanOrEqualTo      lte    |  minimum              min
 *      isNaN                           |  random
 *      isNegative                      |  sum
 *      isPositive                      |
 *      isZero                          |
 *      minus                           |
 *      modulo                   mod    |
 *      multipliedBy             times  |
 *      negated                         |
 *      plus                            |
 *      precision                sd     |
 *      shiftedBy                       |
 *      squareRoot               sqrt   |
 *      toExponential                   |
 *      toFixed                         |
 *      toFormat                        |
 *      toFraction                      |
 *      toJSON                          |
 *      toNumber                        |
 *      toPrecision                     |
 *      toString                        |
 *      valueOf                         |
 *
 */


  var BigNumber,
    isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,
    hasSymbol = typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol',

    mathceil = Math.ceil,
    mathfloor = Math.floor,

    bignumberError = '[BigNumber Error] ',
    tooManyDigits = bignumberError + 'Number primitive has more than 15 significant digits: ',

    BASE = 1e14,
    LOG_BASE = 14,
    MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
    // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
    POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
    SQRT_BASE = 1e7,

    // EDITABLE
    // The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
    // the arguments to toExponential, toFixed, toFormat, and toPrecision.
    MAX = 1E9;                                   // 0 to MAX_INT32


  /*
   * Create and return a BigNumber constructor.
   */
  function clone(configObject) {
    var div, convertBase, parseNumeric,
      P = BigNumber.prototype = { constructor: BigNumber, toString: null, valueOf: null },
      ONE = new BigNumber(1),


      //----------------------------- EDITABLE CONFIG DEFAULTS -------------------------------


      // The default values below must be integers within the inclusive ranges stated.
      // The values can also be changed at run-time using BigNumber.set.

      // The maximum number of decimal places for operations involving division.
      DECIMAL_PLACES = 20,                     // 0 to MAX

      // The rounding mode used when rounding to the above decimal places, and when using
      // toExponential, toFixed, toFormat and toPrecision, and round (default value).
      // UP         0 Away from zero.
      // DOWN       1 Towards zero.
      // CEIL       2 Towards +Infinity.
      // FLOOR      3 Towards -Infinity.
      // HALF_UP    4 Towards nearest neighbour. If equidistant, up.
      // HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
      // HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
      // HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
      // HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
      ROUNDING_MODE = 4,                       // 0 to 8

      // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

      // The exponent value at and beneath which toString returns exponential notation.
      // Number type: -7
      TO_EXP_NEG = -7,                         // 0 to -MAX

      // The exponent value at and above which toString returns exponential notation.
      // Number type: 21
      TO_EXP_POS = 21,                         // 0 to MAX

      // RANGE : [MIN_EXP, MAX_EXP]

      // The minimum exponent value, beneath which underflow to zero occurs.
      // Number type: -324  (5e-324)
      MIN_EXP = -1e7,                          // -1 to -MAX

      // The maximum exponent value, above which overflow to Infinity occurs.
      // Number type:  308  (1.7976931348623157e+308)
      // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
      MAX_EXP = 1e7,                           // 1 to MAX

      // Whether to use cryptographically-secure random number generation, if available.
      CRYPTO = false,                          // true or false

      // The modulo mode used when calculating the modulus: a mod n.
      // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
      // The remainder (r) is calculated as: r = a - n * q.
      //
      // UP        0 The remainder is positive if the dividend is negative, else is negative.
      // DOWN      1 The remainder has the same sign as the dividend.
      //             This modulo mode is commonly known as 'truncated division' and is
      //             equivalent to (a % n) in JavaScript.
      // FLOOR     3 The remainder has the same sign as the divisor (Python %).
      // HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
      // EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
      //             The remainder is always positive.
      //
      // The truncated division, floored division, Euclidian division and IEEE 754 remainder
      // modes are commonly used for the modulus operation.
      // Although the other rounding modes can also be used, they may not give useful results.
      MODULO_MODE = 1,                         // 0 to 9

      // The maximum number of significant digits of the result of the exponentiatedBy operation.
      // If POW_PRECISION is 0, there will be unlimited significant digits.
      POW_PRECISION = 0,                    // 0 to MAX

      // The format specification used by the BigNumber.prototype.toFormat method.
      FORMAT = {
        prefix: '',
        groupSize: 3,
        secondaryGroupSize: 0,
        groupSeparator: ',',
        decimalSeparator: '.',
        fractionGroupSize: 0,
        fractionGroupSeparator: '\xA0',      // non-breaking space
        suffix: ''
      },

      // The alphabet used for base conversion. It must be at least 2 characters long, with no '+',
      // '-', '.', whitespace, or repeated character.
      // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
      ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';


    //------------------------------------------------------------------------------------------


    // CONSTRUCTOR


    /*
     * The BigNumber constructor and exported function.
     * Create and return a new instance of a BigNumber object.
     *
     * v {number|string|BigNumber} A numeric value.
     * [b] {number} The base of v. Integer, 2 to ALPHABET.length inclusive.
     */
    function BigNumber(v, b) {
      var alphabet, c, caseChanged, e, i, isNum, len, str,
        x = this;

      // Enable constructor call without `new`.
      if (!(x instanceof BigNumber)) return new BigNumber(v, b);

      if (b == null) {

        if (v && v._isBigNumber === true) {
          x.s = v.s;

          if (!v.c || v.e > MAX_EXP) {
            x.c = x.e = null;
          } else if (v.e < MIN_EXP) {
            x.c = [x.e = 0];
          } else {
            x.e = v.e;
            x.c = v.c.slice();
          }

          return;
        }

        if ((isNum = typeof v == 'number') && v * 0 == 0) {

          // Use `1 / n` to handle minus zero also.
          x.s = 1 / v < 0 ? (v = -v, -1) : 1;

          // Fast path for integers, where n < 2147483648 (2**31).
          if (v === ~~v) {
            for (e = 0, i = v; i >= 10; i /= 10, e++);

            if (e > MAX_EXP) {
              x.c = x.e = null;
            } else {
              x.e = e;
              x.c = [v];
            }

            return;
          }

          str = String(v);
        } else {

          if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);

          x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
        }

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

        // Exponential form?
        if ((i = str.search(/e/i)) > 0) {

          // Determine exponent.
          if (e < 0) e = i;
          e += +str.slice(i + 1);
          str = str.substring(0, i);
        } else if (e < 0) {

          // Integer.
          e = str.length;
        }

      } else {

        // '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
        intCheck(b, 2, ALPHABET.length, 'Base');

        // Allow exponential notation to be used with base 10 argument, while
        // also rounding to DECIMAL_PLACES as with other bases.
        if (b == 10) {
          x = new BigNumber(v);
          return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
        }

        str = String(v);

        if (isNum = typeof v == 'number') {

          // Avoid potential interpretation of Infinity and NaN as base 44+ values.
          if (v * 0 != 0) return parseNumeric(x, str, isNum, b);

          x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1;

          // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
          if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, '').length > 15) {
            throw Error
             (tooManyDigits + v);
          }
        } else {
          x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
        }

        alphabet = ALPHABET.slice(0, b);
        e = i = 0;

        // Check that str is a valid base b number.
        // Don't use RegExp, so alphabet can contain special characters.
        for (len = str.length; i < len; i++) {
          if (alphabet.indexOf(c = str.charAt(i)) < 0) {
            if (c == '.') {

              // If '.' is not the first character and it has not be found before.
              if (i > e) {
                e = len;
                continue;
              }
            } else if (!caseChanged) {

              // Allow e.g. hexadecimal 'FF' as well as 'ff'.
              if (str == str.toUpperCase() && (str = str.toLowerCase()) ||
                  str == str.toLowerCase() && (str = str.toUpperCase())) {
                caseChanged = true;
                i = -1;
                e = 0;
                continue;
              }
            }

            return parseNumeric(x, String(v), isNum, b);
          }
        }

        // Prevent later check for length on converted number.
        isNum = false;
        str = convertBase(str, b, 10, x.s);

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');
        else e = str.length;
      }

      // Determine leading zeros.
      for (i = 0; str.charCodeAt(i) === 48; i++);

      // Determine trailing zeros.
      for (len = str.length; str.charCodeAt(--len) === 48;);

      if (str = str.slice(i, ++len)) {
        len -= i;

        // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
        if (isNum && BigNumber.DEBUG &&
          len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) {
            throw Error
             (tooManyDigits + (x.s * v));
        }

         // Overflow?
        if ((e = e - i - 1) > MAX_EXP) {

          // Infinity.
          x.c = x.e = null;

        // Underflow?
        } else if (e < MIN_EXP) {

          // Zero.
          x.c = [x.e = 0];
        } else {
          x.e = e;
          x.c = [];

          // Transform base

          // e is the base 10 exponent.
          // i is where to slice str to get the first element of the coefficient array.
          i = (e + 1) % LOG_BASE;
          if (e < 0) i += LOG_BASE;  // i < 1

          if (i < len) {
            if (i) x.c.push(+str.slice(0, i));

            for (len -= LOG_BASE; i < len;) {
              x.c.push(+str.slice(i, i += LOG_BASE));
            }

            i = LOG_BASE - (str = str.slice(i)).length;
          } else {
            i -= len;
          }

          for (; i--; str += '0');
          x.c.push(+str);
        }
      } else {

        // Zero.
        x.c = [x.e = 0];
      }
    }


    // CONSTRUCTOR PROPERTIES


    BigNumber.clone = clone;

    BigNumber.ROUND_UP = 0;
    BigNumber.ROUND_DOWN = 1;
    BigNumber.ROUND_CEIL = 2;
    BigNumber.ROUND_FLOOR = 3;
    BigNumber.ROUND_HALF_UP = 4;
    BigNumber.ROUND_HALF_DOWN = 5;
    BigNumber.ROUND_HALF_EVEN = 6;
    BigNumber.ROUND_HALF_CEIL = 7;
    BigNumber.ROUND_HALF_FLOOR = 8;
    BigNumber.EUCLID = 9;


    /*
     * Configure infrequently-changing library-wide settings.
     *
     * Accept an object with the following optional properties (if the value of a property is
     * a number, it must be an integer within the inclusive range stated):
     *
     *   DECIMAL_PLACES   {number}           0 to MAX
     *   ROUNDING_MODE    {number}           0 to 8
     *   EXPONENTIAL_AT   {number|number[]}  -MAX to MAX  or  [-MAX to 0, 0 to MAX]
     *   RANGE            {number|number[]}  -MAX to MAX (not zero)  or  [-MAX to -1, 1 to MAX]
     *   CRYPTO           {boolean}          true or false
     *   MODULO_MODE      {number}           0 to 9
     *   POW_PRECISION       {number}           0 to MAX
     *   ALPHABET         {string}           A string of two or more unique characters which does
     *                                       not contain '.'.
     *   FORMAT           {object}           An object with some of the following properties:
     *     prefix                 {string}
     *     groupSize              {number}
     *     secondaryGroupSize     {number}
     *     groupSeparator         {string}
     *     decimalSeparator       {string}
     *     fractionGroupSize      {number}
     *     fractionGroupSeparator {string}
     *     suffix                 {string}
     *
     * (The values assigned to the above FORMAT object properties are not checked for validity.)
     *
     * E.g.
     * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
     *
     * Ignore properties/parameters set to null or undefined, except for ALPHABET.
     *
     * Return an object with the properties current values.
     */
    BigNumber.config = BigNumber.set = function (obj) {
      var p, v;

      if (obj != null) {

        if (typeof obj == 'object') {

          // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] DECIMAL_PLACES {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'DECIMAL_PLACES')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            DECIMAL_PLACES = v;
          }

          // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
          // '[BigNumber Error] ROUNDING_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'ROUNDING_MODE')) {
            v = obj[p];
            intCheck(v, 0, 8, p);
            ROUNDING_MODE = v;
          }

          // EXPONENTIAL_AT {number|number[]}
          // Integer, -MAX to MAX inclusive or
          // [integer -MAX to 0 inclusive, 0 to MAX inclusive].
          // '[BigNumber Error] EXPONENTIAL_AT {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'EXPONENTIAL_AT')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, 0, p);
              intCheck(v[1], 0, MAX, p);
              TO_EXP_NEG = v[0];
              TO_EXP_POS = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
            }
          }

          // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
          // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
          // '[BigNumber Error] RANGE {not a primitive number|not an integer|out of range|cannot be zero}: {v}'
          if (obj.hasOwnProperty(p = 'RANGE')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, -1, p);
              intCheck(v[1], 1, MAX, p);
              MIN_EXP = v[0];
              MAX_EXP = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              if (v) {
                MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
              } else {
                throw Error
                 (bignumberError + p + ' cannot be zero: ' + v);
              }
            }
          }

          // CRYPTO {boolean} true or false.
          // '[BigNumber Error] CRYPTO not true or false: {v}'
          // '[BigNumber Error] crypto unavailable'
          if (obj.hasOwnProperty(p = 'CRYPTO')) {
            v = obj[p];
            if (v === !!v) {
              if (v) {
                if (typeof crypto != 'undefined' && crypto &&
                 (crypto.getRandomValues || crypto.randomBytes)) {
                  CRYPTO = v;
                } else {
                  CRYPTO = !v;
                  throw Error
                   (bignumberError + 'crypto unavailable');
                }
              } else {
                CRYPTO = v;
              }
            } else {
              throw Error
               (bignumberError + p + ' not true or false: ' + v);
            }
          }

          // MODULO_MODE {number} Integer, 0 to 9 inclusive.
          // '[BigNumber Error] MODULO_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'MODULO_MODE')) {
            v = obj[p];
            intCheck(v, 0, 9, p);
            MODULO_MODE = v;
          }

          // POW_PRECISION {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] POW_PRECISION {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'POW_PRECISION')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            POW_PRECISION = v;
          }

          // FORMAT {object}
          // '[BigNumber Error] FORMAT not an object: {v}'
          if (obj.hasOwnProperty(p = 'FORMAT')) {
            v = obj[p];
            if (typeof v == 'object') FORMAT = v;
            else throw Error
             (bignumberError + p + ' not an object: ' + v);
          }

          // ALPHABET {string}
          // '[BigNumber Error] ALPHABET invalid: {v}'
          if (obj.hasOwnProperty(p = 'ALPHABET')) {
            v = obj[p];

            // Disallow if only one character,
            // or if it contains '+', '-', '.', whitespace, or a repeated character.
            if (typeof v == 'string' && !/^.$|[+-.\s]|(.).*\1/.test(v)) {
              ALPHABET = v;
            } else {
              throw Error
               (bignumberError + p + ' invalid: ' + v);
            }
          }

        } else {

          // '[BigNumber Error] Object expected: {v}'
          throw Error
           (bignumberError + 'Object expected: ' + obj);
        }
      }

      return {
        DECIMAL_PLACES: DECIMAL_PLACES,
        ROUNDING_MODE: ROUNDING_MODE,
        EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
        RANGE: [MIN_EXP, MAX_EXP],
        CRYPTO: CRYPTO,
        MODULO_MODE: MODULO_MODE,
        POW_PRECISION: POW_PRECISION,
        FORMAT: FORMAT,
        ALPHABET: ALPHABET
      };
    };


    /*
     * Return true if v is a BigNumber instance, otherwise return false.
     *
     * If BigNumber.DEBUG is true, throw if a BigNumber instance is not well-formed.
     *
     * v {any}
     *
     * '[BigNumber Error] Invalid BigNumber: {v}'
     */
    BigNumber.isBigNumber = function (v) {
      if (!v || v._isBigNumber !== true) return false;
      if (!BigNumber.DEBUG) return true;

      var i, n,
        c = v.c,
        e = v.e,
        s = v.s;

      out: if ({}.toString.call(c) == '[object Array]') {

        if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {

          // If the first element is zero, the BigNumber value must be zero.
          if (c[0] === 0) {
            if (e === 0 && c.length === 1) return true;
            break out;
          }

          // Calculate number of digits that c[0] should have, based on the exponent.
          i = (e + 1) % LOG_BASE;
          if (i < 1) i += LOG_BASE;

          // Calculate number of digits of c[0].
          //if (Math.ceil(Math.log(c[0] + 1) / Math.LN10) == i) {
          if (String(c[0]).length == i) {

            for (i = 0; i < c.length; i++) {
              n = c[i];
              if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
            }

            // Last element cannot be zero, unless it is the only element.
            if (n !== 0) return true;
          }
        }

      // Infinity/NaN
      } else if (c === null && e === null && (s === null || s === 1 || s === -1)) {
        return true;
      }

      throw Error
        (bignumberError + 'Invalid BigNumber: ' + v);
    };


    /*
     * Return a new BigNumber whose value is the maximum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.maximum = BigNumber.max = function () {
      return maxOrMin(arguments, P.lt);
    };


    /*
     * Return a new BigNumber whose value is the minimum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.minimum = BigNumber.min = function () {
      return maxOrMin(arguments, P.gt);
    };


    /*
     * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
     * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
     * zeros are produced).
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp}'
     * '[BigNumber Error] crypto unavailable'
     */
    BigNumber.random = (function () {
      var pow2_53 = 0x20000000000000;

      // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
      // Check if Math.random() produces more than 32 bits of randomness.
      // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
      // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
      var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
       ? function () { return mathfloor(Math.random() * pow2_53); }
       : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
         (Math.random() * 0x800000 | 0); };

      return function (dp) {
        var a, b, e, k, v,
          i = 0,
          c = [],
          rand = new BigNumber(ONE);

        if (dp == null) dp = DECIMAL_PLACES;
        else intCheck(dp, 0, MAX);

        k = mathceil(dp / LOG_BASE);

        if (CRYPTO) {

          // Browsers supporting crypto.getRandomValues.
          if (crypto.getRandomValues) {

            a = crypto.getRandomValues(new Uint32Array(k *= 2));

            for (; i < k;) {

              // 53 bits:
              // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
              // 11111 11111111 11111111 11111111 11100000 00000000 00000000
              // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
              //                                     11111 11111111 11111111
              // 0x20000 is 2^21.
              v = a[i] * 0x20000 + (a[i + 1] >>> 11);

              // Rejection sampling:
              // 0 <= v < 9007199254740992
              // Probability that v >= 9e15, is
              // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251
              if (v >= 9e15) {
                b = crypto.getRandomValues(new Uint32Array(2));
                a[i] = b[0];
                a[i + 1] = b[1];
              } else {

                // 0 <= v <= 8999999999999999
                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 2;
              }
            }
            i = k / 2;

          // Node.js supporting crypto.randomBytes.
          } else if (crypto.randomBytes) {

            // buffer
            a = crypto.randomBytes(k *= 7);

            for (; i < k;) {

              // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
              // 0x100000000 is 2^32, 0x1000000 is 2^24
              // 11111 11111111 11111111 11111111 11111111 11111111 11111111
              // 0 <= v < 9007199254740992
              v = ((a[i] & 31) * 0x1000000000000) + (a[i + 1] * 0x10000000000) +
                 (a[i + 2] * 0x100000000) + (a[i + 3] * 0x1000000) +
                 (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];

              if (v >= 9e15) {
                crypto.randomBytes(7).copy(a, i);
              } else {

                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 7;
              }
            }
            i = k / 7;
          } else {
            CRYPTO = false;
            throw Error
             (bignumberError + 'crypto unavailable');
          }
        }

        // Use Math.random.
        if (!CRYPTO) {

          for (; i < k;) {
            v = random53bitInt();
            if (v < 9e15) c[i++] = v % 1e14;
          }
        }

        k = c[--i];
        dp %= LOG_BASE;

        // Convert trailing digits to zeros according to dp.
        if (k && dp) {
          v = POWS_TEN[LOG_BASE - dp];
          c[i] = mathfloor(k / v) * v;
        }

        // Remove trailing elements which are zero.
        for (; c[i] === 0; c.pop(), i--);

        // Zero?
        if (i < 0) {
          c = [e = 0];
        } else {

          // Remove leading elements which are zero and adjust exponent accordingly.
          for (e = -1 ; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);

          // Count the digits of the first element of c to determine leading zeros, and...
          for (i = 1, v = c[0]; v >= 10; v /= 10, i++);

          // adjust the exponent accordingly.
          if (i < LOG_BASE) e -= LOG_BASE - i;
        }

        rand.e = e;
        rand.c = c;
        return rand;
      };
    })();


    /*
     * Return a BigNumber whose value is the sum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.sum = function () {
      var i = 1,
        args = arguments,
        sum = new BigNumber(args[0]);
      for (; i < args.length;) sum = sum.plus(args[i++]);
      return sum;
    };


    // PRIVATE FUNCTIONS


    // Called by BigNumber and BigNumber.prototype.toString.
    convertBase = (function () {
      var decimal = '0123456789';

      /*
       * Convert string of baseIn to an array of numbers of baseOut.
       * Eg. toBaseOut('255', 10, 16) returns [15, 15].
       * Eg. toBaseOut('ff', 16, 10) returns [2, 5, 5].
       */
      function toBaseOut(str, baseIn, baseOut, alphabet) {
        var j,
          arr = [0],
          arrL,
          i = 0,
          len = str.length;

        for (; i < len;) {
          for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);

          arr[0] += alphabet.indexOf(str.charAt(i++));

          for (j = 0; j < arr.length; j++) {

            if (arr[j] > baseOut - 1) {
              if (arr[j + 1] == null) arr[j + 1] = 0;
              arr[j + 1] += arr[j] / baseOut | 0;
              arr[j] %= baseOut;
            }
          }
        }

        return arr.reverse();
      }

      // Convert a numeric string of baseIn to a numeric string of baseOut.
      // If the caller is toString, we are converting from base 10 to baseOut.
      // If the caller is BigNumber, we are converting from baseIn to base 10.
      return function (str, baseIn, baseOut, sign, callerIsToString) {
        var alphabet, d, e, k, r, x, xc, y,
          i = str.indexOf('.'),
          dp = DECIMAL_PLACES,
          rm = ROUNDING_MODE;

        // Non-integer.
        if (i >= 0) {
          k = POW_PRECISION;

          // Unlimited precision.
          POW_PRECISION = 0;
          str = str.replace('.', '');
          y = new BigNumber(baseIn);
          x = y.pow(str.length - i);
          POW_PRECISION = k;

          // Convert str as if an integer, then restore the fraction part by dividing the
          // result by its base raised to a power.

          y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, '0'),
           10, baseOut, decimal);
          y.e = y.c.length;
        }

        // Convert the number as integer.

        xc = toBaseOut(str, baseIn, baseOut, callerIsToString
         ? (alphabet = ALPHABET, decimal)
         : (alphabet = decimal, ALPHABET));

        // xc now represents str as an integer and converted to baseOut. e is the exponent.
        e = k = xc.length;

        // Remove trailing zeros.
        for (; xc[--k] == 0; xc.pop());

        // Zero?
        if (!xc[0]) return alphabet.charAt(0);

        // Does str represent an integer? If so, no need for the division.
        if (i < 0) {
          --e;
        } else {
          x.c = xc;
          x.e = e;

          // The sign is needed for correct rounding.
          x.s = sign;
          x = div(x, y, dp, rm, baseOut);
          xc = x.c;
          r = x.r;
          e = x.e;
        }

        // xc now represents str converted to baseOut.

        // THe index of the rounding digit.
        d = e + dp + 1;

        // The rounding digit: the digit to the right of the digit that may be rounded up.
        i = xc[d];

        // Look at the rounding digits and mode to determine whether to round up.

        k = baseOut / 2;
        r = r || d < 0 || xc[d + 1] != null;

        r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
              : i > k || i == k &&(rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
               rm == (x.s < 0 ? 8 : 7));

        // If the index of the rounding digit is not greater than zero, or xc represents
        // zero, then the result of the base conversion is zero or, if rounding up, a value
        // such as 0.00001.
        if (d < 1 || !xc[0]) {

          // 1^-dp or 0
          str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
        } else {

          // Truncate xc to the required number of decimal places.
          xc.length = d;

          // Round up?
          if (r) {

            // Rounding up may mean the previous digit has to be rounded up and so on.
            for (--baseOut; ++xc[--d] > baseOut;) {
              xc[d] = 0;

              if (!d) {
                ++e;
                xc = [1].concat(xc);
              }
            }
          }

          // Determine trailing zeros.
          for (k = xc.length; !xc[--k];);

          // E.g. [4, 11, 15] becomes 4bf.
          for (i = 0, str = ''; i <= k; str += alphabet.charAt(xc[i++]));

          // Add leading zeros, decimal point and trailing zeros as required.
          str = toFixedPoint(str, e, alphabet.charAt(0));
        }

        // The caller will add the sign.
        return str;
      };
    })();


    // Perform division in the specified base. Called by div and convertBase.
    div = (function () {

      // Assume non-zero x and k.
      function multiply(x, k, base) {
        var m, temp, xlo, xhi,
          carry = 0,
          i = x.length,
          klo = k % SQRT_BASE,
          khi = k / SQRT_BASE | 0;

        for (x = x.slice(); i--;) {
          xlo = x[i] % SQRT_BASE;
          xhi = x[i] / SQRT_BASE | 0;
          m = khi * xlo + xhi * klo;
          temp = klo * xlo + ((m % SQRT_BASE) * SQRT_BASE) + carry;
          carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
          x[i] = temp % base;
        }

        if (carry) x = [carry].concat(x);

        return x;
      }

      function compare(a, b, aL, bL) {
        var i, cmp;

        if (aL != bL) {
          cmp = aL > bL ? 1 : -1;
        } else {

          for (i = cmp = 0; i < aL; i++) {

            if (a[i] != b[i]) {
              cmp = a[i] > b[i] ? 1 : -1;
              break;
            }
          }
        }

        return cmp;
      }

      function subtract(a, b, aL, base) {
        var i = 0;

        // Subtract b from a.
        for (; aL--;) {
          a[aL] -= i;
          i = a[aL] < b[aL] ? 1 : 0;
          a[aL] = i * base + a[aL] - b[aL];
        }

        // Remove leading zeros.
        for (; !a[0] && a.length > 1; a.splice(0, 1));
      }

      // x: dividend, y: divisor.
      return function (x, y, dp, rm, base) {
        var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
          yL, yz,
          s = x.s == y.s ? 1 : -1,
          xc = x.c,
          yc = y.c;

        // Either NaN, Infinity or 0?
        if (!xc || !xc[0] || !yc || !yc[0]) {

          return new BigNumber(

           // Return NaN if either NaN, or both Infinity or 0.
           !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN :

            // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
            xc && xc[0] == 0 || !yc ? s * 0 : s / 0
         );
        }

        q = new BigNumber(s);
        qc = q.c = [];
        e = x.e - y.e;
        s = dp + e + 1;

        if (!base) {
          base = BASE;
          e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
          s = s / LOG_BASE | 0;
        }

        // Result exponent may be one less then the current value of e.
        // The coefficients of the BigNumbers from convertBase may have trailing zeros.
        for (i = 0; yc[i] == (xc[i] || 0); i++);

        if (yc[i] > (xc[i] || 0)) e--;

        if (s < 0) {
          qc.push(1);
          more = true;
        } else {
          xL = xc.length;
          yL = yc.length;
          i = 0;
          s += 2;

          // Normalise xc and yc so highest order digit of yc is >= base / 2.

          n = mathfloor(base / (yc[0] + 1));

          // Not necessary, but to handle odd bases where yc[0] == (base / 2) - 1.
          // if (n > 1 || n++ == 1 && yc[0] < base / 2) {
          if (n > 1) {
            yc = multiply(yc, n, base);
            xc = multiply(xc, n, base);
            yL = yc.length;
            xL = xc.length;
          }

          xi = yL;
          rem = xc.slice(0, yL);
          remL = rem.length;

          // Add zeros to make remainder as long as divisor.
          for (; remL < yL; rem[remL++] = 0);
          yz = yc.slice();
          yz = [0].concat(yz);
          yc0 = yc[0];
          if (yc[1] >= base / 2) yc0++;
          // Not necessary, but to prevent trial digit n > base, when using base 3.
          // else if (base == 3 && yc0 == 1) yc0 = 1 + 1e-15;

          do {
            n = 0;

            // Compare divisor and remainder.
            cmp = compare(yc, rem, yL, remL);

            // If divisor < remainder.
            if (cmp < 0) {

              // Calculate trial digit, n.

              rem0 = rem[0];
              if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

              // n is how many times the divisor goes into the current remainder.
              n = mathfloor(rem0 / yc0);

              //  Algorithm:
              //  product = divisor multiplied by trial digit (n).
              //  Compare product and remainder.
              //  If product is greater than remainder:
              //    Subtract divisor from product, decrement trial digit.
              //  Subtract product from remainder.
              //  If product was less than remainder at the last compare:
              //    Compare new remainder and divisor.
              //    If remainder is greater than divisor:
              //      Subtract divisor from remainder, increment trial digit.

              if (n > 1) {

                // n may be > base only when base is 3.
                if (n >= base) n = base - 1;

                // product = divisor * trial digit.
                prod = multiply(yc, n, base);
                prodL = prod.length;
                remL = rem.length;

                // Compare product and remainder.
                // If product > remainder then trial digit n too high.
                // n is 1 too high about 5% of the time, and is not known to have
                // ever been more than 1 too high.
                while (compare(prod, rem, prodL, remL) == 1) {
                  n--;

                  // Subtract divisor from product.
                  subtract(prod, yL < prodL ? yz : yc, prodL, base);
                  prodL = prod.length;
                  cmp = 1;
                }
              } else {

                // n is 0 or 1, cmp is -1.
                // If n is 0, there is no need to compare yc and rem again below,
                // so change cmp to 1 to avoid it.
                // If n is 1, leave cmp as -1, so yc and rem are compared again.
                if (n == 0) {

                  // divisor < remainder, so n must be at least 1.
                  cmp = n = 1;
                }

                // product = divisor
                prod = yc.slice();
                prodL = prod.length;
              }

              if (prodL < remL) prod = [0].concat(prod);

              // Subtract product from remainder.
              subtract(rem, prod, remL, base);
              remL = rem.length;

               // If product was < remainder.
              if (cmp == -1) {

                // Compare divisor and new remainder.
                // If divisor < new remainder, subtract divisor from remainder.
                // Trial digit n too low.
                // n is 1 too low about 5% of the time, and very rarely 2 too low.
                while (compare(yc, rem, yL, remL) < 1) {
                  n++;

                  // Subtract divisor from remainder.
                  subtract(rem, yL < remL ? yz : yc, remL, base);
                  remL = rem.length;
                }
              }
            } else if (cmp === 0) {
              n++;
              rem = [0];
            } // else cmp === 1 and n will be 0

            // Add the next digit, n, to the result array.
            qc[i++] = n;

            // Update the remainder.
            if (rem[0]) {
              rem[remL++] = xc[xi] || 0;
            } else {
              rem = [xc[xi]];
              remL = 1;
            }
          } while ((xi++ < xL || rem[0] != null) && s--);

          more = rem[0] != null;

          // Leading zero?
          if (!qc[0]) qc.splice(0, 1);
        }

        if (base == BASE) {

          // To calculate q.e, first get the number of digits of qc[0].
          for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);

          round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);

        // Caller is convertBase.
        } else {
          q.e = e;
          q.r = +more;
        }

        return q;
      };
    })();


    /*
     * Return a string representing the value of BigNumber n in fixed-point or exponential
     * notation rounded to the specified decimal places or significant digits.
     *
     * n: a BigNumber.
     * i: the index of the last digit required (i.e. the digit that may be rounded up).
     * rm: the rounding mode.
     * id: 1 (toExponential) or 2 (toPrecision).
     */
    function format(n, i, rm, id) {
      var c0, e, ne, len, str;

      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);

      if (!n.c) return n.toString();

      c0 = n.c[0];
      ne = n.e;

      if (i == null) {
        str = coeffToString(n.c);
        str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS)
         ? toExponential(str, ne)
         : toFixedPoint(str, ne, '0');
      } else {
        n = round(new BigNumber(n), i, rm);

        // n.e may have changed if the value was rounded up.
        e = n.e;

        str = coeffToString(n.c);
        len = str.length;

        // toPrecision returns exponential notation if the number of significant digits
        // specified is less than the number of digits necessary to represent the integer
        // part of the value in fixed-point notation.

        // Exponential notation.
        if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {

          // Append zeros?
          for (; len < i; str += '0', len++);
          str = toExponential(str, e);

        // Fixed-point notation.
        } else {
          i -= ne;
          str = toFixedPoint(str, e, '0');

          // Append zeros?
          if (e + 1 > len) {
            if (--i > 0) for (str += '.'; i--; str += '0');
          } else {
            i += e - len;
            if (i > 0) {
              if (e + 1 == len) str += '.';
              for (; i--; str += '0');
            }
          }
        }
      }

      return n.s < 0 && c0 ? '-' + str : str;
    }


    // Handle BigNumber.max and BigNumber.min.
    function maxOrMin(args, method) {
      var n,
        i = 1,
        m = new BigNumber(args[0]);

      for (; i < args.length; i++) {
        n = new BigNumber(args[i]);

        // If any number is NaN, return NaN.
        if (!n.s) {
          m = n;
          break;
        } else if (method.call(m, n)) {
          m = n;
        }
      }

      return m;
    }


    /*
     * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
     * Called by minus, plus and times.
     */
    function normalise(n, c, e) {
      var i = 1,
        j = c.length;

       // Remove trailing zeros.
      for (; !c[--j]; c.pop());

      // Calculate the base 10 exponent. First get the number of digits of c[0].
      for (j = c[0]; j >= 10; j /= 10, i++);

      // Overflow?
      if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {

        // Infinity.
        n.c = n.e = null;

      // Underflow?
      } else if (e < MIN_EXP) {

        // Zero.
        n.c = [n.e = 0];
      } else {
        n.e = e;
        n.c = c;
      }

      return n;
    }


    // Handle values that fail the validity test in BigNumber.
    parseNumeric = (function () {
      var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
        dotAfter = /^([^.]+)\.$/,
        dotBefore = /^\.([^.]+)$/,
        isInfinityOrNaN = /^-?(Infinity|NaN)$/,
        whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;

      return function (x, str, isNum, b) {
        var base,
          s = isNum ? str : str.replace(whitespaceOrPlus, '');

        // No exception on ±Infinity or NaN.
        if (isInfinityOrNaN.test(s)) {
          x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
        } else {
          if (!isNum) {

            // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
            s = s.replace(basePrefix, function (m, p1, p2) {
              base = (p2 = p2.toLowerCase()) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
              return !b || b == base ? p1 : m;
            });

            if (b) {
              base = b;

              // E.g. '1.' to '1', '.1' to '0.1'
              s = s.replace(dotAfter, '$1').replace(dotBefore, '0.$1');
            }

            if (str != s) return new BigNumber(s, base);
          }

          // '[BigNumber Error] Not a number: {n}'
          // '[BigNumber Error] Not a base {b} number: {n}'
          if (BigNumber.DEBUG) {
            throw Error
              (bignumberError + 'Not a' + (b ? ' base ' + b : '') + ' number: ' + str);
          }

          // NaN
          x.s = null;
        }

        x.c = x.e = null;
      }
    })();


    /*
     * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
     * If r is truthy, it is known that there are more digits after the rounding digit.
     */
    function round(x, sd, rm, r) {
      var d, i, j, k, n, ni, rd,
        xc = x.c,
        pows10 = POWS_TEN;

      // if x is not Infinity or NaN...
      if (xc) {

        // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
        // n is a base 1e14 number, the value of the element of array x.c containing rd.
        // ni is the index of n within x.c.
        // d is the number of digits of n.
        // i is the index of rd within n including leading zeros.
        // j is the actual index of rd within n (if < 0, rd is a leading zero).
        out: {

          // Get the number of digits of the first element of xc.
          for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);
          i = sd - d;

          // If the rounding digit is in the first element of xc...
          if (i < 0) {
            i += LOG_BASE;
            j = sd;
            n = xc[ni = 0];

            // Get the rounding digit at index j of n.
            rd = n / pows10[d - j - 1] % 10 | 0;
          } else {
            ni = mathceil((i + 1) / LOG_BASE);

            if (ni >= xc.length) {

              if (r) {

                // Needed by sqrt.
                for (; xc.length <= ni; xc.push(0));
                n = rd = 0;
                d = 1;
                i %= LOG_BASE;
                j = i - LOG_BASE + 1;
              } else {
                break out;
              }
            } else {
              n = k = xc[ni];

              // Get the number of digits of n.
              for (d = 1; k >= 10; k /= 10, d++);

              // Get the index of rd within n.
              i %= LOG_BASE;

              // Get the index of rd within n, adjusted for leading zeros.
              // The number of leading zeros of n is given by LOG_BASE - d.
              j = i - LOG_BASE + d;

              // Get the rounding digit at index j of n.
              rd = j < 0 ? 0 : n / pows10[d - j - 1] % 10 | 0;
            }
          }

          r = r || sd < 0 ||

          // Are there any non-zero digits after the rounding digit?
          // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
          // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
           xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);

          r = rm < 4
           ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
           : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 &&

            // Check whether the digit to the left of the rounding digit is odd.
            ((i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10) & 1 ||
             rm == (x.s < 0 ? 8 : 7));

          if (sd < 1 || !xc[0]) {
            xc.length = 0;

            if (r) {

              // Convert sd to decimal places.
              sd -= x.e + 1;

              // 1, 0.1, 0.01, 0.001, 0.0001 etc.
              xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
              x.e = -sd || 0;
            } else {

              // Zero.
              xc[0] = x.e = 0;
            }

            return x;
          }

          // Remove excess digits.
          if (i == 0) {
            xc.length = ni;
            k = 1;
            ni--;
          } else {
            xc.length = ni + 1;
            k = pows10[LOG_BASE - i];

            // E.g. 56700 becomes 56000 if 7 is the rounding digit.
            // j > 0 means i > number of leading zeros of n.
            xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
          }

          // Round up?
          if (r) {

            for (; ;) {

              // If the digit to be rounded up is in the first element of xc...
              if (ni == 0) {

                // i will be the length of xc[0] before k is added.
                for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);
                j = xc[0] += k;
                for (k = 1; j >= 10; j /= 10, k++);

                // if i != k the length has increased.
                if (i != k) {
                  x.e++;
                  if (xc[0] == BASE) xc[0] = 1;
                }

                break;
              } else {
                xc[ni] += k;
                if (xc[ni] != BASE) break;
                xc[ni--] = 0;
                k = 1;
              }
            }
          }

          // Remove trailing zeros.
          for (i = xc.length; xc[--i] === 0; xc.pop());
        }

        // Overflow? Infinity.
        if (x.e > MAX_EXP) {
          x.c = x.e = null;

        // Underflow? Zero.
        } else if (x.e < MIN_EXP) {
          x.c = [x.e = 0];
        }
      }

      return x;
    }


    function valueOf(n) {
      var str,
        e = n.e;

      if (e === null) return n.toString();

      str = coeffToString(n.c);

      str = e <= TO_EXP_NEG || e >= TO_EXP_POS
        ? toExponential(str, e)
        : toFixedPoint(str, e, '0');

      return n.s < 0 ? '-' + str : str;
    }


    // PROTOTYPE/INSTANCE METHODS


    /*
     * Return a new BigNumber whose value is the absolute value of this BigNumber.
     */
    P.absoluteValue = P.abs = function () {
      var x = new BigNumber(this);
      if (x.s < 0) x.s = 1;
      return x;
    };


    /*
     * Return
     *   1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
     *   -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
     *   0 if they have the same value,
     *   or null if the value of either is NaN.
     */
    P.comparedTo = function (y, b) {
      return compare(this, new BigNumber(y, b));
    };


    /*
     * If dp is undefined or null or true or false, return the number of decimal places of the
     * value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     *
     * Otherwise, if dp is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of dp decimal places using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * [dp] {number} Decimal places: integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.decimalPlaces = P.dp = function (dp, rm) {
      var c, n, v,
        x = this;

      if (dp != null) {
        intCheck(dp, 0, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), dp + x.e + 1, rm);
      }

      if (!(c = x.c)) return null;
      n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;

      // Subtract the number of trailing zeros of the last number.
      if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
      if (n < 0) n = 0;

      return n;
    };


    /*
     *  n / 0 = I
     *  n / N = N
     *  n / I = 0
     *  0 / n = 0
     *  0 / 0 = N
     *  0 / N = N
     *  0 / I = 0
     *  N / n = N
     *  N / 0 = N
     *  N / N = N
     *  N / I = N
     *  I / n = I
     *  I / 0 = I
     *  I / N = N
     *  I / I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
     * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.dividedBy = P.div = function (y, b) {
      return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
    };


    /*
     * Return a new BigNumber whose value is the integer part of dividing the value of this
     * BigNumber by the value of BigNumber(y, b).
     */
    P.dividedToIntegerBy = P.idiv = function (y, b) {
      return div(this, new BigNumber(y, b), 0, 1);
    };


    /*
     * Return a BigNumber whose value is the value of this BigNumber exponentiated by n.
     *
     * If m is present, return the result modulo m.
     * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
     * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using ROUNDING_MODE.
     *
     * The modular power operation works efficiently when x, n, and m are integers, otherwise it
     * is equivalent to calculating x.exponentiatedBy(n).modulo(m) with a POW_PRECISION of 0.
     *
     * n {number|string|BigNumber} The exponent. An integer.
     * [m] {number|string|BigNumber} The modulus.
     *
     * '[BigNumber Error] Exponent not an integer: {n}'
     */
    P.exponentiatedBy = P.pow = function (n, m) {
      var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y,
        x = this;

      n = new BigNumber(n);

      // Allow NaN and ±Infinity, but not other non-integers.
      if (n.c && !n.isInteger()) {
        throw Error
          (bignumberError + 'Exponent not an integer: ' + valueOf(n));
      }

      if (m != null) m = new BigNumber(m);

      // Exponent of MAX_SAFE_INTEGER is 15.
      nIsBig = n.e > 14;

      // If x is NaN, ±Infinity, ±0 or ±1, or n is ±Infinity, NaN or ±0.
      if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {

        // The sign of the result of pow when x is negative depends on the evenness of n.
        // If +n overflows to ±Infinity, the evenness of n would be not be known.
        y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? 2 - isOdd(n) : +valueOf(n)));
        return m ? y.mod(m) : y;
      }

      nIsNeg = n.s < 0;

      if (m) {

        // x % m returns NaN if abs(m) is zero, or m is NaN.
        if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);

        isModExp = !nIsNeg && x.isInteger() && m.isInteger();

        if (isModExp) x = x.mod(m);

      // Overflow to ±Infinity: >=2**1e10 or >=1.0000024**1e15.
      // Underflow to ±0: <=0.79**1e10 or <=0.9999975**1e15.
      } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0
        // [1, 240000000]
        ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7
        // [80000000000000]  [99999750000000]
        : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {

        // If x is negative and n is odd, k = -0, else k = 0.
        k = x.s < 0 && isOdd(n) ? -0 : 0;

        // If x >= 1, k = ±Infinity.
        if (x.e > -1) k = 1 / k;

        // If n is negative return ±0, else return ±Infinity.
        return new BigNumber(nIsNeg ? 1 / k : k);

      } else if (POW_PRECISION) {

        // Truncating each coefficient array to a length of k after each multiplication
        // equates to truncating significant digits to POW_PRECISION + [28, 41],
        // i.e. there will be a minimum of 28 guard digits retained.
        k = mathceil(POW_PRECISION / LOG_BASE + 2);
      }

      if (nIsBig) {
        half = new BigNumber(0.5);
        if (nIsNeg) n.s = 1;
        nIsOdd = isOdd(n);
      } else {
        i = Math.abs(+valueOf(n));
        nIsOdd = i % 2;
      }

      y = new BigNumber(ONE);

      // Performs 54 loop iterations for n of 9007199254740991.
      for (; ;) {

        if (nIsOdd) {
          y = y.times(x);
          if (!y.c) break;

          if (k) {
            if (y.c.length > k) y.c.length = k;
          } else if (isModExp) {
            y = y.mod(m);    //y = y.minus(div(y, m, 0, MODULO_MODE).times(m));
          }
        }

        if (i) {
          i = mathfloor(i / 2);
          if (i === 0) break;
          nIsOdd = i % 2;
        } else {
          n = n.times(half);
          round(n, n.e + 1, 1);

          if (n.e > 14) {
            nIsOdd = isOdd(n);
          } else {
            i = +valueOf(n);
            if (i === 0) break;
            nIsOdd = i % 2;
          }
        }

        x = x.times(x);

        if (k) {
          if (x.c && x.c.length > k) x.c.length = k;
        } else if (isModExp) {
          x = x.mod(m);    //x = x.minus(div(x, m, 0, MODULO_MODE).times(m));
        }
      }

      if (isModExp) return y;
      if (nIsNeg) y = ONE.div(y);

      return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber rounded to an integer
     * using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {rm}'
     */
    P.integerValue = function (rm) {
      var n = new BigNumber(this);
      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);
      return round(n, n.e + 1, rm);
    };


    /*
     * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isEqualTo = P.eq = function (y, b) {
      return compare(this, new BigNumber(y, b)) === 0;
    };


    /*
     * Return true if the value of this BigNumber is a finite number, otherwise return false.
     */
    P.isFinite = function () {
      return !!this.c;
    };


    /*
     * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isGreaterThan = P.gt = function (y, b) {
      return compare(this, new BigNumber(y, b)) > 0;
    };


    /*
     * Return true if the value of this BigNumber is greater than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isGreaterThanOrEqualTo = P.gte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;

    };


    /*
     * Return true if the value of this BigNumber is an integer, otherwise return false.
     */
    P.isInteger = function () {
      return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
    };


    /*
     * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isLessThan = P.lt = function (y, b) {
      return compare(this, new BigNumber(y, b)) < 0;
    };


    /*
     * Return true if the value of this BigNumber is less than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isLessThanOrEqualTo = P.lte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
    };


    /*
     * Return true if the value of this BigNumber is NaN, otherwise return false.
     */
    P.isNaN = function () {
      return !this.s;
    };


    /*
     * Return true if the value of this BigNumber is negative, otherwise return false.
     */
    P.isNegative = function () {
      return this.s < 0;
    };


    /*
     * Return true if the value of this BigNumber is positive, otherwise return false.
     */
    P.isPositive = function () {
      return this.s > 0;
    };


    /*
     * Return true if the value of this BigNumber is 0 or -0, otherwise return false.
     */
    P.isZero = function () {
      return !!this.c && this.c[0] == 0;
    };


    /*
     *  n - 0 = n
     *  n - N = N
     *  n - I = -I
     *  0 - n = -n
     *  0 - 0 = 0
     *  0 - N = N
     *  0 - I = -I
     *  N - n = N
     *  N - 0 = N
     *  N - N = N
     *  N - I = N
     *  I - n = I
     *  I - 0 = I
     *  I - N = N
     *  I - I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber minus the value of
     * BigNumber(y, b).
     */
    P.minus = function (y, b) {
      var i, j, t, xLTy,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
      if (a != b) {
        y.s = -b;
        return x.plus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Either Infinity?
        if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN);

        // Either zero?
        if (!xc[0] || !yc[0]) {

          // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
          return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x :

           // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
           ROUNDING_MODE == 3 ? -0 : 0);
        }
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Determine which is the bigger number.
      if (a = xe - ye) {

        if (xLTy = a < 0) {
          a = -a;
          t = xc;
        } else {
          ye = xe;
          t = yc;
        }

        t.reverse();

        // Prepend zeros to equalise exponents.
        for (b = a; b--; t.push(0));
        t.reverse();
      } else {

        // Exponents equal. Check digit by digit.
        j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;

        for (a = b = 0; b < j; b++) {

          if (xc[b] != yc[b]) {
            xLTy = xc[b] < yc[b];
            break;
          }
        }
      }

      // x < y? Point xc to the array of the bigger number.
      if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;

      b = (j = yc.length) - (i = xc.length);

      // Append zeros to xc if shorter.
      // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
      if (b > 0) for (; b--; xc[i++] = 0);
      b = BASE - 1;

      // Subtract yc from xc.
      for (; j > a;) {

        if (xc[--j] < yc[j]) {
          for (i = j; i && !xc[--i]; xc[i] = b);
          --xc[i];
          xc[j] += BASE;
        }

        xc[j] -= yc[j];
      }

      // Remove leading zeros and adjust exponent accordingly.
      for (; xc[0] == 0; xc.splice(0, 1), --ye);

      // Zero?
      if (!xc[0]) {

        // Following IEEE 754 (2008) 6.3,
        // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
        y.s = ROUNDING_MODE == 3 ? -1 : 1;
        y.c = [y.e = 0];
        return y;
      }

      // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
      // for finite x and y.
      return normalise(y, xc, ye);
    };


    /*
     *   n % 0 =  N
     *   n % N =  N
     *   n % I =  n
     *   0 % n =  0
     *  -0 % n = -0
     *   0 % 0 =  N
     *   0 % N =  N
     *   0 % I =  0
     *   N % n =  N
     *   N % 0 =  N
     *   N % N =  N
     *   N % I =  N
     *   I % n =  N
     *   I % 0 =  N
     *   I % N =  N
     *   I % I =  N
     *
     * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
     * BigNumber(y, b). The result depends on the value of MODULO_MODE.
     */
    P.modulo = P.mod = function (y, b) {
      var q, s,
        x = this;

      y = new BigNumber(y, b);

      // Return NaN if x is Infinity or NaN, or y is NaN or zero.
      if (!x.c || !y.s || y.c && !y.c[0]) {
        return new BigNumber(NaN);

      // Return x if y is Infinity or x is zero.
      } else if (!y.c || x.c && !x.c[0]) {
        return new BigNumber(x);
      }

      if (MODULO_MODE == 9) {

        // Euclidian division: q = sign(y) * floor(x / abs(y))
        // r = x - qy    where  0 <= r < abs(y)
        s = y.s;
        y.s = 1;
        q = div(x, y, 0, 3);
        y.s = s;
        q.s *= s;
      } else {
        q = div(x, y, 0, MODULO_MODE);
      }

      y = x.minus(q.times(y));

      // To match JavaScript %, ensure sign of zero is sign of dividend.
      if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;

      return y;
    };


    /*
     *  n * 0 = 0
     *  n * N = N
     *  n * I = I
     *  0 * n = 0
     *  0 * 0 = 0
     *  0 * N = N
     *  0 * I = N
     *  N * n = N
     *  N * 0 = N
     *  N * N = N
     *  N * I = N
     *  I * n = I
     *  I * 0 = N
     *  I * N = N
     *  I * I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber multiplied by the value
     * of BigNumber(y, b).
     */
    P.multipliedBy = P.times = function (y, b) {
      var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
        base, sqrtBase,
        x = this,
        xc = x.c,
        yc = (y = new BigNumber(y, b)).c;

      // Either NaN, ±Infinity or ±0?
      if (!xc || !yc || !xc[0] || !yc[0]) {

        // Return NaN if either is NaN, or one is 0 and the other is Infinity.
        if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
          y.c = y.e = y.s = null;
        } else {
          y.s *= x.s;

          // Return ±Infinity if either is ±Infinity.
          if (!xc || !yc) {
            y.c = y.e = null;

          // Return ±0 if either is ±0.
          } else {
            y.c = [0];
            y.e = 0;
          }
        }

        return y;
      }

      e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
      y.s *= x.s;
      xcL = xc.length;
      ycL = yc.length;

      // Ensure xc points to longer array and xcL to its length.
      if (xcL < ycL) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i;

      // Initialise the result array with zeros.
      for (i = xcL + ycL, zc = []; i--; zc.push(0));

      base = BASE;
      sqrtBase = SQRT_BASE;

      for (i = ycL; --i >= 0;) {
        c = 0;
        ylo = yc[i] % sqrtBase;
        yhi = yc[i] / sqrtBase | 0;

        for (k = xcL, j = i + k; j > i;) {
          xlo = xc[--k] % sqrtBase;
          xhi = xc[k] / sqrtBase | 0;
          m = yhi * xlo + xhi * ylo;
          xlo = ylo * xlo + ((m % sqrtBase) * sqrtBase) + zc[j] + c;
          c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
          zc[j--] = xlo % base;
        }

        zc[j] = c;
      }

      if (c) {
        ++e;
      } else {
        zc.splice(0, 1);
      }

      return normalise(y, zc, e);
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber negated,
     * i.e. multiplied by -1.
     */
    P.negated = function () {
      var x = new BigNumber(this);
      x.s = -x.s || null;
      return x;
    };


    /*
     *  n + 0 = n
     *  n + N = N
     *  n + I = I
     *  0 + n = n
     *  0 + 0 = 0
     *  0 + N = N
     *  0 + I = I
     *  N + n = N
     *  N + 0 = N
     *  N + N = N
     *  N + I = N
     *  I + n = I
     *  I + 0 = I
     *  I + N = N
     *  I + I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber plus the value of
     * BigNumber(y, b).
     */
    P.plus = function (y, b) {
      var t,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
       if (a != b) {
        y.s = -b;
        return x.minus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Return ±Infinity if either ±Infinity.
        if (!xc || !yc) return new BigNumber(a / 0);

        // Either zero?
        // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
        if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
      if (a = xe - ye) {
        if (a > 0) {
          ye = xe;
          t = yc;
        } else {
          a = -a;
          t = xc;
        }

        t.reverse();
        for (; a--; t.push(0));
        t.reverse();
      }

      a = xc.length;
      b = yc.length;

      // Point xc to the longer array, and b to the shorter length.
      if (a - b < 0) t = yc, yc = xc, xc = t, b = a;

      // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
      for (a = 0; b;) {
        a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
        xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
      }

      if (a) {
        xc = [a].concat(xc);
        ++ye;
      }

      // No need to check for zero, as +x + +y != 0 && -x + -y != 0
      // ye = MAX_EXP + 1 possible
      return normalise(y, xc, ye);
    };


    /*
     * If sd is undefined or null or true or false, return the number of significant digits of
     * the value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     * If sd is true include integer-part trailing zeros in the count.
     *
     * Otherwise, if sd is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of sd significant digits using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * sd {number|boolean} number: significant digits: integer, 1 to MAX inclusive.
     *                     boolean: whether to count integer-part trailing zeros: true or false.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.precision = P.sd = function (sd, rm) {
      var c, n, v,
        x = this;

      if (sd != null && sd !== !!sd) {
        intCheck(sd, 1, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), sd, rm);
      }

      if (!(c = x.c)) return null;
      v = c.length - 1;
      n = v * LOG_BASE + 1;

      if (v = c[v]) {

        // Subtract the number of trailing zeros of the last element.
        for (; v % 10 == 0; v /= 10, n--);

        // Add the number of digits of the first element.
        for (v = c[0]; v >= 10; v /= 10, n++);
      }

      if (sd && x.e + 1 > n) n = x.e + 1;

      return n;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
     * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
     *
     * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {k}'
     */
    P.shiftedBy = function (k) {
      intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
      return this.times('1e' + k);
    };


    /*
     *  sqrt(-n) =  N
     *  sqrt(N) =  N
     *  sqrt(-I) =  N
     *  sqrt(I) =  I
     *  sqrt(0) =  0
     *  sqrt(-0) = -0
     *
     * Return a new BigNumber whose value is the square root of the value of this BigNumber,
     * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.squareRoot = P.sqrt = function () {
      var m, n, r, rep, t,
        x = this,
        c = x.c,
        s = x.s,
        e = x.e,
        dp = DECIMAL_PLACES + 4,
        half = new BigNumber('0.5');

      // Negative/NaN/Infinity/zero?
      if (s !== 1 || !c || !c[0]) {
        return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
      }

      // Initial estimate.
      s = Math.sqrt(+valueOf(x));

      // Math.sqrt underflow/overflow?
      // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
      if (s == 0 || s == 1 / 0) {
        n = coeffToString(c);
        if ((n.length + e) % 2 == 0) n += '0';
        s = Math.sqrt(+n);
        e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);

        if (s == 1 / 0) {
          n = '1e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new BigNumber(n);
      } else {
        r = new BigNumber(s + '');
      }

      // Check for zero.
      // r could be zero if MIN_EXP is changed after the this value was created.
      // This would cause a division by zero (x/t) and hence Infinity below, which would cause
      // coeffToString to throw.
      if (r.c[0]) {
        e = r.e;
        s = e + dp;
        if (s < 3) s = 0;

        // Newton-Raphson iteration.
        for (; ;) {
          t = r;
          r = half.times(t.plus(div(x, t, dp, 1)));

          if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {

            // The exponent of r may here be one less than the final result exponent,
            // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
            // are indexed correctly.
            if (r.e < e) --s;
            n = n.slice(s - 3, s + 1);

            // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
            // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
            // iteration.
            if (n == '9999' || !rep && n == '4999') {

              // On the first iteration only, check to see if rounding up gives the
              // exact result as the nines may infinitely repeat.
              if (!rep) {
                round(t, t.e + DECIMAL_PLACES + 2, 0);

                if (t.times(t).eq(x)) {
                  r = t;
                  break;
                }
              }

              dp += 4;
              s += 4;
              rep = 1;
            } else {

              // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
              // result. If not, then there are further digits and m will be truthy.
              if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                // Truncate to the first rounding digit.
                round(r, r.e + DECIMAL_PLACES + 2, 1);
                m = !r.times(r).eq(x);
              }

              break;
            }
          }
        }
      }

      return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
    };


    /*
     * Return a string representing the value of this BigNumber in exponential notation and
     * rounded using ROUNDING_MODE to dp fixed decimal places.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toExponential = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp++;
      }
      return format(this, dp, rm, 1);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounding
     * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
     * but e.g. (-0.00001).toFixed(0) is '-0'.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toFixed = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp = dp + this.e + 1;
      }
      return format(this, dp, rm);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounded
     * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
     * of the format or FORMAT object (see BigNumber.set).
     *
     * The formatting object may contain some or all of the properties shown below.
     *
     * FORMAT = {
     *   prefix: '',
     *   groupSize: 3,
     *   secondaryGroupSize: 0,
     *   groupSeparator: ',',
     *   decimalSeparator: '.',
     *   fractionGroupSize: 0,
     *   fractionGroupSeparator: '\xA0',      // non-breaking space
     *   suffix: ''
     * };
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     * [format] {object} Formatting options. See FORMAT pbject above.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     * '[BigNumber Error] Argument not an object: {format}'
     */
    P.toFormat = function (dp, rm, format) {
      var str,
        x = this;

      if (format == null) {
        if (dp != null && rm && typeof rm == 'object') {
          format = rm;
          rm = null;
        } else if (dp && typeof dp == 'object') {
          format = dp;
          dp = rm = null;
        } else {
          format = FORMAT;
        }
      } else if (typeof format != 'object') {
        throw Error
          (bignumberError + 'Argument not an object: ' + format);
      }

      str = x.toFixed(dp, rm);

      if (x.c) {
        var i,
          arr = str.split('.'),
          g1 = +format.groupSize,
          g2 = +format.secondaryGroupSize,
          groupSeparator = format.groupSeparator || '',
          intPart = arr[0],
          fractionPart = arr[1],
          isNeg = x.s < 0,
          intDigits = isNeg ? intPart.slice(1) : intPart,
          len = intDigits.length;

        if (g2) i = g1, g1 = g2, g2 = i, len -= i;

        if (g1 > 0 && len > 0) {
          i = len % g1 || g1;
          intPart = intDigits.substr(0, i);
          for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
          if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
          if (isNeg) intPart = '-' + intPart;
        }

        str = fractionPart
         ? intPart + (format.decimalSeparator || '') + ((g2 = +format.fractionGroupSize)
          ? fractionPart.replace(new RegExp('\\d{' + g2 + '}\\B', 'g'),
           '$&' + (format.fractionGroupSeparator || ''))
          : fractionPart)
         : intPart;
      }

      return (format.prefix || '') + str + (format.suffix || '');
    };


    /*
     * Return an array of two BigNumbers representing the value of this BigNumber as a simple
     * fraction with an integer numerator and an integer denominator.
     * The denominator will be a positive non-zero value less than or equal to the specified
     * maximum denominator. If a maximum denominator is not specified, the denominator will be
     * the lowest value necessary to represent the number exactly.
     *
     * [md] {number|string|BigNumber} Integer >= 1, or Infinity. The maximum denominator.
     *
     * '[BigNumber Error] Argument {not an integer|out of range} : {md}'
     */
    P.toFraction = function (md) {
      var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s,
        x = this,
        xc = x.c;

      if (md != null) {
        n = new BigNumber(md);

        // Throw if md is less than one or is not an integer, unless it is Infinity.
        if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
          throw Error
            (bignumberError + 'Argument ' +
              (n.isInteger() ? 'out of range: ' : 'not an integer: ') + valueOf(n));
        }
      }

      if (!xc) return new BigNumber(x);

      d = new BigNumber(ONE);
      n1 = d0 = new BigNumber(ONE);
      d1 = n0 = new BigNumber(ONE);
      s = coeffToString(xc);

      // Determine initial denominator.
      // d is a power of 10 and the minimum max denominator that specifies the value exactly.
      e = d.e = s.length - x.e - 1;
      d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
      md = !md || n.comparedTo(d) > 0 ? (e > 0 ? d : n1) : n;

      exp = MAX_EXP;
      MAX_EXP = 1 / 0;
      n = new BigNumber(s);

      // n0 = d1 = 0
      n0.c[0] = 0;

      for (; ;)  {
        q = div(n, d, 0, 1);
        d2 = d0.plus(q.times(d1));
        if (d2.comparedTo(md) == 1) break;
        d0 = d1;
        d1 = d2;
        n1 = n0.plus(q.times(d2 = n1));
        n0 = d2;
        d = n.minus(q.times(d2 = d));
        n = d2;
      }

      d2 = div(md.minus(d0), d1, 0, 1);
      n0 = n0.plus(d2.times(n1));
      d0 = d0.plus(d2.times(d1));
      n0.s = n1.s = x.s;
      e = e * 2;

      // Determine which fraction is closer to x, n0/d0 or n1/d1
      r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
          div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];

      MAX_EXP = exp;

      return r;
    };


    /*
     * Return the value of this BigNumber converted to a number primitive.
     */
    P.toNumber = function () {
      return +valueOf(this);
    };


    /*
     * Return a string representing the value of this BigNumber rounded to sd significant digits
     * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
     * necessary to represent the integer part of the value in fixed-point notation, then use
     * exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.toPrecision = function (sd, rm) {
      if (sd != null) intCheck(sd, 1, MAX);
      return format(this, sd, rm, 2);
    };


    /*
     * Return a string representing the value of this BigNumber in base b, or base 10 if b is
     * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
     * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
     * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
     * TO_EXP_NEG, return exponential notation.
     *
     * [b] {number} Integer, 2 to ALPHABET.length inclusive.
     *
     * '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
     */
    P.toString = function (b) {
      var str,
        n = this,
        s = n.s,
        e = n.e;

      // Infinity or NaN?
      if (e === null) {
        if (s) {
          str = 'Infinity';
          if (s < 0) str = '-' + str;
        } else {
          str = 'NaN';
        }
      } else {
        if (b == null) {
          str = e <= TO_EXP_NEG || e >= TO_EXP_POS
           ? toExponential(coeffToString(n.c), e)
           : toFixedPoint(coeffToString(n.c), e, '0');
        } else if (b === 10) {
          n = round(new BigNumber(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
          str = toFixedPoint(coeffToString(n.c), n.e, '0');
        } else {
          intCheck(b, 2, ALPHABET.length, 'Base');
          str = convertBase(toFixedPoint(coeffToString(n.c), e, '0'), 10, b, s, true);
        }

        if (s < 0 && n.c[0]) str = '-' + str;
      }

      return str;
    };


    /*
     * Return as toString, but do not accept a base argument, and include the minus sign for
     * negative zero.
     */
    P.valueOf = P.toJSON = function () {
      return valueOf(this);
    };


    P._isBigNumber = true;

    if (hasSymbol) {
      P[Symbol.toStringTag] = 'BigNumber';

      // Node.js v10.12.0+
      P[Symbol.for('nodejs.util.inspect.custom')] = P.valueOf;
    }

    if (configObject != null) BigNumber.set(configObject);

    return BigNumber;
  }


  // PRIVATE HELPER FUNCTIONS

  // These functions don't need access to variables,
  // e.g. DECIMAL_PLACES, in the scope of the `clone` function above.


  function bitFloor(n) {
    var i = n | 0;
    return n > 0 || n === i ? i : i - 1;
  }


  // Return a coefficient array as a string of base 10 digits.
  function coeffToString(a) {
    var s, z,
      i = 1,
      j = a.length,
      r = a[0] + '';

    for (; i < j;) {
      s = a[i++] + '';
      z = LOG_BASE - s.length;
      for (; z--; s = '0' + s);
      r += s;
    }

    // Determine trailing zeros.
    for (j = r.length; r.charCodeAt(--j) === 48;);

    return r.slice(0, j + 1 || 1);
  }


  // Compare the value of BigNumbers x and y.
  function compare(x, y) {
    var a, b,
      xc = x.c,
      yc = y.c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either NaN?
    if (!i || !j) return null;

    a = xc && !xc[0];
    b = yc && !yc[0];

    // Either zero?
    if (a || b) return a ? b ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    a = i < 0;
    b = k == l;

    // Either Infinity?
    if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;

    // Compare exponents.
    if (!b) return k > l ^ a ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;

    // Compare lengths.
    return k == l ? 0 : k > l ^ a ? 1 : -1;
  }


  /*
   * Check that n is a primitive number, an integer, and in range, otherwise throw.
   */
  function intCheck(n, min, max, name) {
    if (n < min || n > max || n !== mathfloor(n)) {
      throw Error
       (bignumberError + (name || 'Argument') + (typeof n == 'number'
         ? n < min || n > max ? ' out of range: ' : ' not an integer: '
         : ' not a primitive number: ') + String(n));
    }
  }


  // Assumes finite n.
  function isOdd(n) {
    var k = n.c.length - 1;
    return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
  }


  function toExponential(str, e) {
    return (str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str) +
     (e < 0 ? 'e' : 'e+') + e;
  }


  function toFixedPoint(str, e, z) {
    var len, zs;

    // Negative exponent?
    if (e < 0) {

      // Prepend zeros.
      for (zs = z + '.'; ++e; zs += z);
      str = zs + str;

    // Positive exponent
    } else {
      len = str.length;

      // Append zeros.
      if (++e > len) {
        for (zs = z, e -= len; --e; zs += z);
        str += zs;
      } else if (e < len) {
        str = str.slice(0, e) + '.' + str.slice(e);
      }
    }

    return str;
  }


  // EXPORT


  BigNumber = clone();
  BigNumber['default'] = BigNumber.BigNumber = BigNumber;

  // AMD.
  if (typeof define == 'function' && define.amd) {
    define(function () { return BigNumber; });

  // Node.js and other environments that support module.exports.
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = BigNumber;

  // Browser.
  } else {
    if (!globalObject) {
      globalObject = typeof self != 'undefined' && self ? self : window;
    }

    globalObject.BigNumber = BigNumber;
  }
})(this);

},{}],2:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
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
module.exports = {
  languageTag: "en-US",
  delimiters: {
    thousands: ",",
    decimal: "."
  },
  abbreviations: {
    thousand: "k",
    million: "m",
    billion: "b",
    trillion: "t"
  },
  spaceSeparated: false,
  ordinal: function ordinal(number) {
    var b = number % 10;
    return ~~(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
  },
  bytes: {
    binarySuffixes: ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"],
    decimalSuffixes: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  },
  currency: {
    symbol: "$",
    position: "prefix",
    code: "USD"
  },
  currencyFormat: {
    thousandSeparated: true,
    totalLength: 4,
    spaceSeparated: true,
    spaceSeparatedCurrency: true
  },
  formats: {
    fourDigits: {
      totalLength: 4,
      spaceSeparated: true
    },
    fullWithTwoDecimals: {
      output: "currency",
      thousandSeparated: true,
      mantissa: 2
    },
    fullWithTwoDecimalsNoCurrency: {
      thousandSeparated: true,
      mantissa: 2
    },
    fullWithNoDecimals: {
      output: "currency",
      thousandSeparated: true,
      mantissa: 0
    }
  }
};

},{}],3:[function(require,module,exports){
"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
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
var globalState = require("./globalState");

var validating = require("./validating");

var parsing = require("./parsing");

var powers = {
  trillion: Math.pow(10, 12),
  billion: Math.pow(10, 9),
  million: Math.pow(10, 6),
  thousand: Math.pow(10, 3)
};
var defaultOptions = {
  totalLength: 0,
  characteristic: 0,
  forceAverage: false,
  average: false,
  mantissa: -1,
  optionalMantissa: true,
  thousandSeparated: false,
  spaceSeparated: false,
  negative: "sign",
  forceSign: false,
  roundingFunction: Math.round,
  spaceSeparatedAbbreviation: false
};

var _globalState$currentB = globalState.currentBytes(),
    binarySuffixes = _globalState$currentB.binarySuffixes,
    decimalSuffixes = _globalState$currentB.decimalSuffixes;

var bytes = {
  general: {
    scale: 1024,
    suffixes: decimalSuffixes,
    marker: "bd"
  },
  binary: {
    scale: 1024,
    suffixes: binarySuffixes,
    marker: "b"
  },
  decimal: {
    scale: 1000,
    suffixes: decimalSuffixes,
    marker: "d"
  }
};
/**
 * Entry point. Format the provided INSTANCE according to the PROVIDEDFORMAT.
 * This method ensure the prefix and postfix are added as the last step.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {NumbroFormat|string} [providedFormat] - specification for formatting
 * @param numbro - the numbro singleton
 * @return {string}
 */

function _format(instance) {
  var providedFormat = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var numbro = arguments.length > 2 ? arguments[2] : undefined;

  if (typeof providedFormat === "string") {
    providedFormat = parsing.parseFormat(providedFormat);
  }

  var valid = validating.validateFormat(providedFormat);

  if (!valid) {
    return "ERROR: invalid format";
  }

  var prefix = providedFormat.prefix || "";
  var postfix = providedFormat.postfix || "";
  var output = formatNumbro(instance, providedFormat, numbro);
  output = insertPrefix(output, prefix);
  output = insertPostfix(output, postfix);
  return output;
}
/**
 * Format the provided INSTANCE according to the PROVIDEDFORMAT.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param numbro - the numbro singleton
 * @return {string}
 */


function formatNumbro(instance, providedFormat, numbro) {
  switch (providedFormat.output) {
    case "currency":
      {
        providedFormat = formatOrDefault(providedFormat, globalState.currentCurrencyDefaultFormat());
        return formatCurrency(instance, providedFormat, globalState, numbro);
      }

    case "percent":
      {
        providedFormat = formatOrDefault(providedFormat, globalState.currentPercentageDefaultFormat());
        return formatPercentage(instance, providedFormat, globalState, numbro);
      }

    case "byte":
      providedFormat = formatOrDefault(providedFormat, globalState.currentByteDefaultFormat());
      return formatByte(instance, providedFormat, globalState, numbro);

    case "time":
      providedFormat = formatOrDefault(providedFormat, globalState.currentTimeDefaultFormat());
      return formatTime(instance, providedFormat, globalState, numbro);

    case "ordinal":
      providedFormat = formatOrDefault(providedFormat, globalState.currentOrdinalDefaultFormat());
      return formatOrdinal(instance, providedFormat, globalState, numbro);

    case "number":
    default:
      return formatNumber({
        instance: instance,
        providedFormat: providedFormat,
        numbro: numbro
      });
  }
}
/**
 * Get the decimal byte unit (MB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1000).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */


function _getDecimalByteUnit(instance) {
  var data = bytes.decimal;
  return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}
/**
 * Get the binary byte unit (MiB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1024).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */


function _getBinaryByteUnit(instance) {
  var data = bytes.binary;
  return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}
/**
 * Get the decimal byte unit (MB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1024).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */


function _getByteUnit(instance) {
  var data = bytes.general;
  return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}
/**
 * Return the value and the suffix computed in byte.
 * It uses the SUFFIXES and the SCALE provided.
 *
 * @param {number} value - Number to format
 * @param {[String]} suffixes - List of suffixes
 * @param {number} scale - Number in-between two units
 * @return {{value: Number, suffix: String}}
 */


function getFormatByteUnits(value, suffixes, scale) {
  var suffix = suffixes[0];
  var abs = Math.abs(value);

  if (abs >= scale) {
    for (var power = 1; power < suffixes.length; ++power) {
      var min = Math.pow(scale, power);
      var max = Math.pow(scale, power + 1);

      if (abs >= min && abs < max) {
        suffix = suffixes[power];
        value = value / min;
        break;
      }
    } // values greater than or equal to [scale] YB never set the suffix


    if (suffix === suffixes[0]) {
      value = value / Math.pow(scale, suffixes.length - 1);
      suffix = suffixes[suffixes.length - 1];
    }
  }

  return {
    value: value,
    suffix: suffix
  };
}
/**
 * Format the provided INSTANCE as bytes using the PROVIDEDFORMAT, and STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param numbro - the numbro singleton
 * @return {string}
 */


function formatByte(instance, providedFormat, state, numbro) {
  var base = providedFormat.base || "binary";
  var options = Object.assign({}, defaultOptions, providedFormat);

  var _state$currentBytes = state.currentBytes(),
      localBinarySuffixes = _state$currentBytes.binarySuffixes,
      localDecimalSuffixes = _state$currentBytes.decimalSuffixes;

  var localBytes = {
    general: {
      scale: 1024,
      suffixes: localDecimalSuffixes || decimalSuffixes,
      marker: "bd"
    },
    binary: {
      scale: 1024,
      suffixes: localBinarySuffixes || binarySuffixes,
      marker: "b"
    },
    decimal: {
      scale: 1000,
      suffixes: localDecimalSuffixes || decimalSuffixes,
      marker: "d"
    }
  };
  var baseInfo = localBytes[base];

  var _getFormatByteUnits = getFormatByteUnits(instance._value, baseInfo.suffixes, baseInfo.scale),
      value = _getFormatByteUnits.value,
      suffix = _getFormatByteUnits.suffix;

  var output = formatNumber({
    instance: numbro(value),
    providedFormat: providedFormat,
    state: state,
    defaults: state.currentByteDefaultFormat()
  });
  return "".concat(output).concat(options.spaceSeparated ? " " : "").concat(suffix);
}
/**
 * Format the provided INSTANCE as an ordinal using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @return {string}
 */


function formatOrdinal(instance, providedFormat, state) {
  var ordinalFn = state.currentOrdinal();
  var options = Object.assign({}, defaultOptions, providedFormat);
  var output = formatNumber({
    instance: instance,
    providedFormat: providedFormat,
    state: state
  });
  var ordinal = ordinalFn(instance._value);
  return "".concat(output).concat(options.spaceSeparated ? " " : "").concat(ordinal);
}
/**
 * Format the provided INSTANCE as a time HH:MM:SS.
 *
 * @param {Numbro} instance - numbro instance to format
 * @return {string}
 */


function formatTime(instance) {
  var hours = Math.floor(instance._value / 60 / 60);
  var minutes = Math.floor((instance._value - hours * 60 * 60) / 60);
  var seconds = Math.round(instance._value - hours * 60 * 60 - minutes * 60);
  return "".concat(hours, ":").concat(minutes < 10 ? "0" : "").concat(minutes, ":").concat(seconds < 10 ? "0" : "").concat(seconds);
}
/**
 * Format the provided INSTANCE as a percentage using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param numbro - the numbro singleton
 * @return {string}
 */


function formatPercentage(instance, providedFormat, state, numbro) {
  var prefixSymbol = providedFormat.prefixSymbol;
  var output = formatNumber({
    instance: numbro(instance._value * 100),
    providedFormat: providedFormat,
    state: state
  });
  var options = Object.assign({}, defaultOptions, providedFormat);

  if (prefixSymbol) {
    return "%".concat(options.spaceSeparated ? " " : "").concat(output);
  }

  return "".concat(output).concat(options.spaceSeparated ? " " : "", "%");
}
/**
 * Format the provided INSTANCE as a percentage using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @return {string}
 */


function formatCurrency(instance, providedFormat, state) {
  var currentCurrency = state.currentCurrency();
  var options = Object.assign({}, defaultOptions, providedFormat);
  var decimalSeparator = undefined;
  var space = "";
  var average = !!options.totalLength || !!options.forceAverage || options.average;
  var position = providedFormat.currencyPosition || currentCurrency.position;
  var symbol = providedFormat.currencySymbol || currentCurrency.symbol;
  var spaceSeparatedCurrency = options.spaceSeparatedCurrency !== void 0 ? options.spaceSeparatedCurrency : options.spaceSeparated;

  if (providedFormat.lowPrecision === undefined) {
    providedFormat.lowPrecision = false;
  }

  if (spaceSeparatedCurrency) {
    space = " ";
  }

  if (position === "infix") {
    decimalSeparator = space + symbol + space;
  }

  var output = formatNumber({
    instance: instance,
    providedFormat: providedFormat,
    state: state,
    decimalSeparator: decimalSeparator
  });

  if (position === "prefix") {
    if (instance._value < 0 && options.negative === "sign") {
      output = "-".concat(space).concat(symbol).concat(output.slice(1));
    } else if (instance._value > 0 && options.forceSign) {
      output = "+".concat(space).concat(symbol).concat(output.slice(1));
    } else {
      output = symbol + space + output;
    }
  }

  if (!position || position === "postfix") {
    space = !options.spaceSeparatedAbbreviation && average ? "" : space;
    output = output + space + symbol;
  }

  return output;
}
/**
 * Compute the average value out of VALUE.
 * The other parameters are computation options.
 *
 * @param {number} value - value to compute
 * @param {string} [forceAverage] - forced unit used to compute
 * @param {boolean} [lowPrecision=true] - reduce average precision
 * @param {{}} abbreviations - part of the language specification
 * @param {boolean} spaceSeparated - `true` if a space must be inserted between the value and the abbreviation
 * @param {number} [totalLength] - total length of the output including the characteristic and the mantissa
 * @param {function} roundingFunction - function used to round numbers
 * @return {{value: number, abbreviation: string, mantissaPrecision: number}}
 */


function computeAverage(_ref) {
  var value = _ref.value,
      forceAverage = _ref.forceAverage,
      _ref$lowPrecision = _ref.lowPrecision,
      lowPrecision = _ref$lowPrecision === void 0 ? true : _ref$lowPrecision,
      abbreviations = _ref.abbreviations,
      _ref$spaceSeparated = _ref.spaceSeparated,
      spaceSeparated = _ref$spaceSeparated === void 0 ? false : _ref$spaceSeparated,
      _ref$totalLength = _ref.totalLength,
      totalLength = _ref$totalLength === void 0 ? 0 : _ref$totalLength,
      _ref$roundingFunction = _ref.roundingFunction,
      roundingFunction = _ref$roundingFunction === void 0 ? Math.round : _ref$roundingFunction;
  var abbreviation = "";
  var abs = Math.abs(value);
  var mantissaPrecision = -1;

  if (forceAverage && abbreviations[forceAverage] && powers[forceAverage]) {
    abbreviation = abbreviations[forceAverage];
    value = value / powers[forceAverage];
  } else {
    if (abs >= powers.trillion || lowPrecision && roundingFunction(abs / powers.trillion) === 1) {
      // trillion
      abbreviation = abbreviations.trillion;
      value = value / powers.trillion;
    } else if (abs < powers.trillion && abs >= powers.billion || lowPrecision && roundingFunction(abs / powers.billion) === 1) {
      // billion
      abbreviation = abbreviations.billion;
      value = value / powers.billion;
    } else if (abs < powers.billion && abs >= powers.million || lowPrecision && roundingFunction(abs / powers.million) === 1) {
      // million
      abbreviation = abbreviations.million;
      value = value / powers.million;
    } else if (abs < powers.million && abs >= powers.thousand || lowPrecision && roundingFunction(abs / powers.thousand) === 1) {
      // thousand
      abbreviation = abbreviations.thousand;
      value = value / powers.thousand;
    }
  }

  var optionalSpace = spaceSeparated ? " " : "";

  if (abbreviation) {
    abbreviation = optionalSpace + abbreviation;
  }

  if (totalLength) {
    var isNegative = value < 0;
    var characteristic = value.toString().split(".")[0];
    var characteristicLength = isNegative ? characteristic.length - 1 : characteristic.length;
    mantissaPrecision = Math.max(totalLength - characteristicLength, 0);
  }

  return {
    value: value,
    abbreviation: abbreviation,
    mantissaPrecision: mantissaPrecision
  };
}
/**
 * Compute an exponential form for VALUE, taking into account CHARACTERISTIC
 * if provided.
 * @param {number} value - value to compute
 * @param {number} [characteristicPrecision] - optional characteristic length
 * @return {{value: number, abbreviation: string}}
 */


function computeExponential(_ref2) {
  var value = _ref2.value,
      _ref2$characteristicP = _ref2.characteristicPrecision,
      characteristicPrecision = _ref2$characteristicP === void 0 ? 0 : _ref2$characteristicP;

  var _value$toExponential$ = value.toExponential().split("e"),
      _value$toExponential$2 = _slicedToArray(_value$toExponential$, 2),
      numberString = _value$toExponential$2[0],
      exponential = _value$toExponential$2[1];

  var number = +numberString;

  if (!characteristicPrecision) {
    return {
      value: number,
      abbreviation: "e".concat(exponential)
    };
  }

  var characteristicLength = 1; // see `toExponential`

  if (characteristicLength < characteristicPrecision) {
    number = number * Math.pow(10, characteristicPrecision - characteristicLength);
    exponential = +exponential - (characteristicPrecision - characteristicLength);
    exponential = exponential >= 0 ? "+".concat(exponential) : exponential;
  }

  return {
    value: number,
    abbreviation: "e".concat(exponential)
  };
}
/**
 * Return a string of NUMBER zero.
 *
 * @param {number} number - Length of the output
 * @return {string}
 */


function zeroes(number) {
  var result = "";

  for (var i = 0; i < number; i++) {
    result += "0";
  }

  return result;
}
/**
 * Return a string representing VALUE with a PRECISION-long mantissa.
 * This method is for large/small numbers only (a.k.a. including a "e").
 *
 * @param {number} value - number to precise
 * @param {number} precision - desired length for the mantissa
 * @return {string}
 */


function toFixedLarge(value, precision) {
  var result = value.toString();

  var _result$split = result.split("e"),
      _result$split2 = _slicedToArray(_result$split, 2),
      base = _result$split2[0],
      exp = _result$split2[1];

  var _base$split = base.split("."),
      _base$split2 = _slicedToArray(_base$split, 2),
      characteristic = _base$split2[0],
      _base$split2$ = _base$split2[1],
      mantissa = _base$split2$ === void 0 ? "" : _base$split2$;

  if (+exp > 0) {
    result = characteristic + mantissa + zeroes(exp - mantissa.length);
  } else {
    var prefix = ".";

    if (+characteristic < 0) {
      prefix = "-0".concat(prefix);
    } else {
      prefix = "0".concat(prefix);
    }

    var suffix = (zeroes(-exp - 1) + Math.abs(characteristic) + mantissa).substr(0, precision);

    if (suffix.length < precision) {
      suffix += zeroes(precision - suffix.length);
    }

    result = prefix + suffix;
  }

  if (+exp > 0 && precision > 0) {
    result += ".".concat(zeroes(precision));
  }

  return result;
}
/**
 * Return a string representing VALUE with a PRECISION-long mantissa.
 *
 * @param {number} value - number to precise
 * @param {number} precision - desired length for the mantissa
 * @param {function} roundingFunction - rounding function to be used
 * @return {string}
 */


function toFixed(value, precision) {
  var roundingFunction = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Math.round;

  if (value.toString().indexOf("e") !== -1) {
    return toFixedLarge(value, precision);
  }

  return (roundingFunction(+"".concat(value, "e+").concat(precision)) / Math.pow(10, precision)).toFixed(precision);
}
/**
 * Return the current OUTPUT with a mantissa precision of PRECISION.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} optionalMantissa - if `true`, the mantissa is omitted when it's only zeroes
 * @param {number} precision - desired precision of the mantissa
 * @param {boolean} trim - if `true`, trailing zeroes are removed from the mantissa
 * @return {string}
 */


function setMantissaPrecision(output, value, optionalMantissa, precision, trim, roundingFunction) {
  if (precision === -1) {
    return output;
  }

  var result = toFixed(value, precision, roundingFunction);

  var _result$toString$spli = result.toString().split("."),
      _result$toString$spli2 = _slicedToArray(_result$toString$spli, 2),
      currentCharacteristic = _result$toString$spli2[0],
      _result$toString$spli3 = _result$toString$spli2[1],
      currentMantissa = _result$toString$spli3 === void 0 ? "" : _result$toString$spli3;

  if (currentMantissa.match(/^0+$/) && (optionalMantissa || trim)) {
    return currentCharacteristic;
  }

  var hasTrailingZeroes = currentMantissa.match(/0+$/);

  if (trim && hasTrailingZeroes) {
    return "".concat(currentCharacteristic, ".").concat(currentMantissa.toString().slice(0, hasTrailingZeroes.index));
  }

  return result.toString();
}
/**
 * Return the current OUTPUT with a characteristic precision of PRECISION.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} optionalCharacteristic - `true` if the characteristic is omitted when it's only zeroes
 * @param {number} precision - desired precision of the characteristic
 * @return {string}
 */


function setCharacteristicPrecision(output, value, optionalCharacteristic, precision) {
  var result = output;

  var _result$toString$spli4 = result.toString().split("."),
      _result$toString$spli5 = _slicedToArray(_result$toString$spli4, 2),
      currentCharacteristic = _result$toString$spli5[0],
      currentMantissa = _result$toString$spli5[1];

  if (currentCharacteristic.match(/^-?0$/) && optionalCharacteristic) {
    if (!currentMantissa) {
      return currentCharacteristic.replace("0", "");
    }

    return "".concat(currentCharacteristic.replace("0", ""), ".").concat(currentMantissa);
  }

  var hasNegativeSign = value < 0 && currentCharacteristic.indexOf("-") === 0;

  if (hasNegativeSign) {
    // Remove the negative sign
    currentCharacteristic = currentCharacteristic.slice(1);
    result = result.slice(1);
  }

  if (currentCharacteristic.length < precision) {
    var missingZeros = precision - currentCharacteristic.length;

    for (var i = 0; i < missingZeros; i++) {
      result = "0".concat(result);
    }
  }

  if (hasNegativeSign) {
    // Add back the minus sign
    result = "-".concat(result);
  }

  return result.toString();
}
/**
 * Return the indexes where are the group separations after splitting
 * `totalLength` in group of `groupSize` size.
 * Important: we start grouping from the right hand side.
 *
 * @param {number} totalLength - total length of the characteristic to split
 * @param {number} groupSize - length of each group
 * @return {[number]}
 */


function indexesOfGroupSpaces(totalLength, groupSize) {
  var result = [];
  var counter = 0;

  for (var i = totalLength; i > 0; i--) {
    if (counter === groupSize) {
      result.unshift(i);
      counter = 0;
    }

    counter++;
  }

  return result;
}
/**
 * Replace the decimal separator with DECIMALSEPARATOR and insert thousand
 * separators.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} thousandSeparated - `true` if the characteristic must be separated
 * @param {globalState} state - shared state of the library
 * @param {string} decimalSeparator - string to use as decimal separator
 * @return {string}
 */


function replaceDelimiters(output, value, thousandSeparated, state, decimalSeparator) {
  var delimiters = state.currentDelimiters();
  var thousandSeparator = delimiters.thousands;
  decimalSeparator = decimalSeparator || delimiters.decimal;
  var thousandsSize = delimiters.thousandsSize || 3;
  var result = output.toString();
  var characteristic = result.split(".")[0];
  var mantissa = result.split(".")[1];
  var hasNegativeSign = value < 0 && characteristic.indexOf("-") === 0;

  if (thousandSeparated) {
    if (hasNegativeSign) {
      // Remove the negative sign
      characteristic = characteristic.slice(1);
    }

    var indexesToInsertThousandDelimiters = indexesOfGroupSpaces(characteristic.length, thousandsSize);
    indexesToInsertThousandDelimiters.forEach(function (position, index) {
      characteristic = characteristic.slice(0, position + index) + thousandSeparator + characteristic.slice(position + index);
    });

    if (hasNegativeSign) {
      // Add back the negative sign
      characteristic = "-".concat(characteristic);
    }
  }

  if (!mantissa) {
    result = characteristic;
  } else {
    result = characteristic + decimalSeparator + mantissa;
  }

  return result;
}
/**
 * Insert the provided ABBREVIATION at the end of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} abbreviation - abbreviation to append
 * @return {*}
 */


function insertAbbreviation(output, abbreviation) {
  return output + abbreviation;
}
/**
 * Insert the positive/negative sign according to the NEGATIVE flag.
 * If the value is negative but still output as 0, the negative sign is removed.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {string} negative - flag for the negative form ("sign" or "parenthesis")
 * @return {*}
 */


function insertSign(output, value, negative) {
  if (value === 0) {
    return output;
  }

  if (+output === 0) {
    return output.replace("-", "");
  }

  if (value > 0) {
    return "+".concat(output);
  }

  if (negative === "sign") {
    return output;
  }

  return "(".concat(output.replace("-", ""), ")");
}
/**
 * Insert the provided PREFIX at the start of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} prefix - abbreviation to prepend
 * @return {*}
 */


function insertPrefix(output, prefix) {
  return prefix + output;
}
/**
 * Insert the provided POSTFIX at the end of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} postfix - abbreviation to append
 * @return {*}
 */


function insertPostfix(output, postfix) {
  return output + postfix;
}
/**
 * Format the provided INSTANCE as a number using the PROVIDEDFORMAT,
 * and the STATE.
 * This is the key method of the framework!
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} [providedFormat] - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param {string} decimalSeparator - string to use as decimal separator
 * @param {{}} defaults - Set of default values used for formatting
 * @return {string}
 */


function formatNumber(_ref3) {
  var instance = _ref3.instance,
      providedFormat = _ref3.providedFormat,
      _ref3$state = _ref3.state,
      state = _ref3$state === void 0 ? globalState : _ref3$state,
      decimalSeparator = _ref3.decimalSeparator,
      _ref3$defaults = _ref3.defaults,
      defaults = _ref3$defaults === void 0 ? state.currentDefaults() : _ref3$defaults;
  var value = instance._value;

  if (value === 0 && state.hasZeroFormat()) {
    return state.getZeroFormat();
  }

  if (!isFinite(value)) {
    return value.toString();
  }

  var options = Object.assign({}, defaultOptions, defaults, providedFormat);
  var totalLength = options.totalLength;
  var characteristicPrecision = totalLength ? 0 : options.characteristic;
  var optionalCharacteristic = options.optionalCharacteristic;
  var forceAverage = options.forceAverage;
  var lowPrecision = options.lowPrecision;
  var average = !!totalLength || !!forceAverage || options.average; // default when averaging is to chop off decimals

  var mantissaPrecision = totalLength ? -1 : average && providedFormat.mantissa === undefined ? 0 : options.mantissa;
  var optionalMantissa = totalLength ? false : providedFormat.optionalMantissa === undefined ? mantissaPrecision === -1 : options.optionalMantissa;
  var trimMantissa = options.trimMantissa;
  var thousandSeparated = options.thousandSeparated;
  var spaceSeparated = options.spaceSeparated;
  var negative = options.negative;
  var forceSign = options.forceSign;
  var exponential = options.exponential;
  var roundingFunction = options.roundingFunction;
  var abbreviation = "";

  if (average) {
    var data = computeAverage({
      value: value,
      forceAverage: forceAverage,
      lowPrecision: lowPrecision,
      abbreviations: state.currentAbbreviations(),
      spaceSeparated: spaceSeparated,
      roundingFunction: roundingFunction,
      totalLength: totalLength
    });
    value = data.value;
    abbreviation += data.abbreviation;

    if (totalLength) {
      mantissaPrecision = data.mantissaPrecision;
    }
  }

  if (exponential) {
    var _data = computeExponential({
      value: value,
      characteristicPrecision: characteristicPrecision
    });

    value = _data.value;
    abbreviation = _data.abbreviation + abbreviation;
  }

  var output = setMantissaPrecision(value.toString(), value, optionalMantissa, mantissaPrecision, trimMantissa, roundingFunction);
  output = setCharacteristicPrecision(output, value, optionalCharacteristic, characteristicPrecision);
  output = replaceDelimiters(output, value, thousandSeparated, state, decimalSeparator);

  if (average || exponential) {
    output = insertAbbreviation(output, abbreviation);
  }

  if (forceSign || value < 0) {
    output = insertSign(output, value, negative);
  }

  return output;
}
/**
 * If FORMAT is non-null and not just an output, return FORMAT.
 * Return DEFAULTFORMAT otherwise.
 *
 * @param providedFormat
 * @param defaultFormat
 */


function formatOrDefault(providedFormat, defaultFormat) {
  if (!providedFormat) {
    return defaultFormat;
  }

  var keys = Object.keys(providedFormat);

  if (keys.length === 1 && keys[0] === "output") {
    return defaultFormat;
  }

  return providedFormat;
}

module.exports = function (numbro) {
  return {
    format: function format() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _format.apply(void 0, args.concat([numbro]));
    },
    getByteUnit: function getByteUnit() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return _getByteUnit.apply(void 0, args.concat([numbro]));
    },
    getBinaryByteUnit: function getBinaryByteUnit() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return _getBinaryByteUnit.apply(void 0, args.concat([numbro]));
    },
    getDecimalByteUnit: function getDecimalByteUnit() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return _getDecimalByteUnit.apply(void 0, args.concat([numbro]));
    },
    formatOrDefault: formatOrDefault
  };
};

},{"./globalState":4,"./parsing":8,"./validating":10}],4:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
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
var enUS = require("./en-US");

var validating = require("./validating");

var parsing = require("./parsing");

var state = {};
var currentLanguageTag = undefined;
var languages = {};
var zeroFormat = null;
var globalDefaults = {};

function chooseLanguage(tag) {
  currentLanguageTag = tag;
}

function currentLanguageData() {
  return languages[currentLanguageTag];
}
/**
 * Return all the register languages
 *
 * @return {{}}
 */


state.languages = function () {
  return Object.assign({}, languages);
}; //
// Current language accessors
//

/**
 * Return the current language tag
 *
 * @return {string}
 */


state.currentLanguage = function () {
  return currentLanguageTag;
};
/**
 * Return the current language bytes data
 *
 * @return {{}}
 */


state.currentBytes = function () {
  return currentLanguageData().bytes || {};
};
/**
 * Return the current language currency data
 *
 * @return {{}}
 */


state.currentCurrency = function () {
  return currentLanguageData().currency;
};
/**
 * Return the current language abbreviations data
 *
 * @return {{}}
 */


state.currentAbbreviations = function () {
  return currentLanguageData().abbreviations;
};
/**
 * Return the current language delimiters data
 *
 * @return {{}}
 */


state.currentDelimiters = function () {
  return currentLanguageData().delimiters;
};
/**
 * Return the current language ordinal function
 *
 * @return {function}
 */


state.currentOrdinal = function () {
  return currentLanguageData().ordinal;
}; //
// Defaults
//

/**
 * Return the current formatting defaults.
 * First use the current language default, then fallback to the globally defined defaults.
 *
 * @return {{}}
 */


state.currentDefaults = function () {
  return Object.assign({}, currentLanguageData().defaults, globalDefaults);
};
/**
 * Return the ordinal default-format.
 * First use the current language ordinal default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentOrdinalDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().ordinalFormat);
};
/**
 * Return the byte default-format.
 * First use the current language byte default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentByteDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().byteFormat);
};
/**
 * Return the percentage default-format.
 * First use the current language percentage default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentPercentageDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().percentageFormat);
};
/**
 * Return the currency default-format.
 * First use the current language currency default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentCurrencyDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().currencyFormat);
};
/**
 * Return the time default-format.
 * First use the current language currency default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentTimeDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().timeFormat);
};
/**
 * Set the global formatting defaults.
 *
 * @param {{}|string} format - formatting options to use as defaults
 */


state.setDefaults = function (format) {
  format = parsing.parseFormat(format);

  if (validating.validateFormat(format)) {
    globalDefaults = format;
  }
}; //
// Zero format
//

/**
 * Return the format string for 0.
 *
 * @return {string}
 */


state.getZeroFormat = function () {
  return zeroFormat;
};
/**
 * Set a STRING to output when the value is 0.
 *
 * @param {{}|string} string - string to set
 */


state.setZeroFormat = function (string) {
  return zeroFormat = typeof string === "string" ? string : null;
};
/**
 * Return true if a format for 0 has been set already.
 *
 * @return {boolean}
 */


state.hasZeroFormat = function () {
  return zeroFormat !== null;
}; //
// Getters/Setters
//

/**
 * Return the language data for the provided TAG.
 * Return the current language data if no tag is provided.
 *
 * Throw an error if the tag doesn't match any registered language.
 *
 * @param {string} [tag] - language tag of a registered language
 * @return {{}}
 */


state.languageData = function (tag) {
  if (tag) {
    if (languages[tag]) {
      return languages[tag];
    }

    throw new Error("Unknown tag \"".concat(tag, "\""));
  }

  return currentLanguageData();
};
/**
 * Register the provided DATA as a language if and only if the data is valid.
 * If the data is not valid, an error is thrown.
 *
 * When USELANGUAGE is true, the registered language is then used.
 *
 * @param {{}} data - language data to register
 * @param {boolean} [useLanguage] - `true` if the provided data should become the current language
 */


state.registerLanguage = function (data) {
  var useLanguage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!validating.validateLanguage(data)) {
    throw new Error("Invalid language data");
  }

  languages[data.languageTag] = data;

  if (useLanguage) {
    chooseLanguage(data.languageTag);
  }
};
/**
 * Set the current language according to TAG.
 * If TAG doesn't match a registered language, another language matching
 * the "language" part of the tag (according to BCP47: https://tools.ietf.org/rfc/bcp/bcp47.txt).
 * If none, the FALLBACKTAG is used. If the FALLBACKTAG doesn't match a register language,
 * `en-US` is finally used.
 *
 * @param tag
 * @param fallbackTag
 */


state.setLanguage = function (tag) {
  var fallbackTag = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : enUS.languageTag;

  if (!languages[tag]) {
    var suffix = tag.split("-")[0];
    var matchingLanguageTag = Object.keys(languages).find(function (each) {
      return each.split("-")[0] === suffix;
    });

    if (!languages[matchingLanguageTag]) {
      chooseLanguage(fallbackTag);
      return;
    }

    chooseLanguage(matchingLanguageTag);
    return;
  }

  chooseLanguage(tag);
};

state.registerLanguage(enUS);
currentLanguageTag = enUS.languageTag;
module.exports = state;

},{"./en-US":2,"./parsing":8,"./validating":10}],5:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
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
 * Load languages matching TAGS. Silently pass over the failing load.
 *
 * We assume here that we are in a node environment, so we don't check for it.
 * @param {[String]} tags - list of tags to load
 * @param {Numbro} numbro - the numbro singleton
 */
function _loadLanguagesInNode(tags, numbro) {
  tags.forEach(function (tag) {
    var data = undefined;

    try {
      data = require("../languages/".concat(tag));
    } catch (e) {
      console.error("Unable to load \"".concat(tag, "\". No matching language file found.")); // eslint-disable-line no-console
    }

    if (data) {
      numbro.registerLanguage(data);
    }
  });
}

module.exports = function (numbro) {
  return {
    loadLanguagesInNode: function loadLanguagesInNode(tags) {
      return _loadLanguagesInNode(tags, numbro);
    }
  };
};

},{}],6:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
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
var BigNumber = require("bignumber.js");
/**
 * Add a number or a numbro to N.
 *
 * @param {Numbro} n - augend
 * @param {number|Numbro} other - addend
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _add(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.plus(otherValue).toNumber();
  return n;
}
/**
 * Subtract a number or a numbro from N.
 *
 * @param {Numbro} n - minuend
 * @param {number|Numbro} other - subtrahend
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _subtract(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.minus(otherValue).toNumber();
  return n;
}
/**
 * Multiply N by a number or a numbro.
 *
 * @param {Numbro} n - multiplicand
 * @param {number|Numbro} other - multiplier
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _multiply(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.times(otherValue).toNumber();
  return n;
}
/**
 * Divide N by a number or a numbro.
 *
 * @param {Numbro} n - dividend
 * @param {number|Numbro} other - divisor
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _divide(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.dividedBy(otherValue).toNumber();
  return n;
}
/**
 * Set N to the OTHER (or the value of OTHER when it's a numbro instance).
 *
 * @param {Numbro} n - numbro instance to mutate
 * @param {number|Numbro} other - new value to assign to N
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _set(n, other, numbro) {
  var value = other;

  if (numbro.isNumbro(other)) {
    value = other._value;
  }

  n._value = value;
  return n;
}
/**
 * Return the distance between N and OTHER.
 *
 * @param {Numbro} n
 * @param {number|Numbro} other
 * @param {numbro} numbro - numbro singleton
 * @return {number}
 */


function _difference(n, other, numbro) {
  var clone = numbro(n._value);

  _subtract(clone, other, numbro);

  return Math.abs(clone._value);
}

module.exports = function (numbro) {
  return {
    add: function add(n, other) {
      return _add(n, other, numbro);
    },
    subtract: function subtract(n, other) {
      return _subtract(n, other, numbro);
    },
    multiply: function multiply(n, other) {
      return _multiply(n, other, numbro);
    },
    divide: function divide(n, other) {
      return _divide(n, other, numbro);
    },
    set: function set(n, other) {
      return _set(n, other, numbro);
    },
    difference: function difference(n, other) {
      return _difference(n, other, numbro);
    },
    BigNumber: BigNumber
  };
};

},{"bignumber.js":1}],7:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
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
var VERSION = "2.3.3";

var globalState = require("./globalState");

var validator = require("./validating");

var loader = require("./loading")(numbro);

var unformatter = require("./unformatting");

var formatter = require("./formatting")(numbro);

var manipulate = require("./manipulating")(numbro);

var parsing = require("./parsing");

var Numbro = /*#__PURE__*/function () {
  function Numbro(number) {
    _classCallCheck(this, Numbro);

    this._value = number;
  }

  _createClass(Numbro, [{
    key: "clone",
    value: function clone() {
      return numbro(this._value);
    }
  }, {
    key: "format",
    value: function format() {
      var _format = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return formatter.format(this, _format);
    }
  }, {
    key: "formatCurrency",
    value: function formatCurrency(format) {
      if (typeof format === "string") {
        format = parsing.parseFormat(format);
      }

      format = formatter.formatOrDefault(format, globalState.currentCurrencyDefaultFormat());
      format.output = "currency";
      return formatter.format(this, format);
    }
  }, {
    key: "formatTime",
    value: function formatTime() {
      var format = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      format.output = "time";
      return formatter.format(this, format);
    }
  }, {
    key: "binaryByteUnits",
    value: function binaryByteUnits() {
      return formatter.getBinaryByteUnit(this);
    }
  }, {
    key: "decimalByteUnits",
    value: function decimalByteUnits() {
      return formatter.getDecimalByteUnit(this);
    }
  }, {
    key: "byteUnits",
    value: function byteUnits() {
      return formatter.getByteUnit(this);
    }
  }, {
    key: "difference",
    value: function difference(other) {
      return manipulate.difference(this, other);
    }
  }, {
    key: "add",
    value: function add(other) {
      return manipulate.add(this, other);
    }
  }, {
    key: "subtract",
    value: function subtract(other) {
      return manipulate.subtract(this, other);
    }
  }, {
    key: "multiply",
    value: function multiply(other) {
      return manipulate.multiply(this, other);
    }
  }, {
    key: "divide",
    value: function divide(other) {
      return manipulate.divide(this, other);
    }
  }, {
    key: "set",
    value: function set(input) {
      return manipulate.set(this, normalizeInput(input));
    }
  }, {
    key: "value",
    value: function value() {
      return this._value;
    }
  }, {
    key: "valueOf",
    value: function valueOf() {
      return this._value;
    }
  }]);

  return Numbro;
}();
/**
 * Make its best to convert input into a number.
 *
 * @param {numbro|string|number} input - Input to convert
 * @return {number}
 */


function normalizeInput(input) {
  var result = input;

  if (numbro.isNumbro(input)) {
    result = input._value;
  } else if (typeof input === "string") {
    result = numbro.unformat(input);
  } else if (isNaN(input)) {
    result = NaN;
  }

  return result;
}

function numbro(input) {
  return new Numbro(normalizeInput(input));
}

numbro.version = VERSION;

numbro.isNumbro = function (object) {
  return object instanceof Numbro;
}; //
// `numbro` static methods
//


numbro.language = globalState.currentLanguage;
numbro.registerLanguage = globalState.registerLanguage;
numbro.setLanguage = globalState.setLanguage;
numbro.languages = globalState.languages;
numbro.languageData = globalState.languageData;
numbro.zeroFormat = globalState.setZeroFormat;
numbro.defaultFormat = globalState.currentDefaults;
numbro.setDefaults = globalState.setDefaults;
numbro.defaultCurrencyFormat = globalState.currentCurrencyDefaultFormat;
numbro.validate = validator.validate;
numbro.loadLanguagesInNode = loader.loadLanguagesInNode;
numbro.unformat = unformatter.unformat;
numbro.BigNumber = manipulate.BigNumber;
module.exports = numbro;

},{"./formatting":3,"./globalState":4,"./loading":5,"./manipulating":6,"./parsing":8,"./unformatting":9,"./validating":10}],8:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
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
 * Parse the format STRING looking for a prefix. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parsePrefix(string, result) {
  var match = string.match(/^{([^}]*)}/);

  if (match) {
    result.prefix = match[1];
    return string.slice(match[0].length);
  }

  return string;
}
/**
 * Parse the format STRING looking for a postfix. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parsePostfix(string, result) {
  var match = string.match(/{([^}]*)}$/);

  if (match) {
    result.postfix = match[1];
    return string.slice(0, -match[0].length);
  }

  return string;
}
/**
 * Parse the format STRING looking for the output value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 */


function parseOutput(string, result) {
  if (string.indexOf("$") !== -1) {
    result.output = "currency";
    return;
  }

  if (string.indexOf("%") !== -1) {
    result.output = "percent";
    return;
  }

  if (string.indexOf("bd") !== -1) {
    result.output = "byte";
    result.base = "general";
    return;
  }

  if (string.indexOf("b") !== -1) {
    result.output = "byte";
    result.base = "binary";
    return;
  }

  if (string.indexOf("d") !== -1) {
    result.output = "byte";
    result.base = "decimal";
    return;
  }

  if (string.indexOf(":") !== -1) {
    result.output = "time";
    return;
  }

  if (string.indexOf("o") !== -1) {
    result.output = "ordinal";
  }
}
/**
 * Parse the format STRING looking for the thousand separated value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseThousandSeparated(string, result) {
  if (string.indexOf(",") !== -1) {
    result.thousandSeparated = true;
  }
}
/**
 * Parse the format STRING looking for the space separated value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseSpaceSeparated(string, result) {
  if (string.indexOf(" ") !== -1) {
    result.spaceSeparated = true;
    result.spaceSeparatedCurrency = true;

    if (result.average || result.forceAverage) {
      result.spaceSeparatedAbbreviation = true;
    }
  }
}
/**
 * Parse the format STRING looking for the total length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseTotalLength(string, result) {
  var match = string.match(/[1-9]+[0-9]*/);

  if (match) {
    result.totalLength = +match[0];
  }
}
/**
 * Parse the format STRING looking for the characteristic length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseCharacteristic(string, result) {
  var characteristic = string.split(".")[0];
  var match = characteristic.match(/0+/);

  if (match) {
    result.characteristic = match[0].length;
  }
}
/**
 * Parse the format STRING looking for the mantissa length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseMantissa(string, result) {
  var mantissa = string.split(".")[1];

  if (mantissa) {
    var match = mantissa.match(/0+/);

    if (match) {
      result.mantissa = match[0].length;
    }
  }
}
/**
 * Parse the format STRING looking for a trimmed mantissa. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 */


function parseTrimMantissa(string, result) {
  var mantissa = string.split(".")[1];

  if (mantissa) {
    result.trimMantissa = mantissa.indexOf("[") !== -1;
  }
}
/**
 * Parse the format STRING looking for the average value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseAverage(string, result) {
  if (string.indexOf("a") !== -1) {
    result.average = true;
  }
}
/**
 * Parse the format STRING looking for a forced average precision. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseForceAverage(string, result) {
  if (string.indexOf("K") !== -1) {
    result.forceAverage = "thousand";
  } else if (string.indexOf("M") !== -1) {
    result.forceAverage = "million";
  } else if (string.indexOf("B") !== -1) {
    result.forceAverage = "billion";
  } else if (string.indexOf("T") !== -1) {
    result.forceAverage = "trillion";
  }
}
/**
 * Parse the format STRING finding if the mantissa is optional. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseOptionalMantissa(string, result) {
  if (string.match(/\[\.]/)) {
    result.optionalMantissa = true;
  } else if (string.match(/\./)) {
    result.optionalMantissa = false;
  }
}
/**
 * Parse the format STRING finding if the characteristic is optional. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseOptionalCharacteristic(string, result) {
  if (string.indexOf(".") !== -1) {
    var characteristic = string.split(".")[0];
    result.optionalCharacteristic = characteristic.indexOf("0") === -1;
  }
}
/**
 * Parse the format STRING looking for the negative format. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseNegative(string, result) {
  if (string.match(/^\+?\([^)]*\)$/)) {
    result.negative = "parenthesis";
  }

  if (string.match(/^\+?-/)) {
    result.negative = "sign";
  }
}
/**
 * Parse the format STRING finding if the sign is mandatory. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 */


function parseForceSign(string, result) {
  if (string.match(/^\+/)) {
    result.forceSign = true;
  }
}
/**
 * Parse the format STRING and accumulating the values ie RESULT.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {NumbroFormat} - format
 */


function parseFormat(string) {
  var result = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (typeof string !== "string") {
    return string;
  }

  string = parsePrefix(string, result);
  string = parsePostfix(string, result);
  parseOutput(string, result);
  parseTotalLength(string, result);
  parseCharacteristic(string, result);
  parseOptionalCharacteristic(string, result);
  parseAverage(string, result);
  parseForceAverage(string, result);
  parseMantissa(string, result);
  parseOptionalMantissa(string, result);
  parseTrimMantissa(string, result);
  parseThousandSeparated(string, result);
  parseSpaceSeparated(string, result);
  parseNegative(string, result);
  parseForceSign(string, result);
  return result;
}

module.exports = {
  parseFormat: parseFormat
};

},{}],9:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
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
var allSuffixes = [{
  key: "ZiB",
  factor: Math.pow(1024, 7)
}, {
  key: "ZB",
  factor: Math.pow(1000, 7)
}, {
  key: "YiB",
  factor: Math.pow(1024, 8)
}, {
  key: "YB",
  factor: Math.pow(1000, 8)
}, {
  key: "TiB",
  factor: Math.pow(1024, 4)
}, {
  key: "TB",
  factor: Math.pow(1000, 4)
}, {
  key: "PiB",
  factor: Math.pow(1024, 5)
}, {
  key: "PB",
  factor: Math.pow(1000, 5)
}, {
  key: "MiB",
  factor: Math.pow(1024, 2)
}, {
  key: "MB",
  factor: Math.pow(1000, 2)
}, {
  key: "KiB",
  factor: Math.pow(1024, 1)
}, {
  key: "KB",
  factor: Math.pow(1000, 1)
}, {
  key: "GiB",
  factor: Math.pow(1024, 3)
}, {
  key: "GB",
  factor: Math.pow(1000, 3)
}, {
  key: "EiB",
  factor: Math.pow(1024, 6)
}, {
  key: "EB",
  factor: Math.pow(1000, 6)
}, {
  key: "B",
  factor: 1
}];
/**
 * Generate a RegExp where S get all RegExp specific characters escaped.
 *
 * @param {string} s - string representing a RegExp
 * @return {string}
 */

function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}
/**
 * Recursively compute the unformatted value.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @param {function} ordinal - function used to generate an ordinal out of a number
 * @param {string} zeroFormat - string representing zero
 * @param {*} abbreviations - abbreviations used while generating the inputString
 * @param {NumbroFormat} format - format used while generating the inputString
 * @return {number|undefined}
 */


function computeUnformattedValue(inputString, delimiters) {
  var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  var ordinal = arguments.length > 3 ? arguments[3] : undefined;
  var zeroFormat = arguments.length > 4 ? arguments[4] : undefined;
  var abbreviations = arguments.length > 5 ? arguments[5] : undefined;
  var format = arguments.length > 6 ? arguments[6] : undefined;

  if (!isNaN(+inputString)) {
    return +inputString;
  }

  var stripped = ""; // Negative

  var newInput = inputString.replace(/(^[^(]*)\((.*)\)([^)]*$)/, "$1$2$3");

  if (newInput !== inputString) {
    return -1 * computeUnformattedValue(newInput, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
  } // Byte


  for (var i = 0; i < allSuffixes.length; i++) {
    var suffix = allSuffixes[i];
    stripped = inputString.replace(RegExp("([0-9 ])(".concat(suffix.key, ")$")), "$1");

    if (stripped !== inputString) {
      return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) * suffix.factor;
    }
  } // Percent


  stripped = inputString.replace("%", "");

  if (stripped !== inputString) {
    return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) / 100;
  } // Ordinal


  var possibleOrdinalValue = parseFloat(inputString);

  if (isNaN(possibleOrdinalValue)) {
    return undefined;
  }

  var ordinalString = ordinal(possibleOrdinalValue);

  if (ordinalString && ordinalString !== ".") {
    // if ordinal is "." it will be caught next round in the +inputString
    stripped = inputString.replace(new RegExp("".concat(escapeRegExp(ordinalString), "$")), "");

    if (stripped !== inputString) {
      return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
    }
  } // Average


  var inversedAbbreviations = {};
  Object.keys(abbreviations).forEach(function (key) {
    inversedAbbreviations[abbreviations[key]] = key;
  });
  var abbreviationValues = Object.keys(inversedAbbreviations).sort().reverse();
  var numberOfAbbreviations = abbreviationValues.length;

  for (var _i = 0; _i < numberOfAbbreviations; _i++) {
    var value = abbreviationValues[_i];
    var key = inversedAbbreviations[value];
    stripped = inputString.replace(value, "");

    if (stripped !== inputString) {
      var factor = undefined;

      switch (key) {
        // eslint-disable-line default-case
        case "thousand":
          factor = Math.pow(10, 3);
          break;

        case "million":
          factor = Math.pow(10, 6);
          break;

        case "billion":
          factor = Math.pow(10, 9);
          break;

        case "trillion":
          factor = Math.pow(10, 12);
          break;
      }

      return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) * factor;
    }
  }

  return undefined;
}
/**
 * Removes in one pass all formatting symbols.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @return {string}
 */


function removeFormattingSymbols(inputString, delimiters) {
  var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  // Currency
  var stripped = inputString.replace(currencySymbol, ""); // Thousand separators

  stripped = stripped.replace(new RegExp("([0-9])".concat(escapeRegExp(delimiters.thousands), "([0-9])"), "g"), "$1$2"); // Decimal

  stripped = stripped.replace(delimiters.decimal, ".");
  return stripped;
}
/**
 * Unformat a numbro-generated string to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @param {function} ordinal - function used to generate an ordinal out of a number
 * @param {string} zeroFormat - string representing zero
 * @param {*} abbreviations - abbreviations used while generating the inputString
 * @param {NumbroFormat} format - format used while generating the inputString
 * @return {number|undefined}
 */


function unformatValue(inputString, delimiters) {
  var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  var ordinal = arguments.length > 3 ? arguments[3] : undefined;
  var zeroFormat = arguments.length > 4 ? arguments[4] : undefined;
  var abbreviations = arguments.length > 5 ? arguments[5] : undefined;
  var format = arguments.length > 6 ? arguments[6] : undefined;

  if (inputString === "") {
    return undefined;
  } // Zero Format


  if (inputString === zeroFormat) {
    return 0;
  }

  var value = removeFormattingSymbols(inputString, delimiters, currencySymbol);
  return computeUnformattedValue(value, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
}
/**
 * Check if the INPUTSTRING represents a time.
 *
 * @param {string} inputString - string to check
 * @param {*} delimiters - Delimiters used while generating the inputString
 * @return {boolean}
 */


function matchesTime(inputString, delimiters) {
  var separators = inputString.indexOf(":") && delimiters.thousands !== ":";

  if (!separators) {
    return false;
  }

  var segments = inputString.split(":");

  if (segments.length !== 3) {
    return false;
  }

  var hours = +segments[0];
  var minutes = +segments[1];
  var seconds = +segments[2];
  return !isNaN(hours) && !isNaN(minutes) && !isNaN(seconds);
}
/**
 * Unformat a numbro-generated string representing a time to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @return {number}
 */


function unformatTime(inputString) {
  var segments = inputString.split(":");
  var hours = +segments[0];
  var minutes = +segments[1];
  var seconds = +segments[2];
  return seconds + 60 * minutes + 3600 * hours;
}
/**
 * Unformat a numbro-generated string to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @param {NumbroFormat} format - format used  while generating the inputString
 * @return {number}
 */


function unformat(inputString, format) {
  // Avoid circular references
  var globalState = require("./globalState");

  var delimiters = globalState.currentDelimiters();
  var currencySymbol = globalState.currentCurrency().symbol;
  var ordinal = globalState.currentOrdinal();
  var zeroFormat = globalState.getZeroFormat();
  var abbreviations = globalState.currentAbbreviations();
  var value = undefined;

  if (typeof inputString === "string") {
    if (matchesTime(inputString, delimiters)) {
      value = unformatTime(inputString);
    } else {
      value = unformatValue(inputString, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
    }
  } else if (typeof inputString === "number") {
    value = inputString;
  } else {
    return undefined;
  }

  if (value === undefined) {
    return undefined;
  }

  return value;
}

module.exports = {
  unformat: unformat
};

},{"./globalState":4}],10:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
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
var unformatter = require("./unformatting"); // Simplified regexp supporting only `language`, `script`, and `region`


var bcp47RegExp = /^[a-z]{2,3}(-[a-zA-Z]{4})?(-([A-Z]{2}|[0-9]{3}))?$/;
var validOutputValues = ["currency", "percent", "byte", "time", "ordinal", "number"];
var validForceAverageValues = ["trillion", "billion", "million", "thousand"];
var validCurrencyPosition = ["prefix", "infix", "postfix"];
var validNegativeValues = ["sign", "parenthesis"];
var validMandatoryAbbreviations = {
  type: "object",
  children: {
    thousand: {
      type: "string",
      mandatory: true
    },
    million: {
      type: "string",
      mandatory: true
    },
    billion: {
      type: "string",
      mandatory: true
    },
    trillion: {
      type: "string",
      mandatory: true
    }
  },
  mandatory: true
};
var validAbbreviations = {
  type: "object",
  children: {
    thousand: "string",
    million: "string",
    billion: "string",
    trillion: "string"
  }
};
var validBaseValues = ["decimal", "binary", "general"];
var validFormat = {
  output: {
    type: "string",
    validValues: validOutputValues
  },
  base: {
    type: "string",
    validValues: validBaseValues,
    restriction: function restriction(number, format) {
      return format.output === "byte";
    },
    message: "`base` must be provided only when the output is `byte`",
    mandatory: function mandatory(format) {
      return format.output === "byte";
    }
  },
  characteristic: {
    type: "number",
    restriction: function restriction(number) {
      return number >= 0;
    },
    message: "value must be positive"
  },
  prefix: "string",
  postfix: "string",
  forceAverage: {
    type: "string",
    validValues: validForceAverageValues
  },
  average: "boolean",
  lowPrecision: {
    type: "boolean",
    restriction: function restriction(number, format) {
      return format.average === true;
    },
    message: "`lowPrecision` must be provided only when the option `average` is set"
  },
  currencyPosition: {
    type: "string",
    validValues: validCurrencyPosition
  },
  currencySymbol: "string",
  totalLength: {
    type: "number",
    restrictions: [{
      restriction: function restriction(number) {
        return number >= 0;
      },
      message: "value must be positive"
    }, {
      restriction: function restriction(number, format) {
        return !format.exponential;
      },
      message: "`totalLength` is incompatible with `exponential`"
    }]
  },
  mantissa: {
    type: "number",
    restriction: function restriction(number) {
      return number >= 0;
    },
    message: "value must be positive"
  },
  optionalMantissa: "boolean",
  trimMantissa: "boolean",
  roundingFunction: "function",
  optionalCharacteristic: "boolean",
  thousandSeparated: "boolean",
  spaceSeparated: "boolean",
  spaceSeparatedCurrency: "boolean",
  spaceSeparatedAbbreviation: "boolean",
  abbreviations: validAbbreviations,
  negative: {
    type: "string",
    validValues: validNegativeValues
  },
  forceSign: "boolean",
  exponential: {
    type: "boolean"
  },
  prefixSymbol: {
    type: "boolean",
    restriction: function restriction(number, format) {
      return format.output === "percent";
    },
    message: "`prefixSymbol` can be provided only when the output is `percent`"
  }
};
var validLanguage = {
  languageTag: {
    type: "string",
    mandatory: true,
    restriction: function restriction(tag) {
      return tag.match(bcp47RegExp);
    },
    message: "the language tag must follow the BCP 47 specification (see https://tools.ieft.org/html/bcp47)"
  },
  delimiters: {
    type: "object",
    children: {
      thousands: "string",
      decimal: "string",
      thousandsSize: "number"
    },
    mandatory: true
  },
  abbreviations: validMandatoryAbbreviations,
  spaceSeparated: "boolean",
  spaceSeparatedCurrency: "boolean",
  ordinal: {
    type: "function",
    mandatory: true
  },
  bytes: {
    type: "object",
    children: {
      binarySuffixes: "object",
      decimalSuffixes: "object"
    }
  },
  currency: {
    type: "object",
    children: {
      symbol: "string",
      position: "string",
      code: "string"
    },
    mandatory: true
  },
  defaults: "format",
  ordinalFormat: "format",
  byteFormat: "format",
  percentageFormat: "format",
  currencyFormat: "format",
  timeDefaults: "format",
  formats: {
    type: "object",
    children: {
      fourDigits: {
        type: "format",
        mandatory: true
      },
      fullWithTwoDecimals: {
        type: "format",
        mandatory: true
      },
      fullWithTwoDecimalsNoCurrency: {
        type: "format",
        mandatory: true
      },
      fullWithNoDecimals: {
        type: "format",
        mandatory: true
      }
    }
  }
};
/**
 * Check the validity of the provided input and format.
 * The check is NOT lazy.
 *
 * @param {string|number|Numbro} input - input to check
 * @param {NumbroFormat} format - format to check
 * @return {boolean} True when everything is correct
 */

function validate(input, format) {
  var validInput = validateInput(input);
  var isFormatValid = validateFormat(format);
  return validInput && isFormatValid;
}
/**
 * Check the validity of the numbro input.
 *
 * @param {string|number|Numbro} input - input to check
 * @return {boolean} True when everything is correct
 */


function validateInput(input) {
  var value = unformatter.unformat(input);
  return value !== undefined;
}
/**
 * Check the validity of the provided format TOVALIDATE against SPEC.
 *
 * @param {NumbroFormat} toValidate - format to check
 * @param {*} spec - specification against which to check
 * @param {string} prefix - prefix use for error messages
 * @param {boolean} skipMandatoryCheck - `true` when the check for mandatory key must be skipped
 * @return {boolean} True when everything is correct
 */


function validateSpec(toValidate, spec, prefix) {
  var skipMandatoryCheck = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var results = Object.keys(toValidate).map(function (key) {
    if (!spec[key]) {
      console.error("".concat(prefix, " Invalid key: ").concat(key)); // eslint-disable-line no-console

      return false;
    }

    var value = toValidate[key];
    var data = spec[key];

    if (typeof data === "string") {
      data = {
        type: data
      };
    }

    if (data.type === "format") {
      // all formats are partial (a.k.a will be merged with some default values) thus no need to check mandatory values
      var valid = validateSpec(value, validFormat, "[Validate ".concat(key, "]"), true);

      if (!valid) {
        return false;
      }
    } else if (_typeof(value) !== data.type) {
      console.error("".concat(prefix, " ").concat(key, " type mismatched: \"").concat(data.type, "\" expected, \"").concat(_typeof(value), "\" provided")); // eslint-disable-line no-console

      return false;
    }

    if (data.restrictions && data.restrictions.length) {
      var length = data.restrictions.length;

      for (var i = 0; i < length; i++) {
        var _data$restrictions$i = data.restrictions[i],
            restriction = _data$restrictions$i.restriction,
            message = _data$restrictions$i.message;

        if (!restriction(value, toValidate)) {
          console.error("".concat(prefix, " ").concat(key, " invalid value: ").concat(message)); // eslint-disable-line no-console

          return false;
        }
      }
    }

    if (data.restriction && !data.restriction(value, toValidate)) {
      console.error("".concat(prefix, " ").concat(key, " invalid value: ").concat(data.message)); // eslint-disable-line no-console

      return false;
    }

    if (data.validValues && data.validValues.indexOf(value) === -1) {
      console.error("".concat(prefix, " ").concat(key, " invalid value: must be among ").concat(JSON.stringify(data.validValues), ", \"").concat(value, "\" provided")); // eslint-disable-line no-console

      return false;
    }

    if (data.children) {
      var _valid = validateSpec(value, data.children, "[Validate ".concat(key, "]"));

      if (!_valid) {
        return false;
      }
    }

    return true;
  });

  if (!skipMandatoryCheck) {
    results.push.apply(results, _toConsumableArray(Object.keys(spec).map(function (key) {
      var data = spec[key];

      if (typeof data === "string") {
        data = {
          type: data
        };
      }

      if (data.mandatory) {
        var mandatory = data.mandatory;

        if (typeof mandatory === "function") {
          mandatory = mandatory(toValidate);
        }

        if (mandatory && toValidate[key] === undefined) {
          console.error("".concat(prefix, " Missing mandatory key \"").concat(key, "\"")); // eslint-disable-line no-console

          return false;
        }
      }

      return true;
    })));
  }

  return results.reduce(function (acc, current) {
    return acc && current;
  }, true);
}
/**
 * Check the provided FORMAT.
 *
 * @param {NumbroFormat} format - format to check
 * @return {boolean}
 */


function validateFormat(format) {
  return validateSpec(format, validFormat, "[Validate format]");
}
/**
 * Check the provided LANGUAGE.
 *
 * @param {NumbroLanguage} language - language to check
 * @return {boolean}
 */


function validateLanguage(language) {
  return validateSpec(language, validLanguage, "[Validate language]");
}

module.exports = {
  validate: validate,
  validateFormat: validateFormat,
  validateInput: validateInput,
  validateLanguage: validateLanguage
};

},{"./unformatting":9}]},{},[7])(7)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmlnbnVtYmVyLmpzL2JpZ251bWJlci5qcyIsInNyYy9lbi1VUy5qcyIsInNyYy9mb3JtYXR0aW5nLmpzIiwic3JjL2dsb2JhbFN0YXRlLmpzIiwic3JjL2xvYWRpbmcuanMiLCJzcmMvbWFuaXB1bGF0aW5nLmpzIiwic3JjL251bWJyby5qcyIsInNyYy9wYXJzaW5nLmpzIiwic3JjL3VuZm9ybWF0dGluZy5qcyIsInNyYy92YWxpZGF0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QW5CO0FBQ0g7QUFFRDs7Ozs7Ozs7QUFNQSxTQUFTLGdCQUFULENBQTBCLFFBQTFCLEVBQW9DO0FBQ2hDLFNBQU8sWUFBWSxDQUFDLFFBQUQsRUFBVyxhQUFYLEVBQTBCLHFCQUExQixDQUFuQjtBQUNIOztBQUVELE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBQ2IsRUFBQSxRQUFRLEVBQVIsUUFEYTtBQUViLEVBQUEsY0FBYyxFQUFkLGNBRmE7QUFHYixFQUFBLGFBQWEsRUFBYixhQUhhO0FBSWIsRUFBQSxnQkFBZ0IsRUFBaEI7QUFKYSxDQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIjsoZnVuY3Rpb24gKGdsb2JhbE9iamVjdCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbi8qXHJcbiAqICAgICAgYmlnbnVtYmVyLmpzIHY4LjEuMVxyXG4gKiAgICAgIEEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBhcmJpdHJhcnktcHJlY2lzaW9uIGFyaXRobWV0aWMuXHJcbiAqICAgICAgaHR0cHM6Ly9naXRodWIuY29tL01pa2VNY2wvYmlnbnVtYmVyLmpzXHJcbiAqICAgICAgQ29weXJpZ2h0IChjKSAyMDE5IE1pY2hhZWwgTWNsYXVnaGxpbiA8TThjaDg4bEBnbWFpbC5jb20+XHJcbiAqICAgICAgTUlUIExpY2Vuc2VkLlxyXG4gKlxyXG4gKiAgICAgIEJpZ051bWJlci5wcm90b3R5cGUgbWV0aG9kcyAgICAgfCAgQmlnTnVtYmVyIG1ldGhvZHNcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBhYnNvbHV0ZVZhbHVlICAgICAgICAgICAgYWJzICAgIHwgIGNsb25lXHJcbiAqICAgICAgY29tcGFyZWRUbyAgICAgICAgICAgICAgICAgICAgICB8ICBjb25maWcgICAgICAgICAgICAgICBzZXRcclxuICogICAgICBkZWNpbWFsUGxhY2VzICAgICAgICAgICAgZHAgICAgIHwgICAgICBERUNJTUFMX1BMQUNFU1xyXG4gKiAgICAgIGRpdmlkZWRCeSAgICAgICAgICAgICAgICBkaXYgICAgfCAgICAgIFJPVU5ESU5HX01PREVcclxuICogICAgICBkaXZpZGVkVG9JbnRlZ2VyQnkgICAgICAgaWRpdiAgIHwgICAgICBFWFBPTkVOVElBTF9BVFxyXG4gKiAgICAgIGV4cG9uZW50aWF0ZWRCeSAgICAgICAgICBwb3cgICAgfCAgICAgIFJBTkdFXHJcbiAqICAgICAgaW50ZWdlclZhbHVlICAgICAgICAgICAgICAgICAgICB8ICAgICAgQ1JZUFRPXHJcbiAqICAgICAgaXNFcXVhbFRvICAgICAgICAgICAgICAgIGVxICAgICB8ICAgICAgTU9EVUxPX01PREVcclxuICogICAgICBpc0Zpbml0ZSAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICBQT1dfUFJFQ0lTSU9OXHJcbiAqICAgICAgaXNHcmVhdGVyVGhhbiAgICAgICAgICAgIGd0ICAgICB8ICAgICAgRk9STUFUXHJcbiAqICAgICAgaXNHcmVhdGVyVGhhbk9yRXF1YWxUbyAgIGd0ZSAgICB8ICAgICAgQUxQSEFCRVRcclxuICogICAgICBpc0ludGVnZXIgICAgICAgICAgICAgICAgICAgICAgIHwgIGlzQmlnTnVtYmVyXHJcbiAqICAgICAgaXNMZXNzVGhhbiAgICAgICAgICAgICAgIGx0ICAgICB8ICBtYXhpbXVtICAgICAgICAgICAgICBtYXhcclxuICogICAgICBpc0xlc3NUaGFuT3JFcXVhbFRvICAgICAgbHRlICAgIHwgIG1pbmltdW0gICAgICAgICAgICAgIG1pblxyXG4gKiAgICAgIGlzTmFOICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgcmFuZG9tXHJcbiAqICAgICAgaXNOZWdhdGl2ZSAgICAgICAgICAgICAgICAgICAgICB8ICBzdW1cclxuICogICAgICBpc1Bvc2l0aXZlICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBpc1plcm8gICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBtaW51cyAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBtb2R1bG8gICAgICAgICAgICAgICAgICAgbW9kICAgIHxcclxuICogICAgICBtdWx0aXBsaWVkQnkgICAgICAgICAgICAgdGltZXMgIHxcclxuICogICAgICBuZWdhdGVkICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBwbHVzICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBwcmVjaXNpb24gICAgICAgICAgICAgICAgc2QgICAgIHxcclxuICogICAgICBzaGlmdGVkQnkgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBzcXVhcmVSb290ICAgICAgICAgICAgICAgc3FydCAgIHxcclxuICogICAgICB0b0V4cG9uZW50aWFsICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0ZpeGVkICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0Zvcm1hdCAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0ZyYWN0aW9uICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0pTT04gICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b051bWJlciAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b1ByZWNpc2lvbiAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b1N0cmluZyAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB2YWx1ZU9mICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICpcclxuICovXHJcblxyXG5cclxuICB2YXIgQmlnTnVtYmVyLFxyXG4gICAgaXNOdW1lcmljID0gL14tPyg/OlxcZCsoPzpcXC5cXGQqKT98XFwuXFxkKykoPzplWystXT9cXGQrKT8kL2ksXHJcbiAgICBoYXNTeW1ib2wgPSB0eXBlb2YgU3ltYm9sID09ICdmdW5jdGlvbicgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PSAnc3ltYm9sJyxcclxuXHJcbiAgICBtYXRoY2VpbCA9IE1hdGguY2VpbCxcclxuICAgIG1hdGhmbG9vciA9IE1hdGguZmxvb3IsXHJcblxyXG4gICAgYmlnbnVtYmVyRXJyb3IgPSAnW0JpZ051bWJlciBFcnJvcl0gJyxcclxuICAgIHRvb01hbnlEaWdpdHMgPSBiaWdudW1iZXJFcnJvciArICdOdW1iZXIgcHJpbWl0aXZlIGhhcyBtb3JlIHRoYW4gMTUgc2lnbmlmaWNhbnQgZGlnaXRzOiAnLFxyXG5cclxuICAgIEJBU0UgPSAxZTE0LFxyXG4gICAgTE9HX0JBU0UgPSAxNCxcclxuICAgIE1BWF9TQUZFX0lOVEVHRVIgPSAweDFmZmZmZmZmZmZmZmZmLCAgICAgICAgIC8vIDJeNTMgLSAxXHJcbiAgICAvLyBNQVhfSU5UMzIgPSAweDdmZmZmZmZmLCAgICAgICAgICAgICAgICAgICAvLyAyXjMxIC0gMVxyXG4gICAgUE9XU19URU4gPSBbMSwgMTAsIDEwMCwgMWUzLCAxZTQsIDFlNSwgMWU2LCAxZTcsIDFlOCwgMWU5LCAxZTEwLCAxZTExLCAxZTEyLCAxZTEzXSxcclxuICAgIFNRUlRfQkFTRSA9IDFlNyxcclxuXHJcbiAgICAvLyBFRElUQUJMRVxyXG4gICAgLy8gVGhlIGxpbWl0IG9uIHRoZSB2YWx1ZSBvZiBERUNJTUFMX1BMQUNFUywgVE9fRVhQX05FRywgVE9fRVhQX1BPUywgTUlOX0VYUCwgTUFYX0VYUCwgYW5kXHJcbiAgICAvLyB0aGUgYXJndW1lbnRzIHRvIHRvRXhwb25lbnRpYWwsIHRvRml4ZWQsIHRvRm9ybWF0LCBhbmQgdG9QcmVjaXNpb24uXHJcbiAgICBNQVggPSAxRTk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWF9JTlQzMlxyXG5cclxuXHJcbiAgLypcclxuICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIEJpZ051bWJlciBjb25zdHJ1Y3Rvci5cclxuICAgKi9cclxuICBmdW5jdGlvbiBjbG9uZShjb25maWdPYmplY3QpIHtcclxuICAgIHZhciBkaXYsIGNvbnZlcnRCYXNlLCBwYXJzZU51bWVyaWMsXHJcbiAgICAgIFAgPSBCaWdOdW1iZXIucHJvdG90eXBlID0geyBjb25zdHJ1Y3RvcjogQmlnTnVtYmVyLCB0b1N0cmluZzogbnVsbCwgdmFsdWVPZjogbnVsbCB9LFxyXG4gICAgICBPTkUgPSBuZXcgQmlnTnVtYmVyKDEpLFxyXG5cclxuXHJcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRURJVEFCTEUgQ09ORklHIERFRkFVTFRTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblxyXG4gICAgICAvLyBUaGUgZGVmYXVsdCB2YWx1ZXMgYmVsb3cgbXVzdCBiZSBpbnRlZ2VycyB3aXRoaW4gdGhlIGluY2x1c2l2ZSByYW5nZXMgc3RhdGVkLlxyXG4gICAgICAvLyBUaGUgdmFsdWVzIGNhbiBhbHNvIGJlIGNoYW5nZWQgYXQgcnVuLXRpbWUgdXNpbmcgQmlnTnVtYmVyLnNldC5cclxuXHJcbiAgICAgIC8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiBkZWNpbWFsIHBsYWNlcyBmb3Igb3BlcmF0aW9ucyBpbnZvbHZpbmcgZGl2aXNpb24uXHJcbiAgICAgIERFQ0lNQUxfUExBQ0VTID0gMjAsICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhcclxuXHJcbiAgICAgIC8vIFRoZSByb3VuZGluZyBtb2RlIHVzZWQgd2hlbiByb3VuZGluZyB0byB0aGUgYWJvdmUgZGVjaW1hbCBwbGFjZXMsIGFuZCB3aGVuIHVzaW5nXHJcbiAgICAgIC8vIHRvRXhwb25lbnRpYWwsIHRvRml4ZWQsIHRvRm9ybWF0IGFuZCB0b1ByZWNpc2lvbiwgYW5kIHJvdW5kIChkZWZhdWx0IHZhbHVlKS5cclxuICAgICAgLy8gVVAgICAgICAgICAwIEF3YXkgZnJvbSB6ZXJvLlxyXG4gICAgICAvLyBET1dOICAgICAgIDEgVG93YXJkcyB6ZXJvLlxyXG4gICAgICAvLyBDRUlMICAgICAgIDIgVG93YXJkcyArSW5maW5pdHkuXHJcbiAgICAgIC8vIEZMT09SICAgICAgMyBUb3dhcmRzIC1JbmZpbml0eS5cclxuICAgICAgLy8gSEFMRl9VUCAgICA0IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB1cC5cclxuICAgICAgLy8gSEFMRl9ET1dOICA1IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCBkb3duLlxyXG4gICAgICAvLyBIQUxGX0VWRU4gIDYgVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHRvd2FyZHMgZXZlbiBuZWlnaGJvdXIuXHJcbiAgICAgIC8vIEhBTEZfQ0VJTCAgNyBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdG93YXJkcyArSW5maW5pdHkuXHJcbiAgICAgIC8vIEhBTEZfRkxPT1IgOCBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdG93YXJkcyAtSW5maW5pdHkuXHJcbiAgICAgIFJPVU5ESU5HX01PREUgPSA0LCAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byA4XHJcblxyXG4gICAgICAvLyBFWFBPTkVOVElBTF9BVCA6IFtUT19FWFBfTkVHICwgVE9fRVhQX1BPU11cclxuXHJcbiAgICAgIC8vIFRoZSBleHBvbmVudCB2YWx1ZSBhdCBhbmQgYmVuZWF0aCB3aGljaCB0b1N0cmluZyByZXR1cm5zIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICAvLyBOdW1iZXIgdHlwZTogLTdcclxuICAgICAgVE9fRVhQX05FRyA9IC03LCAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIC1NQVhcclxuXHJcbiAgICAgIC8vIFRoZSBleHBvbmVudCB2YWx1ZSBhdCBhbmQgYWJvdmUgd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgLy8gTnVtYmVyIHR5cGU6IDIxXHJcbiAgICAgIFRPX0VYUF9QT1MgPSAyMSwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhcclxuXHJcbiAgICAgIC8vIFJBTkdFIDogW01JTl9FWFAsIE1BWF9FWFBdXHJcblxyXG4gICAgICAvLyBUaGUgbWluaW11bSBleHBvbmVudCB2YWx1ZSwgYmVuZWF0aCB3aGljaCB1bmRlcmZsb3cgdG8gemVybyBvY2N1cnMuXHJcbiAgICAgIC8vIE51bWJlciB0eXBlOiAtMzI0ICAoNWUtMzI0KVxyXG4gICAgICBNSU5fRVhQID0gLTFlNywgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0xIHRvIC1NQVhcclxuXHJcbiAgICAgIC8vIFRoZSBtYXhpbXVtIGV4cG9uZW50IHZhbHVlLCBhYm92ZSB3aGljaCBvdmVyZmxvdyB0byBJbmZpbml0eSBvY2N1cnMuXHJcbiAgICAgIC8vIE51bWJlciB0eXBlOiAgMzA4ICAoMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDgpXHJcbiAgICAgIC8vIEZvciBNQVhfRVhQID4gMWU3LCBlLmcuIG5ldyBCaWdOdW1iZXIoJzFlMTAwMDAwMDAwJykucGx1cygxKSBtYXkgYmUgc2xvdy5cclxuICAgICAgTUFYX0VYUCA9IDFlNywgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAxIHRvIE1BWFxyXG5cclxuICAgICAgLy8gV2hldGhlciB0byB1c2UgY3J5cHRvZ3JhcGhpY2FsbHktc2VjdXJlIHJhbmRvbSBudW1iZXIgZ2VuZXJhdGlvbiwgaWYgYXZhaWxhYmxlLlxyXG4gICAgICBDUllQVE8gPSBmYWxzZSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRydWUgb3IgZmFsc2VcclxuXHJcbiAgICAgIC8vIFRoZSBtb2R1bG8gbW9kZSB1c2VkIHdoZW4gY2FsY3VsYXRpbmcgdGhlIG1vZHVsdXM6IGEgbW9kIG4uXHJcbiAgICAgIC8vIFRoZSBxdW90aWVudCAocSA9IGEgLyBuKSBpcyBjYWxjdWxhdGVkIGFjY29yZGluZyB0byB0aGUgY29ycmVzcG9uZGluZyByb3VuZGluZyBtb2RlLlxyXG4gICAgICAvLyBUaGUgcmVtYWluZGVyIChyKSBpcyBjYWxjdWxhdGVkIGFzOiByID0gYSAtIG4gKiBxLlxyXG4gICAgICAvL1xyXG4gICAgICAvLyBVUCAgICAgICAgMCBUaGUgcmVtYWluZGVyIGlzIHBvc2l0aXZlIGlmIHRoZSBkaXZpZGVuZCBpcyBuZWdhdGl2ZSwgZWxzZSBpcyBuZWdhdGl2ZS5cclxuICAgICAgLy8gRE9XTiAgICAgIDEgVGhlIHJlbWFpbmRlciBoYXMgdGhlIHNhbWUgc2lnbiBhcyB0aGUgZGl2aWRlbmQuXHJcbiAgICAgIC8vICAgICAgICAgICAgIFRoaXMgbW9kdWxvIG1vZGUgaXMgY29tbW9ubHkga25vd24gYXMgJ3RydW5jYXRlZCBkaXZpc2lvbicgYW5kIGlzXHJcbiAgICAgIC8vICAgICAgICAgICAgIGVxdWl2YWxlbnQgdG8gKGEgJSBuKSBpbiBKYXZhU2NyaXB0LlxyXG4gICAgICAvLyBGTE9PUiAgICAgMyBUaGUgcmVtYWluZGVyIGhhcyB0aGUgc2FtZSBzaWduIGFzIHRoZSBkaXZpc29yIChQeXRob24gJSkuXHJcbiAgICAgIC8vIEhBTEZfRVZFTiA2IFRoaXMgbW9kdWxvIG1vZGUgaW1wbGVtZW50cyB0aGUgSUVFRSA3NTQgcmVtYWluZGVyIGZ1bmN0aW9uLlxyXG4gICAgICAvLyBFVUNMSUQgICAgOSBFdWNsaWRpYW4gZGl2aXNpb24uIHEgPSBzaWduKG4pICogZmxvb3IoYSAvIGFicyhuKSkuXHJcbiAgICAgIC8vICAgICAgICAgICAgIFRoZSByZW1haW5kZXIgaXMgYWx3YXlzIHBvc2l0aXZlLlxyXG4gICAgICAvL1xyXG4gICAgICAvLyBUaGUgdHJ1bmNhdGVkIGRpdmlzaW9uLCBmbG9vcmVkIGRpdmlzaW9uLCBFdWNsaWRpYW4gZGl2aXNpb24gYW5kIElFRUUgNzU0IHJlbWFpbmRlclxyXG4gICAgICAvLyBtb2RlcyBhcmUgY29tbW9ubHkgdXNlZCBmb3IgdGhlIG1vZHVsdXMgb3BlcmF0aW9uLlxyXG4gICAgICAvLyBBbHRob3VnaCB0aGUgb3RoZXIgcm91bmRpbmcgbW9kZXMgY2FuIGFsc28gYmUgdXNlZCwgdGhleSBtYXkgbm90IGdpdmUgdXNlZnVsIHJlc3VsdHMuXHJcbiAgICAgIE1PRFVMT19NT0RFID0gMSwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byA5XHJcblxyXG4gICAgICAvLyBUaGUgbWF4aW11bSBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZGlnaXRzIG9mIHRoZSByZXN1bHQgb2YgdGhlIGV4cG9uZW50aWF0ZWRCeSBvcGVyYXRpb24uXHJcbiAgICAgIC8vIElmIFBPV19QUkVDSVNJT04gaXMgMCwgdGhlcmUgd2lsbCBiZSB1bmxpbWl0ZWQgc2lnbmlmaWNhbnQgZGlnaXRzLlxyXG4gICAgICBQT1dfUFJFQ0lTSU9OID0gMCwgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gTUFYXHJcblxyXG4gICAgICAvLyBUaGUgZm9ybWF0IHNwZWNpZmljYXRpb24gdXNlZCBieSB0aGUgQmlnTnVtYmVyLnByb3RvdHlwZS50b0Zvcm1hdCBtZXRob2QuXHJcbiAgICAgIEZPUk1BVCA9IHtcclxuICAgICAgICBwcmVmaXg6ICcnLFxyXG4gICAgICAgIGdyb3VwU2l6ZTogMyxcclxuICAgICAgICBzZWNvbmRhcnlHcm91cFNpemU6IDAsXHJcbiAgICAgICAgZ3JvdXBTZXBhcmF0b3I6ICcsJyxcclxuICAgICAgICBkZWNpbWFsU2VwYXJhdG9yOiAnLicsXHJcbiAgICAgICAgZnJhY3Rpb25Hcm91cFNpemU6IDAsXHJcbiAgICAgICAgZnJhY3Rpb25Hcm91cFNlcGFyYXRvcjogJ1xceEEwJywgICAgICAvLyBub24tYnJlYWtpbmcgc3BhY2VcclxuICAgICAgICBzdWZmaXg6ICcnXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBUaGUgYWxwaGFiZXQgdXNlZCBmb3IgYmFzZSBjb252ZXJzaW9uLiBJdCBtdXN0IGJlIGF0IGxlYXN0IDIgY2hhcmFjdGVycyBsb25nLCB3aXRoIG5vICcrJyxcclxuICAgICAgLy8gJy0nLCAnLicsIHdoaXRlc3BhY2UsIG9yIHJlcGVhdGVkIGNoYXJhY3Rlci5cclxuICAgICAgLy8gJzAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJF8nXHJcbiAgICAgIEFMUEhBQkVUID0gJzAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eic7XHJcblxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cclxuICAgIC8vIENPTlNUUlVDVE9SXHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBUaGUgQmlnTnVtYmVyIGNvbnN0cnVjdG9yIGFuZCBleHBvcnRlZCBmdW5jdGlvbi5cclxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgbmV3IGluc3RhbmNlIG9mIGEgQmlnTnVtYmVyIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiB2IHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gQSBudW1lcmljIHZhbHVlLlxyXG4gICAgICogW2JdIHtudW1iZXJ9IFRoZSBiYXNlIG9mIHYuIEludGVnZXIsIDIgdG8gQUxQSEFCRVQubGVuZ3RoIGluY2x1c2l2ZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gQmlnTnVtYmVyKHYsIGIpIHtcclxuICAgICAgdmFyIGFscGhhYmV0LCBjLCBjYXNlQ2hhbmdlZCwgZSwgaSwgaXNOdW0sIGxlbiwgc3RyLFxyXG4gICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgLy8gRW5hYmxlIGNvbnN0cnVjdG9yIGNhbGwgd2l0aG91dCBgbmV3YC5cclxuICAgICAgaWYgKCEoeCBpbnN0YW5jZW9mIEJpZ051bWJlcikpIHJldHVybiBuZXcgQmlnTnVtYmVyKHYsIGIpO1xyXG5cclxuICAgICAgaWYgKGIgPT0gbnVsbCkge1xyXG5cclxuICAgICAgICBpZiAodiAmJiB2Ll9pc0JpZ051bWJlciA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgeC5zID0gdi5zO1xyXG5cclxuICAgICAgICAgIGlmICghdi5jIHx8IHYuZSA+IE1BWF9FWFApIHtcclxuICAgICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuICAgICAgICAgIH0gZWxzZSBpZiAodi5lIDwgTUlOX0VYUCkge1xyXG4gICAgICAgICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB4LmUgPSB2LmU7XHJcbiAgICAgICAgICAgIHguYyA9IHYuYy5zbGljZSgpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICgoaXNOdW0gPSB0eXBlb2YgdiA9PSAnbnVtYmVyJykgJiYgdiAqIDAgPT0gMCkge1xyXG5cclxuICAgICAgICAgIC8vIFVzZSBgMSAvIG5gIHRvIGhhbmRsZSBtaW51cyB6ZXJvIGFsc28uXHJcbiAgICAgICAgICB4LnMgPSAxIC8gdiA8IDAgPyAodiA9IC12LCAtMSkgOiAxO1xyXG5cclxuICAgICAgICAgIC8vIEZhc3QgcGF0aCBmb3IgaW50ZWdlcnMsIHdoZXJlIG4gPCAyMTQ3NDgzNjQ4ICgyKiozMSkuXHJcbiAgICAgICAgICBpZiAodiA9PT0gfn52KSB7XHJcbiAgICAgICAgICAgIGZvciAoZSA9IDAsIGkgPSB2OyBpID49IDEwOyBpIC89IDEwLCBlKyspO1xyXG5cclxuICAgICAgICAgICAgaWYgKGUgPiBNQVhfRVhQKSB7XHJcbiAgICAgICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB4LmUgPSBlO1xyXG4gICAgICAgICAgICAgIHguYyA9IFt2XTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHN0ciA9IFN0cmluZyh2KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIGlmICghaXNOdW1lcmljLnRlc3Qoc3RyID0gU3RyaW5nKHYpKSkgcmV0dXJuIHBhcnNlTnVtZXJpYyh4LCBzdHIsIGlzTnVtKTtcclxuXHJcbiAgICAgICAgICB4LnMgPSBzdHIuY2hhckNvZGVBdCgwKSA9PSA0NSA/IChzdHIgPSBzdHIuc2xpY2UoMSksIC0xKSA6IDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZWNpbWFsIHBvaW50P1xyXG4gICAgICAgIGlmICgoZSA9IHN0ci5pbmRleE9mKCcuJykpID4gLTEpIHN0ciA9IHN0ci5yZXBsYWNlKCcuJywgJycpO1xyXG5cclxuICAgICAgICAvLyBFeHBvbmVudGlhbCBmb3JtP1xyXG4gICAgICAgIGlmICgoaSA9IHN0ci5zZWFyY2goL2UvaSkpID4gMCkge1xyXG5cclxuICAgICAgICAgIC8vIERldGVybWluZSBleHBvbmVudC5cclxuICAgICAgICAgIGlmIChlIDwgMCkgZSA9IGk7XHJcbiAgICAgICAgICBlICs9ICtzdHIuc2xpY2UoaSArIDEpO1xyXG4gICAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLCBpKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGUgPCAwKSB7XHJcblxyXG4gICAgICAgICAgLy8gSW50ZWdlci5cclxuICAgICAgICAgIGUgPSBzdHIubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBCYXNlIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtifSdcclxuICAgICAgICBpbnRDaGVjayhiLCAyLCBBTFBIQUJFVC5sZW5ndGgsICdCYXNlJyk7XHJcblxyXG4gICAgICAgIC8vIEFsbG93IGV4cG9uZW50aWFsIG5vdGF0aW9uIHRvIGJlIHVzZWQgd2l0aCBiYXNlIDEwIGFyZ3VtZW50LCB3aGlsZVxyXG4gICAgICAgIC8vIGFsc28gcm91bmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYXMgd2l0aCBvdGhlciBiYXNlcy5cclxuICAgICAgICBpZiAoYiA9PSAxMCkge1xyXG4gICAgICAgICAgeCA9IG5ldyBCaWdOdW1iZXIodik7XHJcbiAgICAgICAgICByZXR1cm4gcm91bmQoeCwgREVDSU1BTF9QTEFDRVMgKyB4LmUgKyAxLCBST1VORElOR19NT0RFKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0ciA9IFN0cmluZyh2KTtcclxuXHJcbiAgICAgICAgaWYgKGlzTnVtID0gdHlwZW9mIHYgPT0gJ251bWJlcicpIHtcclxuXHJcbiAgICAgICAgICAvLyBBdm9pZCBwb3RlbnRpYWwgaW50ZXJwcmV0YXRpb24gb2YgSW5maW5pdHkgYW5kIE5hTiBhcyBiYXNlIDQ0KyB2YWx1ZXMuXHJcbiAgICAgICAgICBpZiAodiAqIDAgIT0gMCkgcmV0dXJuIHBhcnNlTnVtZXJpYyh4LCBzdHIsIGlzTnVtLCBiKTtcclxuXHJcbiAgICAgICAgICB4LnMgPSAxIC8gdiA8IDAgPyAoc3RyID0gc3RyLnNsaWNlKDEpLCAtMSkgOiAxO1xyXG5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOdW1iZXIgcHJpbWl0aXZlIGhhcyBtb3JlIHRoYW4gMTUgc2lnbmlmaWNhbnQgZGlnaXRzOiB7bn0nXHJcbiAgICAgICAgICBpZiAoQmlnTnVtYmVyLkRFQlVHICYmIHN0ci5yZXBsYWNlKC9eMFxcLjAqfFxcLi8sICcnKS5sZW5ndGggPiAxNSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgKHRvb01hbnlEaWdpdHMgKyB2KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeC5zID0gc3RyLmNoYXJDb2RlQXQoMCkgPT09IDQ1ID8gKHN0ciA9IHN0ci5zbGljZSgxKSwgLTEpIDogMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFscGhhYmV0ID0gQUxQSEFCRVQuc2xpY2UoMCwgYik7XHJcbiAgICAgICAgZSA9IGkgPSAwO1xyXG5cclxuICAgICAgICAvLyBDaGVjayB0aGF0IHN0ciBpcyBhIHZhbGlkIGJhc2UgYiBudW1iZXIuXHJcbiAgICAgICAgLy8gRG9uJ3QgdXNlIFJlZ0V4cCwgc28gYWxwaGFiZXQgY2FuIGNvbnRhaW4gc3BlY2lhbCBjaGFyYWN0ZXJzLlxyXG4gICAgICAgIGZvciAobGVuID0gc3RyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAoYWxwaGFiZXQuaW5kZXhPZihjID0gc3RyLmNoYXJBdChpKSkgPCAwKSB7XHJcbiAgICAgICAgICAgIGlmIChjID09ICcuJykge1xyXG5cclxuICAgICAgICAgICAgICAvLyBJZiAnLicgaXMgbm90IHRoZSBmaXJzdCBjaGFyYWN0ZXIgYW5kIGl0IGhhcyBub3QgYmUgZm91bmQgYmVmb3JlLlxyXG4gICAgICAgICAgICAgIGlmIChpID4gZSkge1xyXG4gICAgICAgICAgICAgICAgZSA9IGxlbjtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICghY2FzZUNoYW5nZWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gQWxsb3cgZS5nLiBoZXhhZGVjaW1hbCAnRkYnIGFzIHdlbGwgYXMgJ2ZmJy5cclxuICAgICAgICAgICAgICBpZiAoc3RyID09IHN0ci50b1VwcGVyQ2FzZSgpICYmIChzdHIgPSBzdHIudG9Mb3dlckNhc2UoKSkgfHxcclxuICAgICAgICAgICAgICAgICAgc3RyID09IHN0ci50b0xvd2VyQ2FzZSgpICYmIChzdHIgPSBzdHIudG9VcHBlckNhc2UoKSkpIHtcclxuICAgICAgICAgICAgICAgIGNhc2VDaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGkgPSAtMTtcclxuICAgICAgICAgICAgICAgIGUgPSAwO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VOdW1lcmljKHgsIFN0cmluZyh2KSwgaXNOdW0sIGIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHJldmVudCBsYXRlciBjaGVjayBmb3IgbGVuZ3RoIG9uIGNvbnZlcnRlZCBudW1iZXIuXHJcbiAgICAgICAgaXNOdW0gPSBmYWxzZTtcclxuICAgICAgICBzdHIgPSBjb252ZXJ0QmFzZShzdHIsIGIsIDEwLCB4LnMpO1xyXG5cclxuICAgICAgICAvLyBEZWNpbWFsIHBvaW50P1xyXG4gICAgICAgIGlmICgoZSA9IHN0ci5pbmRleE9mKCcuJykpID4gLTEpIHN0ciA9IHN0ci5yZXBsYWNlKCcuJywgJycpO1xyXG4gICAgICAgIGVsc2UgZSA9IHN0ci5sZW5ndGg7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIERldGVybWluZSBsZWFkaW5nIHplcm9zLlxyXG4gICAgICBmb3IgKGkgPSAwOyBzdHIuY2hhckNvZGVBdChpKSA9PT0gNDg7IGkrKyk7XHJcblxyXG4gICAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgIGZvciAobGVuID0gc3RyLmxlbmd0aDsgc3RyLmNoYXJDb2RlQXQoLS1sZW4pID09PSA0ODspO1xyXG5cclxuICAgICAgaWYgKHN0ciA9IHN0ci5zbGljZShpLCArK2xlbikpIHtcclxuICAgICAgICBsZW4gLT0gaTtcclxuXHJcbiAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIE51bWJlciBwcmltaXRpdmUgaGFzIG1vcmUgdGhhbiAxNSBzaWduaWZpY2FudCBkaWdpdHM6IHtufSdcclxuICAgICAgICBpZiAoaXNOdW0gJiYgQmlnTnVtYmVyLkRFQlVHICYmXHJcbiAgICAgICAgICBsZW4gPiAxNSAmJiAodiA+IE1BWF9TQUZFX0lOVEVHRVIgfHwgdiAhPT0gbWF0aGZsb29yKHYpKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgKHRvb01hbnlEaWdpdHMgKyAoeC5zICogdikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgIC8vIE92ZXJmbG93P1xyXG4gICAgICAgIGlmICgoZSA9IGUgLSBpIC0gMSkgPiBNQVhfRVhQKSB7XHJcblxyXG4gICAgICAgICAgLy8gSW5maW5pdHkuXHJcbiAgICAgICAgICB4LmMgPSB4LmUgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBVbmRlcmZsb3c/XHJcbiAgICAgICAgfSBlbHNlIGlmIChlIDwgTUlOX0VYUCkge1xyXG5cclxuICAgICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHguZSA9IGU7XHJcbiAgICAgICAgICB4LmMgPSBbXTtcclxuXHJcbiAgICAgICAgICAvLyBUcmFuc2Zvcm0gYmFzZVxyXG5cclxuICAgICAgICAgIC8vIGUgaXMgdGhlIGJhc2UgMTAgZXhwb25lbnQuXHJcbiAgICAgICAgICAvLyBpIGlzIHdoZXJlIHRvIHNsaWNlIHN0ciB0byBnZXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgdGhlIGNvZWZmaWNpZW50IGFycmF5LlxyXG4gICAgICAgICAgaSA9IChlICsgMSkgJSBMT0dfQkFTRTtcclxuICAgICAgICAgIGlmIChlIDwgMCkgaSArPSBMT0dfQkFTRTsgIC8vIGkgPCAxXHJcblxyXG4gICAgICAgICAgaWYgKGkgPCBsZW4pIHtcclxuICAgICAgICAgICAgaWYgKGkpIHguYy5wdXNoKCtzdHIuc2xpY2UoMCwgaSkpO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZW4gLT0gTE9HX0JBU0U7IGkgPCBsZW47KSB7XHJcbiAgICAgICAgICAgICAgeC5jLnB1c2goK3N0ci5zbGljZShpLCBpICs9IExPR19CQVNFKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGkgPSBMT0dfQkFTRSAtIChzdHIgPSBzdHIuc2xpY2UoaSkpLmxlbmd0aDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGkgLT0gbGVuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGZvciAoOyBpLS07IHN0ciArPSAnMCcpO1xyXG4gICAgICAgICAgeC5jLnB1c2goK3N0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgIHguYyA9IFt4LmUgPSAwXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBDT05TVFJVQ1RPUiBQUk9QRVJUSUVTXHJcblxyXG5cclxuICAgIEJpZ051bWJlci5jbG9uZSA9IGNsb25lO1xyXG5cclxuICAgIEJpZ051bWJlci5ST1VORF9VUCA9IDA7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfRE9XTiA9IDE7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfQ0VJTCA9IDI7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfRkxPT1IgPSAzO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfVVAgPSA0O1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRE9XTiA9IDU7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfSEFMRl9FVkVOID0gNjtcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX0NFSUwgPSA3O1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRkxPT1IgPSA4O1xyXG4gICAgQmlnTnVtYmVyLkVVQ0xJRCA9IDk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBDb25maWd1cmUgaW5mcmVxdWVudGx5LWNoYW5naW5nIGxpYnJhcnktd2lkZSBzZXR0aW5ncy5cclxuICAgICAqXHJcbiAgICAgKiBBY2NlcHQgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBvcHRpb25hbCBwcm9wZXJ0aWVzIChpZiB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpc1xyXG4gICAgICogYSBudW1iZXIsIGl0IG11c3QgYmUgYW4gaW50ZWdlciB3aXRoaW4gdGhlIGluY2x1c2l2ZSByYW5nZSBzdGF0ZWQpOlxyXG4gICAgICpcclxuICAgICAqICAgREVDSU1BTF9QTEFDRVMgICB7bnVtYmVyfSAgICAgICAgICAgMCB0byBNQVhcclxuICAgICAqICAgUk9VTkRJTkdfTU9ERSAgICB7bnVtYmVyfSAgICAgICAgICAgMCB0byA4XHJcbiAgICAgKiAgIEVYUE9ORU5USUFMX0FUICAge251bWJlcnxudW1iZXJbXX0gIC1NQVggdG8gTUFYICBvciAgWy1NQVggdG8gMCwgMCB0byBNQVhdXHJcbiAgICAgKiAgIFJBTkdFICAgICAgICAgICAge251bWJlcnxudW1iZXJbXX0gIC1NQVggdG8gTUFYIChub3QgemVybykgIG9yICBbLU1BWCB0byAtMSwgMSB0byBNQVhdXHJcbiAgICAgKiAgIENSWVBUTyAgICAgICAgICAge2Jvb2xlYW59ICAgICAgICAgIHRydWUgb3IgZmFsc2VcclxuICAgICAqICAgTU9EVUxPX01PREUgICAgICB7bnVtYmVyfSAgICAgICAgICAgMCB0byA5XHJcbiAgICAgKiAgIFBPV19QUkVDSVNJT04gICAgICAge251bWJlcn0gICAgICAgICAgIDAgdG8gTUFYXHJcbiAgICAgKiAgIEFMUEhBQkVUICAgICAgICAge3N0cmluZ30gICAgICAgICAgIEEgc3RyaW5nIG9mIHR3byBvciBtb3JlIHVuaXF1ZSBjaGFyYWN0ZXJzIHdoaWNoIGRvZXNcclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90IGNvbnRhaW4gJy4nLlxyXG4gICAgICogICBGT1JNQVQgICAgICAgICAgIHtvYmplY3R9ICAgICAgICAgICBBbiBvYmplY3Qgd2l0aCBzb21lIG9mIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcclxuICAgICAqICAgICBwcmVmaXggICAgICAgICAgICAgICAgIHtzdHJpbmd9XHJcbiAgICAgKiAgICAgZ3JvdXBTaXplICAgICAgICAgICAgICB7bnVtYmVyfVxyXG4gICAgICogICAgIHNlY29uZGFyeUdyb3VwU2l6ZSAgICAge251bWJlcn1cclxuICAgICAqICAgICBncm91cFNlcGFyYXRvciAgICAgICAgIHtzdHJpbmd9XHJcbiAgICAgKiAgICAgZGVjaW1hbFNlcGFyYXRvciAgICAgICB7c3RyaW5nfVxyXG4gICAgICogICAgIGZyYWN0aW9uR3JvdXBTaXplICAgICAge251bWJlcn1cclxuICAgICAqICAgICBmcmFjdGlvbkdyb3VwU2VwYXJhdG9yIHtzdHJpbmd9XHJcbiAgICAgKiAgICAgc3VmZml4ICAgICAgICAgICAgICAgICB7c3RyaW5nfVxyXG4gICAgICpcclxuICAgICAqIChUaGUgdmFsdWVzIGFzc2lnbmVkIHRvIHRoZSBhYm92ZSBGT1JNQVQgb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdCBjaGVja2VkIGZvciB2YWxpZGl0eS4pXHJcbiAgICAgKlxyXG4gICAgICogRS5nLlxyXG4gICAgICogQmlnTnVtYmVyLmNvbmZpZyh7IERFQ0lNQUxfUExBQ0VTIDogMjAsIFJPVU5ESU5HX01PREUgOiA0IH0pXHJcbiAgICAgKlxyXG4gICAgICogSWdub3JlIHByb3BlcnRpZXMvcGFyYW1ldGVycyBzZXQgdG8gbnVsbCBvciB1bmRlZmluZWQsIGV4Y2VwdCBmb3IgQUxQSEFCRVQuXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGFuIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIGN1cnJlbnQgdmFsdWVzLlxyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIuY29uZmlnID0gQmlnTnVtYmVyLnNldCA9IGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgdmFyIHAsIHY7XHJcblxyXG4gICAgICBpZiAob2JqICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogPT0gJ29iamVjdCcpIHtcclxuXHJcbiAgICAgICAgICAvLyBERUNJTUFMX1BMQUNFUyB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gREVDSU1BTF9QTEFDRVMge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0RFQ0lNQUxfUExBQ0VTJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaW50Q2hlY2sodiwgMCwgTUFYLCBwKTtcclxuICAgICAgICAgICAgREVDSU1BTF9QTEFDRVMgPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJPVU5ESU5HX01PREUge251bWJlcn0gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBST1VORElOR19NT0RFIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdST1VORElOR19NT0RFJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaW50Q2hlY2sodiwgMCwgOCwgcCk7XHJcbiAgICAgICAgICAgIFJPVU5ESU5HX01PREUgPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEVYUE9ORU5USUFMX0FUIHtudW1iZXJ8bnVtYmVyW119XHJcbiAgICAgICAgICAvLyBJbnRlZ2VyLCAtTUFYIHRvIE1BWCBpbmNsdXNpdmUgb3JcclxuICAgICAgICAgIC8vIFtpbnRlZ2VyIC1NQVggdG8gMCBpbmNsdXNpdmUsIDAgdG8gTUFYIGluY2x1c2l2ZV0uXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gRVhQT05FTlRJQUxfQVQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0VYUE9ORU5USUFMX0FUJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaWYgKHYgJiYgdi5wb3ApIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzBdLCAtTUFYLCAwLCBwKTtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzFdLCAwLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIFRPX0VYUF9ORUcgPSB2WzBdO1xyXG4gICAgICAgICAgICAgIFRPX0VYUF9QT1MgPSB2WzFdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGludENoZWNrKHYsIC1NQVgsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgICAgVE9fRVhQX05FRyA9IC0oVE9fRVhQX1BPUyA9IHYgPCAwID8gLXYgOiB2KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJBTkdFIHtudW1iZXJ8bnVtYmVyW119IE5vbi16ZXJvIGludGVnZXIsIC1NQVggdG8gTUFYIGluY2x1c2l2ZSBvclxyXG4gICAgICAgICAgLy8gW2ludGVnZXIgLU1BWCB0byAtMSBpbmNsdXNpdmUsIGludGVnZXIgMSB0byBNQVggaW5jbHVzaXZlXS5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBSQU5HRSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V8Y2Fubm90IGJlIHplcm99OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnUkFOR0UnKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpZiAodiAmJiB2LnBvcCkge1xyXG4gICAgICAgICAgICAgIGludENoZWNrKHZbMF0sIC1NQVgsIC0xLCBwKTtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzFdLCAxLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIE1JTl9FWFAgPSB2WzBdO1xyXG4gICAgICAgICAgICAgIE1BWF9FWFAgPSB2WzFdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGludENoZWNrKHYsIC1NQVgsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgICAgaWYgKHYpIHtcclxuICAgICAgICAgICAgICAgIE1JTl9FWFAgPSAtKE1BWF9FWFAgPSB2IDwgMCA/IC12IDogdik7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgcCArICcgY2Fubm90IGJlIHplcm86ICcgKyB2KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDUllQVE8ge2Jvb2xlYW59IHRydWUgb3IgZmFsc2UuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gQ1JZUFRPIG5vdCB0cnVlIG9yIGZhbHNlOiB7dn0nXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gY3J5cHRvIHVuYXZhaWxhYmxlJ1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0NSWVBUTycpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGlmICh2ID09PSAhIXYpIHtcclxuICAgICAgICAgICAgICBpZiAodikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjcnlwdG8gIT0gJ3VuZGVmaW5lZCcgJiYgY3J5cHRvICYmXHJcbiAgICAgICAgICAgICAgICAgKGNyeXB0by5nZXRSYW5kb21WYWx1ZXMgfHwgY3J5cHRvLnJhbmRvbUJ5dGVzKSkge1xyXG4gICAgICAgICAgICAgICAgICBDUllQVE8gPSB2O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgQ1JZUFRPID0gIXY7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnY3J5cHRvIHVuYXZhaWxhYmxlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIENSWVBUTyA9IHY7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArIHAgKyAnIG5vdCB0cnVlIG9yIGZhbHNlOiAnICsgdik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBNT0RVTE9fTU9ERSB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIDkgaW5jbHVzaXZlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIE1PRFVMT19NT0RFIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdNT0RVTE9fTU9ERScpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIDksIHApO1xyXG4gICAgICAgICAgICBNT0RVTE9fTU9ERSA9IHY7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUE9XX1BSRUNJU0lPTiB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gUE9XX1BSRUNJU0lPTiB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnUE9XX1BSRUNJU0lPTicpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgIFBPV19QUkVDSVNJT04gPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEZPUk1BVCB7b2JqZWN0fVxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIEZPUk1BVCBub3QgYW4gb2JqZWN0OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnRk9STUFUJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSBGT1JNQVQgPSB2O1xyXG4gICAgICAgICAgICBlbHNlIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyBwICsgJyBub3QgYW4gb2JqZWN0OiAnICsgdik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQUxQSEFCRVQge3N0cmluZ31cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBBTFBIQUJFVCBpbnZhbGlkOiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnQUxQSEFCRVQnKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG5cclxuICAgICAgICAgICAgLy8gRGlzYWxsb3cgaWYgb25seSBvbmUgY2hhcmFjdGVyLFxyXG4gICAgICAgICAgICAvLyBvciBpZiBpdCBjb250YWlucyAnKycsICctJywgJy4nLCB3aGl0ZXNwYWNlLCBvciBhIHJlcGVhdGVkIGNoYXJhY3Rlci5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2ID09ICdzdHJpbmcnICYmICEvXi4kfFsrLS5cXHNdfCguKS4qXFwxLy50ZXN0KHYpKSB7XHJcbiAgICAgICAgICAgICAgQUxQSEFCRVQgPSB2O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArIHAgKyAnIGludmFsaWQ6ICcgKyB2KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBPYmplY3QgZXhwZWN0ZWQ6IHt2fSdcclxuICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ09iamVjdCBleHBlY3RlZDogJyArIG9iaik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIERFQ0lNQUxfUExBQ0VTOiBERUNJTUFMX1BMQUNFUyxcclxuICAgICAgICBST1VORElOR19NT0RFOiBST1VORElOR19NT0RFLFxyXG4gICAgICAgIEVYUE9ORU5USUFMX0FUOiBbVE9fRVhQX05FRywgVE9fRVhQX1BPU10sXHJcbiAgICAgICAgUkFOR0U6IFtNSU5fRVhQLCBNQVhfRVhQXSxcclxuICAgICAgICBDUllQVE86IENSWVBUTyxcclxuICAgICAgICBNT0RVTE9fTU9ERTogTU9EVUxPX01PREUsXHJcbiAgICAgICAgUE9XX1BSRUNJU0lPTjogUE9XX1BSRUNJU0lPTixcclxuICAgICAgICBGT1JNQVQ6IEZPUk1BVCxcclxuICAgICAgICBBTFBIQUJFVDogQUxQSEFCRVRcclxuICAgICAgfTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB2IGlzIGEgQmlnTnVtYmVyIGluc3RhbmNlLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICpcclxuICAgICAqIElmIEJpZ051bWJlci5ERUJVRyBpcyB0cnVlLCB0aHJvdyBpZiBhIEJpZ051bWJlciBpbnN0YW5jZSBpcyBub3Qgd2VsbC1mb3JtZWQuXHJcbiAgICAgKlxyXG4gICAgICogdiB7YW55fVxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBJbnZhbGlkIEJpZ051bWJlcjoge3Z9J1xyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIuaXNCaWdOdW1iZXIgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICBpZiAoIXYgfHwgdi5faXNCaWdOdW1iZXIgIT09IHRydWUpIHJldHVybiBmYWxzZTtcclxuICAgICAgaWYgKCFCaWdOdW1iZXIuREVCVUcpIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgdmFyIGksIG4sXHJcbiAgICAgICAgYyA9IHYuYyxcclxuICAgICAgICBlID0gdi5lLFxyXG4gICAgICAgIHMgPSB2LnM7XHJcblxyXG4gICAgICBvdXQ6IGlmICh7fS50b1N0cmluZy5jYWxsKGMpID09ICdbb2JqZWN0IEFycmF5XScpIHtcclxuXHJcbiAgICAgICAgaWYgKChzID09PSAxIHx8IHMgPT09IC0xKSAmJiBlID49IC1NQVggJiYgZSA8PSBNQVggJiYgZSA9PT0gbWF0aGZsb29yKGUpKSB7XHJcblxyXG4gICAgICAgICAgLy8gSWYgdGhlIGZpcnN0IGVsZW1lbnQgaXMgemVybywgdGhlIEJpZ051bWJlciB2YWx1ZSBtdXN0IGJlIHplcm8uXHJcbiAgICAgICAgICBpZiAoY1swXSA9PT0gMCkge1xyXG4gICAgICAgICAgICBpZiAoZSA9PT0gMCAmJiBjLmxlbmd0aCA9PT0gMSkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGJyZWFrIG91dDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDYWxjdWxhdGUgbnVtYmVyIG9mIGRpZ2l0cyB0aGF0IGNbMF0gc2hvdWxkIGhhdmUsIGJhc2VkIG9uIHRoZSBleHBvbmVudC5cclxuICAgICAgICAgIGkgPSAoZSArIDEpICUgTE9HX0JBU0U7XHJcbiAgICAgICAgICBpZiAoaSA8IDEpIGkgKz0gTE9HX0JBU0U7XHJcblxyXG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIG51bWJlciBvZiBkaWdpdHMgb2YgY1swXS5cclxuICAgICAgICAgIC8vaWYgKE1hdGguY2VpbChNYXRoLmxvZyhjWzBdICsgMSkgLyBNYXRoLkxOMTApID09IGkpIHtcclxuICAgICAgICAgIGlmIChTdHJpbmcoY1swXSkubGVuZ3RoID09IGkpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgbiA9IGNbaV07XHJcbiAgICAgICAgICAgICAgaWYgKG4gPCAwIHx8IG4gPj0gQkFTRSB8fCBuICE9PSBtYXRoZmxvb3IobikpIGJyZWFrIG91dDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTGFzdCBlbGVtZW50IGNhbm5vdCBiZSB6ZXJvLCB1bmxlc3MgaXQgaXMgdGhlIG9ubHkgZWxlbWVudC5cclxuICAgICAgICAgICAgaWYgKG4gIT09IDApIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIC8vIEluZmluaXR5L05hTlxyXG4gICAgICB9IGVsc2UgaWYgKGMgPT09IG51bGwgJiYgZSA9PT0gbnVsbCAmJiAocyA9PT0gbnVsbCB8fCBzID09PSAxIHx8IHMgPT09IC0xKSkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgIChiaWdudW1iZXJFcnJvciArICdJbnZhbGlkIEJpZ051bWJlcjogJyArIHYpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIG1heGltdW0gb2YgdGhlIGFyZ3VtZW50cy5cclxuICAgICAqXHJcbiAgICAgKiBhcmd1bWVudHMge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIubWF4aW11bSA9IEJpZ051bWJlci5tYXggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBtYXhPck1pbihhcmd1bWVudHMsIFAubHQpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIG1pbmltdW0gb2YgdGhlIGFyZ3VtZW50cy5cclxuICAgICAqXHJcbiAgICAgKiBhcmd1bWVudHMge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIubWluaW11bSA9IEJpZ051bWJlci5taW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBtYXhPck1pbihhcmd1bWVudHMsIFAuZ3QpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2l0aCBhIHJhbmRvbSB2YWx1ZSBlcXVhbCB0byBvciBncmVhdGVyIHRoYW4gMCBhbmQgbGVzcyB0aGFuIDEsXHJcbiAgICAgKiBhbmQgd2l0aCBkcCwgb3IgREVDSU1BTF9QTEFDRVMgaWYgZHAgaXMgb21pdHRlZCwgZGVjaW1hbCBwbGFjZXMgKG9yIGxlc3MgaWYgdHJhaWxpbmdcclxuICAgICAqIHplcm9zIGFyZSBwcm9kdWNlZCkuXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlcy4gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7ZHB9J1xyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIGNyeXB0byB1bmF2YWlsYWJsZSdcclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLnJhbmRvbSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBwb3cyXzUzID0gMHgyMDAwMDAwMDAwMDAwMDtcclxuXHJcbiAgICAgIC8vIFJldHVybiBhIDUzIGJpdCBpbnRlZ2VyIG4sIHdoZXJlIDAgPD0gbiA8IDkwMDcxOTkyNTQ3NDA5OTIuXHJcbiAgICAgIC8vIENoZWNrIGlmIE1hdGgucmFuZG9tKCkgcHJvZHVjZXMgbW9yZSB0aGFuIDMyIGJpdHMgb2YgcmFuZG9tbmVzcy5cclxuICAgICAgLy8gSWYgaXQgZG9lcywgYXNzdW1lIGF0IGxlYXN0IDUzIGJpdHMgYXJlIHByb2R1Y2VkLCBvdGhlcndpc2UgYXNzdW1lIGF0IGxlYXN0IDMwIGJpdHMuXHJcbiAgICAgIC8vIDB4NDAwMDAwMDAgaXMgMl4zMCwgMHg4MDAwMDAgaXMgMl4yMywgMHgxZmZmZmYgaXMgMl4yMSAtIDEuXHJcbiAgICAgIHZhciByYW5kb201M2JpdEludCA9IChNYXRoLnJhbmRvbSgpICogcG93Ml81MykgJiAweDFmZmZmZlxyXG4gICAgICAgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBtYXRoZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvdzJfNTMpOyB9XHJcbiAgICAgICA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICgoTWF0aC5yYW5kb20oKSAqIDB4NDAwMDAwMDAgfCAwKSAqIDB4ODAwMDAwKSArXHJcbiAgICAgICAgIChNYXRoLnJhbmRvbSgpICogMHg4MDAwMDAgfCAwKTsgfTtcclxuXHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZHApIHtcclxuICAgICAgICB2YXIgYSwgYiwgZSwgaywgdixcclxuICAgICAgICAgIGkgPSAwLFxyXG4gICAgICAgICAgYyA9IFtdLFxyXG4gICAgICAgICAgcmFuZCA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuXHJcbiAgICAgICAgaWYgKGRwID09IG51bGwpIGRwID0gREVDSU1BTF9QTEFDRVM7XHJcbiAgICAgICAgZWxzZSBpbnRDaGVjayhkcCwgMCwgTUFYKTtcclxuXHJcbiAgICAgICAgayA9IG1hdGhjZWlsKGRwIC8gTE9HX0JBU0UpO1xyXG5cclxuICAgICAgICBpZiAoQ1JZUFRPKSB7XHJcblxyXG4gICAgICAgICAgLy8gQnJvd3NlcnMgc3VwcG9ydGluZyBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzLlxyXG4gICAgICAgICAgaWYgKGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcclxuXHJcbiAgICAgICAgICAgIGEgPSBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50MzJBcnJheShrICo9IDIpKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgazspIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gNTMgYml0czpcclxuICAgICAgICAgICAgICAvLyAoKE1hdGgucG93KDIsIDMyKSAtIDEpICogTWF0aC5wb3coMiwgMjEpKS50b1N0cmluZygyKVxyXG4gICAgICAgICAgICAgIC8vIDExMTExIDExMTExMTExIDExMTExMTExIDExMTExMTExIDExMTAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwXHJcbiAgICAgICAgICAgICAgLy8gKChNYXRoLnBvdygyLCAzMikgLSAxKSA+Pj4gMTEpLnRvU3RyaW5nKDIpXHJcbiAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMTExMTEgMTExMTExMTEgMTExMTExMTFcclxuICAgICAgICAgICAgICAvLyAweDIwMDAwIGlzIDJeMjEuXHJcbiAgICAgICAgICAgICAgdiA9IGFbaV0gKiAweDIwMDAwICsgKGFbaSArIDFdID4+PiAxMSk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFJlamVjdGlvbiBzYW1wbGluZzpcclxuICAgICAgICAgICAgICAvLyAwIDw9IHYgPCA5MDA3MTk5MjU0NzQwOTkyXHJcbiAgICAgICAgICAgICAgLy8gUHJvYmFiaWxpdHkgdGhhdCB2ID49IDllMTUsIGlzXHJcbiAgICAgICAgICAgICAgLy8gNzE5OTI1NDc0MDk5MiAvIDkwMDcxOTkyNTQ3NDA5OTIgfj0gMC4wMDA4LCBpLmUuIDEgaW4gMTI1MVxyXG4gICAgICAgICAgICAgIGlmICh2ID49IDllMTUpIHtcclxuICAgICAgICAgICAgICAgIGIgPSBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50MzJBcnJheSgyKSk7XHJcbiAgICAgICAgICAgICAgICBhW2ldID0gYlswXTtcclxuICAgICAgICAgICAgICAgIGFbaSArIDFdID0gYlsxXTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIDAgPD0gdiA8PSA4OTk5OTk5OTk5OTk5OTk5XHJcbiAgICAgICAgICAgICAgICAvLyAwIDw9ICh2ICUgMWUxNCkgPD0gOTk5OTk5OTk5OTk5OTlcclxuICAgICAgICAgICAgICAgIGMucHVzaCh2ICUgMWUxNCk7XHJcbiAgICAgICAgICAgICAgICBpICs9IDI7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGkgPSBrIC8gMjtcclxuXHJcbiAgICAgICAgICAvLyBOb2RlLmpzIHN1cHBvcnRpbmcgY3J5cHRvLnJhbmRvbUJ5dGVzLlxyXG4gICAgICAgICAgfSBlbHNlIGlmIChjcnlwdG8ucmFuZG9tQnl0ZXMpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJ1ZmZlclxyXG4gICAgICAgICAgICBhID0gY3J5cHRvLnJhbmRvbUJ5dGVzKGsgKj0gNyk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGs7KSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIDB4MTAwMDAwMDAwMDAwMCBpcyAyXjQ4LCAweDEwMDAwMDAwMDAwIGlzIDJeNDBcclxuICAgICAgICAgICAgICAvLyAweDEwMDAwMDAwMCBpcyAyXjMyLCAweDEwMDAwMDAgaXMgMl4yNFxyXG4gICAgICAgICAgICAgIC8vIDExMTExIDExMTExMTExIDExMTExMTExIDExMTExMTExIDExMTExMTExIDExMTExMTExIDExMTExMTExXHJcbiAgICAgICAgICAgICAgLy8gMCA8PSB2IDwgOTAwNzE5OTI1NDc0MDk5MlxyXG4gICAgICAgICAgICAgIHYgPSAoKGFbaV0gJiAzMSkgKiAweDEwMDAwMDAwMDAwMDApICsgKGFbaSArIDFdICogMHgxMDAwMDAwMDAwMCkgK1xyXG4gICAgICAgICAgICAgICAgIChhW2kgKyAyXSAqIDB4MTAwMDAwMDAwKSArIChhW2kgKyAzXSAqIDB4MTAwMDAwMCkgK1xyXG4gICAgICAgICAgICAgICAgIChhW2kgKyA0XSA8PCAxNikgKyAoYVtpICsgNV0gPDwgOCkgKyBhW2kgKyA2XTtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKHYgPj0gOWUxNSkge1xyXG4gICAgICAgICAgICAgICAgY3J5cHRvLnJhbmRvbUJ5dGVzKDcpLmNvcHkoYSwgaSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyAwIDw9ICh2ICUgMWUxNCkgPD0gOTk5OTk5OTk5OTk5OTlcclxuICAgICAgICAgICAgICAgIGMucHVzaCh2ICUgMWUxNCk7XHJcbiAgICAgICAgICAgICAgICBpICs9IDc7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGkgPSBrIC8gNztcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIENSWVBUTyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ2NyeXB0byB1bmF2YWlsYWJsZScpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVXNlIE1hdGgucmFuZG9tLlxyXG4gICAgICAgIGlmICghQ1JZUFRPKSB7XHJcblxyXG4gICAgICAgICAgZm9yICg7IGkgPCBrOykge1xyXG4gICAgICAgICAgICB2ID0gcmFuZG9tNTNiaXRJbnQoKTtcclxuICAgICAgICAgICAgaWYgKHYgPCA5ZTE1KSBjW2krK10gPSB2ICUgMWUxNDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGsgPSBjWy0taV07XHJcbiAgICAgICAgZHAgJT0gTE9HX0JBU0U7XHJcblxyXG4gICAgICAgIC8vIENvbnZlcnQgdHJhaWxpbmcgZGlnaXRzIHRvIHplcm9zIGFjY29yZGluZyB0byBkcC5cclxuICAgICAgICBpZiAoayAmJiBkcCkge1xyXG4gICAgICAgICAgdiA9IFBPV1NfVEVOW0xPR19CQVNFIC0gZHBdO1xyXG4gICAgICAgICAgY1tpXSA9IG1hdGhmbG9vcihrIC8gdikgKiB2O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIGVsZW1lbnRzIHdoaWNoIGFyZSB6ZXJvLlxyXG4gICAgICAgIGZvciAoOyBjW2ldID09PSAwOyBjLnBvcCgpLCBpLS0pO1xyXG5cclxuICAgICAgICAvLyBaZXJvP1xyXG4gICAgICAgIGlmIChpIDwgMCkge1xyXG4gICAgICAgICAgYyA9IFtlID0gMF07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgbGVhZGluZyBlbGVtZW50cyB3aGljaCBhcmUgemVybyBhbmQgYWRqdXN0IGV4cG9uZW50IGFjY29yZGluZ2x5LlxyXG4gICAgICAgICAgZm9yIChlID0gLTEgOyBjWzBdID09PSAwOyBjLnNwbGljZSgwLCAxKSwgZSAtPSBMT0dfQkFTRSk7XHJcblxyXG4gICAgICAgICAgLy8gQ291bnQgdGhlIGRpZ2l0cyBvZiB0aGUgZmlyc3QgZWxlbWVudCBvZiBjIHRvIGRldGVybWluZSBsZWFkaW5nIHplcm9zLCBhbmQuLi5cclxuICAgICAgICAgIGZvciAoaSA9IDEsIHYgPSBjWzBdOyB2ID49IDEwOyB2IC89IDEwLCBpKyspO1xyXG5cclxuICAgICAgICAgIC8vIGFkanVzdCB0aGUgZXhwb25lbnQgYWNjb3JkaW5nbHkuXHJcbiAgICAgICAgICBpZiAoaSA8IExPR19CQVNFKSBlIC09IExPR19CQVNFIC0gaTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJhbmQuZSA9IGU7XHJcbiAgICAgICAgcmFuZC5jID0gYztcclxuICAgICAgICByZXR1cm4gcmFuZDtcclxuICAgICAgfTtcclxuICAgIH0pKCk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHN1bSBvZiB0aGUgYXJndW1lbnRzLlxyXG4gICAgICpcclxuICAgICAqIGFyZ3VtZW50cyB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIEJpZ051bWJlci5zdW0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBpID0gMSxcclxuICAgICAgICBhcmdzID0gYXJndW1lbnRzLFxyXG4gICAgICAgIHN1bSA9IG5ldyBCaWdOdW1iZXIoYXJnc1swXSk7XHJcbiAgICAgIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7KSBzdW0gPSBzdW0ucGx1cyhhcmdzW2krK10pO1xyXG4gICAgICByZXR1cm4gc3VtO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8gUFJJVkFURSBGVU5DVElPTlNcclxuXHJcblxyXG4gICAgLy8gQ2FsbGVkIGJ5IEJpZ051bWJlciBhbmQgQmlnTnVtYmVyLnByb3RvdHlwZS50b1N0cmluZy5cclxuICAgIGNvbnZlcnRCYXNlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGRlY2ltYWwgPSAnMDEyMzQ1Njc4OSc7XHJcblxyXG4gICAgICAvKlxyXG4gICAgICAgKiBDb252ZXJ0IHN0cmluZyBvZiBiYXNlSW4gdG8gYW4gYXJyYXkgb2YgbnVtYmVycyBvZiBiYXNlT3V0LlxyXG4gICAgICAgKiBFZy4gdG9CYXNlT3V0KCcyNTUnLCAxMCwgMTYpIHJldHVybnMgWzE1LCAxNV0uXHJcbiAgICAgICAqIEVnLiB0b0Jhc2VPdXQoJ2ZmJywgMTYsIDEwKSByZXR1cm5zIFsyLCA1LCA1XS5cclxuICAgICAgICovXHJcbiAgICAgIGZ1bmN0aW9uIHRvQmFzZU91dChzdHIsIGJhc2VJbiwgYmFzZU91dCwgYWxwaGFiZXQpIHtcclxuICAgICAgICB2YXIgaixcclxuICAgICAgICAgIGFyciA9IFswXSxcclxuICAgICAgICAgIGFyckwsXHJcbiAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgIGxlbiA9IHN0ci5sZW5ndGg7XHJcblxyXG4gICAgICAgIGZvciAoOyBpIDwgbGVuOykge1xyXG4gICAgICAgICAgZm9yIChhcnJMID0gYXJyLmxlbmd0aDsgYXJyTC0tOyBhcnJbYXJyTF0gKj0gYmFzZUluKTtcclxuXHJcbiAgICAgICAgICBhcnJbMF0gKz0gYWxwaGFiZXQuaW5kZXhPZihzdHIuY2hhckF0KGkrKykpO1xyXG5cclxuICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBhcnIubGVuZ3RoOyBqKyspIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcnJbal0gPiBiYXNlT3V0IC0gMSkge1xyXG4gICAgICAgICAgICAgIGlmIChhcnJbaiArIDFdID09IG51bGwpIGFycltqICsgMV0gPSAwO1xyXG4gICAgICAgICAgICAgIGFycltqICsgMV0gKz0gYXJyW2pdIC8gYmFzZU91dCB8IDA7XHJcbiAgICAgICAgICAgICAgYXJyW2pdICU9IGJhc2VPdXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhcnIucmV2ZXJzZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBDb252ZXJ0IGEgbnVtZXJpYyBzdHJpbmcgb2YgYmFzZUluIHRvIGEgbnVtZXJpYyBzdHJpbmcgb2YgYmFzZU91dC5cclxuICAgICAgLy8gSWYgdGhlIGNhbGxlciBpcyB0b1N0cmluZywgd2UgYXJlIGNvbnZlcnRpbmcgZnJvbSBiYXNlIDEwIHRvIGJhc2VPdXQuXHJcbiAgICAgIC8vIElmIHRoZSBjYWxsZXIgaXMgQmlnTnVtYmVyLCB3ZSBhcmUgY29udmVydGluZyBmcm9tIGJhc2VJbiB0byBiYXNlIDEwLlxyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHN0ciwgYmFzZUluLCBiYXNlT3V0LCBzaWduLCBjYWxsZXJJc1RvU3RyaW5nKSB7XHJcbiAgICAgICAgdmFyIGFscGhhYmV0LCBkLCBlLCBrLCByLCB4LCB4YywgeSxcclxuICAgICAgICAgIGkgPSBzdHIuaW5kZXhPZignLicpLFxyXG4gICAgICAgICAgZHAgPSBERUNJTUFMX1BMQUNFUyxcclxuICAgICAgICAgIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuXHJcbiAgICAgICAgLy8gTm9uLWludGVnZXIuXHJcbiAgICAgICAgaWYgKGkgPj0gMCkge1xyXG4gICAgICAgICAgayA9IFBPV19QUkVDSVNJT047XHJcblxyXG4gICAgICAgICAgLy8gVW5saW1pdGVkIHByZWNpc2lvbi5cclxuICAgICAgICAgIFBPV19QUkVDSVNJT04gPSAwO1xyXG4gICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoJy4nLCAnJyk7XHJcbiAgICAgICAgICB5ID0gbmV3IEJpZ051bWJlcihiYXNlSW4pO1xyXG4gICAgICAgICAgeCA9IHkucG93KHN0ci5sZW5ndGggLSBpKTtcclxuICAgICAgICAgIFBPV19QUkVDSVNJT04gPSBrO1xyXG5cclxuICAgICAgICAgIC8vIENvbnZlcnQgc3RyIGFzIGlmIGFuIGludGVnZXIsIHRoZW4gcmVzdG9yZSB0aGUgZnJhY3Rpb24gcGFydCBieSBkaXZpZGluZyB0aGVcclxuICAgICAgICAgIC8vIHJlc3VsdCBieSBpdHMgYmFzZSByYWlzZWQgdG8gYSBwb3dlci5cclxuXHJcbiAgICAgICAgICB5LmMgPSB0b0Jhc2VPdXQodG9GaXhlZFBvaW50KGNvZWZmVG9TdHJpbmcoeC5jKSwgeC5lLCAnMCcpLFxyXG4gICAgICAgICAgIDEwLCBiYXNlT3V0LCBkZWNpbWFsKTtcclxuICAgICAgICAgIHkuZSA9IHkuYy5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb252ZXJ0IHRoZSBudW1iZXIgYXMgaW50ZWdlci5cclxuXHJcbiAgICAgICAgeGMgPSB0b0Jhc2VPdXQoc3RyLCBiYXNlSW4sIGJhc2VPdXQsIGNhbGxlcklzVG9TdHJpbmdcclxuICAgICAgICAgPyAoYWxwaGFiZXQgPSBBTFBIQUJFVCwgZGVjaW1hbClcclxuICAgICAgICAgOiAoYWxwaGFiZXQgPSBkZWNpbWFsLCBBTFBIQUJFVCkpO1xyXG5cclxuICAgICAgICAvLyB4YyBub3cgcmVwcmVzZW50cyBzdHIgYXMgYW4gaW50ZWdlciBhbmQgY29udmVydGVkIHRvIGJhc2VPdXQuIGUgaXMgdGhlIGV4cG9uZW50LlxyXG4gICAgICAgIGUgPSBrID0geGMubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgZm9yICg7IHhjWy0ta10gPT0gMDsgeGMucG9wKCkpO1xyXG5cclxuICAgICAgICAvLyBaZXJvP1xyXG4gICAgICAgIGlmICgheGNbMF0pIHJldHVybiBhbHBoYWJldC5jaGFyQXQoMCk7XHJcblxyXG4gICAgICAgIC8vIERvZXMgc3RyIHJlcHJlc2VudCBhbiBpbnRlZ2VyPyBJZiBzbywgbm8gbmVlZCBmb3IgdGhlIGRpdmlzaW9uLlxyXG4gICAgICAgIGlmIChpIDwgMCkge1xyXG4gICAgICAgICAgLS1lO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB4LmMgPSB4YztcclxuICAgICAgICAgIHguZSA9IGU7XHJcblxyXG4gICAgICAgICAgLy8gVGhlIHNpZ24gaXMgbmVlZGVkIGZvciBjb3JyZWN0IHJvdW5kaW5nLlxyXG4gICAgICAgICAgeC5zID0gc2lnbjtcclxuICAgICAgICAgIHggPSBkaXYoeCwgeSwgZHAsIHJtLCBiYXNlT3V0KTtcclxuICAgICAgICAgIHhjID0geC5jO1xyXG4gICAgICAgICAgciA9IHgucjtcclxuICAgICAgICAgIGUgPSB4LmU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB4YyBub3cgcmVwcmVzZW50cyBzdHIgY29udmVydGVkIHRvIGJhc2VPdXQuXHJcblxyXG4gICAgICAgIC8vIFRIZSBpbmRleCBvZiB0aGUgcm91bmRpbmcgZGlnaXQuXHJcbiAgICAgICAgZCA9IGUgKyBkcCArIDE7XHJcblxyXG4gICAgICAgIC8vIFRoZSByb3VuZGluZyBkaWdpdDogdGhlIGRpZ2l0IHRvIHRoZSByaWdodCBvZiB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cC5cclxuICAgICAgICBpID0geGNbZF07XHJcblxyXG4gICAgICAgIC8vIExvb2sgYXQgdGhlIHJvdW5kaW5nIGRpZ2l0cyBhbmQgbW9kZSB0byBkZXRlcm1pbmUgd2hldGhlciB0byByb3VuZCB1cC5cclxuXHJcbiAgICAgICAgayA9IGJhc2VPdXQgLyAyO1xyXG4gICAgICAgIHIgPSByIHx8IGQgPCAwIHx8IHhjW2QgKyAxXSAhPSBudWxsO1xyXG5cclxuICAgICAgICByID0gcm0gPCA0ID8gKGkgIT0gbnVsbCB8fCByKSAmJiAocm0gPT0gMCB8fCBybSA9PSAoeC5zIDwgMCA/IDMgOiAyKSlcclxuICAgICAgICAgICAgICA6IGkgPiBrIHx8IGkgPT0gayAmJihybSA9PSA0IHx8IHIgfHwgcm0gPT0gNiAmJiB4Y1tkIC0gMV0gJiAxIHx8XHJcbiAgICAgICAgICAgICAgIHJtID09ICh4LnMgPCAwID8gOCA6IDcpKTtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlIGluZGV4IG9mIHRoZSByb3VuZGluZyBkaWdpdCBpcyBub3QgZ3JlYXRlciB0aGFuIHplcm8sIG9yIHhjIHJlcHJlc2VudHNcclxuICAgICAgICAvLyB6ZXJvLCB0aGVuIHRoZSByZXN1bHQgb2YgdGhlIGJhc2UgY29udmVyc2lvbiBpcyB6ZXJvIG9yLCBpZiByb3VuZGluZyB1cCwgYSB2YWx1ZVxyXG4gICAgICAgIC8vIHN1Y2ggYXMgMC4wMDAwMS5cclxuICAgICAgICBpZiAoZCA8IDEgfHwgIXhjWzBdKSB7XHJcblxyXG4gICAgICAgICAgLy8gMV4tZHAgb3IgMFxyXG4gICAgICAgICAgc3RyID0gciA/IHRvRml4ZWRQb2ludChhbHBoYWJldC5jaGFyQXQoMSksIC1kcCwgYWxwaGFiZXQuY2hhckF0KDApKSA6IGFscGhhYmV0LmNoYXJBdCgwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIFRydW5jYXRlIHhjIHRvIHRoZSByZXF1aXJlZCBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgICAgICB4Yy5sZW5ndGggPSBkO1xyXG5cclxuICAgICAgICAgIC8vIFJvdW5kIHVwP1xyXG4gICAgICAgICAgaWYgKHIpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFJvdW5kaW5nIHVwIG1heSBtZWFuIHRoZSBwcmV2aW91cyBkaWdpdCBoYXMgdG8gYmUgcm91bmRlZCB1cCBhbmQgc28gb24uXHJcbiAgICAgICAgICAgIGZvciAoLS1iYXNlT3V0OyArK3hjWy0tZF0gPiBiYXNlT3V0Oykge1xyXG4gICAgICAgICAgICAgIHhjW2RdID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKCFkKSB7XHJcbiAgICAgICAgICAgICAgICArK2U7XHJcbiAgICAgICAgICAgICAgICB4YyA9IFsxXS5jb25jYXQoeGMpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIERldGVybWluZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICAgIGZvciAoayA9IHhjLmxlbmd0aDsgIXhjWy0ta107KTtcclxuXHJcbiAgICAgICAgICAvLyBFLmcuIFs0LCAxMSwgMTVdIGJlY29tZXMgNGJmLlxyXG4gICAgICAgICAgZm9yIChpID0gMCwgc3RyID0gJyc7IGkgPD0gazsgc3RyICs9IGFscGhhYmV0LmNoYXJBdCh4Y1tpKytdKSk7XHJcblxyXG4gICAgICAgICAgLy8gQWRkIGxlYWRpbmcgemVyb3MsIGRlY2ltYWwgcG9pbnQgYW5kIHRyYWlsaW5nIHplcm9zIGFzIHJlcXVpcmVkLlxyXG4gICAgICAgICAgc3RyID0gdG9GaXhlZFBvaW50KHN0ciwgZSwgYWxwaGFiZXQuY2hhckF0KDApKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRoZSBjYWxsZXIgd2lsbCBhZGQgdGhlIHNpZ24uXHJcbiAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgICAgfTtcclxuICAgIH0pKCk7XHJcblxyXG5cclxuICAgIC8vIFBlcmZvcm0gZGl2aXNpb24gaW4gdGhlIHNwZWNpZmllZCBiYXNlLiBDYWxsZWQgYnkgZGl2IGFuZCBjb252ZXJ0QmFzZS5cclxuICAgIGRpdiA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAvLyBBc3N1bWUgbm9uLXplcm8geCBhbmQgay5cclxuICAgICAgZnVuY3Rpb24gbXVsdGlwbHkoeCwgaywgYmFzZSkge1xyXG4gICAgICAgIHZhciBtLCB0ZW1wLCB4bG8sIHhoaSxcclxuICAgICAgICAgIGNhcnJ5ID0gMCxcclxuICAgICAgICAgIGkgPSB4Lmxlbmd0aCxcclxuICAgICAgICAgIGtsbyA9IGsgJSBTUVJUX0JBU0UsXHJcbiAgICAgICAgICBraGkgPSBrIC8gU1FSVF9CQVNFIHwgMDtcclxuXHJcbiAgICAgICAgZm9yICh4ID0geC5zbGljZSgpOyBpLS07KSB7XHJcbiAgICAgICAgICB4bG8gPSB4W2ldICUgU1FSVF9CQVNFO1xyXG4gICAgICAgICAgeGhpID0geFtpXSAvIFNRUlRfQkFTRSB8IDA7XHJcbiAgICAgICAgICBtID0ga2hpICogeGxvICsgeGhpICoga2xvO1xyXG4gICAgICAgICAgdGVtcCA9IGtsbyAqIHhsbyArICgobSAlIFNRUlRfQkFTRSkgKiBTUVJUX0JBU0UpICsgY2Fycnk7XHJcbiAgICAgICAgICBjYXJyeSA9ICh0ZW1wIC8gYmFzZSB8IDApICsgKG0gLyBTUVJUX0JBU0UgfCAwKSArIGtoaSAqIHhoaTtcclxuICAgICAgICAgIHhbaV0gPSB0ZW1wICUgYmFzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjYXJyeSkgeCA9IFtjYXJyeV0uY29uY2F0KHgpO1xyXG5cclxuICAgICAgICByZXR1cm4geDtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gY29tcGFyZShhLCBiLCBhTCwgYkwpIHtcclxuICAgICAgICB2YXIgaSwgY21wO1xyXG5cclxuICAgICAgICBpZiAoYUwgIT0gYkwpIHtcclxuICAgICAgICAgIGNtcCA9IGFMID4gYkwgPyAxIDogLTE7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICBmb3IgKGkgPSBjbXAgPSAwOyBpIDwgYUw7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgaWYgKGFbaV0gIT0gYltpXSkge1xyXG4gICAgICAgICAgICAgIGNtcCA9IGFbaV0gPiBiW2ldID8gMSA6IC0xO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY21wO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBzdWJ0cmFjdChhLCBiLCBhTCwgYmFzZSkge1xyXG4gICAgICAgIHZhciBpID0gMDtcclxuXHJcbiAgICAgICAgLy8gU3VidHJhY3QgYiBmcm9tIGEuXHJcbiAgICAgICAgZm9yICg7IGFMLS07KSB7XHJcbiAgICAgICAgICBhW2FMXSAtPSBpO1xyXG4gICAgICAgICAgaSA9IGFbYUxdIDwgYlthTF0gPyAxIDogMDtcclxuICAgICAgICAgIGFbYUxdID0gaSAqIGJhc2UgKyBhW2FMXSAtIGJbYUxdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcgemVyb3MuXHJcbiAgICAgICAgZm9yICg7ICFhWzBdICYmIGEubGVuZ3RoID4gMTsgYS5zcGxpY2UoMCwgMSkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB4OiBkaXZpZGVuZCwgeTogZGl2aXNvci5cclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uICh4LCB5LCBkcCwgcm0sIGJhc2UpIHtcclxuICAgICAgICB2YXIgY21wLCBlLCBpLCBtb3JlLCBuLCBwcm9kLCBwcm9kTCwgcSwgcWMsIHJlbSwgcmVtTCwgcmVtMCwgeGksIHhMLCB5YzAsXHJcbiAgICAgICAgICB5TCwgeXosXHJcbiAgICAgICAgICBzID0geC5zID09IHkucyA/IDEgOiAtMSxcclxuICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciBOYU4sIEluZmluaXR5IG9yIDA/XHJcbiAgICAgICAgaWYgKCF4YyB8fCAheGNbMF0gfHwgIXljIHx8ICF5Y1swXSkge1xyXG5cclxuICAgICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKFxyXG5cclxuICAgICAgICAgICAvLyBSZXR1cm4gTmFOIGlmIGVpdGhlciBOYU4sIG9yIGJvdGggSW5maW5pdHkgb3IgMC5cclxuICAgICAgICAgICAheC5zIHx8ICF5LnMgfHwgKHhjID8geWMgJiYgeGNbMF0gPT0geWNbMF0gOiAheWMpID8gTmFOIDpcclxuXHJcbiAgICAgICAgICAgIC8vIFJldHVybiDCsTAgaWYgeCBpcyDCsTAgb3IgeSBpcyDCsUluZmluaXR5LCBvciByZXR1cm4gwrFJbmZpbml0eSBhcyB5IGlzIMKxMC5cclxuICAgICAgICAgICAgeGMgJiYgeGNbMF0gPT0gMCB8fCAheWMgPyBzICogMCA6IHMgLyAwXHJcbiAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBxID0gbmV3IEJpZ051bWJlcihzKTtcclxuICAgICAgICBxYyA9IHEuYyA9IFtdO1xyXG4gICAgICAgIGUgPSB4LmUgLSB5LmU7XHJcbiAgICAgICAgcyA9IGRwICsgZSArIDE7XHJcblxyXG4gICAgICAgIGlmICghYmFzZSkge1xyXG4gICAgICAgICAgYmFzZSA9IEJBU0U7XHJcbiAgICAgICAgICBlID0gYml0Rmxvb3IoeC5lIC8gTE9HX0JBU0UpIC0gYml0Rmxvb3IoeS5lIC8gTE9HX0JBU0UpO1xyXG4gICAgICAgICAgcyA9IHMgLyBMT0dfQkFTRSB8IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZXN1bHQgZXhwb25lbnQgbWF5IGJlIG9uZSBsZXNzIHRoZW4gdGhlIGN1cnJlbnQgdmFsdWUgb2YgZS5cclxuICAgICAgICAvLyBUaGUgY29lZmZpY2llbnRzIG9mIHRoZSBCaWdOdW1iZXJzIGZyb20gY29udmVydEJhc2UgbWF5IGhhdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgZm9yIChpID0gMDsgeWNbaV0gPT0gKHhjW2ldIHx8IDApOyBpKyspO1xyXG5cclxuICAgICAgICBpZiAoeWNbaV0gPiAoeGNbaV0gfHwgMCkpIGUtLTtcclxuXHJcbiAgICAgICAgaWYgKHMgPCAwKSB7XHJcbiAgICAgICAgICBxYy5wdXNoKDEpO1xyXG4gICAgICAgICAgbW9yZSA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHhMID0geGMubGVuZ3RoO1xyXG4gICAgICAgICAgeUwgPSB5Yy5sZW5ndGg7XHJcbiAgICAgICAgICBpID0gMDtcclxuICAgICAgICAgIHMgKz0gMjtcclxuXHJcbiAgICAgICAgICAvLyBOb3JtYWxpc2UgeGMgYW5kIHljIHNvIGhpZ2hlc3Qgb3JkZXIgZGlnaXQgb2YgeWMgaXMgPj0gYmFzZSAvIDIuXHJcblxyXG4gICAgICAgICAgbiA9IG1hdGhmbG9vcihiYXNlIC8gKHljWzBdICsgMSkpO1xyXG5cclxuICAgICAgICAgIC8vIE5vdCBuZWNlc3NhcnksIGJ1dCB0byBoYW5kbGUgb2RkIGJhc2VzIHdoZXJlIHljWzBdID09IChiYXNlIC8gMikgLSAxLlxyXG4gICAgICAgICAgLy8gaWYgKG4gPiAxIHx8IG4rKyA9PSAxICYmIHljWzBdIDwgYmFzZSAvIDIpIHtcclxuICAgICAgICAgIGlmIChuID4gMSkge1xyXG4gICAgICAgICAgICB5YyA9IG11bHRpcGx5KHljLCBuLCBiYXNlKTtcclxuICAgICAgICAgICAgeGMgPSBtdWx0aXBseSh4YywgbiwgYmFzZSk7XHJcbiAgICAgICAgICAgIHlMID0geWMubGVuZ3RoO1xyXG4gICAgICAgICAgICB4TCA9IHhjLmxlbmd0aDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB4aSA9IHlMO1xyXG4gICAgICAgICAgcmVtID0geGMuc2xpY2UoMCwgeUwpO1xyXG4gICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgLy8gQWRkIHplcm9zIHRvIG1ha2UgcmVtYWluZGVyIGFzIGxvbmcgYXMgZGl2aXNvci5cclxuICAgICAgICAgIGZvciAoOyByZW1MIDwgeUw7IHJlbVtyZW1MKytdID0gMCk7XHJcbiAgICAgICAgICB5eiA9IHljLnNsaWNlKCk7XHJcbiAgICAgICAgICB5eiA9IFswXS5jb25jYXQoeXopO1xyXG4gICAgICAgICAgeWMwID0geWNbMF07XHJcbiAgICAgICAgICBpZiAoeWNbMV0gPj0gYmFzZSAvIDIpIHljMCsrO1xyXG4gICAgICAgICAgLy8gTm90IG5lY2Vzc2FyeSwgYnV0IHRvIHByZXZlbnQgdHJpYWwgZGlnaXQgbiA+IGJhc2UsIHdoZW4gdXNpbmcgYmFzZSAzLlxyXG4gICAgICAgICAgLy8gZWxzZSBpZiAoYmFzZSA9PSAzICYmIHljMCA9PSAxKSB5YzAgPSAxICsgMWUtMTU7XHJcblxyXG4gICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICBuID0gMDtcclxuXHJcbiAgICAgICAgICAgIC8vIENvbXBhcmUgZGl2aXNvciBhbmQgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICBjbXAgPSBjb21wYXJlKHljLCByZW0sIHlMLCByZW1MKTtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIGRpdmlzb3IgPCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgIGlmIChjbXAgPCAwKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0cmlhbCBkaWdpdCwgbi5cclxuXHJcbiAgICAgICAgICAgICAgcmVtMCA9IHJlbVswXTtcclxuICAgICAgICAgICAgICBpZiAoeUwgIT0gcmVtTCkgcmVtMCA9IHJlbTAgKiBiYXNlICsgKHJlbVsxXSB8fCAwKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gbiBpcyBob3cgbWFueSB0aW1lcyB0aGUgZGl2aXNvciBnb2VzIGludG8gdGhlIGN1cnJlbnQgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgIG4gPSBtYXRoZmxvb3IocmVtMCAvIHljMCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vICBBbGdvcml0aG06XHJcbiAgICAgICAgICAgICAgLy8gIHByb2R1Y3QgPSBkaXZpc29yIG11bHRpcGxpZWQgYnkgdHJpYWwgZGlnaXQgKG4pLlxyXG4gICAgICAgICAgICAgIC8vICBDb21wYXJlIHByb2R1Y3QgYW5kIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAvLyAgSWYgcHJvZHVjdCBpcyBncmVhdGVyIHRoYW4gcmVtYWluZGVyOlxyXG4gICAgICAgICAgICAgIC8vICAgIFN1YnRyYWN0IGRpdmlzb3IgZnJvbSBwcm9kdWN0LCBkZWNyZW1lbnQgdHJpYWwgZGlnaXQuXHJcbiAgICAgICAgICAgICAgLy8gIFN1YnRyYWN0IHByb2R1Y3QgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgLy8gIElmIHByb2R1Y3Qgd2FzIGxlc3MgdGhhbiByZW1haW5kZXIgYXQgdGhlIGxhc3QgY29tcGFyZTpcclxuICAgICAgICAgICAgICAvLyAgICBDb21wYXJlIG5ldyByZW1haW5kZXIgYW5kIGRpdmlzb3IuXHJcbiAgICAgICAgICAgICAgLy8gICAgSWYgcmVtYWluZGVyIGlzIGdyZWF0ZXIgdGhhbiBkaXZpc29yOlxyXG4gICAgICAgICAgICAgIC8vICAgICAgU3VidHJhY3QgZGl2aXNvciBmcm9tIHJlbWFpbmRlciwgaW5jcmVtZW50IHRyaWFsIGRpZ2l0LlxyXG5cclxuICAgICAgICAgICAgICBpZiAobiA+IDEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBuIG1heSBiZSA+IGJhc2Ugb25seSB3aGVuIGJhc2UgaXMgMy5cclxuICAgICAgICAgICAgICAgIGlmIChuID49IGJhc2UpIG4gPSBiYXNlIC0gMTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBwcm9kdWN0ID0gZGl2aXNvciAqIHRyaWFsIGRpZ2l0LlxyXG4gICAgICAgICAgICAgICAgcHJvZCA9IG11bHRpcGx5KHljLCBuLCBiYXNlKTtcclxuICAgICAgICAgICAgICAgIHByb2RMID0gcHJvZC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICByZW1MID0gcmVtLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDb21wYXJlIHByb2R1Y3QgYW5kIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgIC8vIElmIHByb2R1Y3QgPiByZW1haW5kZXIgdGhlbiB0cmlhbCBkaWdpdCBuIHRvbyBoaWdoLlxyXG4gICAgICAgICAgICAgICAgLy8gbiBpcyAxIHRvbyBoaWdoIGFib3V0IDUlIG9mIHRoZSB0aW1lLCBhbmQgaXMgbm90IGtub3duIHRvIGhhdmVcclxuICAgICAgICAgICAgICAgIC8vIGV2ZXIgYmVlbiBtb3JlIHRoYW4gMSB0b28gaGlnaC5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChjb21wYXJlKHByb2QsIHJlbSwgcHJvZEwsIHJlbUwpID09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgbi0tO1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gU3VidHJhY3QgZGl2aXNvciBmcm9tIHByb2R1Y3QuXHJcbiAgICAgICAgICAgICAgICAgIHN1YnRyYWN0KHByb2QsIHlMIDwgcHJvZEwgPyB5eiA6IHljLCBwcm9kTCwgYmFzZSk7XHJcbiAgICAgICAgICAgICAgICAgIHByb2RMID0gcHJvZC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgIGNtcCA9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBuIGlzIDAgb3IgMSwgY21wIGlzIC0xLlxyXG4gICAgICAgICAgICAgICAgLy8gSWYgbiBpcyAwLCB0aGVyZSBpcyBubyBuZWVkIHRvIGNvbXBhcmUgeWMgYW5kIHJlbSBhZ2FpbiBiZWxvdyxcclxuICAgICAgICAgICAgICAgIC8vIHNvIGNoYW5nZSBjbXAgdG8gMSB0byBhdm9pZCBpdC5cclxuICAgICAgICAgICAgICAgIC8vIElmIG4gaXMgMSwgbGVhdmUgY21wIGFzIC0xLCBzbyB5YyBhbmQgcmVtIGFyZSBjb21wYXJlZCBhZ2Fpbi5cclxuICAgICAgICAgICAgICAgIGlmIChuID09IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgIC8vIGRpdmlzb3IgPCByZW1haW5kZXIsIHNvIG4gbXVzdCBiZSBhdCBsZWFzdCAxLlxyXG4gICAgICAgICAgICAgICAgICBjbXAgPSBuID0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBwcm9kdWN0ID0gZGl2aXNvclxyXG4gICAgICAgICAgICAgICAgcHJvZCA9IHljLnNsaWNlKCk7XHJcbiAgICAgICAgICAgICAgICBwcm9kTCA9IHByb2QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgaWYgKHByb2RMIDwgcmVtTCkgcHJvZCA9IFswXS5jb25jYXQocHJvZCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFN1YnRyYWN0IHByb2R1Y3QgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgc3VidHJhY3QocmVtLCBwcm9kLCByZW1MLCBiYXNlKTtcclxuICAgICAgICAgICAgICByZW1MID0gcmVtLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgIC8vIElmIHByb2R1Y3Qgd2FzIDwgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgIGlmIChjbXAgPT0gLTEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDb21wYXJlIGRpdmlzb3IgYW5kIG5ldyByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBkaXZpc29yIDwgbmV3IHJlbWFpbmRlciwgc3VidHJhY3QgZGl2aXNvciBmcm9tIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgIC8vIFRyaWFsIGRpZ2l0IG4gdG9vIGxvdy5cclxuICAgICAgICAgICAgICAgIC8vIG4gaXMgMSB0b28gbG93IGFib3V0IDUlIG9mIHRoZSB0aW1lLCBhbmQgdmVyeSByYXJlbHkgMiB0b28gbG93LlxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGNvbXBhcmUoeWMsIHJlbSwgeUwsIHJlbUwpIDwgMSkge1xyXG4gICAgICAgICAgICAgICAgICBuKys7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBTdWJ0cmFjdCBkaXZpc29yIGZyb20gcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgICBzdWJ0cmFjdChyZW0sIHlMIDwgcmVtTCA/IHl6IDogeWMsIHJlbUwsIGJhc2UpO1xyXG4gICAgICAgICAgICAgICAgICByZW1MID0gcmVtLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY21wID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgbisrO1xyXG4gICAgICAgICAgICAgIHJlbSA9IFswXTtcclxuICAgICAgICAgICAgfSAvLyBlbHNlIGNtcCA9PT0gMSBhbmQgbiB3aWxsIGJlIDBcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgbmV4dCBkaWdpdCwgbiwgdG8gdGhlIHJlc3VsdCBhcnJheS5cclxuICAgICAgICAgICAgcWNbaSsrXSA9IG47XHJcblxyXG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgaWYgKHJlbVswXSkge1xyXG4gICAgICAgICAgICAgIHJlbVtyZW1MKytdID0geGNbeGldIHx8IDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmVtID0gW3hjW3hpXV07XHJcbiAgICAgICAgICAgICAgcmVtTCA9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gd2hpbGUgKCh4aSsrIDwgeEwgfHwgcmVtWzBdICE9IG51bGwpICYmIHMtLSk7XHJcblxyXG4gICAgICAgICAgbW9yZSA9IHJlbVswXSAhPSBudWxsO1xyXG5cclxuICAgICAgICAgIC8vIExlYWRpbmcgemVybz9cclxuICAgICAgICAgIGlmICghcWNbMF0pIHFjLnNwbGljZSgwLCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChiYXNlID09IEJBU0UpIHtcclxuXHJcbiAgICAgICAgICAvLyBUbyBjYWxjdWxhdGUgcS5lLCBmaXJzdCBnZXQgdGhlIG51bWJlciBvZiBkaWdpdHMgb2YgcWNbMF0uXHJcbiAgICAgICAgICBmb3IgKGkgPSAxLCBzID0gcWNbMF07IHMgPj0gMTA7IHMgLz0gMTAsIGkrKyk7XHJcblxyXG4gICAgICAgICAgcm91bmQocSwgZHAgKyAocS5lID0gaSArIGUgKiBMT0dfQkFTRSAtIDEpICsgMSwgcm0sIG1vcmUpO1xyXG5cclxuICAgICAgICAvLyBDYWxsZXIgaXMgY29udmVydEJhc2UuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHEuZSA9IGU7XHJcbiAgICAgICAgICBxLnIgPSArbW9yZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBxO1xyXG4gICAgICB9O1xyXG4gICAgfSkoKTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIEJpZ051bWJlciBuIGluIGZpeGVkLXBvaW50IG9yIGV4cG9uZW50aWFsXHJcbiAgICAgKiBub3RhdGlvbiByb3VuZGVkIHRvIHRoZSBzcGVjaWZpZWQgZGVjaW1hbCBwbGFjZXMgb3Igc2lnbmlmaWNhbnQgZGlnaXRzLlxyXG4gICAgICpcclxuICAgICAqIG46IGEgQmlnTnVtYmVyLlxyXG4gICAgICogaTogdGhlIGluZGV4IG9mIHRoZSBsYXN0IGRpZ2l0IHJlcXVpcmVkIChpLmUuIHRoZSBkaWdpdCB0aGF0IG1heSBiZSByb3VuZGVkIHVwKS5cclxuICAgICAqIHJtOiB0aGUgcm91bmRpbmcgbW9kZS5cclxuICAgICAqIGlkOiAxICh0b0V4cG9uZW50aWFsKSBvciAyICh0b1ByZWNpc2lvbikuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGZvcm1hdChuLCBpLCBybSwgaWQpIHtcclxuICAgICAgdmFyIGMwLCBlLCBuZSwgbGVuLCBzdHI7XHJcblxyXG4gICAgICBpZiAocm0gPT0gbnVsbCkgcm0gPSBST1VORElOR19NT0RFO1xyXG4gICAgICBlbHNlIGludENoZWNrKHJtLCAwLCA4KTtcclxuXHJcbiAgICAgIGlmICghbi5jKSByZXR1cm4gbi50b1N0cmluZygpO1xyXG5cclxuICAgICAgYzAgPSBuLmNbMF07XHJcbiAgICAgIG5lID0gbi5lO1xyXG5cclxuICAgICAgaWYgKGkgPT0gbnVsbCkge1xyXG4gICAgICAgIHN0ciA9IGNvZWZmVG9TdHJpbmcobi5jKTtcclxuICAgICAgICBzdHIgPSBpZCA9PSAxIHx8IGlkID09IDIgJiYgKG5lIDw9IFRPX0VYUF9ORUcgfHwgbmUgPj0gVE9fRVhQX1BPUylcclxuICAgICAgICAgPyB0b0V4cG9uZW50aWFsKHN0ciwgbmUpXHJcbiAgICAgICAgIDogdG9GaXhlZFBvaW50KHN0ciwgbmUsICcwJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbiA9IHJvdW5kKG5ldyBCaWdOdW1iZXIobiksIGksIHJtKTtcclxuXHJcbiAgICAgICAgLy8gbi5lIG1heSBoYXZlIGNoYW5nZWQgaWYgdGhlIHZhbHVlIHdhcyByb3VuZGVkIHVwLlxyXG4gICAgICAgIGUgPSBuLmU7XHJcblxyXG4gICAgICAgIHN0ciA9IGNvZWZmVG9TdHJpbmcobi5jKTtcclxuICAgICAgICBsZW4gPSBzdHIubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyB0b1ByZWNpc2lvbiByZXR1cm5zIGV4cG9uZW50aWFsIG5vdGF0aW9uIGlmIHRoZSBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZGlnaXRzXHJcbiAgICAgICAgLy8gc3BlY2lmaWVkIGlzIGxlc3MgdGhhbiB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBuZWNlc3NhcnkgdG8gcmVwcmVzZW50IHRoZSBpbnRlZ2VyXHJcbiAgICAgICAgLy8gcGFydCBvZiB0aGUgdmFsdWUgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24uXHJcblxyXG4gICAgICAgIC8vIEV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICAgIGlmIChpZCA9PSAxIHx8IGlkID09IDIgJiYgKGkgPD0gZSB8fCBlIDw9IFRPX0VYUF9ORUcpKSB7XHJcblxyXG4gICAgICAgICAgLy8gQXBwZW5kIHplcm9zP1xyXG4gICAgICAgICAgZm9yICg7IGxlbiA8IGk7IHN0ciArPSAnMCcsIGxlbisrKTtcclxuICAgICAgICAgIHN0ciA9IHRvRXhwb25lbnRpYWwoc3RyLCBlKTtcclxuXHJcbiAgICAgICAgLy8gRml4ZWQtcG9pbnQgbm90YXRpb24uXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGkgLT0gbmU7XHJcbiAgICAgICAgICBzdHIgPSB0b0ZpeGVkUG9pbnQoc3RyLCBlLCAnMCcpO1xyXG5cclxuICAgICAgICAgIC8vIEFwcGVuZCB6ZXJvcz9cclxuICAgICAgICAgIGlmIChlICsgMSA+IGxlbikge1xyXG4gICAgICAgICAgICBpZiAoLS1pID4gMCkgZm9yIChzdHIgKz0gJy4nOyBpLS07IHN0ciArPSAnMCcpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaSArPSBlIC0gbGVuO1xyXG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcclxuICAgICAgICAgICAgICBpZiAoZSArIDEgPT0gbGVuKSBzdHIgKz0gJy4nO1xyXG4gICAgICAgICAgICAgIGZvciAoOyBpLS07IHN0ciArPSAnMCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbi5zIDwgMCAmJiBjMCA/ICctJyArIHN0ciA6IHN0cjtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gSGFuZGxlIEJpZ051bWJlci5tYXggYW5kIEJpZ051bWJlci5taW4uXHJcbiAgICBmdW5jdGlvbiBtYXhPck1pbihhcmdzLCBtZXRob2QpIHtcclxuICAgICAgdmFyIG4sXHJcbiAgICAgICAgaSA9IDEsXHJcbiAgICAgICAgbSA9IG5ldyBCaWdOdW1iZXIoYXJnc1swXSk7XHJcblxyXG4gICAgICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBuID0gbmV3IEJpZ051bWJlcihhcmdzW2ldKTtcclxuXHJcbiAgICAgICAgLy8gSWYgYW55IG51bWJlciBpcyBOYU4sIHJldHVybiBOYU4uXHJcbiAgICAgICAgaWYgKCFuLnMpIHtcclxuICAgICAgICAgIG0gPSBuO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfSBlbHNlIGlmIChtZXRob2QuY2FsbChtLCBuKSkge1xyXG4gICAgICAgICAgbSA9IG47XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFN0cmlwIHRyYWlsaW5nIHplcm9zLCBjYWxjdWxhdGUgYmFzZSAxMCBleHBvbmVudCBhbmQgY2hlY2sgYWdhaW5zdCBNSU5fRVhQIGFuZCBNQVhfRVhQLlxyXG4gICAgICogQ2FsbGVkIGJ5IG1pbnVzLCBwbHVzIGFuZCB0aW1lcy5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gbm9ybWFsaXNlKG4sIGMsIGUpIHtcclxuICAgICAgdmFyIGkgPSAxLFxyXG4gICAgICAgIGogPSBjLmxlbmd0aDtcclxuXHJcbiAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgIGZvciAoOyAhY1stLWpdOyBjLnBvcCgpKTtcclxuXHJcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgYmFzZSAxMCBleHBvbmVudC4gRmlyc3QgZ2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIGNbMF0uXHJcbiAgICAgIGZvciAoaiA9IGNbMF07IGogPj0gMTA7IGogLz0gMTAsIGkrKyk7XHJcblxyXG4gICAgICAvLyBPdmVyZmxvdz9cclxuICAgICAgaWYgKChlID0gaSArIGUgKiBMT0dfQkFTRSAtIDEpID4gTUFYX0VYUCkge1xyXG5cclxuICAgICAgICAvLyBJbmZpbml0eS5cclxuICAgICAgICBuLmMgPSBuLmUgPSBudWxsO1xyXG5cclxuICAgICAgLy8gVW5kZXJmbG93P1xyXG4gICAgICB9IGVsc2UgaWYgKGUgPCBNSU5fRVhQKSB7XHJcblxyXG4gICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgbi5jID0gW24uZSA9IDBdO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG4uZSA9IGU7XHJcbiAgICAgICAgbi5jID0gYztcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG47XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIEhhbmRsZSB2YWx1ZXMgdGhhdCBmYWlsIHRoZSB2YWxpZGl0eSB0ZXN0IGluIEJpZ051bWJlci5cclxuICAgIHBhcnNlTnVtZXJpYyA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBiYXNlUHJlZml4ID0gL14oLT8pMChbeGJvXSkoPz1cXHdbXFx3Ll0qJCkvaSxcclxuICAgICAgICBkb3RBZnRlciA9IC9eKFteLl0rKVxcLiQvLFxyXG4gICAgICAgIGRvdEJlZm9yZSA9IC9eXFwuKFteLl0rKSQvLFxyXG4gICAgICAgIGlzSW5maW5pdHlPck5hTiA9IC9eLT8oSW5maW5pdHl8TmFOKSQvLFxyXG4gICAgICAgIHdoaXRlc3BhY2VPclBsdXMgPSAvXlxccypcXCsoPz1bXFx3Ll0pfF5cXHMrfFxccyskL2c7XHJcblxyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHgsIHN0ciwgaXNOdW0sIGIpIHtcclxuICAgICAgICB2YXIgYmFzZSxcclxuICAgICAgICAgIHMgPSBpc051bSA/IHN0ciA6IHN0ci5yZXBsYWNlKHdoaXRlc3BhY2VPclBsdXMsICcnKTtcclxuXHJcbiAgICAgICAgLy8gTm8gZXhjZXB0aW9uIG9uIMKxSW5maW5pdHkgb3IgTmFOLlxyXG4gICAgICAgIGlmIChpc0luZmluaXR5T3JOYU4udGVzdChzKSkge1xyXG4gICAgICAgICAgeC5zID0gaXNOYU4ocykgPyBudWxsIDogcyA8IDAgPyAtMSA6IDE7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmICghaXNOdW0pIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJhc2VQcmVmaXggPSAvXigtPykwKFt4Ym9dKSg/PVxcd1tcXHcuXSokKS9pXHJcbiAgICAgICAgICAgIHMgPSBzLnJlcGxhY2UoYmFzZVByZWZpeCwgZnVuY3Rpb24gKG0sIHAxLCBwMikge1xyXG4gICAgICAgICAgICAgIGJhc2UgPSAocDIgPSBwMi50b0xvd2VyQ2FzZSgpKSA9PSAneCcgPyAxNiA6IHAyID09ICdiJyA/IDIgOiA4O1xyXG4gICAgICAgICAgICAgIHJldHVybiAhYiB8fCBiID09IGJhc2UgPyBwMSA6IG07XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKGIpIHtcclxuICAgICAgICAgICAgICBiYXNlID0gYjtcclxuXHJcbiAgICAgICAgICAgICAgLy8gRS5nLiAnMS4nIHRvICcxJywgJy4xJyB0byAnMC4xJ1xyXG4gICAgICAgICAgICAgIHMgPSBzLnJlcGxhY2UoZG90QWZ0ZXIsICckMScpLnJlcGxhY2UoZG90QmVmb3JlLCAnMC4kMScpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RyICE9IHMpIHJldHVybiBuZXcgQmlnTnVtYmVyKHMsIGJhc2UpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOb3QgYSBudW1iZXI6IHtufSdcclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOb3QgYSBiYXNlIHtifSBudW1iZXI6IHtufSdcclxuICAgICAgICAgIGlmIChCaWdOdW1iZXIuREVCVUcpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnTm90IGEnICsgKGIgPyAnIGJhc2UgJyArIGIgOiAnJykgKyAnIG51bWJlcjogJyArIHN0cik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gTmFOXHJcbiAgICAgICAgICB4LnMgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSkoKTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJvdW5kIHggdG8gc2Qgc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0uIENoZWNrIGZvciBvdmVyL3VuZGVyLWZsb3cuXHJcbiAgICAgKiBJZiByIGlzIHRydXRoeSwgaXQgaXMga25vd24gdGhhdCB0aGVyZSBhcmUgbW9yZSBkaWdpdHMgYWZ0ZXIgdGhlIHJvdW5kaW5nIGRpZ2l0LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiByb3VuZCh4LCBzZCwgcm0sIHIpIHtcclxuICAgICAgdmFyIGQsIGksIGosIGssIG4sIG5pLCByZCxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICBwb3dzMTAgPSBQT1dTX1RFTjtcclxuXHJcbiAgICAgIC8vIGlmIHggaXMgbm90IEluZmluaXR5IG9yIE5hTi4uLlxyXG4gICAgICBpZiAoeGMpIHtcclxuXHJcbiAgICAgICAgLy8gcmQgaXMgdGhlIHJvdW5kaW5nIGRpZ2l0LCBpLmUuIHRoZSBkaWdpdCBhZnRlciB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cC5cclxuICAgICAgICAvLyBuIGlzIGEgYmFzZSAxZTE0IG51bWJlciwgdGhlIHZhbHVlIG9mIHRoZSBlbGVtZW50IG9mIGFycmF5IHguYyBjb250YWluaW5nIHJkLlxyXG4gICAgICAgIC8vIG5pIGlzIHRoZSBpbmRleCBvZiBuIHdpdGhpbiB4LmMuXHJcbiAgICAgICAgLy8gZCBpcyB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiBuLlxyXG4gICAgICAgIC8vIGkgaXMgdGhlIGluZGV4IG9mIHJkIHdpdGhpbiBuIGluY2x1ZGluZyBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgIC8vIGogaXMgdGhlIGFjdHVhbCBpbmRleCBvZiByZCB3aXRoaW4gbiAoaWYgPCAwLCByZCBpcyBhIGxlYWRpbmcgemVybykuXHJcbiAgICAgICAgb3V0OiB7XHJcblxyXG4gICAgICAgICAgLy8gR2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIHRoZSBmaXJzdCBlbGVtZW50IG9mIHhjLlxyXG4gICAgICAgICAgZm9yIChkID0gMSwgayA9IHhjWzBdOyBrID49IDEwOyBrIC89IDEwLCBkKyspO1xyXG4gICAgICAgICAgaSA9IHNkIC0gZDtcclxuXHJcbiAgICAgICAgICAvLyBJZiB0aGUgcm91bmRpbmcgZGlnaXQgaXMgaW4gdGhlIGZpcnN0IGVsZW1lbnQgb2YgeGMuLi5cclxuICAgICAgICAgIGlmIChpIDwgMCkge1xyXG4gICAgICAgICAgICBpICs9IExPR19CQVNFO1xyXG4gICAgICAgICAgICBqID0gc2Q7XHJcbiAgICAgICAgICAgIG4gPSB4Y1tuaSA9IDBdO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHRoZSByb3VuZGluZyBkaWdpdCBhdCBpbmRleCBqIG9mIG4uXHJcbiAgICAgICAgICAgIHJkID0gbiAvIHBvd3MxMFtkIC0gaiAtIDFdICUgMTAgfCAwO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbmkgPSBtYXRoY2VpbCgoaSArIDEpIC8gTE9HX0JBU0UpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5pID49IHhjLmxlbmd0aCkge1xyXG5cclxuICAgICAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE5lZWRlZCBieSBzcXJ0LlxyXG4gICAgICAgICAgICAgICAgZm9yICg7IHhjLmxlbmd0aCA8PSBuaTsgeGMucHVzaCgwKSk7XHJcbiAgICAgICAgICAgICAgICBuID0gcmQgPSAwO1xyXG4gICAgICAgICAgICAgICAgZCA9IDE7XHJcbiAgICAgICAgICAgICAgICBpICU9IExPR19CQVNFO1xyXG4gICAgICAgICAgICAgICAgaiA9IGkgLSBMT0dfQkFTRSArIDE7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrIG91dDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgbiA9IGsgPSB4Y1tuaV07XHJcblxyXG4gICAgICAgICAgICAgIC8vIEdldCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiBuLlxyXG4gICAgICAgICAgICAgIGZvciAoZCA9IDE7IGsgPj0gMTA7IGsgLz0gMTAsIGQrKyk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEdldCB0aGUgaW5kZXggb2YgcmQgd2l0aGluIG4uXHJcbiAgICAgICAgICAgICAgaSAlPSBMT0dfQkFTRTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gR2V0IHRoZSBpbmRleCBvZiByZCB3aXRoaW4gbiwgYWRqdXN0ZWQgZm9yIGxlYWRpbmcgemVyb3MuXHJcbiAgICAgICAgICAgICAgLy8gVGhlIG51bWJlciBvZiBsZWFkaW5nIHplcm9zIG9mIG4gaXMgZ2l2ZW4gYnkgTE9HX0JBU0UgLSBkLlxyXG4gICAgICAgICAgICAgIGogPSBpIC0gTE9HX0JBU0UgKyBkO1xyXG5cclxuICAgICAgICAgICAgICAvLyBHZXQgdGhlIHJvdW5kaW5nIGRpZ2l0IGF0IGluZGV4IGogb2Ygbi5cclxuICAgICAgICAgICAgICByZCA9IGogPCAwID8gMCA6IG4gLyBwb3dzMTBbZCAtIGogLSAxXSAlIDEwIHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHIgPSByIHx8IHNkIDwgMCB8fFxyXG5cclxuICAgICAgICAgIC8vIEFyZSB0aGVyZSBhbnkgbm9uLXplcm8gZGlnaXRzIGFmdGVyIHRoZSByb3VuZGluZyBkaWdpdD9cclxuICAgICAgICAgIC8vIFRoZSBleHByZXNzaW9uICBuICUgcG93czEwW2QgLSBqIC0gMV0gIHJldHVybnMgYWxsIGRpZ2l0cyBvZiBuIHRvIHRoZSByaWdodFxyXG4gICAgICAgICAgLy8gb2YgdGhlIGRpZ2l0IGF0IGosIGUuZy4gaWYgbiBpcyA5MDg3MTQgYW5kIGogaXMgMiwgdGhlIGV4cHJlc3Npb24gZ2l2ZXMgNzE0LlxyXG4gICAgICAgICAgIHhjW25pICsgMV0gIT0gbnVsbCB8fCAoaiA8IDAgPyBuIDogbiAlIHBvd3MxMFtkIC0gaiAtIDFdKTtcclxuXHJcbiAgICAgICAgICByID0gcm0gPCA0XHJcbiAgICAgICAgICAgPyAocmQgfHwgcikgJiYgKHJtID09IDAgfHwgcm0gPT0gKHgucyA8IDAgPyAzIDogMikpXHJcbiAgICAgICAgICAgOiByZCA+IDUgfHwgcmQgPT0gNSAmJiAocm0gPT0gNCB8fCByIHx8IHJtID09IDYgJiZcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIGRpZ2l0IHRvIHRoZSBsZWZ0IG9mIHRoZSByb3VuZGluZyBkaWdpdCBpcyBvZGQuXHJcbiAgICAgICAgICAgICgoaSA+IDAgPyBqID4gMCA/IG4gLyBwb3dzMTBbZCAtIGpdIDogMCA6IHhjW25pIC0gMV0pICUgMTApICYgMSB8fFxyXG4gICAgICAgICAgICAgcm0gPT0gKHgucyA8IDAgPyA4IDogNykpO1xyXG5cclxuICAgICAgICAgIGlmIChzZCA8IDEgfHwgIXhjWzBdKSB7XHJcbiAgICAgICAgICAgIHhjLmxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgICAvLyBDb252ZXJ0IHNkIHRvIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICAgICAgICAgIHNkIC09IHguZSArIDE7XHJcblxyXG4gICAgICAgICAgICAgIC8vIDEsIDAuMSwgMC4wMSwgMC4wMDEsIDAuMDAwMSBldGMuXHJcbiAgICAgICAgICAgICAgeGNbMF0gPSBwb3dzMTBbKExPR19CQVNFIC0gc2QgJSBMT0dfQkFTRSkgJSBMT0dfQkFTRV07XHJcbiAgICAgICAgICAgICAgeC5lID0gLXNkIHx8IDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgICAgICAgeGNbMF0gPSB4LmUgPSAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4geDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgZXhjZXNzIGRpZ2l0cy5cclxuICAgICAgICAgIGlmIChpID09IDApIHtcclxuICAgICAgICAgICAgeGMubGVuZ3RoID0gbmk7XHJcbiAgICAgICAgICAgIGsgPSAxO1xyXG4gICAgICAgICAgICBuaS0tO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgeGMubGVuZ3RoID0gbmkgKyAxO1xyXG4gICAgICAgICAgICBrID0gcG93czEwW0xPR19CQVNFIC0gaV07XHJcblxyXG4gICAgICAgICAgICAvLyBFLmcuIDU2NzAwIGJlY29tZXMgNTYwMDAgaWYgNyBpcyB0aGUgcm91bmRpbmcgZGlnaXQuXHJcbiAgICAgICAgICAgIC8vIGogPiAwIG1lYW5zIGkgPiBudW1iZXIgb2YgbGVhZGluZyB6ZXJvcyBvZiBuLlxyXG4gICAgICAgICAgICB4Y1tuaV0gPSBqID4gMCA/IG1hdGhmbG9vcihuIC8gcG93czEwW2QgLSBqXSAlIHBvd3MxMFtqXSkgKiBrIDogMDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSb3VuZCB1cD9cclxuICAgICAgICAgIGlmIChyKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgOykge1xyXG5cclxuICAgICAgICAgICAgICAvLyBJZiB0aGUgZGlnaXQgdG8gYmUgcm91bmRlZCB1cCBpcyBpbiB0aGUgZmlyc3QgZWxlbWVudCBvZiB4Yy4uLlxyXG4gICAgICAgICAgICAgIGlmIChuaSA9PSAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaSB3aWxsIGJlIHRoZSBsZW5ndGggb2YgeGNbMF0gYmVmb3JlIGsgaXMgYWRkZWQuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAxLCBqID0geGNbMF07IGogPj0gMTA7IGogLz0gMTAsIGkrKyk7XHJcbiAgICAgICAgICAgICAgICBqID0geGNbMF0gKz0gaztcclxuICAgICAgICAgICAgICAgIGZvciAoayA9IDE7IGogPj0gMTA7IGogLz0gMTAsIGsrKyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgaSAhPSBrIHRoZSBsZW5ndGggaGFzIGluY3JlYXNlZC5cclxuICAgICAgICAgICAgICAgIGlmIChpICE9IGspIHtcclxuICAgICAgICAgICAgICAgICAgeC5lKys7XHJcbiAgICAgICAgICAgICAgICAgIGlmICh4Y1swXSA9PSBCQVNFKSB4Y1swXSA9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHhjW25pXSArPSBrO1xyXG4gICAgICAgICAgICAgICAgaWYgKHhjW25pXSAhPSBCQVNFKSBicmVhaztcclxuICAgICAgICAgICAgICAgIHhjW25pLS1dID0gMDtcclxuICAgICAgICAgICAgICAgIGsgPSAxO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICAgIGZvciAoaSA9IHhjLmxlbmd0aDsgeGNbLS1pXSA9PT0gMDsgeGMucG9wKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT3ZlcmZsb3c/IEluZmluaXR5LlxyXG4gICAgICAgIGlmICh4LmUgPiBNQVhfRVhQKSB7XHJcbiAgICAgICAgICB4LmMgPSB4LmUgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBVbmRlcmZsb3c/IFplcm8uXHJcbiAgICAgICAgfSBlbHNlIGlmICh4LmUgPCBNSU5fRVhQKSB7XHJcbiAgICAgICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4geDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gdmFsdWVPZihuKSB7XHJcbiAgICAgIHZhciBzdHIsXHJcbiAgICAgICAgZSA9IG4uZTtcclxuXHJcbiAgICAgIGlmIChlID09PSBudWxsKSByZXR1cm4gbi50b1N0cmluZygpO1xyXG5cclxuICAgICAgc3RyID0gY29lZmZUb1N0cmluZyhuLmMpO1xyXG5cclxuICAgICAgc3RyID0gZSA8PSBUT19FWFBfTkVHIHx8IGUgPj0gVE9fRVhQX1BPU1xyXG4gICAgICAgID8gdG9FeHBvbmVudGlhbChzdHIsIGUpXHJcbiAgICAgICAgOiB0b0ZpeGVkUG9pbnQoc3RyLCBlLCAnMCcpO1xyXG5cclxuICAgICAgcmV0dXJuIG4ucyA8IDAgPyAnLScgKyBzdHIgOiBzdHI7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIFBST1RPVFlQRS9JTlNUQU5DRSBNRVRIT0RTXHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlci5cclxuICAgICAqL1xyXG4gICAgUC5hYnNvbHV0ZVZhbHVlID0gUC5hYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB4ID0gbmV3IEJpZ051bWJlcih0aGlzKTtcclxuICAgICAgaWYgKHgucyA8IDApIHgucyA9IDE7XHJcbiAgICAgIHJldHVybiB4O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVyblxyXG4gICAgICogICAxIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBncmVhdGVyIHRoYW4gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqICAgLTEgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICogICAwIGlmIHRoZXkgaGF2ZSB0aGUgc2FtZSB2YWx1ZSxcclxuICAgICAqICAgb3IgbnVsbCBpZiB0aGUgdmFsdWUgb2YgZWl0aGVyIGlzIE5hTi5cclxuICAgICAqL1xyXG4gICAgUC5jb21wYXJlZFRvID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogSWYgZHAgaXMgdW5kZWZpbmVkIG9yIG51bGwgb3IgdHJ1ZSBvciBmYWxzZSwgcmV0dXJuIHRoZSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgb2YgdGhlXHJcbiAgICAgKiB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciwgb3IgbnVsbCBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgwrFJbmZpbml0eSBvciBOYU4uXHJcbiAgICAgKlxyXG4gICAgICogT3RoZXJ3aXNlLCBpZiBkcCBpcyBhIG51bWJlciwgcmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpc1xyXG4gICAgICogQmlnTnVtYmVyIHJvdW5kZWQgdG8gYSBtYXhpbXVtIG9mIGRwIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yXHJcbiAgICAgKiBST1VORElOR19NT0RFIGlmIHJtIGlzIG9taXR0ZWQuXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlczogaW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7ZHB8cm19J1xyXG4gICAgICovXHJcbiAgICBQLmRlY2ltYWxQbGFjZXMgPSBQLmRwID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gICAgICB2YXIgYywgbiwgdixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIGlmIChkcCAhPSBudWxsKSB7XHJcbiAgICAgICAgaW50Q2hlY2soZHAsIDAsIE1BWCk7XHJcbiAgICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgICBlbHNlIGludENoZWNrKHJtLCAwLCA4KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJvdW5kKG5ldyBCaWdOdW1iZXIoeCksIGRwICsgeC5lICsgMSwgcm0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIShjID0geC5jKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgIG4gPSAoKHYgPSBjLmxlbmd0aCAtIDEpIC0gYml0Rmxvb3IodGhpcy5lIC8gTE9HX0JBU0UpKSAqIExPR19CQVNFO1xyXG5cclxuICAgICAgLy8gU3VidHJhY3QgdGhlIG51bWJlciBvZiB0cmFpbGluZyB6ZXJvcyBvZiB0aGUgbGFzdCBudW1iZXIuXHJcbiAgICAgIGlmICh2ID0gY1t2XSkgZm9yICg7IHYgJSAxMCA9PSAwOyB2IC89IDEwLCBuLS0pO1xyXG4gICAgICBpZiAobiA8IDApIG4gPSAwO1xyXG5cclxuICAgICAgcmV0dXJuIG47XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gLyAwID0gSVxyXG4gICAgICogIG4gLyBOID0gTlxyXG4gICAgICogIG4gLyBJID0gMFxyXG4gICAgICogIDAgLyBuID0gMFxyXG4gICAgICogIDAgLyAwID0gTlxyXG4gICAgICogIDAgLyBOID0gTlxyXG4gICAgICogIDAgLyBJID0gMFxyXG4gICAgICogIE4gLyBuID0gTlxyXG4gICAgICogIE4gLyAwID0gTlxyXG4gICAgICogIE4gLyBOID0gTlxyXG4gICAgICogIE4gLyBJID0gTlxyXG4gICAgICogIEkgLyBuID0gSVxyXG4gICAgICogIEkgLyAwID0gSVxyXG4gICAgICogIEkgLyBOID0gTlxyXG4gICAgICogIEkgLyBJID0gTlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGRpdmlkZWQgYnkgdGhlIHZhbHVlIG9mXHJcbiAgICAgKiBCaWdOdW1iZXIoeSwgYiksIHJvdW5kZWQgYWNjb3JkaW5nIHRvIERFQ0lNQUxfUExBQ0VTIGFuZCBST1VORElOR19NT0RFLlxyXG4gICAgICovXHJcbiAgICBQLmRpdmlkZWRCeSA9IFAuZGl2ID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGRpdih0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpLCBERUNJTUFMX1BMQUNFUywgUk9VTkRJTkdfTU9ERSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgaW50ZWdlciBwYXJ0IG9mIGRpdmlkaW5nIHRoZSB2YWx1ZSBvZiB0aGlzXHJcbiAgICAgKiBCaWdOdW1iZXIgYnkgdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKS5cclxuICAgICAqL1xyXG4gICAgUC5kaXZpZGVkVG9JbnRlZ2VyQnkgPSBQLmlkaXYgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gZGl2KHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYiksIDAsIDEpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgZXhwb25lbnRpYXRlZCBieSBuLlxyXG4gICAgICpcclxuICAgICAqIElmIG0gaXMgcHJlc2VudCwgcmV0dXJuIHRoZSByZXN1bHQgbW9kdWxvIG0uXHJcbiAgICAgKiBJZiBuIGlzIG5lZ2F0aXZlIHJvdW5kIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmQgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqIElmIFBPV19QUkVDSVNJT04gaXMgbm9uLXplcm8gYW5kIG0gaXMgbm90IHByZXNlbnQsIHJvdW5kIHRvIFBPV19QUkVDSVNJT04gdXNpbmcgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqXHJcbiAgICAgKiBUaGUgbW9kdWxhciBwb3dlciBvcGVyYXRpb24gd29ya3MgZWZmaWNpZW50bHkgd2hlbiB4LCBuLCBhbmQgbSBhcmUgaW50ZWdlcnMsIG90aGVyd2lzZSBpdFxyXG4gICAgICogaXMgZXF1aXZhbGVudCB0byBjYWxjdWxhdGluZyB4LmV4cG9uZW50aWF0ZWRCeShuKS5tb2R1bG8obSkgd2l0aCBhIFBPV19QUkVDSVNJT04gb2YgMC5cclxuICAgICAqXHJcbiAgICAgKiBuIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gVGhlIGV4cG9uZW50LiBBbiBpbnRlZ2VyLlxyXG4gICAgICogW21dIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gVGhlIG1vZHVsdXMuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEV4cG9uZW50IG5vdCBhbiBpbnRlZ2VyOiB7bn0nXHJcbiAgICAgKi9cclxuICAgIFAuZXhwb25lbnRpYXRlZEJ5ID0gUC5wb3cgPSBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICB2YXIgaGFsZiwgaXNNb2RFeHAsIGksIGssIG1vcmUsIG5Jc0JpZywgbklzTmVnLCBuSXNPZGQsIHksXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICBuID0gbmV3IEJpZ051bWJlcihuKTtcclxuXHJcbiAgICAgIC8vIEFsbG93IE5hTiBhbmQgwrFJbmZpbml0eSwgYnV0IG5vdCBvdGhlciBub24taW50ZWdlcnMuXHJcbiAgICAgIGlmIChuLmMgJiYgIW4uaXNJbnRlZ2VyKCkpIHtcclxuICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ0V4cG9uZW50IG5vdCBhbiBpbnRlZ2VyOiAnICsgdmFsdWVPZihuKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChtICE9IG51bGwpIG0gPSBuZXcgQmlnTnVtYmVyKG0pO1xyXG5cclxuICAgICAgLy8gRXhwb25lbnQgb2YgTUFYX1NBRkVfSU5URUdFUiBpcyAxNS5cclxuICAgICAgbklzQmlnID0gbi5lID4gMTQ7XHJcblxyXG4gICAgICAvLyBJZiB4IGlzIE5hTiwgwrFJbmZpbml0eSwgwrEwIG9yIMKxMSwgb3IgbiBpcyDCsUluZmluaXR5LCBOYU4gb3IgwrEwLlxyXG4gICAgICBpZiAoIXguYyB8fCAheC5jWzBdIHx8IHguY1swXSA9PSAxICYmICF4LmUgJiYgeC5jLmxlbmd0aCA9PSAxIHx8ICFuLmMgfHwgIW4uY1swXSkge1xyXG5cclxuICAgICAgICAvLyBUaGUgc2lnbiBvZiB0aGUgcmVzdWx0IG9mIHBvdyB3aGVuIHggaXMgbmVnYXRpdmUgZGVwZW5kcyBvbiB0aGUgZXZlbm5lc3Mgb2Ygbi5cclxuICAgICAgICAvLyBJZiArbiBvdmVyZmxvd3MgdG8gwrFJbmZpbml0eSwgdGhlIGV2ZW5uZXNzIG9mIG4gd291bGQgYmUgbm90IGJlIGtub3duLlxyXG4gICAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKE1hdGgucG93KCt2YWx1ZU9mKHgpLCBuSXNCaWcgPyAyIC0gaXNPZGQobikgOiArdmFsdWVPZihuKSkpO1xyXG4gICAgICAgIHJldHVybiBtID8geS5tb2QobSkgOiB5O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBuSXNOZWcgPSBuLnMgPCAwO1xyXG5cclxuICAgICAgaWYgKG0pIHtcclxuXHJcbiAgICAgICAgLy8geCAlIG0gcmV0dXJucyBOYU4gaWYgYWJzKG0pIGlzIHplcm8sIG9yIG0gaXMgTmFOLlxyXG4gICAgICAgIGlmIChtLmMgPyAhbS5jWzBdIDogIW0ucykgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgICAgaXNNb2RFeHAgPSAhbklzTmVnICYmIHguaXNJbnRlZ2VyKCkgJiYgbS5pc0ludGVnZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKGlzTW9kRXhwKSB4ID0geC5tb2QobSk7XHJcblxyXG4gICAgICAvLyBPdmVyZmxvdyB0byDCsUluZmluaXR5OiA+PTIqKjFlMTAgb3IgPj0xLjAwMDAwMjQqKjFlMTUuXHJcbiAgICAgIC8vIFVuZGVyZmxvdyB0byDCsTA6IDw9MC43OSoqMWUxMCBvciA8PTAuOTk5OTk3NSoqMWUxNS5cclxuICAgICAgfSBlbHNlIGlmIChuLmUgPiA5ICYmICh4LmUgPiAwIHx8IHguZSA8IC0xIHx8ICh4LmUgPT0gMFxyXG4gICAgICAgIC8vIFsxLCAyNDAwMDAwMDBdXHJcbiAgICAgICAgPyB4LmNbMF0gPiAxIHx8IG5Jc0JpZyAmJiB4LmNbMV0gPj0gMjRlN1xyXG4gICAgICAgIC8vIFs4MDAwMDAwMDAwMDAwMF0gIFs5OTk5OTc1MDAwMDAwMF1cclxuICAgICAgICA6IHguY1swXSA8IDhlMTMgfHwgbklzQmlnICYmIHguY1swXSA8PSA5OTk5OTc1ZTcpKSkge1xyXG5cclxuICAgICAgICAvLyBJZiB4IGlzIG5lZ2F0aXZlIGFuZCBuIGlzIG9kZCwgayA9IC0wLCBlbHNlIGsgPSAwLlxyXG4gICAgICAgIGsgPSB4LnMgPCAwICYmIGlzT2RkKG4pID8gLTAgOiAwO1xyXG5cclxuICAgICAgICAvLyBJZiB4ID49IDEsIGsgPSDCsUluZmluaXR5LlxyXG4gICAgICAgIGlmICh4LmUgPiAtMSkgayA9IDEgLyBrO1xyXG5cclxuICAgICAgICAvLyBJZiBuIGlzIG5lZ2F0aXZlIHJldHVybiDCsTAsIGVsc2UgcmV0dXJuIMKxSW5maW5pdHkuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIobklzTmVnID8gMSAvIGsgOiBrKTtcclxuXHJcbiAgICAgIH0gZWxzZSBpZiAoUE9XX1BSRUNJU0lPTikge1xyXG5cclxuICAgICAgICAvLyBUcnVuY2F0aW5nIGVhY2ggY29lZmZpY2llbnQgYXJyYXkgdG8gYSBsZW5ndGggb2YgayBhZnRlciBlYWNoIG11bHRpcGxpY2F0aW9uXHJcbiAgICAgICAgLy8gZXF1YXRlcyB0byB0cnVuY2F0aW5nIHNpZ25pZmljYW50IGRpZ2l0cyB0byBQT1dfUFJFQ0lTSU9OICsgWzI4LCA0MV0sXHJcbiAgICAgICAgLy8gaS5lLiB0aGVyZSB3aWxsIGJlIGEgbWluaW11bSBvZiAyOCBndWFyZCBkaWdpdHMgcmV0YWluZWQuXHJcbiAgICAgICAgayA9IG1hdGhjZWlsKFBPV19QUkVDSVNJT04gLyBMT0dfQkFTRSArIDIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobklzQmlnKSB7XHJcbiAgICAgICAgaGFsZiA9IG5ldyBCaWdOdW1iZXIoMC41KTtcclxuICAgICAgICBpZiAobklzTmVnKSBuLnMgPSAxO1xyXG4gICAgICAgIG5Jc09kZCA9IGlzT2RkKG4pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGkgPSBNYXRoLmFicygrdmFsdWVPZihuKSk7XHJcbiAgICAgICAgbklzT2RkID0gaSAlIDI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcblxyXG4gICAgICAvLyBQZXJmb3JtcyA1NCBsb29wIGl0ZXJhdGlvbnMgZm9yIG4gb2YgOTAwNzE5OTI1NDc0MDk5MS5cclxuICAgICAgZm9yICg7IDspIHtcclxuXHJcbiAgICAgICAgaWYgKG5Jc09kZCkge1xyXG4gICAgICAgICAgeSA9IHkudGltZXMoeCk7XHJcbiAgICAgICAgICBpZiAoIXkuYykgYnJlYWs7XHJcblxyXG4gICAgICAgICAgaWYgKGspIHtcclxuICAgICAgICAgICAgaWYgKHkuYy5sZW5ndGggPiBrKSB5LmMubGVuZ3RoID0gaztcclxuICAgICAgICAgIH0gZWxzZSBpZiAoaXNNb2RFeHApIHtcclxuICAgICAgICAgICAgeSA9IHkubW9kKG0pOyAgICAvL3kgPSB5Lm1pbnVzKGRpdih5LCBtLCAwLCBNT0RVTE9fTU9ERSkudGltZXMobSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGkpIHtcclxuICAgICAgICAgIGkgPSBtYXRoZmxvb3IoaSAvIDIpO1xyXG4gICAgICAgICAgaWYgKGkgPT09IDApIGJyZWFrO1xyXG4gICAgICAgICAgbklzT2RkID0gaSAlIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG4gPSBuLnRpbWVzKGhhbGYpO1xyXG4gICAgICAgICAgcm91bmQobiwgbi5lICsgMSwgMSk7XHJcblxyXG4gICAgICAgICAgaWYgKG4uZSA+IDE0KSB7XHJcbiAgICAgICAgICAgIG5Jc09kZCA9IGlzT2RkKG4pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaSA9ICt2YWx1ZU9mKG4pO1xyXG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkgYnJlYWs7XHJcbiAgICAgICAgICAgIG5Jc09kZCA9IGkgJSAyO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgeCA9IHgudGltZXMoeCk7XHJcblxyXG4gICAgICAgIGlmIChrKSB7XHJcbiAgICAgICAgICBpZiAoeC5jICYmIHguYy5sZW5ndGggPiBrKSB4LmMubGVuZ3RoID0gaztcclxuICAgICAgICB9IGVsc2UgaWYgKGlzTW9kRXhwKSB7XHJcbiAgICAgICAgICB4ID0geC5tb2QobSk7ICAgIC8veCA9IHgubWludXMoZGl2KHgsIG0sIDAsIE1PRFVMT19NT0RFKS50aW1lcyhtKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoaXNNb2RFeHApIHJldHVybiB5O1xyXG4gICAgICBpZiAobklzTmVnKSB5ID0gT05FLmRpdih5KTtcclxuXHJcbiAgICAgIHJldHVybiBtID8geS5tb2QobSkgOiBrID8gcm91bmQoeSwgUE9XX1BSRUNJU0lPTiwgUk9VTkRJTkdfTU9ERSwgbW9yZSkgOiB5O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHJvdW5kZWQgdG8gYW4gaW50ZWdlclxyXG4gICAgICogdXNpbmcgcm91bmRpbmcgbW9kZSBybSwgb3IgUk9VTkRJTkdfTU9ERSBpZiBybSBpcyBvbWl0dGVkLlxyXG4gICAgICpcclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3JtfSdcclxuICAgICAqL1xyXG4gICAgUC5pbnRlZ2VyVmFsdWUgPSBmdW5jdGlvbiAocm0pIHtcclxuICAgICAgdmFyIG4gPSBuZXcgQmlnTnVtYmVyKHRoaXMpO1xyXG4gICAgICBpZiAocm0gPT0gbnVsbCkgcm0gPSBST1VORElOR19NT0RFO1xyXG4gICAgICBlbHNlIGludENoZWNrKHJtLCAwLCA4KTtcclxuICAgICAgcmV0dXJuIHJvdW5kKG4sIG4uZSArIDEsIHJtKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZXF1YWwgdG8gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNFcXVhbFRvID0gUC5lcSA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpID09PSAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBhIGZpbml0ZSBudW1iZXIsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNGaW5pdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiAhIXRoaXMuYztcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgKiBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzR3JlYXRlclRoYW4gPSBQLmd0ID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSkgPiAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHZhbHVlIG9mXHJcbiAgICAgKiBCaWdOdW1iZXIoeSwgYiksIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNHcmVhdGVyVGhhbk9yRXF1YWxUbyA9IFAuZ3RlID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIChiID0gY29tcGFyZSh0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpKSkgPT09IDEgfHwgYiA9PT0gMDtcclxuXHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGFuIGludGVnZXIsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNJbnRlZ2VyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gISF0aGlzLmMgJiYgYml0Rmxvb3IodGhpcy5lIC8gTE9HX0JBU0UpID4gdGhpcy5jLmxlbmd0aCAtIDI7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICogb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc0xlc3NUaGFuID0gUC5sdCA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpIDwgMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzTGVzc1RoYW5PckVxdWFsVG8gPSBQLmx0ZSA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiAoYiA9IGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSkpID09PSAtMSB8fCBiID09PSAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBOYU4sIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNOYU4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiAhdGhpcy5zO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBuZWdhdGl2ZSwgb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc05lZ2F0aXZlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zIDwgMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgcG9zaXRpdmUsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNQb3NpdGl2ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucyA+IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIDAgb3IgLTAsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNaZXJvID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gISF0aGlzLmMgJiYgdGhpcy5jWzBdID09IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gLSAwID0gblxyXG4gICAgICogIG4gLSBOID0gTlxyXG4gICAgICogIG4gLSBJID0gLUlcclxuICAgICAqICAwIC0gbiA9IC1uXHJcbiAgICAgKiAgMCAtIDAgPSAwXHJcbiAgICAgKiAgMCAtIE4gPSBOXHJcbiAgICAgKiAgMCAtIEkgPSAtSVxyXG4gICAgICogIE4gLSBuID0gTlxyXG4gICAgICogIE4gLSAwID0gTlxyXG4gICAgICogIE4gLSBOID0gTlxyXG4gICAgICogIE4gLSBJID0gTlxyXG4gICAgICogIEkgLSBuID0gSVxyXG4gICAgICogIEkgLSAwID0gSVxyXG4gICAgICogIEkgLSBOID0gTlxyXG4gICAgICogIEkgLSBJID0gTlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG1pbnVzIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLlxyXG4gICAgICovXHJcbiAgICBQLm1pbnVzID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgdmFyIGksIGosIHQsIHhMVHksXHJcbiAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgYSA9IHgucztcclxuXHJcbiAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKHksIGIpO1xyXG4gICAgICBiID0geS5zO1xyXG5cclxuICAgICAgLy8gRWl0aGVyIE5hTj9cclxuICAgICAgaWYgKCFhIHx8ICFiKSByZXR1cm4gbmV3IEJpZ051bWJlcihOYU4pO1xyXG5cclxuICAgICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgICBpZiAoYSAhPSBiKSB7XHJcbiAgICAgICAgeS5zID0gLWI7XHJcbiAgICAgICAgcmV0dXJuIHgucGx1cyh5KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHhlID0geC5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeWUgPSB5LmUgLyBMT0dfQkFTRSxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICB5YyA9IHkuYztcclxuXHJcbiAgICAgIGlmICgheGUgfHwgIXllKSB7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciBJbmZpbml0eT9cclxuICAgICAgICBpZiAoIXhjIHx8ICF5YykgcmV0dXJuIHhjID8gKHkucyA9IC1iLCB5KSA6IG5ldyBCaWdOdW1iZXIoeWMgPyB4IDogTmFOKTtcclxuXHJcbiAgICAgICAgLy8gRWl0aGVyIHplcm8/XHJcbiAgICAgICAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHtcclxuXHJcbiAgICAgICAgICAvLyBSZXR1cm4geSBpZiB5IGlzIG5vbi16ZXJvLCB4IGlmIHggaXMgbm9uLXplcm8sIG9yIHplcm8gaWYgYm90aCBhcmUgemVyby5cclxuICAgICAgICAgIHJldHVybiB5Y1swXSA/ICh5LnMgPSAtYiwgeSkgOiBuZXcgQmlnTnVtYmVyKHhjWzBdID8geCA6XHJcblxyXG4gICAgICAgICAgIC8vIElFRUUgNzU0ICgyMDA4KSA2LjM6IG4gLSBuID0gLTAgd2hlbiByb3VuZGluZyB0byAtSW5maW5pdHlcclxuICAgICAgICAgICBST1VORElOR19NT0RFID09IDMgPyAtMCA6IDApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgeGUgPSBiaXRGbG9vcih4ZSk7XHJcbiAgICAgIHllID0gYml0Rmxvb3IoeWUpO1xyXG4gICAgICB4YyA9IHhjLnNsaWNlKCk7XHJcblxyXG4gICAgICAvLyBEZXRlcm1pbmUgd2hpY2ggaXMgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICAgIGlmIChhID0geGUgLSB5ZSkge1xyXG5cclxuICAgICAgICBpZiAoeExUeSA9IGEgPCAwKSB7XHJcbiAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICB0ID0geGM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHllID0geGU7XHJcbiAgICAgICAgICB0ID0geWM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0LnJldmVyc2UoKTtcclxuXHJcbiAgICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICAgICAgZm9yIChiID0gYTsgYi0tOyB0LnB1c2goMCkpO1xyXG4gICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBFeHBvbmVudHMgZXF1YWwuIENoZWNrIGRpZ2l0IGJ5IGRpZ2l0LlxyXG4gICAgICAgIGogPSAoeExUeSA9IChhID0geGMubGVuZ3RoKSA8IChiID0geWMubGVuZ3RoKSkgPyBhIDogYjtcclxuXHJcbiAgICAgICAgZm9yIChhID0gYiA9IDA7IGIgPCBqOyBiKyspIHtcclxuXHJcbiAgICAgICAgICBpZiAoeGNbYl0gIT0geWNbYl0pIHtcclxuICAgICAgICAgICAgeExUeSA9IHhjW2JdIDwgeWNbYl07XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8geCA8IHk/IFBvaW50IHhjIHRvIHRoZSBhcnJheSBvZiB0aGUgYmlnZ2VyIG51bWJlci5cclxuICAgICAgaWYgKHhMVHkpIHQgPSB4YywgeGMgPSB5YywgeWMgPSB0LCB5LnMgPSAteS5zO1xyXG5cclxuICAgICAgYiA9IChqID0geWMubGVuZ3RoKSAtIChpID0geGMubGVuZ3RoKTtcclxuXHJcbiAgICAgIC8vIEFwcGVuZCB6ZXJvcyB0byB4YyBpZiBzaG9ydGVyLlxyXG4gICAgICAvLyBObyBuZWVkIHRvIGFkZCB6ZXJvcyB0byB5YyBpZiBzaG9ydGVyIGFzIHN1YnRyYWN0IG9ubHkgbmVlZHMgdG8gc3RhcnQgYXQgeWMubGVuZ3RoLlxyXG4gICAgICBpZiAoYiA+IDApIGZvciAoOyBiLS07IHhjW2krK10gPSAwKTtcclxuICAgICAgYiA9IEJBU0UgLSAxO1xyXG5cclxuICAgICAgLy8gU3VidHJhY3QgeWMgZnJvbSB4Yy5cclxuICAgICAgZm9yICg7IGogPiBhOykge1xyXG5cclxuICAgICAgICBpZiAoeGNbLS1qXSA8IHljW2pdKSB7XHJcbiAgICAgICAgICBmb3IgKGkgPSBqOyBpICYmICF4Y1stLWldOyB4Y1tpXSA9IGIpO1xyXG4gICAgICAgICAgLS14Y1tpXTtcclxuICAgICAgICAgIHhjW2pdICs9IEJBU0U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB4Y1tqXSAtPSB5Y1tqXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcgemVyb3MgYW5kIGFkanVzdCBleHBvbmVudCBhY2NvcmRpbmdseS5cclxuICAgICAgZm9yICg7IHhjWzBdID09IDA7IHhjLnNwbGljZSgwLCAxKSwgLS15ZSk7XHJcblxyXG4gICAgICAvLyBaZXJvP1xyXG4gICAgICBpZiAoIXhjWzBdKSB7XHJcblxyXG4gICAgICAgIC8vIEZvbGxvd2luZyBJRUVFIDc1NCAoMjAwOCkgNi4zLFxyXG4gICAgICAgIC8vIG4gLSBuID0gKzAgIGJ1dCAgbiAtIG4gPSAtMCAgd2hlbiByb3VuZGluZyB0b3dhcmRzIC1JbmZpbml0eS5cclxuICAgICAgICB5LnMgPSBST1VORElOR19NT0RFID09IDMgPyAtMSA6IDE7XHJcbiAgICAgICAgeS5jID0gW3kuZSA9IDBdO1xyXG4gICAgICAgIHJldHVybiB5O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBObyBuZWVkIHRvIGNoZWNrIGZvciBJbmZpbml0eSBhcyAreCAtICt5ICE9IEluZmluaXR5ICYmIC14IC0gLXkgIT0gSW5maW5pdHlcclxuICAgICAgLy8gZm9yIGZpbml0ZSB4IGFuZCB5LlxyXG4gICAgICByZXR1cm4gbm9ybWFsaXNlKHksIHhjLCB5ZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogICBuICUgMCA9ICBOXHJcbiAgICAgKiAgIG4gJSBOID0gIE5cclxuICAgICAqICAgbiAlIEkgPSAgblxyXG4gICAgICogICAwICUgbiA9ICAwXHJcbiAgICAgKiAgLTAgJSBuID0gLTBcclxuICAgICAqICAgMCAlIDAgPSAgTlxyXG4gICAgICogICAwICUgTiA9ICBOXHJcbiAgICAgKiAgIDAgJSBJID0gIDBcclxuICAgICAqICAgTiAlIG4gPSAgTlxyXG4gICAgICogICBOICUgMCA9ICBOXHJcbiAgICAgKiAgIE4gJSBOID0gIE5cclxuICAgICAqICAgTiAlIEkgPSAgTlxyXG4gICAgICogICBJICUgbiA9ICBOXHJcbiAgICAgKiAgIEkgJSAwID0gIE5cclxuICAgICAqICAgSSAlIE4gPSAgTlxyXG4gICAgICogICBJICUgSSA9ICBOXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbW9kdWxvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLiBUaGUgcmVzdWx0IGRlcGVuZHMgb24gdGhlIHZhbHVlIG9mIE1PRFVMT19NT0RFLlxyXG4gICAgICovXHJcbiAgICBQLm1vZHVsbyA9IFAubW9kID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgdmFyIHEsIHMsXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcih5LCBiKTtcclxuXHJcbiAgICAgIC8vIFJldHVybiBOYU4gaWYgeCBpcyBJbmZpbml0eSBvciBOYU4sIG9yIHkgaXMgTmFOIG9yIHplcm8uXHJcbiAgICAgIGlmICgheC5jIHx8ICF5LnMgfHwgeS5jICYmICF5LmNbMF0pIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcihOYU4pO1xyXG5cclxuICAgICAgLy8gUmV0dXJuIHggaWYgeSBpcyBJbmZpbml0eSBvciB4IGlzIHplcm8uXHJcbiAgICAgIH0gZWxzZSBpZiAoIXkuYyB8fCB4LmMgJiYgIXguY1swXSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKHgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoTU9EVUxPX01PREUgPT0gOSkge1xyXG5cclxuICAgICAgICAvLyBFdWNsaWRpYW4gZGl2aXNpb246IHEgPSBzaWduKHkpICogZmxvb3IoeCAvIGFicyh5KSlcclxuICAgICAgICAvLyByID0geCAtIHF5ICAgIHdoZXJlICAwIDw9IHIgPCBhYnMoeSlcclxuICAgICAgICBzID0geS5zO1xyXG4gICAgICAgIHkucyA9IDE7XHJcbiAgICAgICAgcSA9IGRpdih4LCB5LCAwLCAzKTtcclxuICAgICAgICB5LnMgPSBzO1xyXG4gICAgICAgIHEucyAqPSBzO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHEgPSBkaXYoeCwgeSwgMCwgTU9EVUxPX01PREUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB5ID0geC5taW51cyhxLnRpbWVzKHkpKTtcclxuXHJcbiAgICAgIC8vIFRvIG1hdGNoIEphdmFTY3JpcHQgJSwgZW5zdXJlIHNpZ24gb2YgemVybyBpcyBzaWduIG9mIGRpdmlkZW5kLlxyXG4gICAgICBpZiAoIXkuY1swXSAmJiBNT0RVTE9fTU9ERSA9PSAxKSB5LnMgPSB4LnM7XHJcblxyXG4gICAgICByZXR1cm4geTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiAgbiAqIDAgPSAwXHJcbiAgICAgKiAgbiAqIE4gPSBOXHJcbiAgICAgKiAgbiAqIEkgPSBJXHJcbiAgICAgKiAgMCAqIG4gPSAwXHJcbiAgICAgKiAgMCAqIDAgPSAwXHJcbiAgICAgKiAgMCAqIE4gPSBOXHJcbiAgICAgKiAgMCAqIEkgPSBOXHJcbiAgICAgKiAgTiAqIG4gPSBOXHJcbiAgICAgKiAgTiAqIDAgPSBOXHJcbiAgICAgKiAgTiAqIE4gPSBOXHJcbiAgICAgKiAgTiAqIEkgPSBOXHJcbiAgICAgKiAgSSAqIG4gPSBJXHJcbiAgICAgKiAgSSAqIDAgPSBOXHJcbiAgICAgKiAgSSAqIE4gPSBOXHJcbiAgICAgKiAgSSAqIEkgPSBJXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbXVsdGlwbGllZCBieSB0aGUgdmFsdWVcclxuICAgICAqIG9mIEJpZ051bWJlcih5LCBiKS5cclxuICAgICAqL1xyXG4gICAgUC5tdWx0aXBsaWVkQnkgPSBQLnRpbWVzID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgdmFyIGMsIGUsIGksIGosIGssIG0sIHhjTCwgeGxvLCB4aGksIHljTCwgeWxvLCB5aGksIHpjLFxyXG4gICAgICAgIGJhc2UsIHNxcnRCYXNlLFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgIHljID0gKHkgPSBuZXcgQmlnTnVtYmVyKHksIGIpKS5jO1xyXG5cclxuICAgICAgLy8gRWl0aGVyIE5hTiwgwrFJbmZpbml0eSBvciDCsTA/XHJcbiAgICAgIGlmICgheGMgfHwgIXljIHx8ICF4Y1swXSB8fCAheWNbMF0pIHtcclxuXHJcbiAgICAgICAgLy8gUmV0dXJuIE5hTiBpZiBlaXRoZXIgaXMgTmFOLCBvciBvbmUgaXMgMCBhbmQgdGhlIG90aGVyIGlzIEluZmluaXR5LlxyXG4gICAgICAgIGlmICgheC5zIHx8ICF5LnMgfHwgeGMgJiYgIXhjWzBdICYmICF5YyB8fCB5YyAmJiAheWNbMF0gJiYgIXhjKSB7XHJcbiAgICAgICAgICB5LmMgPSB5LmUgPSB5LnMgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB5LnMgKj0geC5zO1xyXG5cclxuICAgICAgICAgIC8vIFJldHVybiDCsUluZmluaXR5IGlmIGVpdGhlciBpcyDCsUluZmluaXR5LlxyXG4gICAgICAgICAgaWYgKCF4YyB8fCAheWMpIHtcclxuICAgICAgICAgICAgeS5jID0geS5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAvLyBSZXR1cm4gwrEwIGlmIGVpdGhlciBpcyDCsTAuXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB5LmMgPSBbMF07XHJcbiAgICAgICAgICAgIHkuZSA9IDA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZSA9IGJpdEZsb29yKHguZSAvIExPR19CQVNFKSArIGJpdEZsb29yKHkuZSAvIExPR19CQVNFKTtcclxuICAgICAgeS5zICo9IHgucztcclxuICAgICAgeGNMID0geGMubGVuZ3RoO1xyXG4gICAgICB5Y0wgPSB5Yy5sZW5ndGg7XHJcblxyXG4gICAgICAvLyBFbnN1cmUgeGMgcG9pbnRzIHRvIGxvbmdlciBhcnJheSBhbmQgeGNMIHRvIGl0cyBsZW5ndGguXHJcbiAgICAgIGlmICh4Y0wgPCB5Y0wpIHpjID0geGMsIHhjID0geWMsIHljID0gemMsIGkgPSB4Y0wsIHhjTCA9IHljTCwgeWNMID0gaTtcclxuXHJcbiAgICAgIC8vIEluaXRpYWxpc2UgdGhlIHJlc3VsdCBhcnJheSB3aXRoIHplcm9zLlxyXG4gICAgICBmb3IgKGkgPSB4Y0wgKyB5Y0wsIHpjID0gW107IGktLTsgemMucHVzaCgwKSk7XHJcblxyXG4gICAgICBiYXNlID0gQkFTRTtcclxuICAgICAgc3FydEJhc2UgPSBTUVJUX0JBU0U7XHJcblxyXG4gICAgICBmb3IgKGkgPSB5Y0w7IC0taSA+PSAwOykge1xyXG4gICAgICAgIGMgPSAwO1xyXG4gICAgICAgIHlsbyA9IHljW2ldICUgc3FydEJhc2U7XHJcbiAgICAgICAgeWhpID0geWNbaV0gLyBzcXJ0QmFzZSB8IDA7XHJcblxyXG4gICAgICAgIGZvciAoayA9IHhjTCwgaiA9IGkgKyBrOyBqID4gaTspIHtcclxuICAgICAgICAgIHhsbyA9IHhjWy0ta10gJSBzcXJ0QmFzZTtcclxuICAgICAgICAgIHhoaSA9IHhjW2tdIC8gc3FydEJhc2UgfCAwO1xyXG4gICAgICAgICAgbSA9IHloaSAqIHhsbyArIHhoaSAqIHlsbztcclxuICAgICAgICAgIHhsbyA9IHlsbyAqIHhsbyArICgobSAlIHNxcnRCYXNlKSAqIHNxcnRCYXNlKSArIHpjW2pdICsgYztcclxuICAgICAgICAgIGMgPSAoeGxvIC8gYmFzZSB8IDApICsgKG0gLyBzcXJ0QmFzZSB8IDApICsgeWhpICogeGhpO1xyXG4gICAgICAgICAgemNbai0tXSA9IHhsbyAlIGJhc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB6Y1tqXSA9IGM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjKSB7XHJcbiAgICAgICAgKytlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHpjLnNwbGljZSgwLCAxKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG5vcm1hbGlzZSh5LCB6YywgZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbmVnYXRlZCxcclxuICAgICAqIGkuZS4gbXVsdGlwbGllZCBieSAtMS5cclxuICAgICAqL1xyXG4gICAgUC5uZWdhdGVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgeCA9IG5ldyBCaWdOdW1iZXIodGhpcyk7XHJcbiAgICAgIHgucyA9IC14LnMgfHwgbnVsbDtcclxuICAgICAgcmV0dXJuIHg7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gKyAwID0gblxyXG4gICAgICogIG4gKyBOID0gTlxyXG4gICAgICogIG4gKyBJID0gSVxyXG4gICAgICogIDAgKyBuID0gblxyXG4gICAgICogIDAgKyAwID0gMFxyXG4gICAgICogIDAgKyBOID0gTlxyXG4gICAgICogIDAgKyBJID0gSVxyXG4gICAgICogIE4gKyBuID0gTlxyXG4gICAgICogIE4gKyAwID0gTlxyXG4gICAgICogIE4gKyBOID0gTlxyXG4gICAgICogIE4gKyBJID0gTlxyXG4gICAgICogIEkgKyBuID0gSVxyXG4gICAgICogIEkgKyAwID0gSVxyXG4gICAgICogIEkgKyBOID0gTlxyXG4gICAgICogIEkgKyBJID0gSVxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHBsdXMgdGhlIHZhbHVlIG9mXHJcbiAgICAgKiBCaWdOdW1iZXIoeSwgYikuXHJcbiAgICAgKi9cclxuICAgIFAucGx1cyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciB0LFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIGEgPSB4LnM7XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcih5LCBiKTtcclxuICAgICAgYiA9IHkucztcclxuXHJcbiAgICAgIC8vIEVpdGhlciBOYU4/XHJcbiAgICAgIGlmICghYSB8fCAhYikgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgICAgIGlmIChhICE9IGIpIHtcclxuICAgICAgICB5LnMgPSAtYjtcclxuICAgICAgICByZXR1cm4geC5taW51cyh5KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHhlID0geC5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeWUgPSB5LmUgLyBMT0dfQkFTRSxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICB5YyA9IHkuYztcclxuXHJcbiAgICAgIGlmICgheGUgfHwgIXllKSB7XHJcblxyXG4gICAgICAgIC8vIFJldHVybiDCsUluZmluaXR5IGlmIGVpdGhlciDCsUluZmluaXR5LlxyXG4gICAgICAgIGlmICgheGMgfHwgIXljKSByZXR1cm4gbmV3IEJpZ051bWJlcihhIC8gMCk7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgIC8vIFJldHVybiB5IGlmIHkgaXMgbm9uLXplcm8sIHggaWYgeCBpcyBub24temVybywgb3IgemVybyBpZiBib3RoIGFyZSB6ZXJvLlxyXG4gICAgICAgIGlmICgheGNbMF0gfHwgIXljWzBdKSByZXR1cm4geWNbMF0gPyB5IDogbmV3IEJpZ051bWJlcih4Y1swXSA/IHggOiBhICogMCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHhlID0gYml0Rmxvb3IoeGUpO1xyXG4gICAgICB5ZSA9IGJpdEZsb29yKHllKTtcclxuICAgICAgeGMgPSB4Yy5zbGljZSgpO1xyXG5cclxuICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuIEZhc3RlciB0byB1c2UgcmV2ZXJzZSB0aGVuIGRvIHVuc2hpZnRzLlxyXG4gICAgICBpZiAoYSA9IHhlIC0geWUpIHtcclxuICAgICAgICBpZiAoYSA+IDApIHtcclxuICAgICAgICAgIHllID0geGU7XHJcbiAgICAgICAgICB0ID0geWM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGEgPSAtYTtcclxuICAgICAgICAgIHQgPSB4YztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICAgIGZvciAoOyBhLS07IHQucHVzaCgwKSk7XHJcbiAgICAgICAgdC5yZXZlcnNlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGEgPSB4Yy5sZW5ndGg7XHJcbiAgICAgIGIgPSB5Yy5sZW5ndGg7XHJcblxyXG4gICAgICAvLyBQb2ludCB4YyB0byB0aGUgbG9uZ2VyIGFycmF5LCBhbmQgYiB0byB0aGUgc2hvcnRlciBsZW5ndGguXHJcbiAgICAgIGlmIChhIC0gYiA8IDApIHQgPSB5YywgeWMgPSB4YywgeGMgPSB0LCBiID0gYTtcclxuXHJcbiAgICAgIC8vIE9ubHkgc3RhcnQgYWRkaW5nIGF0IHljLmxlbmd0aCAtIDEgYXMgdGhlIGZ1cnRoZXIgZGlnaXRzIG9mIHhjIGNhbiBiZSBpZ25vcmVkLlxyXG4gICAgICBmb3IgKGEgPSAwOyBiOykge1xyXG4gICAgICAgIGEgPSAoeGNbLS1iXSA9IHhjW2JdICsgeWNbYl0gKyBhKSAvIEJBU0UgfCAwO1xyXG4gICAgICAgIHhjW2JdID0gQkFTRSA9PT0geGNbYl0gPyAwIDogeGNbYl0gJSBCQVNFO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoYSkge1xyXG4gICAgICAgIHhjID0gW2FdLmNvbmNhdCh4Yyk7XHJcbiAgICAgICAgKyt5ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgemVybywgYXMgK3ggKyAreSAhPSAwICYmIC14ICsgLXkgIT0gMFxyXG4gICAgICAvLyB5ZSA9IE1BWF9FWFAgKyAxIHBvc3NpYmxlXHJcbiAgICAgIHJldHVybiBub3JtYWxpc2UoeSwgeGMsIHllKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBJZiBzZCBpcyB1bmRlZmluZWQgb3IgbnVsbCBvciB0cnVlIG9yIGZhbHNlLCByZXR1cm4gdGhlIG51bWJlciBvZiBzaWduaWZpY2FudCBkaWdpdHMgb2ZcclxuICAgICAqIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciwgb3IgbnVsbCBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgwrFJbmZpbml0eSBvciBOYU4uXHJcbiAgICAgKiBJZiBzZCBpcyB0cnVlIGluY2x1ZGUgaW50ZWdlci1wYXJ0IHRyYWlsaW5nIHplcm9zIGluIHRoZSBjb3VudC5cclxuICAgICAqXHJcbiAgICAgKiBPdGhlcndpc2UsIGlmIHNkIGlzIGEgbnVtYmVyLCByZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzXHJcbiAgICAgKiBCaWdOdW1iZXIgcm91bmRlZCB0byBhIG1heGltdW0gb2Ygc2Qgc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yXHJcbiAgICAgKiBST1VORElOR19NT0RFIGlmIHJtIGlzIG9taXR0ZWQuXHJcbiAgICAgKlxyXG4gICAgICogc2Qge251bWJlcnxib29sZWFufSBudW1iZXI6IHNpZ25pZmljYW50IGRpZ2l0czogaW50ZWdlciwgMSB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICBib29sZWFuOiB3aGV0aGVyIHRvIGNvdW50IGludGVnZXItcGFydCB0cmFpbGluZyB6ZXJvczogdHJ1ZSBvciBmYWxzZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3NkfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC5wcmVjaXNpb24gPSBQLnNkID0gZnVuY3Rpb24gKHNkLCBybSkge1xyXG4gICAgICB2YXIgYywgbiwgdixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIGlmIChzZCAhPSBudWxsICYmIHNkICE9PSAhIXNkKSB7XHJcbiAgICAgICAgaW50Q2hlY2soc2QsIDEsIE1BWCk7XHJcbiAgICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgICBlbHNlIGludENoZWNrKHJtLCAwLCA4KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJvdW5kKG5ldyBCaWdOdW1iZXIoeCksIHNkLCBybSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghKGMgPSB4LmMpKSByZXR1cm4gbnVsbDtcclxuICAgICAgdiA9IGMubGVuZ3RoIC0gMTtcclxuICAgICAgbiA9IHYgKiBMT0dfQkFTRSArIDE7XHJcblxyXG4gICAgICBpZiAodiA9IGNbdl0pIHtcclxuXHJcbiAgICAgICAgLy8gU3VidHJhY3QgdGhlIG51bWJlciBvZiB0cmFpbGluZyB6ZXJvcyBvZiB0aGUgbGFzdCBlbGVtZW50LlxyXG4gICAgICAgIGZvciAoOyB2ICUgMTAgPT0gMDsgdiAvPSAxMCwgbi0tKTtcclxuXHJcbiAgICAgICAgLy8gQWRkIHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIHRoZSBmaXJzdCBlbGVtZW50LlxyXG4gICAgICAgIGZvciAodiA9IGNbMF07IHYgPj0gMTA7IHYgLz0gMTAsIG4rKyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzZCAmJiB4LmUgKyAxID4gbikgbiA9IHguZSArIDE7XHJcblxyXG4gICAgICByZXR1cm4gbjtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBzaGlmdGVkIGJ5IGsgcGxhY2VzXHJcbiAgICAgKiAocG93ZXJzIG9mIDEwKS4gU2hpZnQgdG8gdGhlIHJpZ2h0IGlmIG4gPiAwLCBhbmQgdG8gdGhlIGxlZnQgaWYgbiA8IDAuXHJcbiAgICAgKlxyXG4gICAgICogayB7bnVtYmVyfSBJbnRlZ2VyLCAtTUFYX1NBRkVfSU5URUdFUiB0byBNQVhfU0FGRV9JTlRFR0VSIGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2t9J1xyXG4gICAgICovXHJcbiAgICBQLnNoaWZ0ZWRCeSA9IGZ1bmN0aW9uIChrKSB7XHJcbiAgICAgIGludENoZWNrKGssIC1NQVhfU0FGRV9JTlRFR0VSLCBNQVhfU0FGRV9JTlRFR0VSKTtcclxuICAgICAgcmV0dXJuIHRoaXMudGltZXMoJzFlJyArIGspO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBzcXJ0KC1uKSA9ICBOXHJcbiAgICAgKiAgc3FydChOKSA9ICBOXHJcbiAgICAgKiAgc3FydCgtSSkgPSAgTlxyXG4gICAgICogIHNxcnQoSSkgPSAgSVxyXG4gICAgICogIHNxcnQoMCkgPSAgMFxyXG4gICAgICogIHNxcnQoLTApID0gLTBcclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBzcXVhcmUgcm9vdCBvZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIsXHJcbiAgICAgKiByb3VuZGVkIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmQgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqL1xyXG4gICAgUC5zcXVhcmVSb290ID0gUC5zcXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgbSwgbiwgciwgcmVwLCB0LFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIGMgPSB4LmMsXHJcbiAgICAgICAgcyA9IHgucyxcclxuICAgICAgICBlID0geC5lLFxyXG4gICAgICAgIGRwID0gREVDSU1BTF9QTEFDRVMgKyA0LFxyXG4gICAgICAgIGhhbGYgPSBuZXcgQmlnTnVtYmVyKCcwLjUnKTtcclxuXHJcbiAgICAgIC8vIE5lZ2F0aXZlL05hTi9JbmZpbml0eS96ZXJvP1xyXG4gICAgICBpZiAocyAhPT0gMSB8fCAhYyB8fCAhY1swXSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKCFzIHx8IHMgPCAwICYmICghYyB8fCBjWzBdKSA/IE5hTiA6IGMgPyB4IDogMSAvIDApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJbml0aWFsIGVzdGltYXRlLlxyXG4gICAgICBzID0gTWF0aC5zcXJ0KCt2YWx1ZU9mKHgpKTtcclxuXHJcbiAgICAgIC8vIE1hdGguc3FydCB1bmRlcmZsb3cvb3ZlcmZsb3c/XHJcbiAgICAgIC8vIFBhc3MgeCB0byBNYXRoLnNxcnQgYXMgaW50ZWdlciwgdGhlbiBhZGp1c3QgdGhlIGV4cG9uZW50IG9mIHRoZSByZXN1bHQuXHJcbiAgICAgIGlmIChzID09IDAgfHwgcyA9PSAxIC8gMCkge1xyXG4gICAgICAgIG4gPSBjb2VmZlRvU3RyaW5nKGMpO1xyXG4gICAgICAgIGlmICgobi5sZW5ndGggKyBlKSAlIDIgPT0gMCkgbiArPSAnMCc7XHJcbiAgICAgICAgcyA9IE1hdGguc3FydCgrbik7XHJcbiAgICAgICAgZSA9IGJpdEZsb29yKChlICsgMSkgLyAyKSAtIChlIDwgMCB8fCBlICUgMik7XHJcblxyXG4gICAgICAgIGlmIChzID09IDEgLyAwKSB7XHJcbiAgICAgICAgICBuID0gJzFlJyArIGU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG4gPSBzLnRvRXhwb25lbnRpYWwoKTtcclxuICAgICAgICAgIG4gPSBuLnNsaWNlKDAsIG4uaW5kZXhPZignZScpICsgMSkgKyBlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgciA9IG5ldyBCaWdOdW1iZXIobik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgciA9IG5ldyBCaWdOdW1iZXIocyArICcnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ2hlY2sgZm9yIHplcm8uXHJcbiAgICAgIC8vIHIgY291bGQgYmUgemVybyBpZiBNSU5fRVhQIGlzIGNoYW5nZWQgYWZ0ZXIgdGhlIHRoaXMgdmFsdWUgd2FzIGNyZWF0ZWQuXHJcbiAgICAgIC8vIFRoaXMgd291bGQgY2F1c2UgYSBkaXZpc2lvbiBieSB6ZXJvICh4L3QpIGFuZCBoZW5jZSBJbmZpbml0eSBiZWxvdywgd2hpY2ggd291bGQgY2F1c2VcclxuICAgICAgLy8gY29lZmZUb1N0cmluZyB0byB0aHJvdy5cclxuICAgICAgaWYgKHIuY1swXSkge1xyXG4gICAgICAgIGUgPSByLmU7XHJcbiAgICAgICAgcyA9IGUgKyBkcDtcclxuICAgICAgICBpZiAocyA8IDMpIHMgPSAwO1xyXG5cclxuICAgICAgICAvLyBOZXd0b24tUmFwaHNvbiBpdGVyYXRpb24uXHJcbiAgICAgICAgZm9yICg7IDspIHtcclxuICAgICAgICAgIHQgPSByO1xyXG4gICAgICAgICAgciA9IGhhbGYudGltZXModC5wbHVzKGRpdih4LCB0LCBkcCwgMSkpKTtcclxuXHJcbiAgICAgICAgICBpZiAoY29lZmZUb1N0cmluZyh0LmMpLnNsaWNlKDAsIHMpID09PSAobiA9IGNvZWZmVG9TdHJpbmcoci5jKSkuc2xpY2UoMCwgcykpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBleHBvbmVudCBvZiByIG1heSBoZXJlIGJlIG9uZSBsZXNzIHRoYW4gdGhlIGZpbmFsIHJlc3VsdCBleHBvbmVudCxcclxuICAgICAgICAgICAgLy8gZS5nIDAuMDAwOTk5OSAoZS00KSAtLT4gMC4wMDEgKGUtMyksIHNvIGFkanVzdCBzIHNvIHRoZSByb3VuZGluZyBkaWdpdHNcclxuICAgICAgICAgICAgLy8gYXJlIGluZGV4ZWQgY29ycmVjdGx5LlxyXG4gICAgICAgICAgICBpZiAoci5lIDwgZSkgLS1zO1xyXG4gICAgICAgICAgICBuID0gbi5zbGljZShzIC0gMywgcyArIDEpO1xyXG5cclxuICAgICAgICAgICAgLy8gVGhlIDR0aCByb3VuZGluZyBkaWdpdCBtYXkgYmUgaW4gZXJyb3IgYnkgLTEgc28gaWYgdGhlIDQgcm91bmRpbmcgZGlnaXRzXHJcbiAgICAgICAgICAgIC8vIGFyZSA5OTk5IG9yIDQ5OTkgKGkuZS4gYXBwcm9hY2hpbmcgYSByb3VuZGluZyBib3VuZGFyeSkgY29udGludWUgdGhlXHJcbiAgICAgICAgICAgIC8vIGl0ZXJhdGlvbi5cclxuICAgICAgICAgICAgaWYgKG4gPT0gJzk5OTknIHx8ICFyZXAgJiYgbiA9PSAnNDk5OScpIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gT24gdGhlIGZpcnN0IGl0ZXJhdGlvbiBvbmx5LCBjaGVjayB0byBzZWUgaWYgcm91bmRpbmcgdXAgZ2l2ZXMgdGhlXHJcbiAgICAgICAgICAgICAgLy8gZXhhY3QgcmVzdWx0IGFzIHRoZSBuaW5lcyBtYXkgaW5maW5pdGVseSByZXBlYXQuXHJcbiAgICAgICAgICAgICAgaWYgKCFyZXApIHtcclxuICAgICAgICAgICAgICAgIHJvdW5kKHQsIHQuZSArIERFQ0lNQUxfUExBQ0VTICsgMiwgMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHQudGltZXModCkuZXEoeCkpIHtcclxuICAgICAgICAgICAgICAgICAgciA9IHQ7XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgZHAgKz0gNDtcclxuICAgICAgICAgICAgICBzICs9IDQ7XHJcbiAgICAgICAgICAgICAgcmVwID0gMTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gSWYgcm91bmRpbmcgZGlnaXRzIGFyZSBudWxsLCAwezAsNH0gb3IgNTB7MCwzfSwgY2hlY2sgZm9yIGV4YWN0XHJcbiAgICAgICAgICAgICAgLy8gcmVzdWx0LiBJZiBub3QsIHRoZW4gdGhlcmUgYXJlIGZ1cnRoZXIgZGlnaXRzIGFuZCBtIHdpbGwgYmUgdHJ1dGh5LlxyXG4gICAgICAgICAgICAgIGlmICghK24gfHwgIStuLnNsaWNlKDEpICYmIG4uY2hhckF0KDApID09ICc1Jykge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFRydW5jYXRlIHRvIHRoZSBmaXJzdCByb3VuZGluZyBkaWdpdC5cclxuICAgICAgICAgICAgICAgIHJvdW5kKHIsIHIuZSArIERFQ0lNQUxfUExBQ0VTICsgMiwgMSk7XHJcbiAgICAgICAgICAgICAgICBtID0gIXIudGltZXMocikuZXEoeCk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJvdW5kKHIsIHIuZSArIERFQ0lNQUxfUExBQ0VTICsgMSwgUk9VTkRJTkdfTU9ERSwgbSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaW4gZXhwb25lbnRpYWwgbm90YXRpb24gYW5kXHJcbiAgICAgKiByb3VuZGVkIHVzaW5nIFJPVU5ESU5HX01PREUgdG8gZHAgZml4ZWQgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlcy4gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7ZHB8cm19J1xyXG4gICAgICovXHJcbiAgICBQLnRvRXhwb25lbnRpYWwgPSBmdW5jdGlvbiAoZHAsIHJtKSB7XHJcbiAgICAgIGlmIChkcCAhPSBudWxsKSB7XHJcbiAgICAgICAgaW50Q2hlY2soZHAsIDAsIE1BWCk7XHJcbiAgICAgICAgZHArKztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZm9ybWF0KHRoaXMsIGRwLCBybSwgMSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24gcm91bmRpbmdcclxuICAgICAqIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yIFJPVU5ESU5HX01PREUgaWYgcm0gaXMgb21pdHRlZC5cclxuICAgICAqXHJcbiAgICAgKiBOb3RlOiBhcyB3aXRoIEphdmFTY3JpcHQncyBudW1iZXIgdHlwZSwgKC0wKS50b0ZpeGVkKDApIGlzICcwJyxcclxuICAgICAqIGJ1dCBlLmcuICgtMC4wMDAwMSkudG9GaXhlZCgwKSBpcyAnLTAnLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC50b0ZpeGVkID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gICAgICBpZiAoZHAgIT0gbnVsbCkge1xyXG4gICAgICAgIGludENoZWNrKGRwLCAwLCBNQVgpO1xyXG4gICAgICAgIGRwID0gZHAgKyB0aGlzLmUgKyAxO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmb3JtYXQodGhpcywgZHAsIHJtKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpbiBmaXhlZC1wb2ludCBub3RhdGlvbiByb3VuZGVkXHJcbiAgICAgKiB1c2luZyBybSBvciBST1VORElOR19NT0RFIHRvIGRwIGRlY2ltYWwgcGxhY2VzLCBhbmQgZm9ybWF0dGVkIGFjY29yZGluZyB0byB0aGUgcHJvcGVydGllc1xyXG4gICAgICogb2YgdGhlIGZvcm1hdCBvciBGT1JNQVQgb2JqZWN0IChzZWUgQmlnTnVtYmVyLnNldCkuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIGZvcm1hdHRpbmcgb2JqZWN0IG1heSBjb250YWluIHNvbWUgb3IgYWxsIG9mIHRoZSBwcm9wZXJ0aWVzIHNob3duIGJlbG93LlxyXG4gICAgICpcclxuICAgICAqIEZPUk1BVCA9IHtcclxuICAgICAqICAgcHJlZml4OiAnJyxcclxuICAgICAqICAgZ3JvdXBTaXplOiAzLFxyXG4gICAgICogICBzZWNvbmRhcnlHcm91cFNpemU6IDAsXHJcbiAgICAgKiAgIGdyb3VwU2VwYXJhdG9yOiAnLCcsXHJcbiAgICAgKiAgIGRlY2ltYWxTZXBhcmF0b3I6ICcuJyxcclxuICAgICAqICAgZnJhY3Rpb25Hcm91cFNpemU6IDAsXHJcbiAgICAgKiAgIGZyYWN0aW9uR3JvdXBTZXBhcmF0b3I6ICdcXHhBMCcsICAgICAgLy8gbm9uLWJyZWFraW5nIHNwYWNlXHJcbiAgICAgKiAgIHN1ZmZpeDogJydcclxuICAgICAqIH07XHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlcy4gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICogW2Zvcm1hdF0ge29iamVjdH0gRm9ybWF0dGluZyBvcHRpb25zLiBTZWUgRk9STUFUIHBiamVjdCBhYm92ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCBub3QgYW4gb2JqZWN0OiB7Zm9ybWF0fSdcclxuICAgICAqL1xyXG4gICAgUC50b0Zvcm1hdCA9IGZ1bmN0aW9uIChkcCwgcm0sIGZvcm1hdCkge1xyXG4gICAgICB2YXIgc3RyLFxyXG4gICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgaWYgKGZvcm1hdCA9PSBudWxsKSB7XHJcbiAgICAgICAgaWYgKGRwICE9IG51bGwgJiYgcm0gJiYgdHlwZW9mIHJtID09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICBmb3JtYXQgPSBybTtcclxuICAgICAgICAgIHJtID0gbnVsbDtcclxuICAgICAgICB9IGVsc2UgaWYgKGRwICYmIHR5cGVvZiBkcCA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgZm9ybWF0ID0gZHA7XHJcbiAgICAgICAgICBkcCA9IHJtID0gbnVsbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZm9ybWF0ID0gRk9STUFUO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZm9ybWF0ICE9ICdvYmplY3QnKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdBcmd1bWVudCBub3QgYW4gb2JqZWN0OiAnICsgZm9ybWF0KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc3RyID0geC50b0ZpeGVkKGRwLCBybSk7XHJcblxyXG4gICAgICBpZiAoeC5jKSB7XHJcbiAgICAgICAgdmFyIGksXHJcbiAgICAgICAgICBhcnIgPSBzdHIuc3BsaXQoJy4nKSxcclxuICAgICAgICAgIGcxID0gK2Zvcm1hdC5ncm91cFNpemUsXHJcbiAgICAgICAgICBnMiA9ICtmb3JtYXQuc2Vjb25kYXJ5R3JvdXBTaXplLFxyXG4gICAgICAgICAgZ3JvdXBTZXBhcmF0b3IgPSBmb3JtYXQuZ3JvdXBTZXBhcmF0b3IgfHwgJycsXHJcbiAgICAgICAgICBpbnRQYXJ0ID0gYXJyWzBdLFxyXG4gICAgICAgICAgZnJhY3Rpb25QYXJ0ID0gYXJyWzFdLFxyXG4gICAgICAgICAgaXNOZWcgPSB4LnMgPCAwLFxyXG4gICAgICAgICAgaW50RGlnaXRzID0gaXNOZWcgPyBpbnRQYXJ0LnNsaWNlKDEpIDogaW50UGFydCxcclxuICAgICAgICAgIGxlbiA9IGludERpZ2l0cy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmIChnMikgaSA9IGcxLCBnMSA9IGcyLCBnMiA9IGksIGxlbiAtPSBpO1xyXG5cclxuICAgICAgICBpZiAoZzEgPiAwICYmIGxlbiA+IDApIHtcclxuICAgICAgICAgIGkgPSBsZW4gJSBnMSB8fCBnMTtcclxuICAgICAgICAgIGludFBhcnQgPSBpbnREaWdpdHMuc3Vic3RyKDAsIGkpO1xyXG4gICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkgKz0gZzEpIGludFBhcnQgKz0gZ3JvdXBTZXBhcmF0b3IgKyBpbnREaWdpdHMuc3Vic3RyKGksIGcxKTtcclxuICAgICAgICAgIGlmIChnMiA+IDApIGludFBhcnQgKz0gZ3JvdXBTZXBhcmF0b3IgKyBpbnREaWdpdHMuc2xpY2UoaSk7XHJcbiAgICAgICAgICBpZiAoaXNOZWcpIGludFBhcnQgPSAnLScgKyBpbnRQYXJ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RyID0gZnJhY3Rpb25QYXJ0XHJcbiAgICAgICAgID8gaW50UGFydCArIChmb3JtYXQuZGVjaW1hbFNlcGFyYXRvciB8fCAnJykgKyAoKGcyID0gK2Zvcm1hdC5mcmFjdGlvbkdyb3VwU2l6ZSlcclxuICAgICAgICAgID8gZnJhY3Rpb25QYXJ0LnJlcGxhY2UobmV3IFJlZ0V4cCgnXFxcXGR7JyArIGcyICsgJ31cXFxcQicsICdnJyksXHJcbiAgICAgICAgICAgJyQmJyArIChmb3JtYXQuZnJhY3Rpb25Hcm91cFNlcGFyYXRvciB8fCAnJykpXHJcbiAgICAgICAgICA6IGZyYWN0aW9uUGFydClcclxuICAgICAgICAgOiBpbnRQYXJ0O1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKGZvcm1hdC5wcmVmaXggfHwgJycpICsgc3RyICsgKGZvcm1hdC5zdWZmaXggfHwgJycpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhbiBhcnJheSBvZiB0d28gQmlnTnVtYmVycyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGFzIGEgc2ltcGxlXHJcbiAgICAgKiBmcmFjdGlvbiB3aXRoIGFuIGludGVnZXIgbnVtZXJhdG9yIGFuZCBhbiBpbnRlZ2VyIGRlbm9taW5hdG9yLlxyXG4gICAgICogVGhlIGRlbm9taW5hdG9yIHdpbGwgYmUgYSBwb3NpdGl2ZSBub24temVybyB2YWx1ZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHNwZWNpZmllZFxyXG4gICAgICogbWF4aW11bSBkZW5vbWluYXRvci4gSWYgYSBtYXhpbXVtIGRlbm9taW5hdG9yIGlzIG5vdCBzcGVjaWZpZWQsIHRoZSBkZW5vbWluYXRvciB3aWxsIGJlXHJcbiAgICAgKiB0aGUgbG93ZXN0IHZhbHVlIG5lY2Vzc2FyeSB0byByZXByZXNlbnQgdGhlIG51bWJlciBleGFjdGx5LlxyXG4gICAgICpcclxuICAgICAqIFttZF0ge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfSBJbnRlZ2VyID49IDEsIG9yIEluZmluaXR5LiBUaGUgbWF4aW11bSBkZW5vbWluYXRvci5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX0gOiB7bWR9J1xyXG4gICAgICovXHJcbiAgICBQLnRvRnJhY3Rpb24gPSBmdW5jdGlvbiAobWQpIHtcclxuICAgICAgdmFyIGQsIGQwLCBkMSwgZDIsIGUsIGV4cCwgbiwgbjAsIG4xLCBxLCByLCBzLFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIHhjID0geC5jO1xyXG5cclxuICAgICAgaWYgKG1kICE9IG51bGwpIHtcclxuICAgICAgICBuID0gbmV3IEJpZ051bWJlcihtZCk7XHJcblxyXG4gICAgICAgIC8vIFRocm93IGlmIG1kIGlzIGxlc3MgdGhhbiBvbmUgb3IgaXMgbm90IGFuIGludGVnZXIsIHVubGVzcyBpdCBpcyBJbmZpbml0eS5cclxuICAgICAgICBpZiAoIW4uaXNJbnRlZ2VyKCkgJiYgKG4uYyB8fCBuLnMgIT09IDEpIHx8IG4ubHQoT05FKSkge1xyXG4gICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ0FyZ3VtZW50ICcgK1xyXG4gICAgICAgICAgICAgIChuLmlzSW50ZWdlcigpID8gJ291dCBvZiByYW5nZTogJyA6ICdub3QgYW4gaW50ZWdlcjogJykgKyB2YWx1ZU9mKG4pKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICgheGMpIHJldHVybiBuZXcgQmlnTnVtYmVyKHgpO1xyXG5cclxuICAgICAgZCA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuICAgICAgbjEgPSBkMCA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuICAgICAgZDEgPSBuMCA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuICAgICAgcyA9IGNvZWZmVG9TdHJpbmcoeGMpO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIGluaXRpYWwgZGVub21pbmF0b3IuXHJcbiAgICAgIC8vIGQgaXMgYSBwb3dlciBvZiAxMCBhbmQgdGhlIG1pbmltdW0gbWF4IGRlbm9taW5hdG9yIHRoYXQgc3BlY2lmaWVzIHRoZSB2YWx1ZSBleGFjdGx5LlxyXG4gICAgICBlID0gZC5lID0gcy5sZW5ndGggLSB4LmUgLSAxO1xyXG4gICAgICBkLmNbMF0gPSBQT1dTX1RFTlsoZXhwID0gZSAlIExPR19CQVNFKSA8IDAgPyBMT0dfQkFTRSArIGV4cCA6IGV4cF07XHJcbiAgICAgIG1kID0gIW1kIHx8IG4uY29tcGFyZWRUbyhkKSA+IDAgPyAoZSA+IDAgPyBkIDogbjEpIDogbjtcclxuXHJcbiAgICAgIGV4cCA9IE1BWF9FWFA7XHJcbiAgICAgIE1BWF9FWFAgPSAxIC8gMDtcclxuICAgICAgbiA9IG5ldyBCaWdOdW1iZXIocyk7XHJcblxyXG4gICAgICAvLyBuMCA9IGQxID0gMFxyXG4gICAgICBuMC5jWzBdID0gMDtcclxuXHJcbiAgICAgIGZvciAoOyA7KSAge1xyXG4gICAgICAgIHEgPSBkaXYobiwgZCwgMCwgMSk7XHJcbiAgICAgICAgZDIgPSBkMC5wbHVzKHEudGltZXMoZDEpKTtcclxuICAgICAgICBpZiAoZDIuY29tcGFyZWRUbyhtZCkgPT0gMSkgYnJlYWs7XHJcbiAgICAgICAgZDAgPSBkMTtcclxuICAgICAgICBkMSA9IGQyO1xyXG4gICAgICAgIG4xID0gbjAucGx1cyhxLnRpbWVzKGQyID0gbjEpKTtcclxuICAgICAgICBuMCA9IGQyO1xyXG4gICAgICAgIGQgPSBuLm1pbnVzKHEudGltZXMoZDIgPSBkKSk7XHJcbiAgICAgICAgbiA9IGQyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkMiA9IGRpdihtZC5taW51cyhkMCksIGQxLCAwLCAxKTtcclxuICAgICAgbjAgPSBuMC5wbHVzKGQyLnRpbWVzKG4xKSk7XHJcbiAgICAgIGQwID0gZDAucGx1cyhkMi50aW1lcyhkMSkpO1xyXG4gICAgICBuMC5zID0gbjEucyA9IHgucztcclxuICAgICAgZSA9IGUgKiAyO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIGZyYWN0aW9uIGlzIGNsb3NlciB0byB4LCBuMC9kMCBvciBuMS9kMVxyXG4gICAgICByID0gZGl2KG4xLCBkMSwgZSwgUk9VTkRJTkdfTU9ERSkubWludXMoeCkuYWJzKCkuY29tcGFyZWRUbyhcclxuICAgICAgICAgIGRpdihuMCwgZDAsIGUsIFJPVU5ESU5HX01PREUpLm1pbnVzKHgpLmFicygpKSA8IDEgPyBbbjEsIGQxXSA6IFtuMCwgZDBdO1xyXG5cclxuICAgICAgTUFYX0VYUCA9IGV4cDtcclxuXHJcbiAgICAgIHJldHVybiByO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgY29udmVydGVkIHRvIGEgbnVtYmVyIHByaW1pdGl2ZS5cclxuICAgICAqL1xyXG4gICAgUC50b051bWJlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuICt2YWx1ZU9mKHRoaXMpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHJvdW5kZWQgdG8gc2Qgc2lnbmlmaWNhbnQgZGlnaXRzXHJcbiAgICAgKiB1c2luZyByb3VuZGluZyBtb2RlIHJtIG9yIFJPVU5ESU5HX01PREUuIElmIHNkIGlzIGxlc3MgdGhhbiB0aGUgbnVtYmVyIG9mIGRpZ2l0c1xyXG4gICAgICogbmVjZXNzYXJ5IHRvIHJlcHJlc2VudCB0aGUgaW50ZWdlciBwYXJ0IG9mIHRoZSB2YWx1ZSBpbiBmaXhlZC1wb2ludCBub3RhdGlvbiwgdGhlbiB1c2VcclxuICAgICAqIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICpcclxuICAgICAqIFtzZF0ge251bWJlcn0gU2lnbmlmaWNhbnQgZGlnaXRzLiBJbnRlZ2VyLCAxIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtzZHxybX0nXHJcbiAgICAgKi9cclxuICAgIFAudG9QcmVjaXNpb24gPSBmdW5jdGlvbiAoc2QsIHJtKSB7XHJcbiAgICAgIGlmIChzZCAhPSBudWxsKSBpbnRDaGVjayhzZCwgMSwgTUFYKTtcclxuICAgICAgcmV0dXJuIGZvcm1hdCh0aGlzLCBzZCwgcm0sIDIpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGJhc2UgYiwgb3IgYmFzZSAxMCBpZiBiIGlzXHJcbiAgICAgKiBvbWl0dGVkLiBJZiBhIGJhc2UgaXMgc3BlY2lmaWVkLCBpbmNsdWRpbmcgYmFzZSAxMCwgcm91bmQgYWNjb3JkaW5nIHRvIERFQ0lNQUxfUExBQ0VTIGFuZFxyXG4gICAgICogUk9VTkRJTkdfTU9ERS4gSWYgYSBiYXNlIGlzIG5vdCBzcGVjaWZpZWQsIGFuZCB0aGlzIEJpZ051bWJlciBoYXMgYSBwb3NpdGl2ZSBleHBvbmVudFxyXG4gICAgICogdGhhdCBpcyBlcXVhbCB0byBvciBncmVhdGVyIHRoYW4gVE9fRVhQX1BPUywgb3IgYSBuZWdhdGl2ZSBleHBvbmVudCBlcXVhbCB0byBvciBsZXNzIHRoYW5cclxuICAgICAqIFRPX0VYUF9ORUcsIHJldHVybiBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBbYl0ge251bWJlcn0gSW50ZWdlciwgMiB0byBBTFBIQUJFVC5sZW5ndGggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBCYXNlIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtifSdcclxuICAgICAqL1xyXG4gICAgUC50b1N0cmluZyA9IGZ1bmN0aW9uIChiKSB7XHJcbiAgICAgIHZhciBzdHIsXHJcbiAgICAgICAgbiA9IHRoaXMsXHJcbiAgICAgICAgcyA9IG4ucyxcclxuICAgICAgICBlID0gbi5lO1xyXG5cclxuICAgICAgLy8gSW5maW5pdHkgb3IgTmFOP1xyXG4gICAgICBpZiAoZSA9PT0gbnVsbCkge1xyXG4gICAgICAgIGlmIChzKSB7XHJcbiAgICAgICAgICBzdHIgPSAnSW5maW5pdHknO1xyXG4gICAgICAgICAgaWYgKHMgPCAwKSBzdHIgPSAnLScgKyBzdHI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHN0ciA9ICdOYU4nO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoYiA9PSBudWxsKSB7XHJcbiAgICAgICAgICBzdHIgPSBlIDw9IFRPX0VYUF9ORUcgfHwgZSA+PSBUT19FWFBfUE9TXHJcbiAgICAgICAgICAgPyB0b0V4cG9uZW50aWFsKGNvZWZmVG9TdHJpbmcobi5jKSwgZSlcclxuICAgICAgICAgICA6IHRvRml4ZWRQb2ludChjb2VmZlRvU3RyaW5nKG4uYyksIGUsICcwJyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChiID09PSAxMCkge1xyXG4gICAgICAgICAgbiA9IHJvdW5kKG5ldyBCaWdOdW1iZXIobiksIERFQ0lNQUxfUExBQ0VTICsgZSArIDEsIFJPVU5ESU5HX01PREUpO1xyXG4gICAgICAgICAgc3RyID0gdG9GaXhlZFBvaW50KGNvZWZmVG9TdHJpbmcobi5jKSwgbi5lLCAnMCcpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpbnRDaGVjayhiLCAyLCBBTFBIQUJFVC5sZW5ndGgsICdCYXNlJyk7XHJcbiAgICAgICAgICBzdHIgPSBjb252ZXJ0QmFzZSh0b0ZpeGVkUG9pbnQoY29lZmZUb1N0cmluZyhuLmMpLCBlLCAnMCcpLCAxMCwgYiwgcywgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocyA8IDAgJiYgbi5jWzBdKSBzdHIgPSAnLScgKyBzdHI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGFzIHRvU3RyaW5nLCBidXQgZG8gbm90IGFjY2VwdCBhIGJhc2UgYXJndW1lbnQsIGFuZCBpbmNsdWRlIHRoZSBtaW51cyBzaWduIGZvclxyXG4gICAgICogbmVnYXRpdmUgemVyby5cclxuICAgICAqL1xyXG4gICAgUC52YWx1ZU9mID0gUC50b0pTT04gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiB2YWx1ZU9mKHRoaXMpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgUC5faXNCaWdOdW1iZXIgPSB0cnVlO1xyXG5cclxuICAgIGlmIChoYXNTeW1ib2wpIHtcclxuICAgICAgUFtTeW1ib2wudG9TdHJpbmdUYWddID0gJ0JpZ051bWJlcic7XHJcblxyXG4gICAgICAvLyBOb2RlLmpzIHYxMC4xMi4wK1xyXG4gICAgICBQW1N5bWJvbC5mb3IoJ25vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tJyldID0gUC52YWx1ZU9mO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb25maWdPYmplY3QgIT0gbnVsbCkgQmlnTnVtYmVyLnNldChjb25maWdPYmplY3QpO1xyXG5cclxuICAgIHJldHVybiBCaWdOdW1iZXI7XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gUFJJVkFURSBIRUxQRVIgRlVOQ1RJT05TXHJcblxyXG4gIC8vIFRoZXNlIGZ1bmN0aW9ucyBkb24ndCBuZWVkIGFjY2VzcyB0byB2YXJpYWJsZXMsXHJcbiAgLy8gZS5nLiBERUNJTUFMX1BMQUNFUywgaW4gdGhlIHNjb3BlIG9mIHRoZSBgY2xvbmVgIGZ1bmN0aW9uIGFib3ZlLlxyXG5cclxuXHJcbiAgZnVuY3Rpb24gYml0Rmxvb3Iobikge1xyXG4gICAgdmFyIGkgPSBuIHwgMDtcclxuICAgIHJldHVybiBuID4gMCB8fCBuID09PSBpID8gaSA6IGkgLSAxO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIFJldHVybiBhIGNvZWZmaWNpZW50IGFycmF5IGFzIGEgc3RyaW5nIG9mIGJhc2UgMTAgZGlnaXRzLlxyXG4gIGZ1bmN0aW9uIGNvZWZmVG9TdHJpbmcoYSkge1xyXG4gICAgdmFyIHMsIHosXHJcbiAgICAgIGkgPSAxLFxyXG4gICAgICBqID0gYS5sZW5ndGgsXHJcbiAgICAgIHIgPSBhWzBdICsgJyc7XHJcblxyXG4gICAgZm9yICg7IGkgPCBqOykge1xyXG4gICAgICBzID0gYVtpKytdICsgJyc7XHJcbiAgICAgIHogPSBMT0dfQkFTRSAtIHMubGVuZ3RoO1xyXG4gICAgICBmb3IgKDsgei0tOyBzID0gJzAnICsgcyk7XHJcbiAgICAgIHIgKz0gcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICBmb3IgKGogPSByLmxlbmd0aDsgci5jaGFyQ29kZUF0KC0taikgPT09IDQ4Oyk7XHJcblxyXG4gICAgcmV0dXJuIHIuc2xpY2UoMCwgaiArIDEgfHwgMSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gQ29tcGFyZSB0aGUgdmFsdWUgb2YgQmlnTnVtYmVycyB4IGFuZCB5LlxyXG4gIGZ1bmN0aW9uIGNvbXBhcmUoeCwgeSkge1xyXG4gICAgdmFyIGEsIGIsXHJcbiAgICAgIHhjID0geC5jLFxyXG4gICAgICB5YyA9IHkuYyxcclxuICAgICAgaSA9IHgucyxcclxuICAgICAgaiA9IHkucyxcclxuICAgICAgayA9IHguZSxcclxuICAgICAgbCA9IHkuZTtcclxuXHJcbiAgICAvLyBFaXRoZXIgTmFOP1xyXG4gICAgaWYgKCFpIHx8ICFqKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICBhID0geGMgJiYgIXhjWzBdO1xyXG4gICAgYiA9IHljICYmICF5Y1swXTtcclxuXHJcbiAgICAvLyBFaXRoZXIgemVybz9cclxuICAgIGlmIChhIHx8IGIpIHJldHVybiBhID8gYiA/IDAgOiAtaiA6IGk7XHJcblxyXG4gICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgaWYgKGkgIT0gaikgcmV0dXJuIGk7XHJcblxyXG4gICAgYSA9IGkgPCAwO1xyXG4gICAgYiA9IGsgPT0gbDtcclxuXHJcbiAgICAvLyBFaXRoZXIgSW5maW5pdHk/XHJcbiAgICBpZiAoIXhjIHx8ICF5YykgcmV0dXJuIGIgPyAwIDogIXhjIF4gYSA/IDEgOiAtMTtcclxuXHJcbiAgICAvLyBDb21wYXJlIGV4cG9uZW50cy5cclxuICAgIGlmICghYikgcmV0dXJuIGsgPiBsIF4gYSA/IDEgOiAtMTtcclxuXHJcbiAgICBqID0gKGsgPSB4Yy5sZW5ndGgpIDwgKGwgPSB5Yy5sZW5ndGgpID8gayA6IGw7XHJcblxyXG4gICAgLy8gQ29tcGFyZSBkaWdpdCBieSBkaWdpdC5cclxuICAgIGZvciAoaSA9IDA7IGkgPCBqOyBpKyspIGlmICh4Y1tpXSAhPSB5Y1tpXSkgcmV0dXJuIHhjW2ldID4geWNbaV0gXiBhID8gMSA6IC0xO1xyXG5cclxuICAgIC8vIENvbXBhcmUgbGVuZ3Rocy5cclxuICAgIHJldHVybiBrID09IGwgPyAwIDogayA+IGwgXiBhID8gMSA6IC0xO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qXHJcbiAgICogQ2hlY2sgdGhhdCBuIGlzIGEgcHJpbWl0aXZlIG51bWJlciwgYW4gaW50ZWdlciwgYW5kIGluIHJhbmdlLCBvdGhlcndpc2UgdGhyb3cuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaW50Q2hlY2sobiwgbWluLCBtYXgsIG5hbWUpIHtcclxuICAgIGlmIChuIDwgbWluIHx8IG4gPiBtYXggfHwgbiAhPT0gbWF0aGZsb29yKG4pKSB7XHJcbiAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAobmFtZSB8fCAnQXJndW1lbnQnKSArICh0eXBlb2YgbiA9PSAnbnVtYmVyJ1xyXG4gICAgICAgICA/IG4gPCBtaW4gfHwgbiA+IG1heCA/ICcgb3V0IG9mIHJhbmdlOiAnIDogJyBub3QgYW4gaW50ZWdlcjogJ1xyXG4gICAgICAgICA6ICcgbm90IGEgcHJpbWl0aXZlIG51bWJlcjogJykgKyBTdHJpbmcobikpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8vIEFzc3VtZXMgZmluaXRlIG4uXHJcbiAgZnVuY3Rpb24gaXNPZGQobikge1xyXG4gICAgdmFyIGsgPSBuLmMubGVuZ3RoIC0gMTtcclxuICAgIHJldHVybiBiaXRGbG9vcihuLmUgLyBMT0dfQkFTRSkgPT0gayAmJiBuLmNba10gJSAyICE9IDA7XHJcbiAgfVxyXG5cclxuXHJcbiAgZnVuY3Rpb24gdG9FeHBvbmVudGlhbChzdHIsIGUpIHtcclxuICAgIHJldHVybiAoc3RyLmxlbmd0aCA+IDEgPyBzdHIuY2hhckF0KDApICsgJy4nICsgc3RyLnNsaWNlKDEpIDogc3RyKSArXHJcbiAgICAgKGUgPCAwID8gJ2UnIDogJ2UrJykgKyBlO1xyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIHRvRml4ZWRQb2ludChzdHIsIGUsIHopIHtcclxuICAgIHZhciBsZW4sIHpzO1xyXG5cclxuICAgIC8vIE5lZ2F0aXZlIGV4cG9uZW50P1xyXG4gICAgaWYgKGUgPCAwKSB7XHJcblxyXG4gICAgICAvLyBQcmVwZW5kIHplcm9zLlxyXG4gICAgICBmb3IgKHpzID0geiArICcuJzsgKytlOyB6cyArPSB6KTtcclxuICAgICAgc3RyID0genMgKyBzdHI7XHJcblxyXG4gICAgLy8gUG9zaXRpdmUgZXhwb25lbnRcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxlbiA9IHN0ci5sZW5ndGg7XHJcblxyXG4gICAgICAvLyBBcHBlbmQgemVyb3MuXHJcbiAgICAgIGlmICgrK2UgPiBsZW4pIHtcclxuICAgICAgICBmb3IgKHpzID0geiwgZSAtPSBsZW47IC0tZTsgenMgKz0geik7XHJcbiAgICAgICAgc3RyICs9IHpzO1xyXG4gICAgICB9IGVsc2UgaWYgKGUgPCBsZW4pIHtcclxuICAgICAgICBzdHIgPSBzdHIuc2xpY2UoMCwgZSkgKyAnLicgKyBzdHIuc2xpY2UoZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3RyO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIEVYUE9SVFxyXG5cclxuXHJcbiAgQmlnTnVtYmVyID0gY2xvbmUoKTtcclxuICBCaWdOdW1iZXJbJ2RlZmF1bHQnXSA9IEJpZ051bWJlci5CaWdOdW1iZXIgPSBCaWdOdW1iZXI7XHJcblxyXG4gIC8vIEFNRC5cclxuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgIGRlZmluZShmdW5jdGlvbiAoKSB7IHJldHVybiBCaWdOdW1iZXI7IH0pO1xyXG5cclxuICAvLyBOb2RlLmpzIGFuZCBvdGhlciBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLlxyXG4gIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBCaWdOdW1iZXI7XHJcblxyXG4gIC8vIEJyb3dzZXIuXHJcbiAgfSBlbHNlIHtcclxuICAgIGlmICghZ2xvYmFsT2JqZWN0KSB7XHJcbiAgICAgIGdsb2JhbE9iamVjdCA9IHR5cGVvZiBzZWxmICE9ICd1bmRlZmluZWQnICYmIHNlbGYgPyBzZWxmIDogd2luZG93O1xyXG4gICAgfVxyXG5cclxuICAgIGdsb2JhbE9iamVjdC5CaWdOdW1iZXIgPSBCaWdOdW1iZXI7XHJcbiAgfVxyXG59KSh0aGlzKTtcclxuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxhbmd1YWdlVGFnOiBcImVuLVVTXCIsXG4gICAgZGVsaW1pdGVyczoge1xuICAgICAgICB0aG91c2FuZHM6IFwiLFwiLFxuICAgICAgICBkZWNpbWFsOiBcIi5cIlxuICAgIH0sXG4gICAgYWJicmV2aWF0aW9uczoge1xuICAgICAgICB0aG91c2FuZDogXCJrXCIsXG4gICAgICAgIG1pbGxpb246IFwibVwiLFxuICAgICAgICBiaWxsaW9uOiBcImJcIixcbiAgICAgICAgdHJpbGxpb246IFwidFwiXG4gICAgfSxcbiAgICBzcGFjZVNlcGFyYXRlZDogZmFsc2UsXG4gICAgb3JkaW5hbDogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgIGxldCBiID0gbnVtYmVyICUgMTA7XG4gICAgICAgIHJldHVybiAofn4obnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/IFwidGhcIiA6IChiID09PSAxKSA/IFwic3RcIiA6IChiID09PSAyKSA/IFwibmRcIiA6IChiID09PSAzKSA/IFwicmRcIiA6IFwidGhcIjtcbiAgICB9LFxuICAgIGJ5dGVzOiB7XG4gICAgICAgIGJpbmFyeVN1ZmZpeGVzOiBbXCJCXCIsIFwiS2lCXCIsIFwiTWlCXCIsIFwiR2lCXCIsIFwiVGlCXCIsIFwiUGlCXCIsIFwiRWlCXCIsIFwiWmlCXCIsIFwiWWlCXCJdLFxuICAgICAgICBkZWNpbWFsU3VmZml4ZXM6IFtcIkJcIiwgXCJLQlwiLCBcIk1CXCIsIFwiR0JcIiwgXCJUQlwiLCBcIlBCXCIsIFwiRUJcIiwgXCJaQlwiLCBcIllCXCJdXG4gICAgfSxcbiAgICBjdXJyZW5jeToge1xuICAgICAgICBzeW1ib2w6IFwiJFwiLFxuICAgICAgICBwb3NpdGlvbjogXCJwcmVmaXhcIixcbiAgICAgICAgY29kZTogXCJVU0RcIlxuICAgIH0sXG4gICAgY3VycmVuY3lGb3JtYXQ6IHtcbiAgICAgICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IHRydWUsXG4gICAgICAgIHRvdGFsTGVuZ3RoOiA0LFxuICAgICAgICBzcGFjZVNlcGFyYXRlZDogdHJ1ZSxcbiAgICAgICAgc3BhY2VTZXBhcmF0ZWRDdXJyZW5jeTogdHJ1ZVxuICAgIH0sXG4gICAgZm9ybWF0czoge1xuICAgICAgICBmb3VyRGlnaXRzOiB7XG4gICAgICAgICAgICB0b3RhbExlbmd0aDogNCxcbiAgICAgICAgICAgIHNwYWNlU2VwYXJhdGVkOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIGZ1bGxXaXRoVHdvRGVjaW1hbHM6IHtcbiAgICAgICAgICAgIG91dHB1dDogXCJjdXJyZW5jeVwiLFxuICAgICAgICAgICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IHRydWUsXG4gICAgICAgICAgICBtYW50aXNzYTogMlxuICAgICAgICB9LFxuICAgICAgICBmdWxsV2l0aFR3b0RlY2ltYWxzTm9DdXJyZW5jeToge1xuICAgICAgICAgICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IHRydWUsXG4gICAgICAgICAgICBtYW50aXNzYTogMlxuICAgICAgICB9LFxuICAgICAgICBmdWxsV2l0aE5vRGVjaW1hbHM6IHtcbiAgICAgICAgICAgIG91dHB1dDogXCJjdXJyZW5jeVwiLFxuICAgICAgICAgICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IHRydWUsXG4gICAgICAgICAgICBtYW50aXNzYTogMFxuICAgICAgICB9XG4gICAgfVxufTtcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3IEJlbmphbWluIFZhbiBSeXNlZ2hlbTxiZW5qYW1pbkB2YW5yeXNlZ2hlbS5jb20+XG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG5jb25zdCBnbG9iYWxTdGF0ZSA9IHJlcXVpcmUoXCIuL2dsb2JhbFN0YXRlXCIpO1xuY29uc3QgdmFsaWRhdGluZyA9IHJlcXVpcmUoXCIuL3ZhbGlkYXRpbmdcIik7XG5jb25zdCBwYXJzaW5nID0gcmVxdWlyZShcIi4vcGFyc2luZ1wiKTtcblxuY29uc3QgcG93ZXJzID0ge1xuICAgIHRyaWxsaW9uOiBNYXRoLnBvdygxMCwgMTIpLFxuICAgIGJpbGxpb246IE1hdGgucG93KDEwLCA5KSxcbiAgICBtaWxsaW9uOiBNYXRoLnBvdygxMCwgNiksXG4gICAgdGhvdXNhbmQ6IE1hdGgucG93KDEwLCAzKVxufTtcblxuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgdG90YWxMZW5ndGg6IDAsXG4gICAgY2hhcmFjdGVyaXN0aWM6IDAsXG4gICAgZm9yY2VBdmVyYWdlOiBmYWxzZSxcbiAgICBhdmVyYWdlOiBmYWxzZSxcbiAgICBtYW50aXNzYTogLTEsXG4gICAgb3B0aW9uYWxNYW50aXNzYTogdHJ1ZSxcbiAgICB0aG91c2FuZFNlcGFyYXRlZDogZmFsc2UsXG4gICAgc3BhY2VTZXBhcmF0ZWQ6IGZhbHNlLFxuICAgIG5lZ2F0aXZlOiBcInNpZ25cIixcbiAgICBmb3JjZVNpZ246IGZhbHNlLFxuICAgIHJvdW5kaW5nRnVuY3Rpb246IE1hdGgucm91bmQsXG4gICAgc3BhY2VTZXBhcmF0ZWRBYmJyZXZpYXRpb246IGZhbHNlXG59O1xuXG5jb25zdCB7IGJpbmFyeVN1ZmZpeGVzLCBkZWNpbWFsU3VmZml4ZXMgfSA9IGdsb2JhbFN0YXRlLmN1cnJlbnRCeXRlcygpO1xuXG5jb25zdCBieXRlcyA9IHtcbiAgICBnZW5lcmFsOiB7IHNjYWxlOiAxMDI0LCBzdWZmaXhlczogZGVjaW1hbFN1ZmZpeGVzLCBtYXJrZXI6IFwiYmRcIiB9LFxuICAgIGJpbmFyeTogeyBzY2FsZTogMTAyNCwgc3VmZml4ZXM6IGJpbmFyeVN1ZmZpeGVzLCBtYXJrZXI6IFwiYlwiIH0sXG4gICAgZGVjaW1hbDogeyBzY2FsZTogMTAwMCwgc3VmZml4ZXM6IGRlY2ltYWxTdWZmaXhlcywgbWFya2VyOiBcImRcIiB9XG59O1xuXG4vKipcbiAqIEVudHJ5IHBvaW50LiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFjY29yZGluZyB0byB0aGUgUFJPVklERURGT1JNQVQuXG4gKiBUaGlzIG1ldGhvZCBlbnN1cmUgdGhlIHByZWZpeCBhbmQgcG9zdGZpeCBhcmUgYWRkZWQgYXMgdGhlIGxhc3Qgc3RlcC5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdHxzdHJpbmd9IFtwcm92aWRlZEZvcm1hdF0gLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0gbnVtYnJvIC0gdGhlIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0KGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCA9IHt9LCBudW1icm8pIHtcbiAgICBpZiAodHlwZW9mIHByb3ZpZGVkRm9ybWF0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHByb3ZpZGVkRm9ybWF0ID0gcGFyc2luZy5wYXJzZUZvcm1hdChwcm92aWRlZEZvcm1hdCk7XG4gICAgfVxuXG4gICAgbGV0IHZhbGlkID0gdmFsaWRhdGluZy52YWxpZGF0ZUZvcm1hdChwcm92aWRlZEZvcm1hdCk7XG5cbiAgICBpZiAoIXZhbGlkKSB7XG4gICAgICAgIHJldHVybiBcIkVSUk9SOiBpbnZhbGlkIGZvcm1hdFwiO1xuICAgIH1cblxuICAgIGxldCBwcmVmaXggPSBwcm92aWRlZEZvcm1hdC5wcmVmaXggfHwgXCJcIjtcbiAgICBsZXQgcG9zdGZpeCA9IHByb3ZpZGVkRm9ybWF0LnBvc3RmaXggfHwgXCJcIjtcblxuICAgIGxldCBvdXRwdXQgPSBmb3JtYXROdW1icm8oaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBudW1icm8pO1xuICAgIG91dHB1dCA9IGluc2VydFByZWZpeChvdXRwdXQsIHByZWZpeCk7XG4gICAgb3V0cHV0ID0gaW5zZXJ0UG9zdGZpeChvdXRwdXQsIHBvc3RmaXgpO1xuICAgIHJldHVybiBvdXRwdXQ7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhY2NvcmRpbmcgdG8gdGhlIFBST1ZJREVERk9STUFULlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IHByb3ZpZGVkRm9ybWF0IC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIG51bWJybyAtIHRoZSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE51bWJybyhpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIG51bWJybykge1xuICAgIHN3aXRjaCAocHJvdmlkZWRGb3JtYXQub3V0cHV0KSB7XG4gICAgICAgIGNhc2UgXCJjdXJyZW5jeVwiOiB7XG4gICAgICAgICAgICBwcm92aWRlZEZvcm1hdCA9IGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudEN1cnJlbmN5RGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRDdXJyZW5jeShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLCBudW1icm8pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJwZXJjZW50XCI6IHtcbiAgICAgICAgICAgIHByb3ZpZGVkRm9ybWF0ID0gZm9ybWF0T3JEZWZhdWx0KHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50UGVyY2VudGFnZURlZmF1bHRGb3JtYXQoKSk7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0UGVyY2VudGFnZShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLCBudW1icm8pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJieXRlXCI6XG4gICAgICAgICAgICBwcm92aWRlZEZvcm1hdCA9IGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudEJ5dGVEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdEJ5dGUoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgY2FzZSBcInRpbWVcIjpcbiAgICAgICAgICAgIHByb3ZpZGVkRm9ybWF0ID0gZm9ybWF0T3JEZWZhdWx0KHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50VGltZURlZmF1bHRGb3JtYXQoKSk7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0VGltZShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLCBudW1icm8pO1xuICAgICAgICBjYXNlIFwib3JkaW5hbFwiOlxuICAgICAgICAgICAgcHJvdmlkZWRGb3JtYXQgPSBmb3JtYXRPckRlZmF1bHQocHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLmN1cnJlbnRPcmRpbmFsRGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRPcmRpbmFsKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUsIG51bWJybyk7XG4gICAgICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXROdW1iZXIoe1xuICAgICAgICAgICAgICAgIGluc3RhbmNlLFxuICAgICAgICAgICAgICAgIHByb3ZpZGVkRm9ybWF0LFxuICAgICAgICAgICAgICAgIG51bWJyb1xuICAgICAgICAgICAgfSk7XG4gICAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgZGVjaW1hbCBieXRlIHVuaXQgKE1CKSBmb3IgdGhlIHByb3ZpZGVkIG51bWJybyBJTlNUQU5DRS5cbiAqIFdlIGdvIGZyb20gb25lIHVuaXQgdG8gYW5vdGhlciB1c2luZyB0aGUgZGVjaW1hbCBzeXN0ZW0gKDEwMDApLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBjb21wdXRlXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGdldERlY2ltYWxCeXRlVW5pdChpbnN0YW5jZSkge1xuICAgIGxldCBkYXRhID0gYnl0ZXMuZGVjaW1hbDtcbiAgICByZXR1cm4gZ2V0Rm9ybWF0Qnl0ZVVuaXRzKGluc3RhbmNlLl92YWx1ZSwgZGF0YS5zdWZmaXhlcywgZGF0YS5zY2FsZSkuc3VmZml4O1xufVxuXG4vKipcbiAqIEdldCB0aGUgYmluYXJ5IGJ5dGUgdW5pdCAoTWlCKSBmb3IgdGhlIHByb3ZpZGVkIG51bWJybyBJTlNUQU5DRS5cbiAqIFdlIGdvIGZyb20gb25lIHVuaXQgdG8gYW5vdGhlciB1c2luZyB0aGUgZGVjaW1hbCBzeXN0ZW0gKDEwMjQpLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBjb21wdXRlXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGdldEJpbmFyeUJ5dGVVbml0KGluc3RhbmNlKSB7XG4gICAgbGV0IGRhdGEgPSBieXRlcy5iaW5hcnk7XG4gICAgcmV0dXJuIGdldEZvcm1hdEJ5dGVVbml0cyhpbnN0YW5jZS5fdmFsdWUsIGRhdGEuc3VmZml4ZXMsIGRhdGEuc2NhbGUpLnN1ZmZpeDtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGRlY2ltYWwgYnl0ZSB1bml0IChNQikgZm9yIHRoZSBwcm92aWRlZCBudW1icm8gSU5TVEFOQ0UuXG4gKiBXZSBnbyBmcm9tIG9uZSB1bml0IHRvIGFub3RoZXIgdXNpbmcgdGhlIGRlY2ltYWwgc3lzdGVtICgxMDI0KS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gY29tcHV0ZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBnZXRCeXRlVW5pdChpbnN0YW5jZSkge1xuICAgIGxldCBkYXRhID0gYnl0ZXMuZ2VuZXJhbDtcbiAgICByZXR1cm4gZ2V0Rm9ybWF0Qnl0ZVVuaXRzKGluc3RhbmNlLl92YWx1ZSwgZGF0YS5zdWZmaXhlcywgZGF0YS5zY2FsZSkuc3VmZml4O1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgdmFsdWUgYW5kIHRoZSBzdWZmaXggY29tcHV0ZWQgaW4gYnl0ZS5cbiAqIEl0IHVzZXMgdGhlIFNVRkZJWEVTIGFuZCB0aGUgU0NBTEUgcHJvdmlkZWQuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gTnVtYmVyIHRvIGZvcm1hdFxuICogQHBhcmFtIHtbU3RyaW5nXX0gc3VmZml4ZXMgLSBMaXN0IG9mIHN1ZmZpeGVzXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGUgLSBOdW1iZXIgaW4tYmV0d2VlbiB0d28gdW5pdHNcbiAqIEByZXR1cm4ge3t2YWx1ZTogTnVtYmVyLCBzdWZmaXg6IFN0cmluZ319XG4gKi9cbmZ1bmN0aW9uIGdldEZvcm1hdEJ5dGVVbml0cyh2YWx1ZSwgc3VmZml4ZXMsIHNjYWxlKSB7XG4gICAgbGV0IHN1ZmZpeCA9IHN1ZmZpeGVzWzBdO1xuICAgIGxldCBhYnMgPSBNYXRoLmFicyh2YWx1ZSk7XG5cbiAgICBpZiAoYWJzID49IHNjYWxlKSB7XG4gICAgICAgIGZvciAobGV0IHBvd2VyID0gMTsgcG93ZXIgPCBzdWZmaXhlcy5sZW5ndGg7ICsrcG93ZXIpIHtcbiAgICAgICAgICAgIGxldCBtaW4gPSBNYXRoLnBvdyhzY2FsZSwgcG93ZXIpO1xuICAgICAgICAgICAgbGV0IG1heCA9IE1hdGgucG93KHNjYWxlLCBwb3dlciArIDEpO1xuXG4gICAgICAgICAgICBpZiAoYWJzID49IG1pbiAmJiBhYnMgPCBtYXgpIHtcbiAgICAgICAgICAgICAgICBzdWZmaXggPSBzdWZmaXhlc1twb3dlcl07XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIG1pbjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbHVlcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gW3NjYWxlXSBZQiBuZXZlciBzZXQgdGhlIHN1ZmZpeFxuICAgICAgICBpZiAoc3VmZml4ID09PSBzdWZmaXhlc1swXSkge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KHNjYWxlLCBzdWZmaXhlcy5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIHN1ZmZpeCA9IHN1ZmZpeGVzW3N1ZmZpeGVzLmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdmFsdWUsIHN1ZmZpeCB9O1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYXMgYnl0ZXMgdXNpbmcgdGhlIFBST1ZJREVERk9STUFULCBhbmQgU1RBVEUuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gcHJvdmlkZWRGb3JtYXQgLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHBhcmFtIG51bWJybyAtIHRoZSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdEJ5dGUoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSwgbnVtYnJvKSB7XG4gICAgbGV0IGJhc2UgPSBwcm92aWRlZEZvcm1hdC5iYXNlIHx8IFwiYmluYXJ5XCI7XG4gICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgcHJvdmlkZWRGb3JtYXQpO1xuXG4gICAgY29uc3QgeyBiaW5hcnlTdWZmaXhlczogbG9jYWxCaW5hcnlTdWZmaXhlcywgZGVjaW1hbFN1ZmZpeGVzOiBsb2NhbERlY2ltYWxTdWZmaXhlcyB9ID0gc3RhdGUuY3VycmVudEJ5dGVzKCk7XG5cbiAgICBjb25zdCBsb2NhbEJ5dGVzID0ge1xuICAgICAgICBnZW5lcmFsOiB7IHNjYWxlOiAxMDI0LCBzdWZmaXhlczogbG9jYWxEZWNpbWFsU3VmZml4ZXMgfHwgZGVjaW1hbFN1ZmZpeGVzLCBtYXJrZXI6IFwiYmRcIiB9LFxuICAgICAgICBiaW5hcnk6IHsgc2NhbGU6IDEwMjQsIHN1ZmZpeGVzOiBsb2NhbEJpbmFyeVN1ZmZpeGVzIHx8IGJpbmFyeVN1ZmZpeGVzLCBtYXJrZXI6IFwiYlwiIH0sXG4gICAgICAgIGRlY2ltYWw6IHsgc2NhbGU6IDEwMDAsIHN1ZmZpeGVzOiBsb2NhbERlY2ltYWxTdWZmaXhlcyB8fCBkZWNpbWFsU3VmZml4ZXMsIG1hcmtlcjogXCJkXCIgfVxuICAgIH07XG4gICAgbGV0IGJhc2VJbmZvID0gbG9jYWxCeXRlc1tiYXNlXTtcblxuICAgIGxldCB7IHZhbHVlLCBzdWZmaXggfSA9IGdldEZvcm1hdEJ5dGVVbml0cyhpbnN0YW5jZS5fdmFsdWUsIGJhc2VJbmZvLnN1ZmZpeGVzLCBiYXNlSW5mby5zY2FsZSk7XG5cbiAgICBsZXQgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKHtcbiAgICAgICAgaW5zdGFuY2U6IG51bWJybyh2YWx1ZSksXG4gICAgICAgIHByb3ZpZGVkRm9ybWF0LFxuICAgICAgICBzdGF0ZSxcbiAgICAgICAgZGVmYXVsdHM6IHN0YXRlLmN1cnJlbnRCeXRlRGVmYXVsdEZvcm1hdCgpXG4gICAgfSk7XG5cbiAgICByZXR1cm4gYCR7b3V0cHV0fSR7b3B0aW9ucy5zcGFjZVNlcGFyYXRlZCA/IFwiIFwiIDogXCJcIn0ke3N1ZmZpeH1gO1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYXMgYW4gb3JkaW5hbCB1c2luZyB0aGUgUFJPVklERURGT1JNQVQsXG4gKiBhbmQgdGhlIFNUQVRFLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IHByb3ZpZGVkRm9ybWF0IC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtnbG9iYWxTdGF0ZX0gc3RhdGUgLSBzaGFyZWQgc3RhdGUgb2YgdGhlIGxpYnJhcnlcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0T3JkaW5hbChpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIHN0YXRlKSB7XG4gICAgbGV0IG9yZGluYWxGbiA9IHN0YXRlLmN1cnJlbnRPcmRpbmFsKCk7XG4gICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgcHJvdmlkZWRGb3JtYXQpO1xuXG4gICAgbGV0IG91dHB1dCA9IGZvcm1hdE51bWJlcih7XG4gICAgICAgIGluc3RhbmNlLFxuICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgc3RhdGVcbiAgICB9KTtcbiAgICBsZXQgb3JkaW5hbCA9IG9yZGluYWxGbihpbnN0YW5jZS5fdmFsdWUpO1xuXG4gICAgcmV0dXJuIGAke291dHB1dH0ke29wdGlvbnMuc3BhY2VTZXBhcmF0ZWQgPyBcIiBcIiA6IFwiXCJ9JHtvcmRpbmFsfWA7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBhIHRpbWUgSEg6TU06U1MuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXRUaW1lKGluc3RhbmNlKSB7XG4gICAgbGV0IGhvdXJzID0gTWF0aC5mbG9vcihpbnN0YW5jZS5fdmFsdWUgLyA2MCAvIDYwKTtcbiAgICBsZXQgbWludXRlcyA9IE1hdGguZmxvb3IoKGluc3RhbmNlLl92YWx1ZSAtIChob3VycyAqIDYwICogNjApKSAvIDYwKTtcbiAgICBsZXQgc2Vjb25kcyA9IE1hdGgucm91bmQoaW5zdGFuY2UuX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkgLSAobWludXRlcyAqIDYwKSk7XG4gICAgcmV0dXJuIGAke2hvdXJzfTokeyhtaW51dGVzIDwgMTApID8gXCIwXCIgOiBcIlwifSR7bWludXRlc306JHsoc2Vjb25kcyA8IDEwKSA/IFwiMFwiIDogXCJcIn0ke3NlY29uZHN9YDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGEgcGVyY2VudGFnZSB1c2luZyB0aGUgUFJPVklERURGT1JNQVQsXG4gKiBhbmQgdGhlIFNUQVRFLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IHByb3ZpZGVkRm9ybWF0IC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtnbG9iYWxTdGF0ZX0gc3RhdGUgLSBzaGFyZWQgc3RhdGUgb2YgdGhlIGxpYnJhcnlcbiAqIEBwYXJhbSBudW1icm8gLSB0aGUgbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXRQZXJjZW50YWdlKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgc3RhdGUsIG51bWJybykge1xuICAgIGxldCBwcmVmaXhTeW1ib2wgPSBwcm92aWRlZEZvcm1hdC5wcmVmaXhTeW1ib2w7XG5cbiAgICBsZXQgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKHtcbiAgICAgICAgaW5zdGFuY2U6IG51bWJybyhpbnN0YW5jZS5fdmFsdWUgKiAxMDApLFxuICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgc3RhdGVcbiAgICB9KTtcbiAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwcm92aWRlZEZvcm1hdCk7XG5cbiAgICBpZiAocHJlZml4U3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBgJSR7b3B0aW9ucy5zcGFjZVNlcGFyYXRlZCA/IFwiIFwiIDogXCJcIn0ke291dHB1dH1gO1xuICAgIH1cblxuICAgIHJldHVybiBgJHtvdXRwdXR9JHtvcHRpb25zLnNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwifSVgO1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYXMgYSBwZXJjZW50YWdlIHVzaW5nIHRoZSBQUk9WSURFREZPUk1BVCxcbiAqIGFuZCB0aGUgU1RBVEUuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gcHJvdmlkZWRGb3JtYXQgLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXRDdXJyZW5jeShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIHN0YXRlKSB7XG4gICAgY29uc3QgY3VycmVudEN1cnJlbmN5ID0gc3RhdGUuY3VycmVudEN1cnJlbmN5KCk7XG4gICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgcHJvdmlkZWRGb3JtYXQpO1xuICAgIGxldCBkZWNpbWFsU2VwYXJhdG9yID0gdW5kZWZpbmVkO1xuICAgIGxldCBzcGFjZSA9IFwiXCI7XG4gICAgbGV0IGF2ZXJhZ2UgPSAhIW9wdGlvbnMudG90YWxMZW5ndGggfHwgISFvcHRpb25zLmZvcmNlQXZlcmFnZSB8fCBvcHRpb25zLmF2ZXJhZ2U7XG4gICAgbGV0IHBvc2l0aW9uID0gcHJvdmlkZWRGb3JtYXQuY3VycmVuY3lQb3NpdGlvbiB8fCBjdXJyZW50Q3VycmVuY3kucG9zaXRpb247XG4gICAgbGV0IHN5bWJvbCA9IHByb3ZpZGVkRm9ybWF0LmN1cnJlbmN5U3ltYm9sIHx8IGN1cnJlbnRDdXJyZW5jeS5zeW1ib2w7XG4gICAgY29uc3Qgc3BhY2VTZXBhcmF0ZWRDdXJyZW5jeSA9IG9wdGlvbnMuc3BhY2VTZXBhcmF0ZWRDdXJyZW5jeSAhPT0gdm9pZCAwXG4gICAgICAgID8gb3B0aW9ucy5zcGFjZVNlcGFyYXRlZEN1cnJlbmN5IDogb3B0aW9ucy5zcGFjZVNlcGFyYXRlZDtcblxuICAgIGlmIChwcm92aWRlZEZvcm1hdC5sb3dQcmVjaXNpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm92aWRlZEZvcm1hdC5sb3dQcmVjaXNpb24gPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoc3BhY2VTZXBhcmF0ZWRDdXJyZW5jeSkge1xuICAgICAgICBzcGFjZSA9IFwiIFwiO1xuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA9PT0gXCJpbmZpeFwiKSB7XG4gICAgICAgIGRlY2ltYWxTZXBhcmF0b3IgPSBzcGFjZSArIHN5bWJvbCArIHNwYWNlO1xuICAgIH1cblxuICAgIGxldCBvdXRwdXQgPSBmb3JtYXROdW1iZXIoe1xuICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgcHJvdmlkZWRGb3JtYXQsXG4gICAgICAgIHN0YXRlLFxuICAgICAgICBkZWNpbWFsU2VwYXJhdG9yXG4gICAgfSk7XG5cbiAgICBpZiAocG9zaXRpb24gPT09IFwicHJlZml4XCIpIHtcbiAgICAgICAgaWYgKGluc3RhbmNlLl92YWx1ZSA8IDAgJiYgb3B0aW9ucy5uZWdhdGl2ZSA9PT0gXCJzaWduXCIpIHtcbiAgICAgICAgICAgIG91dHB1dCA9IGAtJHtzcGFjZX0ke3N5bWJvbH0ke291dHB1dC5zbGljZSgxKX1gO1xuICAgICAgICB9IGVsc2UgaWYgKGluc3RhbmNlLl92YWx1ZSA+IDAgJiYgb3B0aW9ucy5mb3JjZVNpZ24pIHtcbiAgICAgICAgICAgIG91dHB1dCA9IGArJHtzcGFjZX0ke3N5bWJvbH0ke291dHB1dC5zbGljZSgxKX1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0cHV0ID0gc3ltYm9sICsgc3BhY2UgKyBvdXRwdXQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXBvc2l0aW9uIHx8IHBvc2l0aW9uID09PSBcInBvc3RmaXhcIikge1xuICAgICAgICBzcGFjZSA9ICFvcHRpb25zLnNwYWNlU2VwYXJhdGVkQWJicmV2aWF0aW9uICYmIGF2ZXJhZ2UgPyBcIlwiIDogc3BhY2U7XG4gICAgICAgIG91dHB1dCA9IG91dHB1dCArIHNwYWNlICsgc3ltYm9sO1xuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQ7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgYXZlcmFnZSB2YWx1ZSBvdXQgb2YgVkFMVUUuXG4gKiBUaGUgb3RoZXIgcGFyYW1ldGVycyBhcmUgY29tcHV0YXRpb24gb3B0aW9ucy5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSB2YWx1ZSB0byBjb21wdXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gW2ZvcmNlQXZlcmFnZV0gLSBmb3JjZWQgdW5pdCB1c2VkIHRvIGNvbXB1dGVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2xvd1ByZWNpc2lvbj10cnVlXSAtIHJlZHVjZSBhdmVyYWdlIHByZWNpc2lvblxuICogQHBhcmFtIHt7fX0gYWJicmV2aWF0aW9ucyAtIHBhcnQgb2YgdGhlIGxhbmd1YWdlIHNwZWNpZmljYXRpb25cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc3BhY2VTZXBhcmF0ZWQgLSBgdHJ1ZWAgaWYgYSBzcGFjZSBtdXN0IGJlIGluc2VydGVkIGJldHdlZW4gdGhlIHZhbHVlIGFuZCB0aGUgYWJicmV2aWF0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gW3RvdGFsTGVuZ3RoXSAtIHRvdGFsIGxlbmd0aCBvZiB0aGUgb3V0cHV0IGluY2x1ZGluZyB0aGUgY2hhcmFjdGVyaXN0aWMgYW5kIHRoZSBtYW50aXNzYVxuICogQHBhcmFtIHtmdW5jdGlvbn0gcm91bmRpbmdGdW5jdGlvbiAtIGZ1bmN0aW9uIHVzZWQgdG8gcm91bmQgbnVtYmVyc1xuICogQHJldHVybiB7e3ZhbHVlOiBudW1iZXIsIGFiYnJldmlhdGlvbjogc3RyaW5nLCBtYW50aXNzYVByZWNpc2lvbjogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUF2ZXJhZ2UoeyB2YWx1ZSwgZm9yY2VBdmVyYWdlLCBsb3dQcmVjaXNpb24gPSB0cnVlLCBhYmJyZXZpYXRpb25zLCBzcGFjZVNlcGFyYXRlZCA9IGZhbHNlLCB0b3RhbExlbmd0aCA9IDAsIHJvdW5kaW5nRnVuY3Rpb24gPSBNYXRoLnJvdW5kIH0pIHtcbiAgICBsZXQgYWJicmV2aWF0aW9uID0gXCJcIjtcbiAgICBsZXQgYWJzID0gTWF0aC5hYnModmFsdWUpO1xuICAgIGxldCBtYW50aXNzYVByZWNpc2lvbiA9IC0xO1xuXG4gICAgaWYgKGZvcmNlQXZlcmFnZSAmJiBhYmJyZXZpYXRpb25zW2ZvcmNlQXZlcmFnZV0gJiYgcG93ZXJzW2ZvcmNlQXZlcmFnZV0pIHtcbiAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9uc1tmb3JjZUF2ZXJhZ2VdO1xuICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gcG93ZXJzW2ZvcmNlQXZlcmFnZV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGFicyA+PSBwb3dlcnMudHJpbGxpb24gfHwgKGxvd1ByZWNpc2lvbiAmJiByb3VuZGluZ0Z1bmN0aW9uKGFicyAvIHBvd2Vycy50cmlsbGlvbikgPT09IDEpKSB7XG4gICAgICAgICAgICAvLyB0cmlsbGlvblxuICAgICAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy50cmlsbGlvbjtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBwb3dlcnMudHJpbGxpb247XG4gICAgICAgIH0gZWxzZSBpZiAoYWJzIDwgcG93ZXJzLnRyaWxsaW9uICYmIGFicyA+PSBwb3dlcnMuYmlsbGlvbiB8fCAobG93UHJlY2lzaW9uICYmIHJvdW5kaW5nRnVuY3Rpb24oYWJzIC8gcG93ZXJzLmJpbGxpb24pID09PSAxKSkge1xuICAgICAgICAgICAgLy8gYmlsbGlvblxuICAgICAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy5iaWxsaW9uO1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIHBvd2Vycy5iaWxsaW9uO1xuICAgICAgICB9IGVsc2UgaWYgKGFicyA8IHBvd2Vycy5iaWxsaW9uICYmIGFicyA+PSBwb3dlcnMubWlsbGlvbiB8fCAobG93UHJlY2lzaW9uICYmIHJvdW5kaW5nRnVuY3Rpb24oYWJzIC8gcG93ZXJzLm1pbGxpb24pID09PSAxKSkge1xuICAgICAgICAgICAgLy8gbWlsbGlvblxuICAgICAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy5taWxsaW9uO1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIHBvd2Vycy5taWxsaW9uO1xuICAgICAgICB9IGVsc2UgaWYgKGFicyA8IHBvd2Vycy5taWxsaW9uICYmIGFicyA+PSBwb3dlcnMudGhvdXNhbmQgfHwgKGxvd1ByZWNpc2lvbiAmJiByb3VuZGluZ0Z1bmN0aW9uKGFicyAvIHBvd2Vycy50aG91c2FuZCkgPT09IDEpKSB7XG4gICAgICAgICAgICAvLyB0aG91c2FuZFxuICAgICAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy50aG91c2FuZDtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBwb3dlcnMudGhvdXNhbmQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgb3B0aW9uYWxTcGFjZSA9IHNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwiO1xuXG4gICAgaWYgKGFiYnJldmlhdGlvbikge1xuICAgICAgICBhYmJyZXZpYXRpb24gPSBvcHRpb25hbFNwYWNlICsgYWJicmV2aWF0aW9uO1xuICAgIH1cblxuICAgIGlmICh0b3RhbExlbmd0aCkge1xuICAgICAgICBsZXQgaXNOZWdhdGl2ZSA9IHZhbHVlIDwgMDtcbiAgICAgICAgbGV0IGNoYXJhY3RlcmlzdGljID0gdmFsdWUudG9TdHJpbmcoKS5zcGxpdChcIi5cIilbMF07XG5cbiAgICAgICAgbGV0IGNoYXJhY3RlcmlzdGljTGVuZ3RoID0gaXNOZWdhdGl2ZVxuICAgICAgICAgICAgPyBjaGFyYWN0ZXJpc3RpYy5sZW5ndGggLSAxXG4gICAgICAgICAgICA6IGNoYXJhY3RlcmlzdGljLmxlbmd0aDtcblxuICAgICAgICBtYW50aXNzYVByZWNpc2lvbiA9IE1hdGgubWF4KHRvdGFsTGVuZ3RoIC0gY2hhcmFjdGVyaXN0aWNMZW5ndGgsIDApO1xuICAgIH1cblxuICAgIHJldHVybiB7IHZhbHVlLCBhYmJyZXZpYXRpb24sIG1hbnRpc3NhUHJlY2lzaW9uIH07XG59XG5cbi8qKlxuICogQ29tcHV0ZSBhbiBleHBvbmVudGlhbCBmb3JtIGZvciBWQUxVRSwgdGFraW5nIGludG8gYWNjb3VudCBDSEFSQUNURVJJU1RJQ1xuICogaWYgcHJvdmlkZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSB2YWx1ZSB0byBjb21wdXRlXG4gKiBAcGFyYW0ge251bWJlcn0gW2NoYXJhY3RlcmlzdGljUHJlY2lzaW9uXSAtIG9wdGlvbmFsIGNoYXJhY3RlcmlzdGljIGxlbmd0aFxuICogQHJldHVybiB7e3ZhbHVlOiBudW1iZXIsIGFiYnJldmlhdGlvbjogc3RyaW5nfX1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUV4cG9uZW50aWFsKHsgdmFsdWUsIGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uID0gMCB9KSB7XG4gICAgbGV0IFtudW1iZXJTdHJpbmcsIGV4cG9uZW50aWFsXSA9IHZhbHVlLnRvRXhwb25lbnRpYWwoKS5zcGxpdChcImVcIik7XG4gICAgbGV0IG51bWJlciA9ICtudW1iZXJTdHJpbmc7XG5cbiAgICBpZiAoIWNoYXJhY3RlcmlzdGljUHJlY2lzaW9uKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2YWx1ZTogbnVtYmVyLFxuICAgICAgICAgICAgYWJicmV2aWF0aW9uOiBgZSR7ZXhwb25lbnRpYWx9YFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGxldCBjaGFyYWN0ZXJpc3RpY0xlbmd0aCA9IDE7IC8vIHNlZSBgdG9FeHBvbmVudGlhbGBcblxuICAgIGlmIChjaGFyYWN0ZXJpc3RpY0xlbmd0aCA8IGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uKSB7XG4gICAgICAgIG51bWJlciA9IG51bWJlciAqIE1hdGgucG93KDEwLCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbiAtIGNoYXJhY3RlcmlzdGljTGVuZ3RoKTtcbiAgICAgICAgZXhwb25lbnRpYWwgPSArZXhwb25lbnRpYWwgLSAoY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gLSBjaGFyYWN0ZXJpc3RpY0xlbmd0aCk7XG4gICAgICAgIGV4cG9uZW50aWFsID0gZXhwb25lbnRpYWwgPj0gMCA/IGArJHtleHBvbmVudGlhbH1gIDogZXhwb25lbnRpYWw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IG51bWJlcixcbiAgICAgICAgYWJicmV2aWF0aW9uOiBgZSR7ZXhwb25lbnRpYWx9YFxuICAgIH07XG59XG5cbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIG9mIE5VTUJFUiB6ZXJvLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXIgLSBMZW5ndGggb2YgdGhlIG91dHB1dFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiB6ZXJvZXMobnVtYmVyKSB7XG4gICAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXI7IGkrKykge1xuICAgICAgICByZXN1bHQgKz0gXCIwXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIFZBTFVFIHdpdGggYSBQUkVDSVNJT04tbG9uZyBtYW50aXNzYS5cbiAqIFRoaXMgbWV0aG9kIGlzIGZvciBsYXJnZS9zbWFsbCBudW1iZXJzIG9ubHkgKGEuay5hLiBpbmNsdWRpbmcgYSBcImVcIikuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIHRvIHByZWNpc2VcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gLSBkZXNpcmVkIGxlbmd0aCBmb3IgdGhlIG1hbnRpc3NhXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHRvRml4ZWRMYXJnZSh2YWx1ZSwgcHJlY2lzaW9uKSB7XG4gICAgbGV0IHJlc3VsdCA9IHZhbHVlLnRvU3RyaW5nKCk7XG5cbiAgICBsZXQgW2Jhc2UsIGV4cF0gPSByZXN1bHQuc3BsaXQoXCJlXCIpO1xuXG4gICAgbGV0IFtjaGFyYWN0ZXJpc3RpYywgbWFudGlzc2EgPSBcIlwiXSA9IGJhc2Uuc3BsaXQoXCIuXCIpO1xuXG4gICAgaWYgKCtleHAgPiAwKSB7XG4gICAgICAgIHJlc3VsdCA9IGNoYXJhY3RlcmlzdGljICsgbWFudGlzc2EgKyB6ZXJvZXMoZXhwIC0gbWFudGlzc2EubGVuZ3RoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJlZml4ID0gXCIuXCI7XG5cbiAgICAgICAgaWYgKCtjaGFyYWN0ZXJpc3RpYyA8IDApIHtcbiAgICAgICAgICAgIHByZWZpeCA9IGAtMCR7cHJlZml4fWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcmVmaXggPSBgMCR7cHJlZml4fWA7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3VmZml4ID0gKHplcm9lcygtZXhwIC0gMSkgKyBNYXRoLmFicyhjaGFyYWN0ZXJpc3RpYykgKyBtYW50aXNzYSkuc3Vic3RyKDAsIHByZWNpc2lvbik7XG4gICAgICAgIGlmIChzdWZmaXgubGVuZ3RoIDwgcHJlY2lzaW9uKSB7XG4gICAgICAgICAgICBzdWZmaXggKz0gemVyb2VzKHByZWNpc2lvbiAtIHN1ZmZpeC5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9IHByZWZpeCArIHN1ZmZpeDtcbiAgICB9XG5cbiAgICBpZiAoK2V4cCA+IDAgJiYgcHJlY2lzaW9uID4gMCkge1xuICAgICAgICByZXN1bHQgKz0gYC4ke3plcm9lcyhwcmVjaXNpb24pfWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIFZBTFVFIHdpdGggYSBQUkVDSVNJT04tbG9uZyBtYW50aXNzYS5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgdG8gcHJlY2lzZVxuICogQHBhcmFtIHtudW1iZXJ9IHByZWNpc2lvbiAtIGRlc2lyZWQgbGVuZ3RoIGZvciB0aGUgbWFudGlzc2FcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHJvdW5kaW5nRnVuY3Rpb24gLSByb3VuZGluZyBmdW5jdGlvbiB0byBiZSB1c2VkXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHRvRml4ZWQodmFsdWUsIHByZWNpc2lvbiwgcm91bmRpbmdGdW5jdGlvbiA9IE1hdGgucm91bmQpIHtcbiAgICBpZiAodmFsdWUudG9TdHJpbmcoKS5pbmRleE9mKFwiZVwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRvRml4ZWRMYXJnZSh2YWx1ZSwgcHJlY2lzaW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKHJvdW5kaW5nRnVuY3Rpb24oK2Ake3ZhbHVlfWUrJHtwcmVjaXNpb259YCkgLyAoTWF0aC5wb3coMTAsIHByZWNpc2lvbikpKS50b0ZpeGVkKHByZWNpc2lvbik7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IE9VVFBVVCB3aXRoIGEgbWFudGlzc2EgcHJlY2lzaW9uIG9mIFBSRUNJU0lPTi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciBiZWluZyBjdXJyZW50bHkgZm9ybWF0dGVkXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbmFsTWFudGlzc2EgLSBpZiBgdHJ1ZWAsIHRoZSBtYW50aXNzYSBpcyBvbWl0dGVkIHdoZW4gaXQncyBvbmx5IHplcm9lc1xuICogQHBhcmFtIHtudW1iZXJ9IHByZWNpc2lvbiAtIGRlc2lyZWQgcHJlY2lzaW9uIG9mIHRoZSBtYW50aXNzYVxuICogQHBhcmFtIHtib29sZWFufSB0cmltIC0gaWYgYHRydWVgLCB0cmFpbGluZyB6ZXJvZXMgYXJlIHJlbW92ZWQgZnJvbSB0aGUgbWFudGlzc2FcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gc2V0TWFudGlzc2FQcmVjaXNpb24ob3V0cHV0LCB2YWx1ZSwgb3B0aW9uYWxNYW50aXNzYSwgcHJlY2lzaW9uLCB0cmltLCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgaWYgKHByZWNpc2lvbiA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBsZXQgcmVzdWx0ID0gdG9GaXhlZCh2YWx1ZSwgcHJlY2lzaW9uLCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICBsZXQgW2N1cnJlbnRDaGFyYWN0ZXJpc3RpYywgY3VycmVudE1hbnRpc3NhID0gXCJcIl0gPSByZXN1bHQudG9TdHJpbmcoKS5zcGxpdChcIi5cIik7XG5cbiAgICBpZiAoY3VycmVudE1hbnRpc3NhLm1hdGNoKC9eMCskLykgJiYgKG9wdGlvbmFsTWFudGlzc2EgfHwgdHJpbSkpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRDaGFyYWN0ZXJpc3RpYztcbiAgICB9XG5cbiAgICBsZXQgaGFzVHJhaWxpbmdaZXJvZXMgPSBjdXJyZW50TWFudGlzc2EubWF0Y2goLzArJC8pO1xuICAgIGlmICh0cmltICYmIGhhc1RyYWlsaW5nWmVyb2VzKSB7XG4gICAgICAgIHJldHVybiBgJHtjdXJyZW50Q2hhcmFjdGVyaXN0aWN9LiR7Y3VycmVudE1hbnRpc3NhLnRvU3RyaW5nKCkuc2xpY2UoMCwgaGFzVHJhaWxpbmdaZXJvZXMuaW5kZXgpfWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdC50b1N0cmluZygpO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBPVVRQVVQgd2l0aCBhIGNoYXJhY3RlcmlzdGljIHByZWNpc2lvbiBvZiBQUkVDSVNJT04uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgYmVpbmcgY3VycmVudGx5IGZvcm1hdHRlZFxuICogQHBhcmFtIHtib29sZWFufSBvcHRpb25hbENoYXJhY3RlcmlzdGljIC0gYHRydWVgIGlmIHRoZSBjaGFyYWN0ZXJpc3RpYyBpcyBvbWl0dGVkIHdoZW4gaXQncyBvbmx5IHplcm9lc1xuICogQHBhcmFtIHtudW1iZXJ9IHByZWNpc2lvbiAtIGRlc2lyZWQgcHJlY2lzaW9uIG9mIHRoZSBjaGFyYWN0ZXJpc3RpY1xuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBzZXRDaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbihvdXRwdXQsIHZhbHVlLCBvcHRpb25hbENoYXJhY3RlcmlzdGljLCBwcmVjaXNpb24pIHtcbiAgICBsZXQgcmVzdWx0ID0gb3V0cHV0O1xuICAgIGxldCBbY3VycmVudENoYXJhY3RlcmlzdGljLCBjdXJyZW50TWFudGlzc2FdID0gcmVzdWx0LnRvU3RyaW5nKCkuc3BsaXQoXCIuXCIpO1xuXG4gICAgaWYgKGN1cnJlbnRDaGFyYWN0ZXJpc3RpYy5tYXRjaCgvXi0/MCQvKSAmJiBvcHRpb25hbENoYXJhY3RlcmlzdGljKSB7XG4gICAgICAgIGlmICghY3VycmVudE1hbnRpc3NhKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudENoYXJhY3RlcmlzdGljLnJlcGxhY2UoXCIwXCIsIFwiXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGAke2N1cnJlbnRDaGFyYWN0ZXJpc3RpYy5yZXBsYWNlKFwiMFwiLCBcIlwiKX0uJHtjdXJyZW50TWFudGlzc2F9YDtcbiAgICB9XG5cbiAgICBjb25zdCBoYXNOZWdhdGl2ZVNpZ24gPSB2YWx1ZSA8IDAgJiYgY3VycmVudENoYXJhY3RlcmlzdGljLmluZGV4T2YoXCItXCIpID09PSAwO1xuICAgIGlmIChoYXNOZWdhdGl2ZVNpZ24pIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgbmVnYXRpdmUgc2lnblxuICAgICAgICAgICAgY3VycmVudENoYXJhY3RlcmlzdGljID0gY3VycmVudENoYXJhY3RlcmlzdGljLnNsaWNlKDEpO1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnNsaWNlKDEpO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50Q2hhcmFjdGVyaXN0aWMubGVuZ3RoIDwgcHJlY2lzaW9uKSB7XG4gICAgICAgIGxldCBtaXNzaW5nWmVyb3MgPSBwcmVjaXNpb24gLSBjdXJyZW50Q2hhcmFjdGVyaXN0aWMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1pc3NpbmdaZXJvczsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBgMCR7cmVzdWx0fWA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaGFzTmVnYXRpdmVTaWduKSB7XG4gICAgICAgIC8vIEFkZCBiYWNrIHRoZSBtaW51cyBzaWduXG4gICAgICAgIHJlc3VsdCA9IGAtJHtyZXN1bHR9YDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC50b1N0cmluZygpO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgaW5kZXhlcyB3aGVyZSBhcmUgdGhlIGdyb3VwIHNlcGFyYXRpb25zIGFmdGVyIHNwbGl0dGluZ1xuICogYHRvdGFsTGVuZ3RoYCBpbiBncm91cCBvZiBgZ3JvdXBTaXplYCBzaXplLlxuICogSW1wb3J0YW50OiB3ZSBzdGFydCBncm91cGluZyBmcm9tIHRoZSByaWdodCBoYW5kIHNpZGUuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHRvdGFsTGVuZ3RoIC0gdG90YWwgbGVuZ3RoIG9mIHRoZSBjaGFyYWN0ZXJpc3RpYyB0byBzcGxpdFxuICogQHBhcmFtIHtudW1iZXJ9IGdyb3VwU2l6ZSAtIGxlbmd0aCBvZiBlYWNoIGdyb3VwXG4gKiBAcmV0dXJuIHtbbnVtYmVyXX1cbiAqL1xuZnVuY3Rpb24gaW5kZXhlc09mR3JvdXBTcGFjZXModG90YWxMZW5ndGgsIGdyb3VwU2l6ZSkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBsZXQgY291bnRlciA9IDA7XG4gICAgZm9yIChsZXQgaSA9IHRvdGFsTGVuZ3RoOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIGlmIChjb3VudGVyID09PSBncm91cFNpemUpIHtcbiAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0KGkpO1xuICAgICAgICAgICAgY291bnRlciA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgY291bnRlcisrO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmVwbGFjZSB0aGUgZGVjaW1hbCBzZXBhcmF0b3Igd2l0aCBERUNJTUFMU0VQQVJBVE9SIGFuZCBpbnNlcnQgdGhvdXNhbmRcbiAqIHNlcGFyYXRvcnMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgYmVpbmcgY3VycmVudGx5IGZvcm1hdHRlZFxuICogQHBhcmFtIHtib29sZWFufSB0aG91c2FuZFNlcGFyYXRlZCAtIGB0cnVlYCBpZiB0aGUgY2hhcmFjdGVyaXN0aWMgbXVzdCBiZSBzZXBhcmF0ZWRcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gZGVjaW1hbFNlcGFyYXRvciAtIHN0cmluZyB0byB1c2UgYXMgZGVjaW1hbCBzZXBhcmF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gcmVwbGFjZURlbGltaXRlcnMob3V0cHV0LCB2YWx1ZSwgdGhvdXNhbmRTZXBhcmF0ZWQsIHN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yKSB7XG4gICAgbGV0IGRlbGltaXRlcnMgPSBzdGF0ZS5jdXJyZW50RGVsaW1pdGVycygpO1xuICAgIGxldCB0aG91c2FuZFNlcGFyYXRvciA9IGRlbGltaXRlcnMudGhvdXNhbmRzO1xuICAgIGRlY2ltYWxTZXBhcmF0b3IgPSBkZWNpbWFsU2VwYXJhdG9yIHx8IGRlbGltaXRlcnMuZGVjaW1hbDtcbiAgICBsZXQgdGhvdXNhbmRzU2l6ZSA9IGRlbGltaXRlcnMudGhvdXNhbmRzU2l6ZSB8fCAzO1xuXG4gICAgbGV0IHJlc3VsdCA9IG91dHB1dC50b1N0cmluZygpO1xuICAgIGxldCBjaGFyYWN0ZXJpc3RpYyA9IHJlc3VsdC5zcGxpdChcIi5cIilbMF07XG4gICAgbGV0IG1hbnRpc3NhID0gcmVzdWx0LnNwbGl0KFwiLlwiKVsxXTtcbiAgICBjb25zdCBoYXNOZWdhdGl2ZVNpZ24gPSB2YWx1ZSA8IDAgJiYgY2hhcmFjdGVyaXN0aWMuaW5kZXhPZihcIi1cIikgPT09IDA7XG5cbiAgICBpZiAodGhvdXNhbmRTZXBhcmF0ZWQpIHtcbiAgICAgICAgaWYgKGhhc05lZ2F0aXZlU2lnbikge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBuZWdhdGl2ZSBzaWduXG4gICAgICAgICAgICBjaGFyYWN0ZXJpc3RpYyA9IGNoYXJhY3RlcmlzdGljLnNsaWNlKDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGluZGV4ZXNUb0luc2VydFRob3VzYW5kRGVsaW1pdGVycyA9IGluZGV4ZXNPZkdyb3VwU3BhY2VzKGNoYXJhY3RlcmlzdGljLmxlbmd0aCwgdGhvdXNhbmRzU2l6ZSk7XG4gICAgICAgIGluZGV4ZXNUb0luc2VydFRob3VzYW5kRGVsaW1pdGVycy5mb3JFYWNoKChwb3NpdGlvbiwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNoYXJhY3RlcmlzdGljID0gY2hhcmFjdGVyaXN0aWMuc2xpY2UoMCwgcG9zaXRpb24gKyBpbmRleCkgKyB0aG91c2FuZFNlcGFyYXRvciArIGNoYXJhY3RlcmlzdGljLnNsaWNlKHBvc2l0aW9uICsgaW5kZXgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoaGFzTmVnYXRpdmVTaWduKSB7XG4gICAgICAgICAgICAvLyBBZGQgYmFjayB0aGUgbmVnYXRpdmUgc2lnblxuICAgICAgICAgICAgY2hhcmFjdGVyaXN0aWMgPSBgLSR7Y2hhcmFjdGVyaXN0aWN9YDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghbWFudGlzc2EpIHtcbiAgICAgICAgcmVzdWx0ID0gY2hhcmFjdGVyaXN0aWM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gY2hhcmFjdGVyaXN0aWMgKyBkZWNpbWFsU2VwYXJhdG9yICsgbWFudGlzc2E7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogSW5zZXJ0IHRoZSBwcm92aWRlZCBBQkJSRVZJQVRJT04gYXQgdGhlIGVuZCBvZiBPVVRQVVQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gYWJicmV2aWF0aW9uIC0gYWJicmV2aWF0aW9uIHRvIGFwcGVuZFxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0QWJicmV2aWF0aW9uKG91dHB1dCwgYWJicmV2aWF0aW9uKSB7XG4gICAgcmV0dXJuIG91dHB1dCArIGFiYnJldmlhdGlvbjtcbn1cblxuLyoqXG4gKiBJbnNlcnQgdGhlIHBvc2l0aXZlL25lZ2F0aXZlIHNpZ24gYWNjb3JkaW5nIHRvIHRoZSBORUdBVElWRSBmbGFnLlxuICogSWYgdGhlIHZhbHVlIGlzIG5lZ2F0aXZlIGJ1dCBzdGlsbCBvdXRwdXQgYXMgMCwgdGhlIG5lZ2F0aXZlIHNpZ24gaXMgcmVtb3ZlZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciBiZWluZyBjdXJyZW50bHkgZm9ybWF0dGVkXG4gKiBAcGFyYW0ge3N0cmluZ30gbmVnYXRpdmUgLSBmbGFnIGZvciB0aGUgbmVnYXRpdmUgZm9ybSAoXCJzaWduXCIgb3IgXCJwYXJlbnRoZXNpc1wiKVxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0U2lnbihvdXRwdXQsIHZhbHVlLCBuZWdhdGl2ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGlmICgrb3V0cHV0ID09PSAwKSB7XG4gICAgICAgIHJldHVybiBvdXRwdXQucmVwbGFjZShcIi1cIiwgXCJcIik7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlID4gMCkge1xuICAgICAgICByZXR1cm4gYCske291dHB1dH1gO1xuICAgIH1cblxuICAgIGlmIChuZWdhdGl2ZSA9PT0gXCJzaWduXCIpIHtcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICByZXR1cm4gYCgke291dHB1dC5yZXBsYWNlKFwiLVwiLCBcIlwiKX0pYDtcbn1cblxuLyoqXG4gKiBJbnNlcnQgdGhlIHByb3ZpZGVkIFBSRUZJWCBhdCB0aGUgc3RhcnQgb2YgT1VUUFVULlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIGFiYnJldmlhdGlvbiB0byBwcmVwZW5kXG4gKiBAcmV0dXJuIHsqfVxuICovXG5mdW5jdGlvbiBpbnNlcnRQcmVmaXgob3V0cHV0LCBwcmVmaXgpIHtcbiAgICByZXR1cm4gcHJlZml4ICsgb3V0cHV0O1xufVxuXG4vKipcbiAqIEluc2VydCB0aGUgcHJvdmlkZWQgUE9TVEZJWCBhdCB0aGUgZW5kIG9mIE9VVFBVVC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBwb3N0Zml4IC0gYWJicmV2aWF0aW9uIHRvIGFwcGVuZFxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0UG9zdGZpeChvdXRwdXQsIHBvc3RmaXgpIHtcbiAgICByZXR1cm4gb3V0cHV0ICsgcG9zdGZpeDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGEgbnVtYmVyIHVzaW5nIHRoZSBQUk9WSURFREZPUk1BVCxcbiAqIGFuZCB0aGUgU1RBVEUuXG4gKiBUaGlzIGlzIHRoZSBrZXkgbWV0aG9kIG9mIHRoZSBmcmFtZXdvcmshXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gW3Byb3ZpZGVkRm9ybWF0XSAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gZGVjaW1hbFNlcGFyYXRvciAtIHN0cmluZyB0byB1c2UgYXMgZGVjaW1hbCBzZXBhcmF0b3JcbiAqIEBwYXJhbSB7e319IGRlZmF1bHRzIC0gU2V0IG9mIGRlZmF1bHQgdmFsdWVzIHVzZWQgZm9yIGZvcm1hdHRpbmdcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0TnVtYmVyKHsgaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSA9IGdsb2JhbFN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yLCBkZWZhdWx0cyA9IHN0YXRlLmN1cnJlbnREZWZhdWx0cygpIH0pIHtcbiAgICBsZXQgdmFsdWUgPSBpbnN0YW5jZS5fdmFsdWU7XG5cbiAgICBpZiAodmFsdWUgPT09IDAgJiYgc3RhdGUuaGFzWmVyb0Zvcm1hdCgpKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5nZXRaZXJvRm9ybWF0KCk7XG4gICAgfVxuXG4gICAgaWYgKCFpc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgZGVmYXVsdHMsIHByb3ZpZGVkRm9ybWF0KTtcblxuICAgIGxldCB0b3RhbExlbmd0aCA9IG9wdGlvbnMudG90YWxMZW5ndGg7XG4gICAgbGV0IGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uID0gdG90YWxMZW5ndGggPyAwIDogb3B0aW9ucy5jaGFyYWN0ZXJpc3RpYztcbiAgICBsZXQgb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYyA9IG9wdGlvbnMub3B0aW9uYWxDaGFyYWN0ZXJpc3RpYztcbiAgICBsZXQgZm9yY2VBdmVyYWdlID0gb3B0aW9ucy5mb3JjZUF2ZXJhZ2U7XG4gICAgbGV0IGxvd1ByZWNpc2lvbiA9IG9wdGlvbnMubG93UHJlY2lzaW9uO1xuICAgIGxldCBhdmVyYWdlID0gISF0b3RhbExlbmd0aCB8fCAhIWZvcmNlQXZlcmFnZSB8fCBvcHRpb25zLmF2ZXJhZ2U7XG5cbiAgICAvLyBkZWZhdWx0IHdoZW4gYXZlcmFnaW5nIGlzIHRvIGNob3Agb2ZmIGRlY2ltYWxzXG4gICAgbGV0IG1hbnRpc3NhUHJlY2lzaW9uID0gdG90YWxMZW5ndGggPyAtMSA6IChhdmVyYWdlICYmIHByb3ZpZGVkRm9ybWF0Lm1hbnRpc3NhID09PSB1bmRlZmluZWQgPyAwIDogb3B0aW9ucy5tYW50aXNzYSk7XG4gICAgbGV0IG9wdGlvbmFsTWFudGlzc2EgPSB0b3RhbExlbmd0aCA/IGZhbHNlIDogKHByb3ZpZGVkRm9ybWF0Lm9wdGlvbmFsTWFudGlzc2EgPT09IHVuZGVmaW5lZCA/IG1hbnRpc3NhUHJlY2lzaW9uID09PSAtMSA6IG9wdGlvbnMub3B0aW9uYWxNYW50aXNzYSk7XG4gICAgbGV0IHRyaW1NYW50aXNzYSA9IG9wdGlvbnMudHJpbU1hbnRpc3NhO1xuICAgIGxldCB0aG91c2FuZFNlcGFyYXRlZCA9IG9wdGlvbnMudGhvdXNhbmRTZXBhcmF0ZWQ7XG4gICAgbGV0IHNwYWNlU2VwYXJhdGVkID0gb3B0aW9ucy5zcGFjZVNlcGFyYXRlZDtcbiAgICBsZXQgbmVnYXRpdmUgPSBvcHRpb25zLm5lZ2F0aXZlO1xuICAgIGxldCBmb3JjZVNpZ24gPSBvcHRpb25zLmZvcmNlU2lnbjtcbiAgICBsZXQgZXhwb25lbnRpYWwgPSBvcHRpb25zLmV4cG9uZW50aWFsO1xuICAgIGxldCByb3VuZGluZ0Z1bmN0aW9uID0gb3B0aW9ucy5yb3VuZGluZ0Z1bmN0aW9uO1xuXG4gICAgbGV0IGFiYnJldmlhdGlvbiA9IFwiXCI7XG4gICAgaWYgKGF2ZXJhZ2UpIHtcbiAgICAgICAgbGV0IGRhdGEgPSBjb21wdXRlQXZlcmFnZSh7XG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGZvcmNlQXZlcmFnZSxcbiAgICAgICAgICAgIGxvd1ByZWNpc2lvbixcbiAgICAgICAgICAgIGFiYnJldmlhdGlvbnM6IHN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zKCksXG4gICAgICAgICAgICBzcGFjZVNlcGFyYXRlZCxcbiAgICAgICAgICAgIHJvdW5kaW5nRnVuY3Rpb24sXG4gICAgICAgICAgICB0b3RhbExlbmd0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YWx1ZSA9IGRhdGEudmFsdWU7XG4gICAgICAgIGFiYnJldmlhdGlvbiArPSBkYXRhLmFiYnJldmlhdGlvbjtcblxuICAgICAgICBpZiAodG90YWxMZW5ndGgpIHtcbiAgICAgICAgICAgIG1hbnRpc3NhUHJlY2lzaW9uID0gZGF0YS5tYW50aXNzYVByZWNpc2lvbjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChleHBvbmVudGlhbCkge1xuICAgICAgICBsZXQgZGF0YSA9IGNvbXB1dGVFeHBvbmVudGlhbCh7XG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhbHVlID0gZGF0YS52YWx1ZTtcbiAgICAgICAgYWJicmV2aWF0aW9uID0gZGF0YS5hYmJyZXZpYXRpb24gKyBhYmJyZXZpYXRpb247XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dCA9IHNldE1hbnRpc3NhUHJlY2lzaW9uKHZhbHVlLnRvU3RyaW5nKCksIHZhbHVlLCBvcHRpb25hbE1hbnRpc3NhLCBtYW50aXNzYVByZWNpc2lvbiwgdHJpbU1hbnRpc3NhLCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICBvdXRwdXQgPSBzZXRDaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbihvdXRwdXQsIHZhbHVlLCBvcHRpb25hbENoYXJhY3RlcmlzdGljLCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbik7XG4gICAgb3V0cHV0ID0gcmVwbGFjZURlbGltaXRlcnMob3V0cHV0LCB2YWx1ZSwgdGhvdXNhbmRTZXBhcmF0ZWQsIHN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yKTtcblxuICAgIGlmIChhdmVyYWdlIHx8IGV4cG9uZW50aWFsKSB7XG4gICAgICAgIG91dHB1dCA9IGluc2VydEFiYnJldmlhdGlvbihvdXRwdXQsIGFiYnJldmlhdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKGZvcmNlU2lnbiB8fCB2YWx1ZSA8IDApIHtcbiAgICAgICAgb3V0cHV0ID0gaW5zZXJ0U2lnbihvdXRwdXQsIHZhbHVlLCBuZWdhdGl2ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBJZiBGT1JNQVQgaXMgbm9uLW51bGwgYW5kIG5vdCBqdXN0IGFuIG91dHB1dCwgcmV0dXJuIEZPUk1BVC5cbiAqIFJldHVybiBERUZBVUxURk9STUFUIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0gcHJvdmlkZWRGb3JtYXRcbiAqIEBwYXJhbSBkZWZhdWx0Rm9ybWF0XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZGVmYXVsdEZvcm1hdCkge1xuICAgIGlmICghcHJvdmlkZWRGb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRGb3JtYXQ7XG4gICAgfVxuXG4gICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwcm92aWRlZEZvcm1hdCk7XG4gICAgaWYgKGtleXMubGVuZ3RoID09PSAxICYmIGtleXNbMF0gPT09IFwib3V0cHV0XCIpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRGb3JtYXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3ZpZGVkRm9ybWF0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IChudW1icm8pID0+ICh7XG4gICAgZm9ybWF0OiAoLi4uYXJncykgPT4gZm9ybWF0KC4uLmFyZ3MsIG51bWJybyksXG4gICAgZ2V0Qnl0ZVVuaXQ6ICguLi5hcmdzKSA9PiBnZXRCeXRlVW5pdCguLi5hcmdzLCBudW1icm8pLFxuICAgIGdldEJpbmFyeUJ5dGVVbml0OiAoLi4uYXJncykgPT4gZ2V0QmluYXJ5Qnl0ZVVuaXQoLi4uYXJncywgbnVtYnJvKSxcbiAgICBnZXREZWNpbWFsQnl0ZVVuaXQ6ICguLi5hcmdzKSA9PiBnZXREZWNpbWFsQnl0ZVVuaXQoLi4uYXJncywgbnVtYnJvKSxcbiAgICBmb3JtYXRPckRlZmF1bHRcbn0pO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IGVuVVMgPSByZXF1aXJlKFwiLi9lbi1VU1wiKTtcbmNvbnN0IHZhbGlkYXRpbmcgPSByZXF1aXJlKFwiLi92YWxpZGF0aW5nXCIpO1xuY29uc3QgcGFyc2luZyA9IHJlcXVpcmUoXCIuL3BhcnNpbmdcIik7XG5cbmxldCBzdGF0ZSA9IHt9O1xuXG5sZXQgY3VycmVudExhbmd1YWdlVGFnID0gdW5kZWZpbmVkO1xubGV0IGxhbmd1YWdlcyA9IHt9O1xuXG5sZXQgemVyb0Zvcm1hdCA9IG51bGw7XG5cbmxldCBnbG9iYWxEZWZhdWx0cyA9IHt9O1xuXG5mdW5jdGlvbiBjaG9vc2VMYW5ndWFnZSh0YWcpIHsgY3VycmVudExhbmd1YWdlVGFnID0gdGFnOyB9XG5cbmZ1bmN0aW9uIGN1cnJlbnRMYW5ndWFnZURhdGEoKSB7IHJldHVybiBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlVGFnXTsgfVxuXG4vKipcbiAqIFJldHVybiBhbGwgdGhlIHJlZ2lzdGVyIGxhbmd1YWdlc1xuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5sYW5ndWFnZXMgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBsYW5ndWFnZXMpO1xuXG4vL1xuLy8gQ3VycmVudCBsYW5ndWFnZSBhY2Nlc3NvcnNcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIHRhZ1xuICpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuc3RhdGUuY3VycmVudExhbmd1YWdlID0gKCkgPT4gY3VycmVudExhbmd1YWdlVGFnO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBieXRlcyBkYXRhXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRCeXRlcyA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5ieXRlcyB8fCB7fTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgY3VycmVuY3kgZGF0YVxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50Q3VycmVuY3kgPSAoKSA9PiBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkuY3VycmVuY3k7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIGFiYnJldmlhdGlvbnMgZGF0YVxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50QWJicmV2aWF0aW9ucyA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5hYmJyZXZpYXRpb25zO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBkZWxpbWl0ZXJzIGRhdGFcbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudERlbGltaXRlcnMgPSAoKSA9PiBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkuZGVsaW1pdGVycztcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgbGFuZ3VhZ2Ugb3JkaW5hbCBmdW5jdGlvblxuICpcbiAqIEByZXR1cm4ge2Z1bmN0aW9ufVxuICovXG5zdGF0ZS5jdXJyZW50T3JkaW5hbCA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5vcmRpbmFsO1xuXG4vL1xuLy8gRGVmYXVsdHNcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGZvcm1hdHRpbmcgZGVmYXVsdHMuXG4gKiBGaXJzdCB1c2UgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgZ2xvYmFsbHkgZGVmaW5lZCBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudERlZmF1bHRzID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudExhbmd1YWdlRGF0YSgpLmRlZmF1bHRzLCBnbG9iYWxEZWZhdWx0cyk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBvcmRpbmFsIGRlZmF1bHQtZm9ybWF0LlxuICogRmlyc3QgdXNlIHRoZSBjdXJyZW50IGxhbmd1YWdlIG9yZGluYWwgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgcmVndWxhciBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudE9yZGluYWxEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5vcmRpbmFsRm9ybWF0KTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGJ5dGUgZGVmYXVsdC1mb3JtYXQuXG4gKiBGaXJzdCB1c2UgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgYnl0ZSBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50Qnl0ZURlZmF1bHRGb3JtYXQgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZS5jdXJyZW50RGVmYXVsdHMoKSwgY3VycmVudExhbmd1YWdlRGF0YSgpLmJ5dGVGb3JtYXQpO1xuXG4vKipcbiAqIFJldHVybiB0aGUgcGVyY2VudGFnZSBkZWZhdWx0LWZvcm1hdC5cbiAqIEZpcnN0IHVzZSB0aGUgY3VycmVudCBsYW5ndWFnZSBwZXJjZW50YWdlIGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIHJlZ3VsYXIgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRQZXJjZW50YWdlRGVmYXVsdEZvcm1hdCA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLmN1cnJlbnREZWZhdWx0cygpLCBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkucGVyY2VudGFnZUZvcm1hdCk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW5jeSBkZWZhdWx0LWZvcm1hdC5cbiAqIEZpcnN0IHVzZSB0aGUgY3VycmVudCBsYW5ndWFnZSBjdXJyZW5jeSBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50Q3VycmVuY3lEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5jdXJyZW5jeUZvcm1hdCk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSB0aW1lIGRlZmF1bHQtZm9ybWF0LlxuICogRmlyc3QgdXNlIHRoZSBjdXJyZW50IGxhbmd1YWdlIGN1cnJlbmN5IGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIHJlZ3VsYXIgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRUaW1lRGVmYXVsdEZvcm1hdCA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLmN1cnJlbnREZWZhdWx0cygpLCBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkudGltZUZvcm1hdCk7XG5cbi8qKlxuICogU2V0IHRoZSBnbG9iYWwgZm9ybWF0dGluZyBkZWZhdWx0cy5cbiAqXG4gKiBAcGFyYW0ge3t9fHN0cmluZ30gZm9ybWF0IC0gZm9ybWF0dGluZyBvcHRpb25zIHRvIHVzZSBhcyBkZWZhdWx0c1xuICovXG5zdGF0ZS5zZXREZWZhdWx0cyA9IChmb3JtYXQpID0+IHtcbiAgICBmb3JtYXQgPSBwYXJzaW5nLnBhcnNlRm9ybWF0KGZvcm1hdCk7XG4gICAgaWYgKHZhbGlkYXRpbmcudmFsaWRhdGVGb3JtYXQoZm9ybWF0KSkge1xuICAgICAgICBnbG9iYWxEZWZhdWx0cyA9IGZvcm1hdDtcbiAgICB9XG59O1xuXG4vL1xuLy8gWmVybyBmb3JtYXRcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBmb3JtYXQgc3RyaW5nIGZvciAwLlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuc3RhdGUuZ2V0WmVyb0Zvcm1hdCA9ICgpID0+IHplcm9Gb3JtYXQ7XG5cbi8qKlxuICogU2V0IGEgU1RSSU5HIHRvIG91dHB1dCB3aGVuIHRoZSB2YWx1ZSBpcyAwLlxuICpcbiAqIEBwYXJhbSB7e318c3RyaW5nfSBzdHJpbmcgLSBzdHJpbmcgdG8gc2V0XG4gKi9cbnN0YXRlLnNldFplcm9Gb3JtYXQgPSAoc3RyaW5nKSA9PiB6ZXJvRm9ybWF0ID0gdHlwZW9mKHN0cmluZykgPT09IFwic3RyaW5nXCIgPyBzdHJpbmcgOiBudWxsO1xuXG4vKipcbiAqIFJldHVybiB0cnVlIGlmIGEgZm9ybWF0IGZvciAwIGhhcyBiZWVuIHNldCBhbHJlYWR5LlxuICpcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbnN0YXRlLmhhc1plcm9Gb3JtYXQgPSAoKSA9PiB6ZXJvRm9ybWF0ICE9PSBudWxsO1xuXG4vL1xuLy8gR2V0dGVycy9TZXR0ZXJzXG4vL1xuXG4vKipcbiAqIFJldHVybiB0aGUgbGFuZ3VhZ2UgZGF0YSBmb3IgdGhlIHByb3ZpZGVkIFRBRy5cbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBkYXRhIGlmIG5vIHRhZyBpcyBwcm92aWRlZC5cbiAqXG4gKiBUaHJvdyBhbiBlcnJvciBpZiB0aGUgdGFnIGRvZXNuJ3QgbWF0Y2ggYW55IHJlZ2lzdGVyZWQgbGFuZ3VhZ2UuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFt0YWddIC0gbGFuZ3VhZ2UgdGFnIG9mIGEgcmVnaXN0ZXJlZCBsYW5ndWFnZVxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmxhbmd1YWdlRGF0YSA9ICh0YWcpID0+IHtcbiAgICBpZiAodGFnKSB7XG4gICAgICAgIGlmIChsYW5ndWFnZXNbdGFnXSkge1xuICAgICAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1t0YWddO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0YWcgXCIke3RhZ31cImApO1xuICAgIH1cblxuICAgIHJldHVybiBjdXJyZW50TGFuZ3VhZ2VEYXRhKCk7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIHRoZSBwcm92aWRlZCBEQVRBIGFzIGEgbGFuZ3VhZ2UgaWYgYW5kIG9ubHkgaWYgdGhlIGRhdGEgaXMgdmFsaWQuXG4gKiBJZiB0aGUgZGF0YSBpcyBub3QgdmFsaWQsIGFuIGVycm9yIGlzIHRocm93bi5cbiAqXG4gKiBXaGVuIFVTRUxBTkdVQUdFIGlzIHRydWUsIHRoZSByZWdpc3RlcmVkIGxhbmd1YWdlIGlzIHRoZW4gdXNlZC5cbiAqXG4gKiBAcGFyYW0ge3t9fSBkYXRhIC0gbGFuZ3VhZ2UgZGF0YSB0byByZWdpc3RlclxuICogQHBhcmFtIHtib29sZWFufSBbdXNlTGFuZ3VhZ2VdIC0gYHRydWVgIGlmIHRoZSBwcm92aWRlZCBkYXRhIHNob3VsZCBiZWNvbWUgdGhlIGN1cnJlbnQgbGFuZ3VhZ2VcbiAqL1xuc3RhdGUucmVnaXN0ZXJMYW5ndWFnZSA9IChkYXRhLCB1c2VMYW5ndWFnZSA9IGZhbHNlKSA9PiB7XG4gICAgaWYgKCF2YWxpZGF0aW5nLnZhbGlkYXRlTGFuZ3VhZ2UoZGF0YSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBsYW5ndWFnZSBkYXRhXCIpO1xuICAgIH1cblxuICAgIGxhbmd1YWdlc1tkYXRhLmxhbmd1YWdlVGFnXSA9IGRhdGE7XG5cbiAgICBpZiAodXNlTGFuZ3VhZ2UpIHtcbiAgICAgICAgY2hvb3NlTGFuZ3VhZ2UoZGF0YS5sYW5ndWFnZVRhZyk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBTZXQgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgYWNjb3JkaW5nIHRvIFRBRy5cbiAqIElmIFRBRyBkb2Vzbid0IG1hdGNoIGEgcmVnaXN0ZXJlZCBsYW5ndWFnZSwgYW5vdGhlciBsYW5ndWFnZSBtYXRjaGluZ1xuICogdGhlIFwibGFuZ3VhZ2VcIiBwYXJ0IG9mIHRoZSB0YWcgKGFjY29yZGluZyB0byBCQ1A0NzogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9yZmMvYmNwL2JjcDQ3LnR4dCkuXG4gKiBJZiBub25lLCB0aGUgRkFMTEJBQ0tUQUcgaXMgdXNlZC4gSWYgdGhlIEZBTExCQUNLVEFHIGRvZXNuJ3QgbWF0Y2ggYSByZWdpc3RlciBsYW5ndWFnZSxcbiAqIGBlbi1VU2AgaXMgZmluYWxseSB1c2VkLlxuICpcbiAqIEBwYXJhbSB0YWdcbiAqIEBwYXJhbSBmYWxsYmFja1RhZ1xuICovXG5zdGF0ZS5zZXRMYW5ndWFnZSA9ICh0YWcsIGZhbGxiYWNrVGFnID0gZW5VUy5sYW5ndWFnZVRhZykgPT4ge1xuICAgIGlmICghbGFuZ3VhZ2VzW3RhZ10pIHtcbiAgICAgICAgbGV0IHN1ZmZpeCA9IHRhZy5zcGxpdChcIi1cIilbMF07XG5cbiAgICAgICAgbGV0IG1hdGNoaW5nTGFuZ3VhZ2VUYWcgPSBPYmplY3Qua2V5cyhsYW5ndWFnZXMpLmZpbmQoZWFjaCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZWFjaC5zcGxpdChcIi1cIilbMF0gPT09IHN1ZmZpeDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFsYW5ndWFnZXNbbWF0Y2hpbmdMYW5ndWFnZVRhZ10pIHtcbiAgICAgICAgICAgIGNob29zZUxhbmd1YWdlKGZhbGxiYWNrVGFnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNob29zZUxhbmd1YWdlKG1hdGNoaW5nTGFuZ3VhZ2VUYWcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY2hvb3NlTGFuZ3VhZ2UodGFnKTtcbn07XG5cbnN0YXRlLnJlZ2lzdGVyTGFuZ3VhZ2UoZW5VUyk7XG5jdXJyZW50TGFuZ3VhZ2VUYWcgPSBlblVTLmxhbmd1YWdlVGFnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRlO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogTG9hZCBsYW5ndWFnZXMgbWF0Y2hpbmcgVEFHUy4gU2lsZW50bHkgcGFzcyBvdmVyIHRoZSBmYWlsaW5nIGxvYWQuXG4gKlxuICogV2UgYXNzdW1lIGhlcmUgdGhhdCB3ZSBhcmUgaW4gYSBub2RlIGVudmlyb25tZW50LCBzbyB3ZSBkb24ndCBjaGVjayBmb3IgaXQuXG4gKiBAcGFyYW0ge1tTdHJpbmddfSB0YWdzIC0gbGlzdCBvZiB0YWdzIHRvIGxvYWRcbiAqIEBwYXJhbSB7TnVtYnJvfSBudW1icm8gLSB0aGUgbnVtYnJvIHNpbmdsZXRvblxuICovXG5mdW5jdGlvbiBsb2FkTGFuZ3VhZ2VzSW5Ob2RlKHRhZ3MsIG51bWJybykge1xuICAgIHRhZ3MuZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgICAgIGxldCBkYXRhID0gdW5kZWZpbmVkO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGF0YSA9IHJlcXVpcmUoYC4uL2xhbmd1YWdlcy8ke3RhZ31gKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVW5hYmxlIHRvIGxvYWQgXCIke3RhZ31cIi4gTm8gbWF0Y2hpbmcgbGFuZ3VhZ2UgZmlsZSBmb3VuZC5gKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgbnVtYnJvLnJlZ2lzdGVyTGFuZ3VhZ2UoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAobnVtYnJvKSA9PiAoe1xuICAgIGxvYWRMYW5ndWFnZXNJbk5vZGU6ICh0YWdzKSA9PiBsb2FkTGFuZ3VhZ2VzSW5Ob2RlKHRhZ3MsIG51bWJybylcbn0pO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IEJpZ051bWJlciA9IHJlcXVpcmUoXCJiaWdudW1iZXIuanNcIik7XG5cbi8qKlxuICogQWRkIGEgbnVtYmVyIG9yIGEgbnVtYnJvIHRvIE4uXG4gKlxuICogQHBhcmFtIHtOdW1icm99IG4gLSBhdWdlbmRcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBhZGRlbmRcbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gYWRkKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUucGx1cyhvdGhlclZhbHVlKS50b051bWJlcigpO1xuICAgIHJldHVybiBuO1xufVxuXG4vKipcbiAqIFN1YnRyYWN0IGEgbnVtYmVyIG9yIGEgbnVtYnJvIGZyb20gTi5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gbiAtIG1pbnVlbmRcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBzdWJ0cmFoZW5kXG4gKiBAcGFyYW0ge251bWJyb30gbnVtYnJvIC0gbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7TnVtYnJvfSBuXG4gKi9cbmZ1bmN0aW9uIHN1YnRyYWN0KG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUubWludXMob3RoZXJWYWx1ZSkudG9OdW1iZXIoKTtcbiAgICByZXR1cm4gbjtcbn1cblxuLyoqXG4gKiBNdWx0aXBseSBOIGJ5IGEgbnVtYmVyIG9yIGEgbnVtYnJvLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuIC0gbXVsdGlwbGljYW5kXG4gKiBAcGFyYW0ge251bWJlcnxOdW1icm99IG90aGVyIC0gbXVsdGlwbGllclxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge051bWJyb30gblxuICovXG5mdW5jdGlvbiBtdWx0aXBseShuLCBvdGhlciwgbnVtYnJvKSB7XG4gICAgbGV0IHZhbHVlID0gbmV3IEJpZ051bWJlcihuLl92YWx1ZSk7XG4gICAgbGV0IG90aGVyVmFsdWUgPSBvdGhlcjtcblxuICAgIGlmIChudW1icm8uaXNOdW1icm8ob3RoZXIpKSB7XG4gICAgICAgIG90aGVyVmFsdWUgPSBvdGhlci5fdmFsdWU7XG4gICAgfVxuXG4gICAgb3RoZXJWYWx1ZSA9IG5ldyBCaWdOdW1iZXIob3RoZXJWYWx1ZSk7XG5cbiAgICBuLl92YWx1ZSA9IHZhbHVlLnRpbWVzKG90aGVyVmFsdWUpLnRvTnVtYmVyKCk7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogRGl2aWRlIE4gYnkgYSBudW1iZXIgb3IgYSBudW1icm8uXG4gKlxuICogQHBhcmFtIHtOdW1icm99IG4gLSBkaXZpZGVuZFxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlciAtIGRpdmlzb3JcbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gZGl2aWRlKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUuZGl2aWRlZEJ5KG90aGVyVmFsdWUpLnRvTnVtYmVyKCk7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogU2V0IE4gdG8gdGhlIE9USEVSIChvciB0aGUgdmFsdWUgb2YgT1RIRVIgd2hlbiBpdCdzIGEgbnVtYnJvIGluc3RhbmNlKS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gbiAtIG51bWJybyBpbnN0YW5jZSB0byBtdXRhdGVcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBuZXcgdmFsdWUgdG8gYXNzaWduIHRvIE5cbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gc2V0IChuLCBvdGhlciwgbnVtYnJvKSB7XG4gICAgbGV0IHZhbHVlID0gb3RoZXI7XG5cbiAgICBpZiAobnVtYnJvLmlzTnVtYnJvKG90aGVyKSkge1xuICAgICAgICB2YWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBuLl92YWx1ZSA9IHZhbHVlO1xuICAgIHJldHVybiBuO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgZGlzdGFuY2UgYmV0d2VlbiBOIGFuZCBPVEhFUi5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gblxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlclxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gZGlmZmVyZW5jZShuLCBvdGhlciwgbnVtYnJvKSB7XG4gICAgbGV0IGNsb25lID0gbnVtYnJvKG4uX3ZhbHVlKTtcbiAgICBzdWJ0cmFjdChjbG9uZSwgb3RoZXIsIG51bWJybyk7XG5cbiAgICByZXR1cm4gTWF0aC5hYnMoY2xvbmUuX3ZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBudW1icm8gPT4gKHtcbiAgICBhZGQ6IChuLCBvdGhlcikgPT4gYWRkKG4sIG90aGVyLCBudW1icm8pLFxuICAgIHN1YnRyYWN0OiAobiwgb3RoZXIpID0+IHN1YnRyYWN0KG4sIG90aGVyLCBudW1icm8pLFxuICAgIG11bHRpcGx5OiAobiwgb3RoZXIpID0+IG11bHRpcGx5KG4sIG90aGVyLCBudW1icm8pLFxuICAgIGRpdmlkZTogKG4sIG90aGVyKSA9PiBkaXZpZGUobiwgb3RoZXIsIG51bWJybyksXG4gICAgc2V0OiAobiwgb3RoZXIpID0+IHNldChuLCBvdGhlciwgbnVtYnJvKSxcbiAgICBkaWZmZXJlbmNlOiAobiwgb3RoZXIpID0+IGRpZmZlcmVuY2Uobiwgb3RoZXIsIG51bWJybyksXG4gICAgQmlnTnVtYmVyOiBCaWdOdW1iZXJcbn0pO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IFZFUlNJT04gPSBcIjIuMy4zXCI7XG5cbmNvbnN0IGdsb2JhbFN0YXRlID0gcmVxdWlyZShcIi4vZ2xvYmFsU3RhdGVcIik7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi92YWxpZGF0aW5nXCIpO1xuY29uc3QgbG9hZGVyID0gcmVxdWlyZShcIi4vbG9hZGluZ1wiKShudW1icm8pO1xuY29uc3QgdW5mb3JtYXR0ZXIgPSByZXF1aXJlKFwiLi91bmZvcm1hdHRpbmdcIik7XG5sZXQgZm9ybWF0dGVyID0gcmVxdWlyZShcIi4vZm9ybWF0dGluZ1wiKShudW1icm8pO1xubGV0IG1hbmlwdWxhdGUgPSByZXF1aXJlKFwiLi9tYW5pcHVsYXRpbmdcIikobnVtYnJvKTtcbmNvbnN0IHBhcnNpbmcgPSByZXF1aXJlKFwiLi9wYXJzaW5nXCIpO1xuXG5jbGFzcyBOdW1icm8ge1xuICAgIGNvbnN0cnVjdG9yKG51bWJlcikge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bWJlcjtcbiAgICB9XG5cbiAgICBjbG9uZSgpIHsgcmV0dXJuIG51bWJybyh0aGlzLl92YWx1ZSk7IH1cblxuICAgIGZvcm1hdChmb3JtYXQgPSB7fSkgeyByZXR1cm4gZm9ybWF0dGVyLmZvcm1hdCh0aGlzLCBmb3JtYXQpOyB9XG5cbiAgICBmb3JtYXRDdXJyZW5jeShmb3JtYXQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmb3JtYXQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IHBhcnNpbmcucGFyc2VGb3JtYXQoZm9ybWF0KTtcbiAgICAgICAgfVxuICAgICAgICBmb3JtYXQgPSBmb3JtYXR0ZXIuZm9ybWF0T3JEZWZhdWx0KGZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudEN1cnJlbmN5RGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgZm9ybWF0Lm91dHB1dCA9IFwiY3VycmVuY3lcIjtcbiAgICAgICAgcmV0dXJuIGZvcm1hdHRlci5mb3JtYXQodGhpcywgZm9ybWF0KTtcbiAgICB9XG5cbiAgICBmb3JtYXRUaW1lKGZvcm1hdCA9IHt9KSB7XG4gICAgICAgIGZvcm1hdC5vdXRwdXQgPSBcInRpbWVcIjtcbiAgICAgICAgcmV0dXJuIGZvcm1hdHRlci5mb3JtYXQodGhpcywgZm9ybWF0KTtcbiAgICB9XG5cbiAgICBiaW5hcnlCeXRlVW5pdHMoKSB7IHJldHVybiBmb3JtYXR0ZXIuZ2V0QmluYXJ5Qnl0ZVVuaXQodGhpcyk7fVxuXG4gICAgZGVjaW1hbEJ5dGVVbml0cygpIHsgcmV0dXJuIGZvcm1hdHRlci5nZXREZWNpbWFsQnl0ZVVuaXQodGhpcyk7fVxuXG4gICAgYnl0ZVVuaXRzKCkgeyByZXR1cm4gZm9ybWF0dGVyLmdldEJ5dGVVbml0KHRoaXMpO31cblxuICAgIGRpZmZlcmVuY2Uob3RoZXIpIHsgcmV0dXJuIG1hbmlwdWxhdGUuZGlmZmVyZW5jZSh0aGlzLCBvdGhlcik7IH1cblxuICAgIGFkZChvdGhlcikgeyByZXR1cm4gbWFuaXB1bGF0ZS5hZGQodGhpcywgb3RoZXIpOyB9XG5cbiAgICBzdWJ0cmFjdChvdGhlcikgeyByZXR1cm4gbWFuaXB1bGF0ZS5zdWJ0cmFjdCh0aGlzLCBvdGhlcik7IH1cblxuICAgIG11bHRpcGx5KG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLm11bHRpcGx5KHRoaXMsIG90aGVyKTsgfVxuXG4gICAgZGl2aWRlKG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLmRpdmlkZSh0aGlzLCBvdGhlcik7IH1cblxuICAgIHNldChpbnB1dCkgeyByZXR1cm4gbWFuaXB1bGF0ZS5zZXQodGhpcywgbm9ybWFsaXplSW5wdXQoaW5wdXQpKTsgfVxuXG4gICAgdmFsdWUoKSB7IHJldHVybiB0aGlzLl92YWx1ZTsgfVxuXG4gICAgdmFsdWVPZigpIHsgcmV0dXJuIHRoaXMuX3ZhbHVlOyB9XG59XG5cbi8qKlxuICogTWFrZSBpdHMgYmVzdCB0byBjb252ZXJ0IGlucHV0IGludG8gYSBudW1iZXIuXG4gKlxuICogQHBhcmFtIHtudW1icm98c3RyaW5nfG51bWJlcn0gaW5wdXQgLSBJbnB1dCB0byBjb252ZXJ0XG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUlucHV0KGlucHV0KSB7XG4gICAgbGV0IHJlc3VsdCA9IGlucHV0O1xuICAgIGlmIChudW1icm8uaXNOdW1icm8oaW5wdXQpKSB7XG4gICAgICAgIHJlc3VsdCA9IGlucHV0Ll92YWx1ZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXN1bHQgPSBudW1icm8udW5mb3JtYXQoaW5wdXQpO1xuICAgIH0gZWxzZSBpZiAoaXNOYU4oaW5wdXQpKSB7XG4gICAgICAgIHJlc3VsdCA9IE5hTjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBudW1icm8oaW5wdXQpIHtcbiAgICByZXR1cm4gbmV3IE51bWJybyhub3JtYWxpemVJbnB1dChpbnB1dCkpO1xufVxuXG5udW1icm8udmVyc2lvbiA9IFZFUlNJT047XG5cbm51bWJyby5pc051bWJybyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBOdW1icm87XG59O1xuXG4vL1xuLy8gYG51bWJyb2Agc3RhdGljIG1ldGhvZHNcbi8vXG5cbm51bWJyby5sYW5ndWFnZSA9IGdsb2JhbFN0YXRlLmN1cnJlbnRMYW5ndWFnZTtcbm51bWJyby5yZWdpc3Rlckxhbmd1YWdlID0gZ2xvYmFsU3RhdGUucmVnaXN0ZXJMYW5ndWFnZTtcbm51bWJyby5zZXRMYW5ndWFnZSA9IGdsb2JhbFN0YXRlLnNldExhbmd1YWdlO1xubnVtYnJvLmxhbmd1YWdlcyA9IGdsb2JhbFN0YXRlLmxhbmd1YWdlcztcbm51bWJyby5sYW5ndWFnZURhdGEgPSBnbG9iYWxTdGF0ZS5sYW5ndWFnZURhdGE7XG5udW1icm8uemVyb0Zvcm1hdCA9IGdsb2JhbFN0YXRlLnNldFplcm9Gb3JtYXQ7XG5udW1icm8uZGVmYXVsdEZvcm1hdCA9IGdsb2JhbFN0YXRlLmN1cnJlbnREZWZhdWx0cztcbm51bWJyby5zZXREZWZhdWx0cyA9IGdsb2JhbFN0YXRlLnNldERlZmF1bHRzO1xubnVtYnJvLmRlZmF1bHRDdXJyZW5jeUZvcm1hdCA9IGdsb2JhbFN0YXRlLmN1cnJlbnRDdXJyZW5jeURlZmF1bHRGb3JtYXQ7XG5udW1icm8udmFsaWRhdGUgPSB2YWxpZGF0b3IudmFsaWRhdGU7XG5udW1icm8ubG9hZExhbmd1YWdlc0luTm9kZSA9IGxvYWRlci5sb2FkTGFuZ3VhZ2VzSW5Ob2RlO1xubnVtYnJvLnVuZm9ybWF0ID0gdW5mb3JtYXR0ZXIudW5mb3JtYXQ7XG5udW1icm8uQmlnTnVtYmVyID0gbWFuaXB1bGF0ZS5CaWdOdW1iZXI7XG5cbm1vZHVsZS5leHBvcnRzID0gbnVtYnJvO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgYSBwcmVmaXguIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlUHJlZml4KHN0cmluZywgcmVzdWx0KSB7XG4gICAgbGV0IG1hdGNoID0gc3RyaW5nLm1hdGNoKC9eeyhbXn1dKil9Lyk7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJlc3VsdC5wcmVmaXggPSBtYXRjaFsxXTtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5zbGljZShtYXRjaFswXS5sZW5ndGgpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgYSBwb3N0Zml4LiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZVBvc3RmaXgoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBsZXQgbWF0Y2ggPSBzdHJpbmcubWF0Y2goL3soW159XSopfSQvKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LnBvc3RmaXggPSBtYXRjaFsxXTtcblxuICAgICAgICByZXR1cm4gc3RyaW5nLnNsaWNlKDAsIC1tYXRjaFswXS5sZW5ndGgpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIG91dHB1dCB2YWx1ZS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqL1xuZnVuY3Rpb24gcGFyc2VPdXRwdXQoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCIkXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQub3V0cHV0ID0gXCJjdXJyZW5jeVwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiJVwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwicGVyY2VudFwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiYmRcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImJ5dGVcIjtcbiAgICAgICAgcmVzdWx0LmJhc2UgPSBcImdlbmVyYWxcIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcImJcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImJ5dGVcIjtcbiAgICAgICAgcmVzdWx0LmJhc2UgPSBcImJpbmFyeVwiO1xuICAgICAgICByZXR1cm47XG5cbiAgICB9XG5cbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCJkXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQub3V0cHV0ID0gXCJieXRlXCI7XG4gICAgICAgIHJlc3VsdC5iYXNlID0gXCJkZWNpbWFsXCI7XG4gICAgICAgIHJldHVybjtcblxuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIjpcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcInRpbWVcIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIm9cIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcIm9yZGluYWxcIjtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIHRob3VzYW5kIHNlcGFyYXRlZCB2YWx1ZS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VUaG91c2FuZFNlcGFyYXRlZChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIixcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC50aG91c2FuZFNlcGFyYXRlZCA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIHRoZSBzcGFjZSBzZXBhcmF0ZWQgdmFsdWUuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlU3BhY2VTZXBhcmF0ZWQoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCIgXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuc3BhY2VTZXBhcmF0ZWQgPSB0cnVlO1xuICAgICAgICByZXN1bHQuc3BhY2VTZXBhcmF0ZWRDdXJyZW5jeSA9IHRydWU7XG5cbiAgICAgICAgaWYgKHJlc3VsdC5hdmVyYWdlIHx8IHJlc3VsdC5mb3JjZUF2ZXJhZ2UpIHtcbiAgICAgICAgICAgIHJlc3VsdC5zcGFjZVNlcGFyYXRlZEFiYnJldmlhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIHRvdGFsIGxlbmd0aC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VUb3RhbExlbmd0aChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGxldCBtYXRjaCA9IHN0cmluZy5tYXRjaCgvWzEtOV0rWzAtOV0qLyk7XG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LnRvdGFsTGVuZ3RoID0gK21hdGNoWzBdO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgY2hhcmFjdGVyaXN0aWMgbGVuZ3RoLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUNoYXJhY3RlcmlzdGljKHN0cmluZywgcmVzdWx0KSB7XG4gICAgbGV0IGNoYXJhY3RlcmlzdGljID0gc3RyaW5nLnNwbGl0KFwiLlwiKVswXTtcbiAgICBsZXQgbWF0Y2ggPSBjaGFyYWN0ZXJpc3RpYy5tYXRjaCgvMCsvKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LmNoYXJhY3RlcmlzdGljID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgbWFudGlzc2EgbGVuZ3RoLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZU1hbnRpc3NhKHN0cmluZywgcmVzdWx0KSB7XG4gICAgbGV0IG1hbnRpc3NhID0gc3RyaW5nLnNwbGl0KFwiLlwiKVsxXTtcbiAgICBpZiAobWFudGlzc2EpIHtcbiAgICAgICAgbGV0IG1hdGNoID0gbWFudGlzc2EubWF0Y2goLzArLyk7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgcmVzdWx0Lm1hbnRpc3NhID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIGEgdHJpbW1lZCBtYW50aXNzYS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqL1xuZnVuY3Rpb24gcGFyc2VUcmltTWFudGlzc2Eoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBjb25zdCBtYW50aXNzYSA9IHN0cmluZy5zcGxpdChcIi5cIilbMV07XG4gICAgaWYgKG1hbnRpc3NhKSB7XG4gICAgICAgIHJlc3VsdC50cmltTWFudGlzc2EgPSBtYW50aXNzYS5pbmRleE9mKFwiW1wiKSAhPT0gLTE7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIHRoZSBhdmVyYWdlIHZhbHVlLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUF2ZXJhZ2Uoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCJhXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuYXZlcmFnZSA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIGEgZm9yY2VkIGF2ZXJhZ2UgcHJlY2lzaW9uLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUZvcmNlQXZlcmFnZShzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIktcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5mb3JjZUF2ZXJhZ2UgPSBcInRob3VzYW5kXCI7XG4gICAgfSBlbHNlIGlmIChzdHJpbmcuaW5kZXhPZihcIk1cIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5mb3JjZUF2ZXJhZ2UgPSBcIm1pbGxpb25cIjtcbiAgICB9IGVsc2UgaWYgKHN0cmluZy5pbmRleE9mKFwiQlwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LmZvcmNlQXZlcmFnZSA9IFwiYmlsbGlvblwiO1xuICAgIH0gZWxzZSBpZiAoc3RyaW5nLmluZGV4T2YoXCJUXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuZm9yY2VBdmVyYWdlID0gXCJ0cmlsbGlvblwiO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBmaW5kaW5nIGlmIHRoZSBtYW50aXNzYSBpcyBvcHRpb25hbC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VPcHRpb25hbE1hbnRpc3NhKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5tYXRjaCgvXFxbXFwuXS8pKSB7XG4gICAgICAgIHJlc3VsdC5vcHRpb25hbE1hbnRpc3NhID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHN0cmluZy5tYXRjaCgvXFwuLykpIHtcbiAgICAgICAgcmVzdWx0Lm9wdGlvbmFsTWFudGlzc2EgPSBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgZmluZGluZyBpZiB0aGUgY2hhcmFjdGVyaXN0aWMgaXMgb3B0aW9uYWwuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlT3B0aW9uYWxDaGFyYWN0ZXJpc3RpYyhzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIi5cIikgIT09IC0xKSB7XG4gICAgICAgIGxldCBjaGFyYWN0ZXJpc3RpYyA9IHN0cmluZy5zcGxpdChcIi5cIilbMF07XG4gICAgICAgIHJlc3VsdC5vcHRpb25hbENoYXJhY3RlcmlzdGljID0gY2hhcmFjdGVyaXN0aWMuaW5kZXhPZihcIjBcIikgPT09IC0xO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgbmVnYXRpdmUgZm9ybWF0LiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZU5lZ2F0aXZlKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5tYXRjaCgvXlxcKz9cXChbXildKlxcKSQvKSkge1xuICAgICAgICByZXN1bHQubmVnYXRpdmUgPSBcInBhcmVudGhlc2lzXCI7XG4gICAgfVxuICAgIGlmIChzdHJpbmcubWF0Y2goL15cXCs/LS8pKSB7XG4gICAgICAgIHJlc3VsdC5uZWdhdGl2ZSA9IFwic2lnblwiO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBmaW5kaW5nIGlmIHRoZSBzaWduIGlzIG1hbmRhdG9yeS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqL1xuZnVuY3Rpb24gcGFyc2VGb3JjZVNpZ24oc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLm1hdGNoKC9eXFwrLykpIHtcbiAgICAgICAgcmVzdWx0LmZvcmNlU2lnbiA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGFuZCBhY2N1bXVsYXRpbmcgdGhlIHZhbHVlcyBpZSBSRVNVTFQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7TnVtYnJvRm9ybWF0fSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUZvcm1hdChzdHJpbmcsIHJlc3VsdCA9IHt9KSB7XG4gICAgaWYgKHR5cGVvZiBzdHJpbmcgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICB9XG5cbiAgICBzdHJpbmcgPSBwYXJzZVByZWZpeChzdHJpbmcsIHJlc3VsdCk7XG4gICAgc3RyaW5nID0gcGFyc2VQb3N0Zml4KHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU91dHB1dChzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VUb3RhbExlbmd0aChzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VDaGFyYWN0ZXJpc3RpYyhzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VPcHRpb25hbENoYXJhY3RlcmlzdGljKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZUF2ZXJhZ2Uoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlRm9yY2VBdmVyYWdlKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU1hbnRpc3NhKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU9wdGlvbmFsTWFudGlzc2Eoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlVHJpbU1hbnRpc3NhKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZVRob3VzYW5kU2VwYXJhdGVkKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZVNwYWNlU2VwYXJhdGVkKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU5lZ2F0aXZlKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZUZvcmNlU2lnbihzdHJpbmcsIHJlc3VsdCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwYXJzZUZvcm1hdFxufTtcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3IEJlbmphbWluIFZhbiBSeXNlZ2hlbTxiZW5qYW1pbkB2YW5yeXNlZ2hlbS5jb20+XG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG5jb25zdCBhbGxTdWZmaXhlcyA9IFtcbiAgICB7a2V5OiBcIlppQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDcpfSxcbiAgICB7a2V5OiBcIlpCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgNyl9LFxuICAgIHtrZXk6IFwiWWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgOCl9LFxuICAgIHtrZXk6IFwiWUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCA4KX0sXG4gICAge2tleTogXCJUaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCA0KX0sXG4gICAge2tleTogXCJUQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDQpfSxcbiAgICB7a2V5OiBcIlBpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDUpfSxcbiAgICB7a2V5OiBcIlBCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgNSl9LFxuICAgIHtrZXk6IFwiTWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgMil9LFxuICAgIHtrZXk6IFwiTUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCAyKX0sXG4gICAge2tleTogXCJLaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCAxKX0sXG4gICAge2tleTogXCJLQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDEpfSxcbiAgICB7a2V5OiBcIkdpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDMpfSxcbiAgICB7a2V5OiBcIkdCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgMyl9LFxuICAgIHtrZXk6IFwiRWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgNil9LFxuICAgIHtrZXk6IFwiRUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCA2KX0sXG4gICAge2tleTogXCJCXCIsIGZhY3RvcjogMX1cbl07XG5cbi8qKlxuICogR2VuZXJhdGUgYSBSZWdFeHAgd2hlcmUgUyBnZXQgYWxsIFJlZ0V4cCBzcGVjaWZpYyBjaGFyYWN0ZXJzIGVzY2FwZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHMgLSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgUmVnRXhwXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cChzKSB7XG4gICAgcmV0dXJuIHMucmVwbGFjZSgvWy0vXFxcXF4kKis/LigpfFtcXF17fV0vZywgXCJcXFxcJCZcIik7XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgY29tcHV0ZSB0aGUgdW5mb3JtYXR0ZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW2N1cnJlbmN5U3ltYm9sXSAtIHN5bWJvbCB1c2VkIGZvciBjdXJyZW5jeSB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtmdW5jdGlvbn0gb3JkaW5hbCAtIGZ1bmN0aW9uIHVzZWQgdG8gZ2VuZXJhdGUgYW4gb3JkaW5hbCBvdXQgb2YgYSBudW1iZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSB6ZXJvRm9ybWF0IC0gc3RyaW5nIHJlcHJlc2VudGluZyB6ZXJvXG4gKiBAcGFyYW0geyp9IGFiYnJldmlhdGlvbnMgLSBhYmJyZXZpYXRpb25zIHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdXNlZCB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7bnVtYmVyfHVuZGVmaW5lZH1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sID0gXCJcIiwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KSB7XG4gICAgaWYgKCFpc05hTigraW5wdXRTdHJpbmcpKSB7XG4gICAgICAgIHJldHVybiAraW5wdXRTdHJpbmc7XG4gICAgfVxuXG4gICAgbGV0IHN0cmlwcGVkID0gXCJcIjtcbiAgICAvLyBOZWdhdGl2ZVxuXG4gICAgbGV0IG5ld0lucHV0ID0gaW5wdXRTdHJpbmcucmVwbGFjZSgvKF5bXihdKilcXCgoLiopXFwpKFteKV0qJCkvLCBcIiQxJDIkM1wiKTtcblxuICAgIGlmIChuZXdJbnB1dCAhPT0gaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIC0xICogY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUobmV3SW5wdXQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIC8vIEJ5dGVcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsU3VmZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHN1ZmZpeCA9IGFsbFN1ZmZpeGVzW2ldO1xuICAgICAgICBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2UoUmVnRXhwKGAoWzAtOSBdKSgke3N1ZmZpeC5rZXl9KSRgKSwgXCIkMVwiKTtcblxuICAgICAgICBpZiAoc3RyaXBwZWQgIT09IGlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoc3RyaXBwZWQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpICogc3VmZml4LmZhY3RvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFBlcmNlbnRcblxuICAgIHN0cmlwcGVkID0gaW5wdXRTdHJpbmcucmVwbGFjZShcIiVcIiwgXCJcIik7XG5cbiAgICBpZiAoc3RyaXBwZWQgIT09IGlucHV0U3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZShzdHJpcHBlZCwgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCkgLyAxMDA7XG4gICAgfVxuXG4gICAgLy8gT3JkaW5hbFxuXG4gICAgbGV0IHBvc3NpYmxlT3JkaW5hbFZhbHVlID0gcGFyc2VGbG9hdChpbnB1dFN0cmluZyk7XG5cbiAgICBpZiAoaXNOYU4ocG9zc2libGVPcmRpbmFsVmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgbGV0IG9yZGluYWxTdHJpbmcgPSBvcmRpbmFsKHBvc3NpYmxlT3JkaW5hbFZhbHVlKTtcbiAgICBpZiAob3JkaW5hbFN0cmluZyAmJiBvcmRpbmFsU3RyaW5nICE9PSBcIi5cIikgeyAvLyBpZiBvcmRpbmFsIGlzIFwiLlwiIGl0IHdpbGwgYmUgY2F1Z2h0IG5leHQgcm91bmQgaW4gdGhlICtpbnB1dFN0cmluZ1xuICAgICAgICBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2UobmV3IFJlZ0V4cChgJHtlc2NhcGVSZWdFeHAob3JkaW5hbFN0cmluZyl9JGApLCBcIlwiKTtcblxuICAgICAgICBpZiAoc3RyaXBwZWQgIT09IGlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoc3RyaXBwZWQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQXZlcmFnZVxuXG4gICAgbGV0IGludmVyc2VkQWJicmV2aWF0aW9ucyA9IHt9O1xuICAgIE9iamVjdC5rZXlzKGFiYnJldmlhdGlvbnMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICBpbnZlcnNlZEFiYnJldmlhdGlvbnNbYWJicmV2aWF0aW9uc1trZXldXSA9IGtleTtcbiAgICB9KTtcblxuICAgIGxldCBhYmJyZXZpYXRpb25WYWx1ZXMgPSBPYmplY3Qua2V5cyhpbnZlcnNlZEFiYnJldmlhdGlvbnMpLnNvcnQoKS5yZXZlcnNlKCk7XG4gICAgbGV0IG51bWJlck9mQWJicmV2aWF0aW9ucyA9IGFiYnJldmlhdGlvblZhbHVlcy5sZW5ndGg7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mQWJicmV2aWF0aW9uczsgaSsrKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IGFiYnJldmlhdGlvblZhbHVlc1tpXTtcbiAgICAgICAgbGV0IGtleSA9IGludmVyc2VkQWJicmV2aWF0aW9uc1t2YWx1ZV07XG5cbiAgICAgICAgc3RyaXBwZWQgPSBpbnB1dFN0cmluZy5yZXBsYWNlKHZhbHVlLCBcIlwiKTtcbiAgICAgICAgaWYgKHN0cmlwcGVkICE9PSBpbnB1dFN0cmluZykge1xuICAgICAgICAgICAgbGV0IGZhY3RvciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHN3aXRjaCAoa2V5KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZGVmYXVsdC1jYXNlXG4gICAgICAgICAgICAgICAgY2FzZSBcInRob3VzYW5kXCI6XG4gICAgICAgICAgICAgICAgICAgIGZhY3RvciA9IE1hdGgucG93KDEwLCAzKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm1pbGxpb25cIjpcbiAgICAgICAgICAgICAgICAgICAgZmFjdG9yID0gTWF0aC5wb3coMTAsIDYpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiYmlsbGlvblwiOlxuICAgICAgICAgICAgICAgICAgICBmYWN0b3IgPSBNYXRoLnBvdygxMCwgOSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJ0cmlsbGlvblwiOlxuICAgICAgICAgICAgICAgICAgICBmYWN0b3IgPSBNYXRoLnBvdygxMCwgMTIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZShzdHJpcHBlZCwgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCkgKiBmYWN0b3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgaW4gb25lIHBhc3MgYWxsIGZvcm1hdHRpbmcgc3ltYm9scy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRTdHJpbmcgLSBzdHJpbmcgdG8gdW5mb3JtYXRcbiAqIEBwYXJhbSB7Kn0gZGVsaW1pdGVycyAtIERlbGltaXRlcnMgdXNlZCB0byBnZW5lcmF0ZSB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY3VycmVuY3lTeW1ib2xdIC0gc3ltYm9sIHVzZWQgZm9yIGN1cnJlbmN5IHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUZvcm1hdHRpbmdTeW1ib2xzKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCA9IFwiXCIpIHtcbiAgICAvLyBDdXJyZW5jeVxuXG4gICAgbGV0IHN0cmlwcGVkID0gaW5wdXRTdHJpbmcucmVwbGFjZShjdXJyZW5jeVN5bWJvbCwgXCJcIik7XG5cbiAgICAvLyBUaG91c2FuZCBzZXBhcmF0b3JzXG5cbiAgICBzdHJpcHBlZCA9IHN0cmlwcGVkLnJlcGxhY2UobmV3IFJlZ0V4cChgKFswLTldKSR7ZXNjYXBlUmVnRXhwKGRlbGltaXRlcnMudGhvdXNhbmRzKX0oWzAtOV0pYCwgXCJnXCIpLCBcIiQxJDJcIik7XG5cbiAgICAvLyBEZWNpbWFsXG5cbiAgICBzdHJpcHBlZCA9IHN0cmlwcGVkLnJlcGxhY2UoZGVsaW1pdGVycy5kZWNpbWFsLCBcIi5cIik7XG5cbiAgICByZXR1cm4gc3RyaXBwZWQ7XG59XG5cbi8qKlxuICogVW5mb3JtYXQgYSBudW1icm8tZ2VuZXJhdGVkIHN0cmluZyB0byByZXRyaWV2ZSB0aGUgb3JpZ2luYWwgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW2N1cnJlbmN5U3ltYm9sXSAtIHN5bWJvbCB1c2VkIGZvciBjdXJyZW5jeSB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtmdW5jdGlvbn0gb3JkaW5hbCAtIGZ1bmN0aW9uIHVzZWQgdG8gZ2VuZXJhdGUgYW4gb3JkaW5hbCBvdXQgb2YgYSBudW1iZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSB6ZXJvRm9ybWF0IC0gc3RyaW5nIHJlcHJlc2VudGluZyB6ZXJvXG4gKiBAcGFyYW0geyp9IGFiYnJldmlhdGlvbnMgLSBhYmJyZXZpYXRpb25zIHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdXNlZCB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7bnVtYmVyfHVuZGVmaW5lZH1cbiAqL1xuZnVuY3Rpb24gdW5mb3JtYXRWYWx1ZShpbnB1dFN0cmluZywgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wgPSBcIlwiLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpIHtcbiAgICBpZiAoaW5wdXRTdHJpbmcgPT09IFwiXCIpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBaZXJvIEZvcm1hdFxuXG4gICAgaWYgKGlucHV0U3RyaW5nID09PSB6ZXJvRm9ybWF0KSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGxldCB2YWx1ZSA9IHJlbW92ZUZvcm1hdHRpbmdTeW1ib2xzKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCk7XG4gICAgcmV0dXJuIGNvbXB1dGVVbmZvcm1hdHRlZFZhbHVlKHZhbHVlLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgSU5QVVRTVFJJTkcgcmVwcmVzZW50cyBhIHRpbWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIGNoZWNrXG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNUaW1lKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzKSB7XG4gICAgbGV0IHNlcGFyYXRvcnMgPSBpbnB1dFN0cmluZy5pbmRleE9mKFwiOlwiKSAmJiBkZWxpbWl0ZXJzLnRob3VzYW5kcyAhPT0gXCI6XCI7XG5cbiAgICBpZiAoIXNlcGFyYXRvcnMpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBzZWdtZW50cyA9IGlucHV0U3RyaW5nLnNwbGl0KFwiOlwiKTtcbiAgICBpZiAoc2VnbWVudHMubGVuZ3RoICE9PSAzKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgaG91cnMgPSArc2VnbWVudHNbMF07XG4gICAgbGV0IG1pbnV0ZXMgPSArc2VnbWVudHNbMV07XG4gICAgbGV0IHNlY29uZHMgPSArc2VnbWVudHNbMl07XG5cbiAgICByZXR1cm4gIWlzTmFOKGhvdXJzKSAmJiAhaXNOYU4obWludXRlcykgJiYgIWlzTmFOKHNlY29uZHMpO1xufVxuXG4vKipcbiAqIFVuZm9ybWF0IGEgbnVtYnJvLWdlbmVyYXRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIGEgdGltZSB0byByZXRyaWV2ZSB0aGUgb3JpZ2luYWwgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIHVuZm9ybWF0VGltZShpbnB1dFN0cmluZykge1xuICAgIGxldCBzZWdtZW50cyA9IGlucHV0U3RyaW5nLnNwbGl0KFwiOlwiKTtcblxuICAgIGxldCBob3VycyA9ICtzZWdtZW50c1swXTtcbiAgICBsZXQgbWludXRlcyA9ICtzZWdtZW50c1sxXTtcbiAgICBsZXQgc2Vjb25kcyA9ICtzZWdtZW50c1syXTtcblxuICAgIHJldHVybiBzZWNvbmRzICsgNjAgKiBtaW51dGVzICsgMzYwMCAqIGhvdXJzO1xufVxuXG4vKipcbiAqIFVuZm9ybWF0IGEgbnVtYnJvLWdlbmVyYXRlZCBzdHJpbmcgdG8gcmV0cmlldmUgdGhlIG9yaWdpbmFsIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFN0cmluZyAtIHN0cmluZyB0byB1bmZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IGZvcm1hdCAtIGZvcm1hdCB1c2VkICB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiB1bmZvcm1hdChpbnB1dFN0cmluZywgZm9ybWF0KSB7XG4gICAgLy8gQXZvaWQgY2lyY3VsYXIgcmVmZXJlbmNlc1xuICAgIGNvbnN0IGdsb2JhbFN0YXRlID0gcmVxdWlyZShcIi4vZ2xvYmFsU3RhdGVcIik7XG5cbiAgICBsZXQgZGVsaW1pdGVycyA9IGdsb2JhbFN0YXRlLmN1cnJlbnREZWxpbWl0ZXJzKCk7XG4gICAgbGV0IGN1cnJlbmN5U3ltYm9sID0gZ2xvYmFsU3RhdGUuY3VycmVudEN1cnJlbmN5KCkuc3ltYm9sO1xuICAgIGxldCBvcmRpbmFsID0gZ2xvYmFsU3RhdGUuY3VycmVudE9yZGluYWwoKTtcbiAgICBsZXQgemVyb0Zvcm1hdCA9IGdsb2JhbFN0YXRlLmdldFplcm9Gb3JtYXQoKTtcbiAgICBsZXQgYWJicmV2aWF0aW9ucyA9IGdsb2JhbFN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zKCk7XG5cbiAgICBsZXQgdmFsdWUgPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAodHlwZW9mIGlucHV0U3RyaW5nID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGlmIChtYXRjaGVzVGltZShpbnB1dFN0cmluZywgZGVsaW1pdGVycykpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdW5mb3JtYXRUaW1lKGlucHV0U3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gdW5mb3JtYXRWYWx1ZShpbnB1dFN0cmluZywgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dFN0cmluZyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICB2YWx1ZSA9IGlucHV0U3RyaW5nO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHVuZm9ybWF0XG59O1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmxldCB1bmZvcm1hdHRlciA9IHJlcXVpcmUoXCIuL3VuZm9ybWF0dGluZ1wiKTtcblxuLy8gU2ltcGxpZmllZCByZWdleHAgc3VwcG9ydGluZyBvbmx5IGBsYW5ndWFnZWAsIGBzY3JpcHRgLCBhbmQgYHJlZ2lvbmBcbmNvbnN0IGJjcDQ3UmVnRXhwID0gL15bYS16XXsyLDN9KC1bYS16QS1aXXs0fSk/KC0oW0EtWl17Mn18WzAtOV17M30pKT8kLztcblxuY29uc3QgdmFsaWRPdXRwdXRWYWx1ZXMgPSBbXG4gICAgXCJjdXJyZW5jeVwiLFxuICAgIFwicGVyY2VudFwiLFxuICAgIFwiYnl0ZVwiLFxuICAgIFwidGltZVwiLFxuICAgIFwib3JkaW5hbFwiLFxuICAgIFwibnVtYmVyXCJcbl07XG5cbmNvbnN0IHZhbGlkRm9yY2VBdmVyYWdlVmFsdWVzID0gW1xuICAgIFwidHJpbGxpb25cIixcbiAgICBcImJpbGxpb25cIixcbiAgICBcIm1pbGxpb25cIixcbiAgICBcInRob3VzYW5kXCJcbl07XG5cbmNvbnN0IHZhbGlkQ3VycmVuY3lQb3NpdGlvbiA9IFtcbiAgICBcInByZWZpeFwiLFxuICAgIFwiaW5maXhcIixcbiAgICBcInBvc3RmaXhcIlxuXTtcblxuY29uc3QgdmFsaWROZWdhdGl2ZVZhbHVlcyA9IFtcbiAgICBcInNpZ25cIixcbiAgICBcInBhcmVudGhlc2lzXCJcbl07XG5cbmNvbnN0IHZhbGlkTWFuZGF0b3J5QWJicmV2aWF0aW9ucyA9IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgIGNoaWxkcmVuOiB7XG4gICAgICAgIHRob3VzYW5kOiB7XG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIG1pbGxpb246IHtcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgYmlsbGlvbjoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICB0cmlsbGlvbjoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSxcbiAgICBtYW5kYXRvcnk6IHRydWVcbn07XG5cbmNvbnN0IHZhbGlkQWJicmV2aWF0aW9ucyA9IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgIGNoaWxkcmVuOiB7XG4gICAgICAgIHRob3VzYW5kOiBcInN0cmluZ1wiLFxuICAgICAgICBtaWxsaW9uOiBcInN0cmluZ1wiLFxuICAgICAgICBiaWxsaW9uOiBcInN0cmluZ1wiLFxuICAgICAgICB0cmlsbGlvbjogXCJzdHJpbmdcIlxuICAgIH1cbn07XG5cbmNvbnN0IHZhbGlkQmFzZVZhbHVlcyA9IFtcbiAgICBcImRlY2ltYWxcIixcbiAgICBcImJpbmFyeVwiLFxuICAgIFwiZ2VuZXJhbFwiXG5dO1xuXG5jb25zdCB2YWxpZEZvcm1hdCA9IHtcbiAgICBvdXRwdXQ6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgdmFsaWRWYWx1ZXM6IHZhbGlkT3V0cHV0VmFsdWVzXG4gICAgfSxcbiAgICBiYXNlOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZEJhc2VWYWx1ZXMsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyLCBmb3JtYXQpID0+IGZvcm1hdC5vdXRwdXQgPT09IFwiYnl0ZVwiLFxuICAgICAgICBtZXNzYWdlOiBcImBiYXNlYCBtdXN0IGJlIHByb3ZpZGVkIG9ubHkgd2hlbiB0aGUgb3V0cHV0IGlzIGBieXRlYFwiLFxuICAgICAgICBtYW5kYXRvcnk6IChmb3JtYXQpID0+IGZvcm1hdC5vdXRwdXQgPT09IFwiYnl0ZVwiXG4gICAgfSxcbiAgICBjaGFyYWN0ZXJpc3RpYzoge1xuICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgICByZXN0cmljdGlvbjogKG51bWJlcikgPT4gbnVtYmVyID49IDAsXG4gICAgICAgIG1lc3NhZ2U6IFwidmFsdWUgbXVzdCBiZSBwb3NpdGl2ZVwiXG4gICAgfSxcbiAgICBwcmVmaXg6IFwic3RyaW5nXCIsXG4gICAgcG9zdGZpeDogXCJzdHJpbmdcIixcbiAgICBmb3JjZUF2ZXJhZ2U6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgdmFsaWRWYWx1ZXM6IHZhbGlkRm9yY2VBdmVyYWdlVmFsdWVzXG4gICAgfSxcbiAgICBhdmVyYWdlOiBcImJvb2xlYW5cIixcbiAgICBsb3dQcmVjaXNpb246IHtcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyLCBmb3JtYXQpID0+IGZvcm1hdC5hdmVyYWdlID09PSB0cnVlLFxuICAgICAgICBtZXNzYWdlOiBcImBsb3dQcmVjaXNpb25gIG11c3QgYmUgcHJvdmlkZWQgb25seSB3aGVuIHRoZSBvcHRpb24gYGF2ZXJhZ2VgIGlzIHNldFwiXG4gICAgfSxcbiAgICBjdXJyZW5jeVBvc2l0aW9uOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZEN1cnJlbmN5UG9zaXRpb25cbiAgICB9LFxuICAgIGN1cnJlbmN5U3ltYm9sOiBcInN0cmluZ1wiLFxuICAgIHRvdGFsTGVuZ3RoOiB7XG4gICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXG4gICAgICAgIHJlc3RyaWN0aW9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyKSA9PiBudW1iZXIgPj0gMCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBcInZhbHVlIG11c3QgYmUgcG9zaXRpdmVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN0cmljdGlvbjogKG51bWJlciwgZm9ybWF0KSA9PiAhZm9ybWF0LmV4cG9uZW50aWFsLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiYHRvdGFsTGVuZ3RoYCBpcyBpbmNvbXBhdGlibGUgd2l0aCBgZXhwb25lbnRpYWxgXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH0sXG4gICAgbWFudGlzc2E6IHtcbiAgICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIpID0+IG51bWJlciA+PSAwLFxuICAgICAgICBtZXNzYWdlOiBcInZhbHVlIG11c3QgYmUgcG9zaXRpdmVcIlxuICAgIH0sXG4gICAgb3B0aW9uYWxNYW50aXNzYTogXCJib29sZWFuXCIsXG4gICAgdHJpbU1hbnRpc3NhOiBcImJvb2xlYW5cIixcbiAgICByb3VuZGluZ0Z1bmN0aW9uOiBcImZ1bmN0aW9uXCIsXG4gICAgb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYzogXCJib29sZWFuXCIsXG4gICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IFwiYm9vbGVhblwiLFxuICAgIHNwYWNlU2VwYXJhdGVkOiBcImJvb2xlYW5cIixcbiAgICBzcGFjZVNlcGFyYXRlZEN1cnJlbmN5OiBcImJvb2xlYW5cIixcbiAgICBzcGFjZVNlcGFyYXRlZEFiYnJldmlhdGlvbjogXCJib29sZWFuXCIsXG4gICAgYWJicmV2aWF0aW9uczogdmFsaWRBYmJyZXZpYXRpb25zLFxuICAgIG5lZ2F0aXZlOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZE5lZ2F0aXZlVmFsdWVzXG4gICAgfSxcbiAgICBmb3JjZVNpZ246IFwiYm9vbGVhblwiLFxuICAgIGV4cG9uZW50aWFsOiB7XG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgfSxcbiAgICBwcmVmaXhTeW1ib2w6IHtcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyLCBmb3JtYXQpID0+IGZvcm1hdC5vdXRwdXQgPT09IFwicGVyY2VudFwiLFxuICAgICAgICBtZXNzYWdlOiBcImBwcmVmaXhTeW1ib2xgIGNhbiBiZSBwcm92aWRlZCBvbmx5IHdoZW4gdGhlIG91dHB1dCBpcyBgcGVyY2VudGBcIlxuICAgIH1cbn07XG5cbmNvbnN0IHZhbGlkTGFuZ3VhZ2UgPSB7XG4gICAgbGFuZ3VhZ2VUYWc6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlLFxuICAgICAgICByZXN0cmljdGlvbjogKHRhZykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRhZy5tYXRjaChiY3A0N1JlZ0V4cCk7XG4gICAgICAgIH0sXG4gICAgICAgIG1lc3NhZ2U6IFwidGhlIGxhbmd1YWdlIHRhZyBtdXN0IGZvbGxvdyB0aGUgQkNQIDQ3IHNwZWNpZmljYXRpb24gKHNlZSBodHRwczovL3Rvb2xzLmllZnQub3JnL2h0bWwvYmNwNDcpXCJcbiAgICB9LFxuICAgIGRlbGltaXRlcnM6IHtcbiAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgY2hpbGRyZW46IHtcbiAgICAgICAgICAgIHRob3VzYW5kczogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGRlY2ltYWw6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICB0aG91c2FuZHNTaXplOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgIH0sXG4gICAgYWJicmV2aWF0aW9uczogdmFsaWRNYW5kYXRvcnlBYmJyZXZpYXRpb25zLFxuICAgIHNwYWNlU2VwYXJhdGVkOiBcImJvb2xlYW5cIixcbiAgICBzcGFjZVNlcGFyYXRlZEN1cnJlbmN5OiBcImJvb2xlYW5cIixcbiAgICBvcmRpbmFsOiB7XG4gICAgICAgIHR5cGU6IFwiZnVuY3Rpb25cIixcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgfSxcbiAgICBieXRlczoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgICAgYmluYXJ5U3VmZml4ZXM6IFwib2JqZWN0XCIsXG4gICAgICAgICAgICBkZWNpbWFsU3VmZml4ZXM6IFwib2JqZWN0XCJcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY3VycmVuY3k6IHtcbiAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgY2hpbGRyZW46IHtcbiAgICAgICAgICAgIHN5bWJvbDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgY29kZTogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICB9LFxuICAgIGRlZmF1bHRzOiBcImZvcm1hdFwiLFxuICAgIG9yZGluYWxGb3JtYXQ6IFwiZm9ybWF0XCIsXG4gICAgYnl0ZUZvcm1hdDogXCJmb3JtYXRcIixcbiAgICBwZXJjZW50YWdlRm9ybWF0OiBcImZvcm1hdFwiLFxuICAgIGN1cnJlbmN5Rm9ybWF0OiBcImZvcm1hdFwiLFxuICAgIHRpbWVEZWZhdWx0czogXCJmb3JtYXRcIixcbiAgICBmb3JtYXRzOiB7XG4gICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgICAgICBmb3VyRGlnaXRzOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJmb3JtYXRcIixcbiAgICAgICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdWxsV2l0aFR3b0RlY2ltYWxzOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJmb3JtYXRcIixcbiAgICAgICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdWxsV2l0aFR3b0RlY2ltYWxzTm9DdXJyZW5jeToge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVsbFdpdGhOb0RlY2ltYWxzOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJmb3JtYXRcIixcbiAgICAgICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogQ2hlY2sgdGhlIHZhbGlkaXR5IG9mIHRoZSBwcm92aWRlZCBpbnB1dCBhbmQgZm9ybWF0LlxuICogVGhlIGNoZWNrIGlzIE5PVCBsYXp5LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxOdW1icm99IGlucHV0IC0gaW5wdXQgdG8gY2hlY2tcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdG8gY2hlY2tcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgd2hlbiBldmVyeXRoaW5nIGlzIGNvcnJlY3RcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGUoaW5wdXQsIGZvcm1hdCkge1xuICAgIGxldCB2YWxpZElucHV0ID0gdmFsaWRhdGVJbnB1dChpbnB1dCk7XG4gICAgbGV0IGlzRm9ybWF0VmFsaWQgPSB2YWxpZGF0ZUZvcm1hdChmb3JtYXQpO1xuXG4gICAgcmV0dXJuIHZhbGlkSW5wdXQgJiYgaXNGb3JtYXRWYWxpZDtcbn1cblxuLyoqXG4gKiBDaGVjayB0aGUgdmFsaWRpdHkgb2YgdGhlIG51bWJybyBpbnB1dC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8TnVtYnJvfSBpbnB1dCAtIGlucHV0IHRvIGNoZWNrXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIHdoZW4gZXZlcnl0aGluZyBpcyBjb3JyZWN0XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlSW5wdXQoaW5wdXQpIHtcbiAgICBsZXQgdmFsdWUgPSB1bmZvcm1hdHRlci51bmZvcm1hdChpbnB1dCk7XG5cbiAgICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDaGVjayB0aGUgdmFsaWRpdHkgb2YgdGhlIHByb3ZpZGVkIGZvcm1hdCBUT1ZBTElEQVRFIGFnYWluc3QgU1BFQy5cbiAqXG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gdG9WYWxpZGF0ZSAtIGZvcm1hdCB0byBjaGVja1xuICogQHBhcmFtIHsqfSBzcGVjIC0gc3BlY2lmaWNhdGlvbiBhZ2FpbnN0IHdoaWNoIHRvIGNoZWNrXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IC0gcHJlZml4IHVzZSBmb3IgZXJyb3IgbWVzc2FnZXNcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc2tpcE1hbmRhdG9yeUNoZWNrIC0gYHRydWVgIHdoZW4gdGhlIGNoZWNrIGZvciBtYW5kYXRvcnkga2V5IG11c3QgYmUgc2tpcHBlZFxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSB3aGVuIGV2ZXJ5dGhpbmcgaXMgY29ycmVjdFxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZVNwZWModG9WYWxpZGF0ZSwgc3BlYywgcHJlZml4LCBza2lwTWFuZGF0b3J5Q2hlY2sgPSBmYWxzZSkge1xuICAgIGxldCByZXN1bHRzID0gT2JqZWN0LmtleXModG9WYWxpZGF0ZSkubWFwKChrZXkpID0+IHtcbiAgICAgICAgaWYgKCFzcGVjW2tleV0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSBJbnZhbGlkIGtleTogJHtrZXl9YCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHZhbHVlID0gdG9WYWxpZGF0ZVtrZXldO1xuICAgICAgICBsZXQgZGF0YSA9IHNwZWNba2V5XTtcblxuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGRhdGEgPSB7dHlwZTogZGF0YX07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS50eXBlID09PSBcImZvcm1hdFwiKSB7IC8vIGFsbCBmb3JtYXRzIGFyZSBwYXJ0aWFsIChhLmsuYSB3aWxsIGJlIG1lcmdlZCB3aXRoIHNvbWUgZGVmYXVsdCB2YWx1ZXMpIHRodXMgbm8gbmVlZCB0byBjaGVjayBtYW5kYXRvcnkgdmFsdWVzXG4gICAgICAgICAgICBsZXQgdmFsaWQgPSB2YWxpZGF0ZVNwZWModmFsdWUsIHZhbGlkRm9ybWF0LCBgW1ZhbGlkYXRlICR7a2V5fV1gLCB0cnVlKTtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9ICR7a2V5fSB0eXBlIG1pc21hdGNoZWQ6IFwiJHtkYXRhLnR5cGV9XCIgZXhwZWN0ZWQsIFwiJHt0eXBlb2YgdmFsdWV9XCIgcHJvdmlkZWRgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5yZXN0cmljdGlvbnMgJiYgZGF0YS5yZXN0cmljdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBsZXQgbGVuZ3RoID0gZGF0YS5yZXN0cmljdGlvbnMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCB7cmVzdHJpY3Rpb24sIG1lc3NhZ2V9ID0gZGF0YS5yZXN0cmljdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKCFyZXN0cmljdGlvbih2YWx1ZSwgdG9WYWxpZGF0ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9ICR7a2V5fSBpbnZhbGlkIHZhbHVlOiAke21lc3NhZ2V9YCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEucmVzdHJpY3Rpb24gJiYgIWRhdGEucmVzdHJpY3Rpb24odmFsdWUsIHRvVmFsaWRhdGUpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3ByZWZpeH0gJHtrZXl9IGludmFsaWQgdmFsdWU6ICR7ZGF0YS5tZXNzYWdlfWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnZhbGlkVmFsdWVzICYmIGRhdGEudmFsaWRWYWx1ZXMuaW5kZXhPZih2YWx1ZSkgPT09IC0xKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3ByZWZpeH0gJHtrZXl9IGludmFsaWQgdmFsdWU6IG11c3QgYmUgYW1vbmcgJHtKU09OLnN0cmluZ2lmeShkYXRhLnZhbGlkVmFsdWVzKX0sIFwiJHt2YWx1ZX1cIiBwcm92aWRlZGApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICBsZXQgdmFsaWQgPSB2YWxpZGF0ZVNwZWModmFsdWUsIGRhdGEuY2hpbGRyZW4sIGBbVmFsaWRhdGUgJHtrZXl9XWApO1xuXG4gICAgICAgICAgICBpZiAoIXZhbGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBpZiAoIXNraXBNYW5kYXRvcnlDaGVjaykge1xuICAgICAgICByZXN1bHRzLnB1c2goLi4uT2JqZWN0LmtleXMoc3BlYykubWFwKChrZXkpID0+IHtcbiAgICAgICAgICAgIGxldCBkYXRhID0gc3BlY1trZXldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IHt0eXBlOiBkYXRhfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRhdGEubWFuZGF0b3J5KSB7XG4gICAgICAgICAgICAgICAgbGV0IG1hbmRhdG9yeSA9IGRhdGEubWFuZGF0b3J5O1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWFuZGF0b3J5ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFuZGF0b3J5ID0gbWFuZGF0b3J5KHRvVmFsaWRhdGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChtYW5kYXRvcnkgJiYgdG9WYWxpZGF0ZVtrZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9IE1pc3NpbmcgbWFuZGF0b3J5IGtleSBcIiR7a2V5fVwiYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzLnJlZHVjZSgoYWNjLCBjdXJyZW50KSA9PiB7XG4gICAgICAgIHJldHVybiBhY2MgJiYgY3VycmVudDtcbiAgICB9LCB0cnVlKTtcbn1cblxuLyoqXG4gKiBDaGVjayB0aGUgcHJvdmlkZWQgRk9STUFULlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdG8gY2hlY2tcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlRm9ybWF0KGZvcm1hdCkge1xuICAgIHJldHVybiB2YWxpZGF0ZVNwZWMoZm9ybWF0LCB2YWxpZEZvcm1hdCwgXCJbVmFsaWRhdGUgZm9ybWF0XVwiKTtcbn1cblxuLyoqXG4gKiBDaGVjayB0aGUgcHJvdmlkZWQgTEFOR1VBR0UuXG4gKlxuICogQHBhcmFtIHtOdW1icm9MYW5ndWFnZX0gbGFuZ3VhZ2UgLSBsYW5ndWFnZSB0byBjaGVja1xuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVMYW5ndWFnZShsYW5ndWFnZSkge1xuICAgIHJldHVybiB2YWxpZGF0ZVNwZWMobGFuZ3VhZ2UsIHZhbGlkTGFuZ3VhZ2UsIFwiW1ZhbGlkYXRlIGxhbmd1YWdlXVwiKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdmFsaWRhdGUsXG4gICAgdmFsaWRhdGVGb3JtYXQsXG4gICAgdmFsaWRhdGVJbnB1dCxcbiAgICB2YWxpZGF0ZUxhbmd1YWdlXG59O1xuIl19