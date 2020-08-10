const { Transform } = require('stream');

class BasicFilter extends Transform {
  constructor(numberOfLines = 10, term = '', options) {
    super(options);
    this.numberOfLines = this.validateNumberOfLines(numberOfLines);
    this.term = this.validateTerm(term);
    this.fn = this.count;
    if (this.term) {
      this.fn = this.filter;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  count(line, cb) {
    if (this.numberOfLines === 0) {
      this.push(null);
    } else {
      cb(null, line);
      this.numberOfLines -= 1;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  filter(chunk, cb) {
    if (chunk.includes(this.term)) {
      this.count(chunk, cb);
    } else {
      cb(null, Buffer.alloc(0));
    }
  }

  // eslint-disable-next-line class-methods-use-this
  validateTerm(term) {
    return term ? Buffer.from(String(term)) : null;
  }

  // eslint-disable-next-line class-methods-use-this
  validateNumberOfLines(numberOfLines = null) {
    return Number.isNaN(numberOfLines) || numberOfLines < 1 ? 10 : parseInt(numberOfLines, 10);
  }

  // eslint-disable-next-line no-underscore-dangle
  _transform(chunk, encoding, callback) {
    this.fn(chunk, callback);
  }
}

exports.BasicFilter = BasicFilter;
