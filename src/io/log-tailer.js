const { EventEmitter } = require('events');
const fsp = require('fs').promises;

const MAX_BUFFER_SIZE = 16 * 1024;

class LogTailer extends EventEmitter {
  constructor(path = '', numberOfLines = 10,
    options = { encoding: 'utf8', bufferSize: MAX_BUFFER_SIZE }) {
    super();
    this.path = this.validateAndCleanPath(path);
    this.numberOfLines = numberOfLines;
    this.validateNumberOfLines();
    this.offset = -1;
    this.lastHead = null;
    ({ encoding: this.encoding, bufferSize: this.bufferSize } = options);
    this.validateBufferSize();
    this.bRead = 0;
    this.size = null;
  }

  async read() {
    if (this.numberOfLines < 1) {
      this.emit('end');
      return;
    }

    let fileHandle = null;

    try {
      fileHandle = await this.openFile().catch((err) => {
        this.emit('error', err);
        return null;
      });

      const remainingBytes = this.size - this.bRead;
      // create the buffer of the size of the remainingBytes only
      const bfSize = (remainingBytes >= this.bufferSize) ? this.bufferSize : remainingBytes;
      if (this.offset === -1) {
        this.offset = this.size - bfSize;
      }
      const buffer = Buffer.alloc(bfSize);

      const { bytesRead } = await fileHandle.read(buffer, 0, bfSize, this.offset);
      if (bytesRead === 0) {
        this.emit('end');
        return;
      }
      this.bRead += bytesRead;

      let data = buffer.slice(0, bytesRead).toString(this.encoding);

      if (this.lastHead) {
        data += this.lastHead;
      }
      const lines = data.split('\n');
      const readFrom = data.endsWith('\n') ? lines.length - 2 : lines.length - 1;

      const strBuffer = [];
      const lowerBound = (this.offset === 0) ? -1 : 0;
      for (let x = readFrom; x > lowerBound && this.numberOfLines > 0; x -= 1) {
        strBuffer.push(`${lines[x]}\n`);
        this.numberOfLines -= 1;
      }

      this.emit('data', Buffer.from(strBuffer.join(''), this.encoding));
      // chances are that the first line we read is not complete
      // so we'll push it as part of the next read.
      [this.lastHead] = lines;
      const nextOffset = this.offset - bfSize;
      this.offset = (nextOffset < 0) ? 0 : nextOffset;

      if (this.numberOfLines === 0) {
        this.emit('end');
        return;
      }
    } catch (err) {
      this.emit('error', err);
    } finally {
      await this.closeFile(fileHandle).catch();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  validateAndCleanPath(path = '') {
    if (typeof path !== 'string') {
      throw new Error('The "path" argument must be of type string.');
    }

    const cleanPath = path.trim();
    if (!cleanPath) {
      throw new Error('The "path" argument can\' be empty.');
    }
    return cleanPath;
  }

  // eslint-disable-next-line class-methods-use-this
  validateNumberOfLines() {
    if (typeof this.numberOfLines !== 'number') {
      throw new Error('The "numberOfLines" argument must be of type number.');
    }

    if (this.numberOfLines < 1) {
      throw new Error('The "numberOfLines" argument value must be greater than 0.');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  validateBufferSize() {
    if (typeof this.bufferSize !== 'number') {
      throw new Error('The "bufferSize" argument must be of type number.');
    }

    if (this.bufferSize < 1 || this.bufferSize > MAX_BUFFER_SIZE) {
      throw new Error(`The "bufferSize" argument value must be between 0 and ${MAX_BUFFER_SIZE}.`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async closeFile(fileHandle = null) {
    if (fileHandle) {
      await fileHandle.close();
    }
  }

  async openFile() {
    const fileHandle = await fsp.open(this.path, 'r');
    const stats = await fileHandle.stat();

    const { size } = stats;
    if (!this.size) {
      this.size = size;
    }
    return fileHandle;
  }
}

exports.LogTailer = LogTailer;
