import prisma from '../config/db.js';

export const uploadVideo = async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;

    const newVideo = await prisma.video.create({
      data: {
        title: title || file.originalname,
        filename: file.filename,
        filepath: file.path,
        filesize: file.size,
        mimetype: file.mimetype,
      },
    });

    return res.status(201).json(newVideo);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};