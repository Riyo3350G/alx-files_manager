import routesController from './routes/index';
// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');

const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
routesController(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
