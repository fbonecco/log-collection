const express = require('express');
const filesRoutes = require('./src/routes/files-routes')();

const app = express();
const port = process.env.PORT || 5000;

app.use('/api', filesRoutes);

app.get('/', (req, res) => {
  res.send('Log Collection.')
});

app.listen(port, () => {
});
