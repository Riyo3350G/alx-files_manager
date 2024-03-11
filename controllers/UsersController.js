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

    return res.status(201).json({ id: newUser._id, email }); // Return only email and ID
  }
}

module.exports = UsersController;
