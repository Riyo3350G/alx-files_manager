import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import Queue from 'bull';
import dbClient from '../utils/db';
import userUtils from '../utils/user';

const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  static postNew(request, response) {
    const { email } = request.body;
    const { password } = request.body;

    if (!email) {
      response.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      response.status(400).json({ error: 'Missing password' });
      return;
    }

    const users = dbClient.db.collection('users');
    users.findOne({ email }, (err, user) => {
      if (user) {
        response.status(400).json({ error: 'Already exist' });
      } else {
        const hashedPassword = sha1(password);
        users.insertOne(
          {
            email,
            password: hashedPassword,
          },
        ).then((result) => {
          response.status(201).json({ id: result.insertedId, email });
          userQueue.add({ userId: result.insertedId });
        }).catch((error) => console.log(error));
      }
    });
  }

  static async getMe(request, response) {
    const { userId } = await userUtils.getUserIdAndKey(request);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.users.findOne({ _id: ObjectID(userId) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });
    return response.status(200).send({ id: user._id, email: user.email });
  }
}

module.exports = UsersController;
