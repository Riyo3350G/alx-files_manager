import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import Queue from 'bull';
import dbClient from '../utils/db';
import userUtils from '../utils/user';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

class FilesController {
  static async postUpload(request, response) {
    const { userId } = await userUtils.getUserIdAndKey(request);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.users.findOne({ _id: ObjectID(userId) });
    const { name } = request.body;
    const { type } = request.body;
    const { parentId } = request.body;
    const isPublic = request.body.isPublic || false;
    const { data } = request.body;
    if (!name) {
      return response.status(400).json({ error: 'Missing name' });
    }
    if (!type) {
      return response.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return response.status(400).json({ error: 'Missing data' });
    }

    const files = dbClient.db.collection('files');
    if (parentId) {
      const idObject = new ObjectID(parentId);
      const file = await files.findOne({ _id: idObject, userId: user._id });
      if (!file) {
        return response.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
        return response.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (type === 'folder') {
      files.insertOne(
        {
          userId: user._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic,
        },
      ).then((result) => response.status(201).json({
        id: result.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      })).catch((error) => {
        console.log(error);
      });
    } else {
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = `${filePath}/${uuidv4()}`;
      const buff = Buffer.from(data, 'base64');
      // const storeThis = buff.toString('utf-8');
      try {
        try {
          await fs.mkdir(filePath);
        } catch (error) {
          // pass. Error raised when file already exists
        }
        await fs.writeFile(fileName, buff, 'utf-8');
      } catch (error) {
        console.log(error);
      }
      files.insertOne(
        {
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
          localPath: fileName,
        },
      ).then((result) => {
        response.status(201).json(
          {
            id: result.insertedId,
            userId: user._id,
            name,
            type,
            isPublic,
            parentId: parentId || 0,
          },
        );
        if (type === 'image') {
          fileQueue.add(
            {
              userId: user._id,
              fileId: result.insertedId,
            },
          );
        }
      }).catch((error) => console.log(error));
    }
    return null;
  }
}

export default FilesController;
