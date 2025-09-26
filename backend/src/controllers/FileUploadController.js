const path = require('path');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = '';
        if (file.mimetype.startsWith('video/')) {
            const bundleId = req.body.bundleId || req.params.bundleId || 'general';
            folder = path.join('uploads/videos', bundleId);
        } else if (file.mimetype.startsWith('audio/')) {
            folder = 'uploads/audios';
        } else if (file.mimetype.startsWith('image/')) {
            folder = 'uploads/pictures';
        } else {
            return cb(new Error('Unsupported file type'), false);
        }

        fs.mkdirSync(folder, { recursive: true });
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/\s+/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${name}_${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ storage });
module.exports = { upload };