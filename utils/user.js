import redisClient from './redis';
import dbClient from './db';

class UserUtils {
  static async getUserIdAndKey(req) {
    const object = { userId: null, key: null };
    // eslint-disable-next-line no-undef
    const token = req.header('X-Token');
    if (!token) {
      return object;
    }
    object.key = `auth_${token}`;
    object.userId = await redisClient.get(object.key);
    return object;
  }

  static async getUser(query) {
    const user = await dbClient.users.findOne(query);
    return user;
  }
}

module.exports = UserUtils;
