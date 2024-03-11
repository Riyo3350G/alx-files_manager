import routesController from './routes/index';

const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
routesController(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});