const fsp = require('fs').promises;
const { LogStream } = require('../io/log-stream');
const { BasicTextFilter } = require('../io/basic-text-filter');

const BASE_PATH = '/var/log/';

// TODO: add validations to prevent getting access to files in locations
// other than /var/log
async function checkFile(fileName = null) {
  if (typeof fileName !== 'string' || !fileName) {
    throw new Error('Invalid file.');
  }

  const isFile = await fsp.stat(BASE_PATH + fileName)
    .then(() => true)
    .catch(() => false);
  return isFile;
}

function getFileStream(fileName = null, numberOfLines = 10, filter = null) {
  if (typeof fileName !== 'string' || !fileName) {
    throw new Error('Invalid file.');
  }

  const logStream = new LogStream(BASE_PATH + fileName, numberOfLines);

  if (filter) {
    const filterStream = new BasicTextFilter(filter);
    logStream.pipe(filterStream);
    return filterStream;
  }
  return logStream;
}

exports.getFileStream = getFileStream;
exports.checkFile = checkFile;
