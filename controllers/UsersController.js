import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';
import userUtils from '../utils/user';

const userQueue = new Queue('userQueue');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const user = await dbClient.users.findOne({ email });
    if (user) return res.status(400).json({ error: 'Already exist' });

    const newUser = await dbClient.users.insertOne({
      email,
      password: sha1(password),
    });

    userQueue.add({
      userId: newUser.insertedId,
    });

    return res.status(201).json({ email, id: newUser.insertedId });
  }

  static async getMe(req, res) {
    const { userId } = await userUtils.getUserIdAndKey(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json({ email: user.email, id: user._id });
  }
}

module.exports = UsersController;
