const { Readable } = require('stream');
const { LogTailer } = require('./log-tailer');

class LogStream extends Readable {
  constructor(path, numberOfLines, options) {
    super(options);
    this.source = new LogTailer(path, numberOfLines, options);

    this.source.on('data', (chunk) => {
      this.push(chunk);
    });

    this.source.on('end', () => {
      this.push(null);
    });
  }

  _read() {
    this.source.read();
  }
}

exports.LogStream = LogStream;
