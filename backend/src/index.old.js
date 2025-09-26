const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const {query} = require("./config/db-connection");

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes

// Get all bundles
app.get('/api/bundles', async (req, res) => {
    try {
        const result = await query('SELECT * FROM speech_therapy.exercise_bundle ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new bundle
app.post('/api/bundles', async (req, res) => {
    const { title } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO speech_therapy.exercise_bundle (title) VALUES ($1) RETURNING *',
            [title]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get exercises by bundle ID
app.get('/api/bundles/:bundleId/exercises', async (req, res) => {
    const { bundleId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM speech_therapy.exercise WHERE bundle_id = $1 ORDER BY step',
            [bundleId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new exercise
app.post('/api/exercises', upload.fields([
    { name: 'picture', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    const { title, description, bundle_id, step } = req.body;

    try {
        let pictureData = null;
        let audioData = null;
        let videoFilePath = null;
        let type = null;

        // Handle picture upload
        if (req.files.picture) {
            const pictureFile = req.files.picture[0];
            pictureData = fs.readFileSync(pictureFile.path);
            fs.unlinkSync(pictureFile.path); // Remove temp file
        }

        // Handle audio upload
        if (req.files.audio) {
            const audioFile = req.files.audio[0];
            audioData = fs.readFileSync(audioFile.path);
            fs.unlinkSync(audioFile.path); // Remove temp file
            type = 'audio';
        }

        // Handle video upload
        if (req.files.video) {
            const videoFile = req.files.video[0];
            videoFilePath = videoFile.filename;
            // Move video file to permanent location
            fs.renameSync(videoFile.path, path.join('uploads', videoFile.filename));
            type = 'video'
        }

        const result = await pool.query(
            'INSERT INTO speech_therapy.exercise (title, description, bundle_id, step, picture, audio, video_file_path, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [title, description, bundle_id, step, pictureData, audioData, videoFilePath, type]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get exercise picture
app.get('/api/exercises/:exerciseId/picture', async (req, res) => {
    const { exerciseId } = req.params;
    try {
        const result = await pool.query(
            'SELECT picture FROM speech_therapy.exercise WHERE id = $1',
            [exerciseId]
        );

        if (result.rows.length === 0 || !result.rows[0].picture) {
            return res.status(404).json({ error: 'Picture not found' });
        }

        res.set('Content-Type', 'image/jpeg');
        res.send(result.rows[0].picture);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get exercise audio
app.get('/api/exercises/:exerciseId/audio', async (req, res) => {
    const { exerciseId } = req.params;
    try {
        const result = await pool.query(
            'SELECT audio FROM speech_therapy.exercise WHERE id = $1',
            [exerciseId]
        );

        if (result.rows.length === 0 || !result.rows[0].audio) {
            return res.status(404).json({ error: 'Audio not found' });
        }

        res.set('Content-Type', 'audio/mpeg');
        res.send(result.rows[0].audio);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete bundle
app.delete('/api/bundles/:bundleId', async (req, res) => {
    const { bundleId } = req.params;
    try {
        // First delete all exercises in the bundle
        await pool.query('DELETE FROM speech_therapy.exercise WHERE bundle_id = $1', [bundleId]);
        // Then delete the bundle
        await pool.query('DELETE FROM speech_therapy.exercise_bundle WHERE id = $1', [bundleId]);
        res.json({ message: 'Bundle deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete exercise
app.delete('/api/exercises/:exerciseId', async (req, res) => {
    const { exerciseId } = req.params;
    try {
        // Get video file path to delete from filesystem
        const result = await pool.query(
            'SELECT video_file_path FROM speech_therapy.exercise WHERE id = $1',
            [exerciseId]
        );

        if (result.rows.length > 0 && result.rows[0].video_file_path) {
            const videoPath = path.join('uploads', result.rows[0].video_file_path);
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
        }

        await pool.query('DELETE FROM speech_therapy.exercise WHERE id = $1', [exerciseId]);
        res.json({ message: 'Exercise deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});