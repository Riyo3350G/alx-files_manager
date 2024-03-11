import redisClient from './redis';
import dbClient from './db';

class UserUtils {
  static async createUser(email, password) {
    const user = await dbClient.users.insertOne({ email, password });
    return user;
  }

  static async getUserIdAndKey(request) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    return { userId, key };
  }

  static async getUser(query) {
    const user = await dbClient.users.findOne(query);
    return user;
  }
}

module.exports = UserUtils;
