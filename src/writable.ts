import * as stream from "node:stream";

import { constants } from "./constants";

interface WritableStreamBufferOptions extends stream.WritableOptions {
  initialSize?: number | undefined;
  incrementAmount?: number | undefined;
}

class WritableStreamBuffer extends stream.Writable {
  constructor(opts: WritableStreamBufferOptions = {}) {
    opts.decodeStrings = true;
    super(opts);

    this._incrementAmount =
      opts.incrementAmount || constants.DEFAULT_INCREMENT_AMOUNT;
    this._buffer = Buffer.alloc(
      opts.initialSize || constants.DEFAULT_INITIAL_SIZE,
    );
    this._size = 0;
  }

  size(): number {
    return this._size;
  }

  maxSize(): number {
    return this._buffer.length;
  }

  getContents(length?: number): Buffer | false {
    if (!this._size) return false;

    const actualLength = Math.min(length || this._size, this._size);
    const data = Buffer.alloc(actualLength);
    this._buffer.copy(data, 0, 0, actualLength);

    if (actualLength < this._size) {
      this._buffer.copy(this._buffer, 0, actualLength, this._size);
    }

    this._size -= actualLength;
    return data;
  }

  getContentsAsString(
    encoding: BufferEncoding = "utf8",
    length?: number,
  ): string | false {
    if (!this._size) return false;

    const actualLength = Math.min(length || this._size, this._size);
    const data = this._buffer.toString(encoding, 0, actualLength);
    const dataLengthInBytes = Buffer.byteLength(data, encoding);

    if (dataLengthInBytes < this._size) {
      this._buffer.copy(this._buffer, 0, dataLengthInBytes, this._size);
    }

    this._size -= dataLengthInBytes;
    return data;
  }

  #increaseBufferIfNecessary(incomingDataSize) {
    const remainingSpace = this._buffer.length - this._size;

    if (remainingSpace < incomingDataSize) {
      const factor = Math.ceil(
        (incomingDataSize - remainingSpace) / this._incrementAmount,
      );

      const newBuffer = Buffer.alloc(
        this._buffer.length + this._incrementAmount * factor,
      );
      this._buffer.copy(newBuffer, 0, 0, this._size);
      this._buffer = newBuffer;
    }
  }

  override _write(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.#increaseBufferIfNecessary(chunk.length);
    chunk.copy(this._buffer, this._size, 0);
    this._size += chunk.length;
    callback();
  }
}

export { WritableStreamBuffer, type WritableStreamBufferOptions };
