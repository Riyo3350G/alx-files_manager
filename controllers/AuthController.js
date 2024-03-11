import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const auth = req.header('Authorization');
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const buff = Buffer.from(auth.replace('Basic ', ''), 'base64');
    const credentials = {
      email: buff.toString('utf-8').split(':')[0],
      password: buff.toString('utf-8').split(':')[1],
    };

    if (!credentials.email || !credentials.password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.users.findOne({ email: credentials.email });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.password !== sha1(credentials.password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    const value = user._id;
    const duration = 24 * 3600;

    redisClient.set(key, value, duration);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const value = await redisClient.get(key);
    if (!value) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    redisClient.del(key);
    return res.status(204).end();
  }
}

module.exports = AuthController;
