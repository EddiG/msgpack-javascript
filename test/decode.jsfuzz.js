/* eslint-disable */
const assert = require("assert");
const { Decoder, encode, DecodeError, DataViewIndexOutOfBoundsError } = require("../dist/index.js");

/**
 * @param {Buffer} bytes
 * @returns {void}
 */
module.exports.fuzz = function fuzz(bytes) {
  const decoder = new Decoder();
  try {
    decoder.decode(bytes);
  } catch (e) {
    if (e instanceof DecodeError) {
      // ok
    } else if (e instanceof DataViewIndexOutOfBoundsError) {
      // ok
    } else {
      throw e;
    }
  }

  // make sure the decoder instance is not broken
  const object = {
    foo: 1,
    bar: 2,
    baz: ["one", "two", "three"],
  };
  assert.deepStrictEqual(decoder.decode(encode(object)), object);
}
