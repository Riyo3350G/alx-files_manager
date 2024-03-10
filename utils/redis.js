const { createClient } = require('redis');
const { promisify } = require('util');

// eslint-disable-next-line no-unused-vars
class RedisClient {
  constructor() {
    this.client = createClient();
    this.connected = true;
    this.client.on('connect', () => {
      this.connected = true;
    });
    this.client.on('error', (err) => {
      console.log(err.message);
      this.connected = false;
    });
  }

  isAlive() {
    return this.connected;
  }

  // eslint-disable-next-line consistent-return
  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);
    try {
      return await getAsync(key);
    } catch (error) {
      console.error(error);
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.setex(key, duration, value);
    } catch (error) {
      console.error(error);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(error);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
