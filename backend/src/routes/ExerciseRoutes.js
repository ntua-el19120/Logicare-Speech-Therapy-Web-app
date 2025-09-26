const express = require('express');
const bodyParser = require('body-parser');
const exerciseCrud = require('../crud/ExerciseCrud');
const path = require('path');
const fs = require('fs');
const Exercise = require("../models/Exercise");
const exerciseBundleCrud = require("../crud/ExerciseBundleCrud");
const { v4: uuidv4 } = require('uuid');
const multer = require("multer");
const pool = require("../config/db-connection");

const router = express.Router();

router.use(bodyParser.json());

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, '../../' , 'uploads', 'videos');

async function ensureUploadDir() {
    try {
        await fs.access(UPLOADS_DIR);
    } catch {
        await fs.mkdir(UPLOADS_DIR, { recursive: true },
            (err) => {
                if (err) {
                    return console.error(err);
                }
            })
    }
}

// Configure multer for handling multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        // Define allowed file types
        const allowedTypes = {
            audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg','audio/mp4','audio/x-m4a'],
            picture: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm']
        };

        const fieldAllowedTypes = allowedTypes[file.fieldname];
        if (fieldAllowedTypes && fieldAllowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: ${fieldAllowedTypes?.join(', ')}`));
        }
    }
});

// Initialize upload directory
ensureUploadDir().catch(console.error);

// POST endpoint for creating exercise with file uploads
router.post('/exercises', upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'picture', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Extract form data
        const { bundle_id, step, title, description } = req.body;

        // Validate required fields
        if (!bundle_id || !step || !title) {
            return res.status(400).json({
                error: 'Missing required fields: bundle_id, step, and title are required'
            });
        }

        // Validate bundle_id exists
        const bundleCheck = exerciseBundleCrud.getBundleById(bundle_id, false);

        if (!bundleCheck) {
            return res.status(400).json({
                error: 'Invalid bundle_id: bundle does not exist'
            });
        }

        let audioBuffer = null;
        let pictureBuffer = null;
        let videoFilePath = null;

        // Process uploaded files
        if (req.files) {
            // Handle audio file
            if (req.files.audio && req.files.audio[0]) {
                audioBuffer = req.files.audio[0].buffer;
            }

            // Handle picture file
            if (req.files.picture && req.files.picture[0]) {
                pictureBuffer = req.files.picture[0].buffer;
            }

            // Handle video file - save to filesystem
            if (req.files.video && req.files.video[0]) {
                const videoFile = req.files.video[0];
                const fileExtension = path.extname(videoFile.originalname) ||
                    getExtensionFromMimeType(videoFile.mimetype);
                const fileName = `${uuidv4()}${fileExtension}`;
                const fullPath = path.join(UPLOADS_DIR, fileName);

                // Save video file to filesystem
                await fs.writeFile(fullPath, videoFile.buffer,
                    (err) => {
                        if (err) {
                            return console.error(err);
                        }
                    });

                // Store relative path in database
                videoFilePath = path.join('uploads', 'videos', fileName);
            }
        }

        // Insert exercise into database

        const result = await exerciseCrud.createExercise(new Exercise(
            null,
            bundle_id,
            parseInt(step),
            title,
            description,
            audioBuffer,
            pictureBuffer,
            videoFilePath
        ));

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Exercise created successfully',
            exercise: result
        });

    } catch (error) {
        await client.query('ROLLBACK');

        // Clean up video file if it was created but database insert failed
        if (req.files?.video?.[0]) {
            try {
                const videoFile = req.files.video[0];
                const fileExtension = path.extname(videoFile.originalname) ||
                    getExtensionFromMimeType(videoFile.mimetype);
                const fileName = `${uuidv4()}${fileExtension}`;
                const fullPath = path.join(UPLOADS_DIR, fileName);
                await fs.unlink(fullPath,
                    (err) => {
                        if (err) {
                            return console.error(err);
                        }
                    });
            } catch (cleanupError) {
                console.error('Error cleaning up video file:', cleanupError);
            }
        }

        console.error('Error creating exercise:', error);

        if (error.code === '23503') {
            return res.status(400).json({
                error: 'Foreign key constraint violation: Invalid bundle_id'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });

    } finally {
        client.release();
    }
});

// Helper function to get file extension from MIME type
function getExtensionFromMimeType(mimeType) {
    const mimeToExt = {
        'video/mp4': '.mp4',
        'video/avi': '.avi',
        'video/mov': '.mov',
        'video/wmv': '.wmv',
        'video/webm': '.webm',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'audio/ogg': '.ogg',
        'image/jpeg': '.jpg',
        'audio/mp4':   '.m4a',     // add this
        'audio/x-m4a': '.m4a',     // and/or this
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp'
    };

    return mimeToExt[mimeType] || '';
}

// GET endpoint to retrieve exercise with file info
router.get('/exercises/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await exerciseCrud.getExerciseById(id)

        if (result === null) {
            return res.status(404).json({ error: 'Exercise not found' });
        }

        res.json(result);
    } catch (error) {
        console.error('Error retrieving exercise:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET endpoint to serve video files
router.get('/exercises/:id/video', async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await exerciseCrud.getExerciseById(id);

    if (!exercise || !exercise.video_file_path) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // 1) Normalize any backslashes → forward slashes
    // 2) Grab only the filename portion (e.g. "foo.webm")
    const relative = exercise.video_file_path.replace(/\\/g, '/');
    const filename = path.basename(relative);

    // 3) Build the absolute path under your UPLOADS_DIR
    //    UPLOADS_DIR is already defined as: path.join(__dirname, '../../uploads/videos')
    const fullPath = path.join(UPLOADS_DIR, filename);

    // 4) Check existence
    await fs.promises.access(fullPath);

    // 5) Stream it
    return res.sendFile(fullPath);
  } catch (err) {
    console.error('Error serving video:', err);
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Video file not found on disk.' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// GET endpoint to serve audio files
router.get('/exercises/:id/audio', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await exerciseCrud.getExerciseById(id);

        if (!result || !result.audio) {
            return res.status(404).json({ error: 'Audio not found' });
        }

        const audioBuffer = result.audio;

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length
        });

        res.send(audioBuffer);

    } catch (error) {
        console.error('Error serving audio:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET endpoint to serve picture files
router.get('/exercises/:id/picture', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await exerciseCrud.getExerciseById(id);

        if (!result || !result.picture) {
            return res.status(404).json({ error: 'Picture not found' });
        }

        const pictureBuffer = result.picture;

        res.set({
            'Content-Type': 'image/jpeg', // You might want to store and retrieve the actual MIME type
            'Content-Length': pictureBuffer.length
        });

        res.send(pictureBuffer);

    } catch (error) {
        console.error('Error serving picture:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum size is 100MB.' });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Unexpected file field.' });
        }
    }

    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({ error: error.message });
    }

    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Update exercise
router.put('/exercises/:id', upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'picture', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const { bundle_id, step, title, description } = req.body;

        // Check if exercise exists
        const existingExercise = await exerciseCrud.getExerciseById(id);

        if (!existingExercise) {
            return res.status(404).json({ error: 'Exercise not found' });
        }

        const currentExercise = existingExercise;

        // Validate bundle_id if provided
        if (bundle_id) {
            const bundleCheck = exerciseCrud.getExerciseById(bundle_id);

            if (!bundleCheck) {
                return res.status(400).json({
                    error: 'Invalid bundle_id: bundle does not exist'
                });
            }
        }

        // Prepare update data - only update fields that are provided
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (bundle_id !== undefined) {
            currentExercise.bundle_id = bundle_id;
        }

        if (step !== undefined) {
            currentExercise.step = parseInt(step);
        }

        if (title !== undefined) {
            currentExercise.title = title;
        }

        if (description !== undefined) {
            currentExercise.description = description;
        }

        let oldVideoPath = null;

        // Process uploaded files
        if (req.files) {
            // Handle audio file replacement
            if (req.files.audio && req.files.audio[0]) {
                currentExercise.audio = req.files.audio[0].buffer;
            }

            // Handle picture file replacement
            if (req.files.picture && req.files.picture[0]) {
                currentExercise.picture = req.files.picture[0].buffer;
            }

            // Handle video file replacement
            if (req.files.video && req.files.video[0]) {
                // Store old video path for cleanup
                oldVideoPath = currentExercise.video_file_path;

                const videoFile = req.files.video[0];
                const fileExtension = path.extname(videoFile.originalname) ||
                    getExtensionFromMimeType(videoFile.mimetype);
                const fileName = `${uuidv4()}${fileExtension}`;
                const fullPath = path.join(UPLOADS_DIR, fileName);

                // Save new video file to filesystem
                await fs.writeFile(fullPath, videoFile.buffer,
                    (err) => {
                        if (err) {
                            return console.error(err);
                        }
                    });

                // Update database with new video path
                const newVideoPath = path.join('uploads', 'videos', fileName);
                currentExercise.video_file_path = newVideoPath;
            }
        }

        const result = await exerciseCrud.updateExercise(currentExercise);

        await client.query('COMMIT');

        // Clean up old video file if it was replaced
        if (oldVideoPath) {
            try {
                const oldFullPath = path.join(__dirname, oldVideoPath);
                await fs.unlink(oldFullPath,
                    (err) => {
                        if (err) {
                            return console.error(err);
                        }
                    });
            } catch (cleanupError) {
                console.error('Error cleaning up old video file:', cleanupError);
                // Don't fail the request if cleanup fails
            }
        }

        res.json({
            message: 'Exercise updated successfully',
            exercise: result
        });

    } catch (error) {
        await client.query('ROLLBACK');

        // Clean up new video file if it was created but database update failed
        if (req.files?.video?.[0]) {
            try {
                const videoFile = req.files.video[0];
                const fileExtension = path.extname(videoFile.originalname) ||
                    getExtensionFromMimeType(videoFile.mimetype);
                const fileName = `${uuidv4()}${fileExtension}`;
                const fullPath = path.join(UPLOADS_DIR, fileName);
                await fs.unlink(fullPath,
                    (err) => {
                        if (err) {
                            return console.error(err);
                        }
                    });
            } catch (cleanupError) {
                console.error('Error cleaning up new video file:', cleanupError);
            }
        }

        console.error('Error updating exercise:', error);

        if (error.code === '23503') {
            return res.status(400).json({
                error: 'Foreign key constraint violation: Invalid bundle_id'
            });
        }

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Duplicate entry: Exercise with this bundle_id and step already exists'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });

    } finally {
        client.release();
    }
});


// DELETE endpoint for removing exercises
router.delete('/exercises/:id', async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { id } = req.params;

        // Get exercise data before deletion for cleanup
        const existingExercise = await exerciseCrud.getExerciseById(id)

        if (!existingExercise) {
            return res.status(404).json({ error: 'Exercise not found' });
        }

        const videoPath = existingExercise.video_file_path;

        // Delete from database
        await exerciseCrud.deleteExercise(id);

        await client.query('COMMIT');

        // Clean up video file if it exists
        if (videoPath) {
            try {
                const fullPath = path.join(__dirname, videoPath);
                await fs.unlink(fullPath,
                    (err) => {
                        if (err) {
                            return console.error(err);
                        }
                    });
            } catch (cleanupError) {
                console.error('Error cleaning up video file:', cleanupError);
                // Don't fail the request if cleanup fails
            }
        }

        res.json({ message: 'Exercise deleted successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting exercise:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });

    } finally {
        client.release();
    }
});

module.exports = router;
