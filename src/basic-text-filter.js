const { Transform } = require('stream');

class BasicTextFilter extends Transform {
  constructor(term = '', options) {
    super(options);
    this.term = term;
    this.validateTerm();
  }

  validateTerm() {
    if (typeof this.term !== 'string') {
      throw new Error('The "term" argument must be of type string.');
    }

    if (!this.term) {
      throw new Error('The "term" argument can\' be empty.');
    }
  }

  _transform(chunk, encoding, callback) {
    const split = chunk.toString().split('\n');
    split.map(line => {
      if (line && line.includes(this.term)) {
        this.push(`${line}\n`);
      }
    })
    callback();
  }
}

exports.BasicTextFilter = BasicTextFilter;
