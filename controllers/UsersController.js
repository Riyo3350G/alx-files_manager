const { MongoClient } = require('mongodb');
const sha1 = require('sha1');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const client = await MongoClient.connect('mongodb://localhost:27017/files_manager');
    const db = client.db();
    const collection = db.collection('users');

    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      await client.close();
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);

    const newUser = {
      email,
      password: hashedPassword,
    };

    await collection.insertOne(newUser);
    await client.close();

    return res.status(201).json({ id: newUser._id, email });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const client = await MongoClient.connect('mongodb://localhost:27017/files_manager');
    const db = client.db();
    const collection = db.collection('users');

    const user = await collection.findOne({ _id: token });
    if (!user) {
      await client.close();
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await client.close();

    return res.status(200).json({ id: user._id, email: user.email });
  }
}

module.exports = UsersController;
