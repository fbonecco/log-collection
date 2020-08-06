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
