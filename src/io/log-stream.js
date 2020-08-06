const { Readable } = require('stream');
const { LogTailer } = require('./log-tailer');

class LogStream extends Readable {
  constructor(path, numberOfLines, options) {
    super(options);
    this.source = new LogTailer(path, numberOfLines, options);

    this.source.on('data', (chunk) => {
      const split = chunk.toString().split('\n');
      split.forEach((line) => {
        if (line) {
          this.push(`${line}\n`);
        }
      });
    });

    this.source.on('end', () => {
      this.push(null);
    });

    this.source.on('end', () => {
      this.push(null);
    });
  }

  // eslint-disable-next-line no-underscore-dangle
  _read() {
    this.source.read().catch((err) => { this.destroy(err); });
  }
}

exports.LogStream = LogStream;
