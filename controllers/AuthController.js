import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import userUtils from '../utils/user';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const { email, password } = req.headers;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const user = await userUtils.getUser({ email, password: sha1(password) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id, 86400);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const { userId, key } = await userUtils.getUserIdAndKey(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(key);
    return res.status(204).end();
  }
}

module.exports = AuthController;
