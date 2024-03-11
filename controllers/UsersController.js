import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';
import userUtils from '../utils/user';

const userQueue = new Queue('userQueue');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });

    const sha1Password = sha1(password);

    const user = await userUtils.getUser({ email });

    if (user) return res.status(400).send({ error: 'Already exist' });

    const result = await dbClient.users.insertOne({
      email,
      password: sha1Password,
    });

    const newUs = {
      id: result.insertedId,
      email,
    };

    await userQueue.add({
      userId: result.insertedId.toString(),
    });

    return res.status(201).send(newUs);
  }

  static async getMe(req, res) {
    const { userId } = await userUtils.getUserIdAndKey(req);

    const user = await userUtils.getUser({ _id: ObjectId(userId) });
    const procUser = { id: user._id, ...user };
    delete procUser._id;
    delete procUser.password;
    return res.status(200).send(procUser);
  }
}

export default UsersController;
