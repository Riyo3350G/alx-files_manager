import { Router } from 'express';

const AppController = require('../controllers/AppController');

function routesController(app) {
  const router = Router();
  app.use('/', router);
  router.get('/status', (req, res) => {
    AppController.getStatus(req, res);
  });
  router.get('/stats', (req, res) => {
    AppController.getStats(req, res);
  });
}

export default routesController;
