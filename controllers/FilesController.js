import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import userUtils from '../utils/user';

class FilesController {
  static async postUpload(request, response) {
    const { userId } = await userUtils.getUserIdAndKey(request);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = request.body;
    if (!name) return response.status(400).send({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return response.status(400).send({ error: 'Missing or invalid type' });
    }
    if (!data && type !== 'folder') {
      return response.status(400).send({ error: 'Missing data' });
    }

    // Validate parentId if provided
    if (parentId !== 0) {
      const parent = await dbClient.files.findOne({ _id: parentId });
      if (!parent) return response.status(400).send({ error: 'Parent not found' });
      if (parent.type !== 'folder') return response.status(400).send({ error: 'Parent is not a folder' });
    }

    let localPath = '';
    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      await fs.mkdir(folderPath, { recursive: true });
      const fileName = uuidv4();
      localPath = path.join(folderPath, fileName);
      const fileBuffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileBuffer);
    }

    const newFile = await dbClient.files.insertOne({
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath,
    });

    return response.status(201).send({
      id: newFile.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }
}

module.exports = FilesController;
