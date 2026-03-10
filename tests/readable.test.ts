"use strict";

const fixtures = require("./fixtures");
const streamBuffer = require("../src/index");
const { ReadableStreamBuffer } = streamBuffer;

describe("A default ReadableStreamBuffer", () => {
  // Declare variables here so they are accessible in all blocks below
  let buffer;

  beforeEach(() => {
    buffer = new ReadableStreamBuffer();
  });

  it("is a Stream", () => {
    const Stream = require("node:stream").Stream;
    expect(buffer).toBeInstanceOf(Stream);
  });

  it("is empty by default", () => {
    expect(buffer.size()).toEqual(0);
  });

  describe("when stopped", () => {
    beforeEach(() => {
      buffer.stop();
    });

    it("throws error on calling stop() again", () => {
      expect(() => buffer.stop()).toThrow(Error);
    });
  });

  it("emits end event when stopped", (done) => {
    buffer.on("end", done);
    buffer.stop();
    buffer.read();
  });

  // Example of handling data with local variables
  it("emits end event after data, when stopped", (done) => {
    let receivedData = "";

    buffer.on("readable", () => {
      const chunk = buffer.read();
      if (chunk) receivedData += chunk.toString("utf8");
    });

    buffer.on("end", () => {
      expect(receivedData).toEqual(fixtures.unicodeString);
      done();
    });

    buffer.put(fixtures.unicodeString);
    buffer.stop();
  });
});
