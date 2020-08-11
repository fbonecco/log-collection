const argv = require('minimist')(process.argv.slice(2));
const { LogStream } = require('./src/io/log-stream');
const { BasicFilter } = require('./src/io/filter');
// utility script - usage:
// node tail.js -p path/to/file -n 10 -f filter-text

const path = argv.p || null;
const filter = argv.f || null;
const lines = argv.n || 10;

if (!path) {
  throw Error('Invalid file.');
}
const logStream = new LogStream(path);
const filterStream = new BasicFilter(lines, filter);
logStream.pipe(filterStream).pipe(process.stdout);
