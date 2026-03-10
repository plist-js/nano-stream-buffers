"use strict";

import { constants } from "nano-stream-buffers";

const simpleString = "This is a String!";
const unicodeString = "\u00bd + \u00bc = \u00be";
const binaryData = new Buffer(64);
for (let i = 0; i < binaryData.length; i++) {
  binaryData[i] = i;
}

// Binary data larger than initial size of buffers.
const largeBinaryData = new Buffer(constants.DEFAULT_INITIAL_SIZE + 1);
for (let i = 0; i < largeBinaryData.length; i++) {
  largeBinaryData[i] = i % 256;
}

export { simpleString, unicodeString, binaryData, largeBinaryData };
