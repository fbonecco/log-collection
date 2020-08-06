const argv = require('minimist')(process.argv.slice(2));
const { LogStream } = require('./src/io/log-stream');
const { BasicTextFilter } = require('./src/io/basic-text-filter');

// utility script - usage:
// node tail.js -p path/to/file -n 10 -f filter-text

const path = argv.p || null;
const filter = argv.f || null;
const lines = argv.n || 10;

if (!path) {
  throw Error('Invalid file.');
}

const logStream = new LogStream(path, lines);
if (filter) {
  const filterStream = new BasicTextFilter(filter);
  logStream.pipe(filterStream);
  filterStream.pipe(process.stdout);
} else {
  logStream.pipe(process.stdout);
}
