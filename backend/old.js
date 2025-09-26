const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use('/videos', express.static(path.join(__dirname, 'uploads')));

// PostgreSQL connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'speech_therapy',
    password: 'postgres',
    port: 5432,
});

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage });

// Upload endpoint
app.post('/upload', upload.single('video'), async (req, res) => {
    const file = req.file;
    const { title } = req.body;

    if (!file || !title) return res.status(400).json({ error: 'Missing file or title' });

    const filepath = `/videos/${file.filename}`;

    try {
        const result = await pool.query(
            'INSERT INTO speech_therapy.videos (title, filepath) VALUES ($1, $2) RETURNING *',
            [title, filepath]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

// Get all videos
app.get('/videos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM speech_therapy.videos ORDER BY uploaded_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database fetch error');
    }
});

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
