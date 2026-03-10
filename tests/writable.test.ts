import { beforeEach, describe, expect, it } from "bun:test";

import { constants, WritableStreamBuffer } from "nano-stream-buffers";

import * as fixtures from "./fixtures";

describe("WritableStreamBuffer with defaults", () => {
  let buffer;

  beforeEach(() => {
    buffer = new WritableStreamBuffer();
  });

  it("returns false on call to getContents() when empty", () => {
    expect(buffer.getContents()).toBeFalse();
  });

  it("returns false on call to getContentsAsString() when empty", () => {
    expect(buffer.getContentsAsString()).toBeFalse();
  });

  it("backing buffer should be default size", () => {
    expect(buffer.maxSize()).toEqual(constants.DEFAULT_INITIAL_SIZE);
  });

  describe("when writing a simple string", () => {
    beforeEach(() => {
      buffer.write(fixtures.simpleString);
    });

    it("should have a backing buffer of correct length", () => {
      expect(buffer.size()).toEqual(fixtures.simpleString.length);
    });

    it("should have a default max size", () => {
      expect(buffer.maxSize()).toEqual(constants.DEFAULT_INITIAL_SIZE);
    });

    it("contents should be correct", () => {
      expect(buffer.getContentsAsString()).toEqual(fixtures.simpleString);
    });

    it("returns partial contents correctly", () => {
      const halfLength = Math.floor(
        Buffer.byteLength(fixtures.simpleString) / 2,
      );
      const buf = Buffer.concat([
        buffer.getContents(halfLength),
        buffer.getContents(),
      ]);
      expect(buf.toString()).toEqual(fixtures.simpleString);
    });
  });

  describe("when writing a large binary blob", () => {
    beforeEach(() => {
      buffer.write(fixtures.largeBinaryData);
    });

    it("should have a backing buffer of correct length", () => {
      expect(buffer.size()).toEqual(fixtures.largeBinaryData.length);
    });

    it("should have a larger backing buffer max size", () => {
      expect(buffer.maxSize()).toEqual(
        constants.DEFAULT_INITIAL_SIZE + constants.DEFAULT_INCREMENT_AMOUNT,
      );
    });

    it("contents are valid", () => {
      expect(buffer.getContents()).toStrictEqual(fixtures.largeBinaryData);
    });
  });

  describe("when writing some simple data to the stream", () => {
    let firstStr;
    let secondStr;

    beforeEach(() => {
      buffer = new WritableStreamBuffer();
      buffer.write(fixtures.simpleString);
    });

    describe("and retrieving half of it", () => {
      beforeEach(() => {
        const halfSize = Math.floor(fixtures.simpleString.length / 2);
        firstStr = buffer.getContentsAsString("utf8", halfSize);
      });

      it("returns correct data", () => {
        const expected = fixtures.simpleString.substring(
          0,
          Math.floor(fixtures.simpleString.length / 2),
        );
        expect(firstStr).toEqual(expected);
      });

      it("leaves correct amount of data remaining in buffer", () => {
        expect(buffer.size()).toEqual(
          Math.ceil(fixtures.simpleString.length / 2),
        );
      });

      describe("and then retrieving the other half of it", () => {
        beforeEach(() => {
          const remainingSize = Math.ceil(fixtures.simpleString.length / 2);
          secondStr = buffer.getContentsAsString("utf8", remainingSize);
        });

        it("returns correct data", () => {
          const expected = fixtures.simpleString.substring(
            Math.floor(fixtures.simpleString.length / 2),
          );
          expect(secondStr).toEqual(expected);
        });

        it("results in an empty buffer", () => {
          expect(buffer.size()).toEqual(0);
        });
      });
    });
  });
});

describe("WritableStreamBuffer with custom size and increment", () => {
  let buffer;

  beforeEach(() => {
    buffer = new WritableStreamBuffer({
      initialSize: 62,
      incrementAmount: 321,
    });
  });

  it("has the correct initial size", () => {
    expect(buffer.maxSize()).toEqual(62);
  });

  describe("after data is written", () => {
    beforeEach(() => {
      buffer.write(fixtures.binaryData);
    });

    it("has correct initial size + custom increment amount", () => {
      expect(buffer.maxSize()).toEqual(321 + 62);
    });
  });
});

describe("When WritableStreamBuffer is written in two chunks", () => {
  let buffer;

  beforeEach(() => {
    buffer = new WritableStreamBuffer();
    buffer.write(fixtures.simpleString);
    buffer.write(fixtures.simpleString);
  });

  it("buffer contents are correct", () => {
    expect(buffer.getContentsAsString()).toEqual(
      fixtures.simpleString + fixtures.simpleString,
    );
  });
});
