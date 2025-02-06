const path = require('path');
const express = require('express');
const app = express();

const PORT = String(+process.env.PORT) === String(process.env.PORT).trim() ? +process.env.PORT : 8080;

app.use(express.static(path.join(__dirname, 'frontend')));

app.listen(PORT, () => {
  console.log('listening on port ', PORT);
});