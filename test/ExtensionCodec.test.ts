import assert from "assert";
import util from "util";
import { encode, decode, ExtensionCodec, decodeAsync } from "../src";

describe("ExtensionCodec", () => {
  context("timestamp", () => {
    const extensionCodec = ExtensionCodec.defaultCodec;

    it("encodes and decodes a date without milliseconds (timestamp 32)", () => {
      const date = new Date(1556633024000);
      const encoded = encode(date, { extensionCodec });
      assert.deepStrictEqual(
        decode(encoded, { extensionCodec }),
        date,
        `date: ${date.toISOString()}, encoded: ${util.inspect(encoded)}`,
      );
    });

    it("encodes and decodes a date with milliseconds (timestamp 64)", () => {
      const date = new Date(1556633024123);
      const encoded = encode(date, { extensionCodec });
      assert.deepStrictEqual(
        decode(encoded, { extensionCodec }),
        date,
        `date: ${date.toISOString()}, encoded: ${util.inspect(encoded)}`,
      );
    });

    it("encodes and decodes a future date (timestamp 96)", () => {
      const date = new Date(0x400000000 * 1000);
      const encoded = encode(date, { extensionCodec });
      assert.deepStrictEqual(
        decode(encoded, { extensionCodec }),
        date,
        `date: ${date.toISOString()}, encoded: ${util.inspect(encoded)}`,
      );
    });
  });

  context("custom extensions", () => {
    const extensionCodec = new ExtensionCodec();

    // Set<T>
    extensionCodec.register({
      type: 0,
      encode: (object: unknown): Uint8Array | null => {
        if (object instanceof Set) {
          return encode([...object]);
        } else {
          return null;
        }
      },
      decode: (data: Uint8Array) => {
        const array = decode(data) as Array<unknown>;
        return new Set(array);
      },
    });

    // Map<T>
    extensionCodec.register({
      type: 1,
      encode: (object: unknown): Uint8Array | null => {
        if (object instanceof Map) {
          return encode([...object]);
        } else {
          return null;
        }
      },
      decode: (data: Uint8Array) => {
        const array = decode(data) as Array<[unknown, unknown]>;
        return new Map(array);
      },
    });

    it("encodes and decodes custom data types (synchronously)", () => {
      const set = new Set([1, 2, 3]);
      const map = new Map([
        ["foo", "bar"],
        ["bar", "baz"],
      ]);
      const encoded = encode([set, map], { extensionCodec });
      assert.deepStrictEqual(decode(encoded, { extensionCodec }), [set, map]);
    });

    it("encodes and decodes custom data types (asynchronously)", async () => {
      const set = new Set([1, 2, 3]);
      const map = new Map([
        ["foo", "bar"],
        ["bar", "baz"],
      ]);
      const encoded = encode([set, map], { extensionCodec });
      const createStream = async function* () {
        yield encoded;
      };
      assert.deepStrictEqual(await decodeAsync(createStream(), { extensionCodec }), [set, map]);
    });
  });

  context("custom extensions with custom context", () => {
    class Context {
      public expectations: Array<any> = [];
      constructor(public ctxVal: number) {}
      public hasVisited(val: any) {
        this.expectations.push(val);
      }
    }
    const extensionCodec = new ExtensionCodec<Context>();

    class Magic<T> {
      constructor(public val: T) {}
    }

    // Magic
    extensionCodec.register({
      type: 0,
      encode: (object: unknown, context): Uint8Array | null => {
        if (object instanceof Magic) {
          context.hasVisited({ encoding: object.val });
          return encode({ magic: object.val, ctx: context.ctxVal }, { extensionCodec, context });
        } else {
          return null;
        }
      },
      decode: (data: Uint8Array, extType, context) => {
        extType;
        const decoded = decode(data, { extensionCodec, context }) as { magic: number };
        context.hasVisited({ decoding: decoded.magic, ctx: context.ctxVal });
        return new Magic(decoded.magic);
      },
    });

    it("encodes and decodes custom data types (synchronously)", () => {
      const context = new Context(42);
      const magic1 = new Magic(17);
      const magic2 = new Magic({ foo: new Magic("inner") });
      const test = [magic1, magic2];
      const encoded = encode(test, { extensionCodec, context });
      assert.deepStrictEqual(decode(encoded, { extensionCodec, context }), test);
      assert.deepStrictEqual(context.expectations, [
        {
          encoding: magic1.val,
        },
        {
          encoding: magic2.val,
        },
        {
          encoding: magic2.val.foo.val,
        },
        {
          ctx: 42,
          decoding: magic1.val,
        },
        {
          ctx: 42,
          decoding: magic2.val.foo.val,
        },
        {
          ctx: 42,
          decoding: magic2.val,
        },
      ]);
    });

    it("encodes and decodes custom data types (asynchronously)", async () => {
      const context = new Context(42);
      const magic1 = new Magic(17);
      const magic2 = new Magic({ foo: new Magic("inner") });
      const test = [magic1, magic2];
      const encoded = encode(test, { extensionCodec, context });
      const createStream = async function* () {
        yield encoded;
      };
      assert.deepStrictEqual(await decodeAsync(createStream(), { extensionCodec, context }), test);
      assert.deepStrictEqual(context.expectations, [
        {
          encoding: magic1.val,
        },
        {
          encoding: magic2.val,
        },
        {
          encoding: magic2.val.foo.val,
        },
        {
          ctx: 42,
          decoding: magic1.val,
        },
        {
          ctx: 42,
          decoding: magic2.val.foo.val,
        },
        {
          ctx: 42,
          decoding: magic2.val,
        },
      ]);
    });
  });

  context("custom extensions with alignment", () => {
    const extensionCodec = new ExtensionCodec();

    extensionCodec.register({
      type: 0x01,
      align: 4,
      encode: (object: unknown): Uint8Array | null => {
        if (object instanceof Float32Array) {
          return new Uint8Array(object.buffer);
        }
        return null;
      },
      decode: (data: Uint8Array) => {
        return new Float32Array(data.buffer, data.byteOffset, data.byteLength / Float32Array.BYTES_PER_ELEMENT);
      },
    });

    it("encodes and decodes Float32Array type with zero-copy", () => {
      const data = {
        position: new Float32Array([1.1, 2.2, 3.3, 4.4, 5.5]),
      };
      const encoded = encode(data, { extensionCodec });
      const decoded = decode(encoded, { extensionCodec });
      assert.deepStrictEqual(decoded, data);
      assert.strictEqual(decoded.position.buffer, encoded.buffer);
    });
  });
});
