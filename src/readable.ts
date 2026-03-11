import * as stream from "node:stream";

import { constants } from "./constants";

interface ReadableStreamBufferOptions extends stream.ReadableOptions {
  frequency?: number | undefined;
  chunkSize?: number | undefined;
  initialSize?: number | undefined;
  incrementAmount?: number | undefined;
}

class ReadableStreamBuffer extends stream.Readable {
  constructor(opts: ReadableStreamBufferOptions = {}) {
    super(opts);

    this.stopped = false;
    this._frequency = opts.frequency ?? constants.DEFAULT_FREQUENCY;
    this._chunkSize = opts.chunkSize || constants.DEFAULT_CHUNK_SIZE;
    this._incrementAmount =
      opts.incrementAmount || constants.DEFAULT_INCREMENT_AMOUNT;

    this._size = 0;
    this._buffer = Buffer.alloc(
      opts.initialSize || constants.DEFAULT_INITIAL_SIZE,
    );
    this._allowPush = false;
    this._timeout = null;
  }

  #sendData = (): void => {
    const amount = Math.min(this._chunkSize, this._size);
    let sendMore = false;

    if (amount > 0) {
      const chunk = Buffer.alloc(amount);
      this._buffer.copy(chunk, 0, 0, amount);

      sendMore = this.push(chunk) !== false;
      this._allowPush = sendMore;

      this._buffer.copy(this._buffer, 0, amount, this._size);
      this._size -= amount;
    }

    if (this._size === 0 && this.stopped) {
      this.push(null);
    }

    if (sendMore) {
      this._timeout = setTimeout(this.#sendData, this._frequency);
    } else {
      this._timeout = null;
    }
  };

  stop(): void {
    if (this.stopped) {
      throw new Error("stop() called on already stopped ReadableStreamBuffer");
    }
    this.stopped = true;

    if (this._size === 0) {
      this.push(null);
    }
  }

  size(): number {
    return this._size;
  }

  maxSize(): number {
    return this._buffer.length;
  }

  #increaseBufferIfNecessary(incomingDataSize) {
    if (this._buffer.length - this._size < incomingDataSize) {
      const factor = Math.ceil(
        (incomingDataSize - (this._buffer.length - this._size)) /
          this._incrementAmount,
      );

      const newBuffer = Buffer.alloc(
        this._buffer.length + this._incrementAmount * factor,
      );
      this._buffer.copy(newBuffer, 0, 0, this._size);
      this._buffer = newBuffer;
    }
  }

  #kickSendDataTask() {
    if (!this._timeout && this._allowPush) {
      this._timeout = setTimeout(this.#sendData, this._frequency);
    }
  }

  put(data: string | Buffer, encoding: BufferEncoding = "utf8"): void {
    if (this.stopped) {
      throw new Error("Tried to write data to a stopped ReadableStreamBuffer");
    }

    if (Buffer.isBuffer(data)) {
      this.#increaseBufferIfNecessary(data.length);
      data.copy(this._buffer, this._size, 0);
      this._size += data.length;
    } else {
      const dataStr = String(data);
      const dataSizeInBytes = Buffer.byteLength(dataStr, encoding);
      this.#increaseBufferIfNecessary(dataSizeInBytes);
      this._buffer.write(dataStr, this._size, encoding);
      this._size += dataSizeInBytes;
    }

    this.#kickSendDataTask();
  }

  override _read(): void {
    this._allowPush = true;
    this.#kickSendDataTask();
  }
}

export { ReadableStreamBuffer, type ReadableStreamBufferOptions };
