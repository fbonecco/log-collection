const express = require('express');
const { getFileStream } = require('../services/file-service');
const { checkFile } = require('../services/file-service');

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      chunks.push(chunk.toString().replace('\n', ''));
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(chunks));
  });
}

function filesRoutes() {
  const filesRouter = express.Router();
  filesRouter.route('/files/:fileId')
    .get(async (req, res) => {
      try {
        const fileName = req.params.fileId || null;
        const filter = req.query.filter || null;
        const numberOfLines = parseInt(req.query.n, 10) || 10;
        const body = { name: fileName };
        const fileExists = await checkFile(fileName);
        if (!fileExists) {
          return res.sendStatus(404);
        }
        // ideally, the stream created with the streamToString function
        // should be piped to the res object.
        // that way, we'd avoid keeping all the events in memory until
        // the response is commited (this is how the command line tool works)
        const events = await streamToString(getFileStream(fileName, numberOfLines, filter));
        body.lines = events;
        return res.json(body);
      } catch (err) {
        return res.sendStatus(500);
      }
    });
  return filesRouter;
}

module.exports = filesRoutes;
