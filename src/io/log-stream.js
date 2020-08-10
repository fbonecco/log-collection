const { Readable } = require('stream');
const fs = require('fs');

const MIN_BUFFER_SIZE = 64 * 1024;
const MAX_BUFFER_SIZE = 10 * 1024 * 1024;
const BUFFER_SIZE = 2 * 1024 * 1024;
const LINE_BREAK = 10;

class LogStream extends Readable {
  constructor(path = '', options = { encoding: 'utf8', bufferSize: BUFFER_SIZE, autoDestroy: true }) {
    super(options);
    this.path = this.validateAndCleanPath(path);
    this.offset = null;
    this.lastHead = null;
    ({ encoding: this.encoding, bufferSize: this.bufferSize } = options);
    this.validateBufferSize();
    this.bRead = 0;
    this.size = 0;
    this.readFrom = -1;
    this.buffer = Buffer.alloc(this.bufferSize);
    this.isPaused = false;
    this.fd = null;
    this.reading = false;

    this.openFile();
  }

  // eslint-disable-next-line no-underscore-dangle
  _read() {
    if (typeof this.fd !== 'number') {
      // the file descriptor might not be ready at this point
      return this.once('open', () => {
        // eslint-disable-next-line no-underscore-dangle
        this._read();
      });
    }

    this.isPaused = false;
    this.pull();
  }

  pull() {
    // check if there are buffered values that weren't emitted yet.
    this.pushValues();
    if (this.isPaused || this.reading) {
      return;
    }

    const remainingBytes = this.size - this.bRead;
    if (remainingBytes === 0) {
      this.push(null);
      this.emit('end');
      this.destroy();
      return;
    }

    if (!this.offset) {
      // first time we read the file
      this.offset = this.size - this.bufferSize;
    } else {
      // calculated based on the previous read
      const nextOffset = this.offset - this.bufferSize;
      this.offset = (nextOffset < 0) ? 0 : nextOffset;
    }
    // how many bytes do we need to read?
    const length = (remainingBytes < this.bufferSize) ? remainingBytes : this.bufferSize;
    this.reading = true;
    fs.read(this.fd, this.buffer, 0, length, this.offset, (err, bytesRead) => {
      if (err) {
        this.destroy();
        this.emit('error', err);
      } else {
        this.reading = false;
        this.bRead += bytesRead;
        this.readFrom = bytesRead;
        if (this.lastHead) {
          this.readFrom += this.lastHead.length;
          this.buffer = Buffer.concat([this.buffer.slice(0, bytesRead),
            this.lastHead], this.readFrom);
          this.lastHead = null;
        }
        this.pushValues();
      }
    });
  }

  // This function iterates over the values that are stored in the buffer.
  // Tries to identify where line breaks are and pushes them individually.
  // Attempts to handle back pressure scenarios; if a call this.push returns
  // false, no more values are emitted until the flow is resumed.
  pushValues() {
    // check if this stream has been paused (back-pressure) and if there
    // are indeed bytes to read
    while (!this.isPaused && this.readFrom >= 0) {
      // identify the occurrence of line breaks.
      const newLine = this.buffer.lastIndexOf(LINE_BREAK, this.readFrom);
      let limit = -1;
      let line = null;
      if (newLine !== 0) {
        limit = this.buffer.lastIndexOf(LINE_BREAK, newLine - 1);
        line = this.buffer.slice(limit + 1, newLine + 1);
      } else {
        line = this.buffer.slice(0, 1);
      }

      this.readFrom = limit;
      if (limit < 0) {
        // chances are that the first line we read is not complete
        // so we'll push it as part of the next read.
        this.lastHead = Buffer.from(line);
        if (this.bRead === this.size) {
          this.isPaused = !this.push(this.lastHead);
        }
      } else {
        this.isPaused = !this.push(line);
      }
    }
  }

  // eslint-disable-next-line no-underscore-dangle
  _destroy(err, cb) {
    if (this.fd) {
      fs.close(this.fd, (err2) => {
        err = err || err2;
        cb(err);
        this.emit('close');
      });
    }
    this.fd = null;
    this.buffer = null;
  }

  openFile() {
    const handleError = (err, event = 'error') => {
      this.destroy();
      this.emit(event, err);
    };
    fs.open(this.path, 'r', (err, fd) => {
      if (err) {
        return handleError(err, 'fileNotFound');
      }
      this.fd = fd;
      fs.fstat(fd, (err1, stat) => {
        if (err1) {
          return handleError(err1);
        }
        ({ size: this.size } = stat);
        this.emit('open', fd);
        this.emit('ready');
        this.read();
      });
    });
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

    if (this.bufferSize < MIN_BUFFER_SIZE || this.bufferSize > MAX_BUFFER_SIZE) {
      throw new Error(`The "bufferSize" argument value must be between ${MIN_BUFFER_SIZE} and ${MAX_BUFFER_SIZE}.`);
    }
  }
}

exports.LogStream = LogStream;
