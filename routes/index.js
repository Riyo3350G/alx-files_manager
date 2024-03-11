import { Router } from 'express';

const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');

function routesController(app) {
  const router = Router();
  app.use('/', router);
  router.get('/status', (req, res) => {
    AppController.getStatus(req, res);
  });
  router.get('/stats', (req, res) => {
    AppController.getStats(req, res);
  });
  router.post('/users', (req, res) => {
    UsersController.postNew(req, res);
  });
  router.get('/connect', (req, res) => {
    AuthController.getConnect(req, res);
  });
  router.get('/disconnect', (req, res) => {
    AuthController.getDisconnect(req, res);
  });
}

export default routesController;
