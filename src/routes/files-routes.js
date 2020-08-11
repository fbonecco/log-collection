const express = require('express');
const { getLogStream } = require('../services/file-service');

function filesRoutes() {
  const filesRouter = express.Router();
  // simple handler for GET requests
  // data is streamed directly into the res object
  filesRouter.route('/files/:fileId')
    .get(async (req, res) => {
      try {
        const fileName = req.params.fileId || null;
        const filter = req.query.filter || null;
        const numberOfLines = parseInt(req.query.n, 10) || 10;
        const body = { name: fileName };

        const stream = getLogStream(fileName, numberOfLines, filter, () => {
          return res.sendStatus(404);
        });
        // TODO: handle request cancellation and close fd
        return stream.pipe(res);
      } catch (err) {
        return res.sendStatus(500);
      }
    });
  return filesRouter;
}

module.exports = filesRoutes;
