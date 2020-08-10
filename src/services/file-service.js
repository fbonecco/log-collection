const { LogStream } = require('../io/log-stream');
const { BasicFilter } = require('../io/filter');

const BASE_PATH = '/var/log/';

// TODO: add validations to prevent getting access to files in locations
// other than /var/log. For instance, an attacker would get access to the
// /etc/password if it sends this value ..%2F..%2Fetc%2Fpasswd in the GET request
function getLogStream(fileName = null, numberOfLines = 10, filter = null, cb) {
  if (typeof fileName !== 'string' || !fileName) {
    throw new Error('Invalid file.');
  }

  const logStream = new LogStream(BASE_PATH + fileName);
  if (cb !== null) {
    logStream.on('fileNotFound', cb);
  }
  const filterStream = new BasicFilter(numberOfLines, filter);
  filterStream.on('end', () => {
    logStream.destroy();
  });
  logStream.pipe(filterStream);
  return filterStream;
}

exports.getLogStream = getLogStream;
