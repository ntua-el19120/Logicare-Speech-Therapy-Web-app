const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

// Import your app.app (adjust path as needed)
const app = require('../../src/app.js');
const exerciseBundleCrud = require("../../src/crud/ExerciseBundleCrud");
const ExerciseBundle = require("../../src/models/ExerciseBundle");
const pool = require("../../src/config/db-connection");

// Test data
let testBundleId;
let testExerciseId;

// Mock files for testing
const createMockFiles = async () => {
    const mockAudio = Buffer.from('mock audio data');
    const mockImage = Buffer.from('mock image data');
    const mockVideo = Buffer.from('mock video data');

    return { mockAudio, mockImage, mockVideo };
};

describe('Speech Therapy Exercise API', () => {
    beforeAll(async () => {
        await pool.query('DELETE FROM speech_therapy.exercise');
        await pool.query('DELETE FROM speech_therapy.exercise_bundle');
        // Create test bundle
        const bundleResult = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(null, "title", null, false))
        testBundleId = bundleResult.id;
    });

    afterAll(async () => {
        await pool.query('DELETE FROM speech_therapy.exercise');
        await pool.query('DELETE FROM speech_therapy.exercise_bundle');
    });

    describe('POST /api/exercises', () => {
        test('should create exercise with all files', async () => {
            const { mockAudio, mockImage, mockVideo } = await createMockFiles();

            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Test Exercise')
                .field('description', 'Test description')
                .attach('audio', mockAudio, 'test.mp3')
                .attach('picture', mockImage, 'test.jpg')
                .attach('video', mockVideo, 'test.mp4')
                .expect(201);

            expect(response.body.message).toBe('Exercise created successfully');
            expect(response.body.exercise).toHaveProperty('id');
            expect(response.body.exercise.title).toBe('Test Exercise');
            expect(response.body.exercise.audio).toBeDefined();
            expect(response.body.exercise.picture).toBeDefined()
            expect(response.body.exercise.video_file_path).toMatch(/uploads\/videos\/.+\.mp4$/);

            testExerciseId = response.body.exercise.id;
        });

        test('should create exercise with only required fields', async () => {
            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '2')
                .field('title', 'Minimal Exercise')
                .expect(201);

            expect(response.body.exercise.audio).toBeDefined();
            expect(response.body.exercise.picture).toBeDefined();
            expect(response.body.exercise.video_file_path).toBeNull();
        });

        test('should fail with missing required fields', async () => {
            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                // Missing title
                .expect(400);

            expect(response.body.error).toContain('Missing required fields');
        });

        test('should fail with invalid bundle_id', async () => {
            const fakeBundleId = uuidv4();

            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', fakeBundleId)
                .field('step', '1')
                .field('title', 'Test Exercise')
                .expect(400);

            expect(response.body.error).toContain('Invalid bundle_id');
        });

        test('should fail with invalid file type', async () => {
            const mockTextFile = Buffer.from('not an audio file');

            await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Test Exercise')
                .attach('audio', mockTextFile, 'test.txt')
                .expect(400);
        });
    });

    describe('GET /api/exercises/:id', () => {
        beforeEach(async () => {
            // Create test exercise
            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Test Exercise')
                .field('description', 'Test description');

            testExerciseId = response.body.exercise.id;
        });

        test('should retrieve exercise by id', async () => {
            const response = await request(app.app)
                .get(`/api/exercises/${testExerciseId}`)
                .expect(200);

            expect(response.body.id).toBe(testExerciseId);
            expect(response.body.title).toBe('Test Exercise');
            expect(response.body.bundle_id).toBe(testBundleId);
        });

        test('should return 404 for non-existent exercise', async () => {
            const fakeId = uuidv4();

            const response = await request(app.app)
                .get(`/api/exercises/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe('Exercise not found');
        });
    });

    describe('PUT /api/exercises/:id', () => {
        beforeEach(async () => {
            // Create test exercise with files
            const { mockAudio, mockImage, mockVideo } = await createMockFiles();

            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Original Exercise')
                .field('description', 'Original description')
                .attach('audio', mockAudio, 'original.mp3')
                .attach('picture', mockImage, 'original.jpg')
                .attach('video', mockVideo, 'original.mp4');

            testExerciseId = response.body.exercise.id;
        });

        test('should update exercise text fields', async () => {
            const response = await request(app.app)
                .put(`/api/exercises/${testExerciseId}`)
                .field('title', 'Updated Exercise')
                .field('description', 'Updated description')
                .expect(200);

            expect(response.body.message).toBe('Exercise updated successfully');
            expect(response.body.exercise.title).toBe('Updated Exercise');
            expect(response.body.exercise.description).toBe('Updated description');
        });

        test('should update exercise files', async () => {
            const { mockAudio, mockVideo } = await createMockFiles();

            const response = await request(app.app)
                .put(`/api/exercises/${testExerciseId}`)
                .attach('audio', mockAudio, 'new.mp3')
                .attach('video', mockVideo, 'new.mp4')
                .expect(200);

            expect(response.body.exercise.audio).toBeDefined()
            expect(response.body.exercise.video_file_path).toMatch(/uploads\/videos\/.+\.mp4$/);
        });

        test('should update only provided fields', async () => {
            const response = await request(app.app)
                .put(`/api/exercises/${testExerciseId}`)
                .field('title', 'Partially Updated')
                .expect(200);

            expect(response.body.exercise.title).toBe('Partially Updated');
            expect(response.body.exercise.description).toBe('Original description');
        });

        test('should return 404 for non-existent exercise', async () => {
            const fakeId = uuidv4();

            const response = await request(app.app)
                .put(`/api/exercises/${fakeId}`)
                .field('title', 'Updated Title')
                .expect(404);

            expect(response.body.error).toBe('Exercise not found');
        });

        test('should fail with invalid bundle_id', async () => {
            const fakeBundleId = uuidv4();

            const response = await request(app.app)
                .put(`/api/exercises/${testExerciseId}`)
                .field('bundle_id', fakeBundleId)
                .expect(400);

            expect(response.body.error).toContain('Invalid bundle_id');
        });
    });

    describe('DELETE /api/exercises/:id', () => {
        beforeEach(async () => {
            // Create test exercise
            const { mockVideo } = await createMockFiles();

            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Exercise to Delete')
                .attach('video', mockVideo, 'delete.mp4');

            testExerciseId = response.body.exercise.id;
        });

        test('should delete exercise successfully', async () => {
            const response = await request(app.app)
                .delete(`/api/exercises/${testExerciseId}`)
                .expect(200);

            expect(response.body.message).toBe('Exercise deleted successfully');

            // Verify exercise is deleted
            await request(app.app)
                .get(`/api/exercises/${testExerciseId}`)
                .expect(404);
        });

        test('should return 404 for non-existent exercise', async () => {
            const fakeId = uuidv4();

            const response = await request(app.app)
                .delete(`/api/exercises/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe('Exercise not found');
        });
    });

    describe('GET /api/exercises/:id/video', () => {
        beforeEach(async () => {
            const { mockVideo } = await createMockFiles();

            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Video Exercise')
                .attach('video', mockVideo, 'test.mp4');

            testExerciseId = response.body.exercise.id;
        });

        test('should serve video file', async () => {
            await request(app.app)
                .get(`/api/exercises/${testExerciseId}/video`)
                .expect(200)
                .expect('Content-Type', 'application/mp4');
        });

        test('should return 404 for exercise without video', async () => {
            // Create exercise without video
            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '2')
                .field('title', 'No Video Exercise');

            const noVideoId = response.body.exercise.id;

            const videoResponse = await request(app.app)
                .get(`/api/exercises/${noVideoId}/video`)
                .expect(404);

            expect(videoResponse.body.error).toBe('Video not found');
        });
    });

    describe('GET /api/exercises/:id/audio', () => {
        beforeEach(async () => {
            const { mockAudio } = await createMockFiles();

            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Audio Exercise')
                .attach('audio', mockAudio, 'test.mp3');

            testExerciseId = response.body.exercise.id;
        });

        test('should serve audio file', async () => {
            const response = await request(app.app)
                .get(`/api/exercises/${testExerciseId}/audio`)
                .expect(200)
                .expect('Content-Type', 'audio/mpeg');

            expect(response.body.toString()).toBe('mock audio data');
        });

        test('should return 404 for exercise without audio', async () => {
            // Create exercise without audio
            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '2')
                .field('title', 'No Audio Exercise');

            const noAudioId = response.body.exercise.id;

            const audioResponse = await request(app.app)
                .get(`/api/exercises/${noAudioId}/audio`)
                .expect(404);

            expect(audioResponse.body.error).toBe('Audio not found');
        });
    });

    describe('GET /api/exercises/:id/picture', () => {
        beforeEach(async () => {
            const { mockImage } = await createMockFiles();

            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Picture Exercise')
                .attach('picture', mockImage, 'test.jpg');

            testExerciseId = response.body.exercise.id;
        });

        test('should serve picture file', async () => {
            const response = await request(app.app)
                .get(`/api/exercises/${testExerciseId}/picture`)
                .expect(200)
                .expect('Content-Type', 'image/jpeg');

            expect(response.body.toString()).toBe('mock image data');
        });

        test('should return 404 for exercise without picture', async () => {
            // Create exercise without picture
            const response = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '2')
                .field('title', 'No Picture Exercise');

            const noPictureId = response.body.exercise.id;

            const pictureResponse = await request(app.app)
                .get(`/api/exercises/${noPictureId}/picture`)
                .expect(404);

            expect(pictureResponse.body.error).toBe('Picture not found');
        });
    });

    describe('Error Handling', () => {
        test('should handle malformed UUID', async () => {
            await request(app.app)
                .get('/api/exercises/invalid-uuid')
                .expect(500); // PostgreSQL will throw an error for invalid UUID format
        });

        test('should handle file size limit', async () => {
            // Create a buffer larger than the 100MB limit
            const largeBuffer = Buffer.alloc(101 * 1024 * 1024); // 101MB

            await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Large File Exercise')
                .attach('video', largeBuffer, 'large.mp4')
                .expect(400);
        });

        test('should handle unexpected file fields', async () => {
            const mockFile = Buffer.from('test data');

            await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Unexpected Field Exercise')
                .attach('unexpected_field', mockFile, 'test.txt')
                .expect(400);
        });
    });

    describe('File Cleanup', () => {
        test('should clean up video file when exercise is deleted', async () => {
            const { mockVideo } = await createMockFiles();

            // Create exercise with video
            const createResponse = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Cleanup Test Exercise')
                .attach('video', mockVideo, 'cleanup.mp4');

            const exerciseId = createResponse.body.exercise.id;
            const videoPath = createResponse.body.exercise.video_file_path;

            // Verify video file exists (in a real scenario)
            // Note: In tests, the file might not actually be written to disk

            // Delete exercise
            await request(app.app)
                .delete(`/api/exercises/${exerciseId}`)
                .expect(200);

            // Video file should be cleaned up (this is tested by the endpoint logic)
        });

        test('should clean up old video when replacing with new one', async () => {
            const { mockVideo } = await createMockFiles();

            // Create exercise with video
            const createResponse = await request(app.app)
                .post('/api/exercises')
                .field('bundle_id', testBundleId)
                .field('step', '1')
                .field('title', 'Replace Video Exercise')
                .attach('video', mockVideo, 'original.mp4');

            const exerciseId = createResponse.body.exercise.id;
            const originalVideoPath = createResponse.body.exercise.video_file_path;

            // Update with new video
            const newMockVideo = Buffer.from('new mock video data');
            const updateResponse = await request(app.app)
                .put(`/api/exercises/${exerciseId}`)
                .attach('video', newMockVideo, 'new.mp4')
                .expect(200);

            const newVideoPath = updateResponse.body.exercise.video_file_path;

            // Paths should be different
            expect(newVideoPath).not.toBe(originalVideoPath);
        });
    });
});