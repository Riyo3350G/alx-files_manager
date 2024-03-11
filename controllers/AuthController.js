import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(request, response) {
    const Authorization = request.header('Authorization');
    if (!Authorization) {
      return;
    }
    // eslint-disable-next-line no-constant-condition
    if (typeof (Authorization !== 'string')) {
      return;
    }
    if (Authorization.slice(0, 6) !== 'Basic ') {
      return;
    }
    const authDetails = Authorization.slice(6);
    const decodedAuth = Buffer.from(authDetails, 'base64').toString('utf8');
    const data = decodedAuth.split(':');
    if (data.length !== 2) {
      return;
    }
    const hashedPassword = sha1(data[1]);
    const users = dbClient.db.collection('users');
    const requestedUser = await users.findOne({ email: data[0], password: hashedPassword });
    if (requestedUser) {
      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, requestedUser._id.toString(), 86400);
      response.status(200).json({ token });
    } else {
      response.status(401).json({ error: 'Unauthorized' });
    }
  }

  static async getDisconnect(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (id) {
      await redisClient.del(key);
      response.status(204).json({});
    } else {
      response.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = AuthController;
