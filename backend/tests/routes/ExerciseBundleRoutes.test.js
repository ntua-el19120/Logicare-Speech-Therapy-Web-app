const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

// Import your app (adjust path as needed)
const app = require('../../src/app.js');
const exerciseBundleCrud = require("../../src/crud/ExerciseBundleCrud");
const userCrud = require("../../src/crud/UserCrud");
const userExerciseBundleAssociationCrud = require("../../src/crud/UserExerciseBundleAssociationCrud");
const ExerciseBundle = require("../../src/models/ExerciseBundle");
const pool = require("../../src/config/db-connection");
const User = require("../../src/models/User");

// Test data
let testBundleId;
let testUserId;
let testBundleId2;

describe('Exercise Bundle API', () => {
    beforeAll(async () => {
        // Create test user (assuming you have a users table)
        // You might need to create a test user in your users table here
        // await pool.query('INSERT INTO users (id, name, email) VALUES ($1, $2, $3)', [testUserId, 'Test User', 'test@example.com']);
        let user = await userCrud.createUser(new User(
            null,"patient","user@user.com","user","user", 2000,"hashed",null
        ))
        testUserId = user.id;

    });

    afterAll(async () => {
        // Clean up test data
        await pool.query('DELETE FROM speech_therapy.user_bundle WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM speech_therapy.exercise');
        await pool.query('DELETE FROM speech_therapy.exercise_bundle');
        await pool.query('DELETE FROM speech_therapy.user');
        // await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    });

    beforeEach(async () => {
        // Clean up bundles before each test
        await pool.query('DELETE FROM speech_therapy.user_bundle');
        await pool.query('DELETE FROM speech_therapy.exercise');
        await pool.query('DELETE FROM speech_therapy.exercise_bundle');
    });

    describe('POST /api/bundles', () => {
        test('should create bundle successfully', async () => {
            const bundleData = {
                title: 'Test Bundle',
                global: true
            };

            const response = await request(app.app)
                .post('/api/bundles')
                .send(bundleData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe('Test Bundle');
            expect(response.body.global).toBe(true);
            expect(response.body.description).toBeUndefined();

            testBundleId = response.body.id;
        });

        test('should create bundle with minimal data', async () => {
            const bundleData = {
                title: 'Minimal Bundle',
                global: false
            };

            const response = await request(app.app)
                .post('/api/bundles')
                .send(bundleData)
                .expect(201);

            expect(response.body.title).toBe('Minimal Bundle');
            expect(response.body.global).toBe(false);
        });

        test('should handle database error', async () => {
            // Force a database error by trying to create with invalid data type
            const bundleData = {
                title: 'A'.repeat(10000), // Extremely long title that might cause DB error
                global: 'invalid_boolean_value'
            };

            await request(app.app)
                .post('/api/bundles')
                .send(bundleData)
                .expect(500);
        });
    });

    describe('POST /api/bundles/:bundleId/users/:userId', () => {
        beforeEach(async () => {
            // Create test bundle
            const bundleResult = await exerciseBundleCrud.createExerciseBundle(
                new ExerciseBundle(null, "Test Bundle", null, false)
            );
            testBundleId = bundleResult.id;
        });

        test('should assign bundle to user successfully', async () => {
            const response = await request(app.app)
                .post(`/api/bundles/${testBundleId}/users/${testUserId}`)
                .expect(200);

            expect(response.body.message).toBe('Bundle assigned to user');

            // Verify association was created in database
            const result = await pool.query(
                'SELECT * FROM speech_therapy.user_bundle WHERE user_id = $1 AND bundle_id = $2',
                [testUserId, testBundleId]
            );
            expect(result.rows.length).toBe(1);
        });

        test('should handle invalid bundle ID', async () => {
            const fakeBundleId = uuidv4();

            const response = await request(app.app)
                .post(`/api/bundles/${fakeBundleId}/users/${testUserId}`)
                .expect(500);

            expect(response.body.error).toBeDefined();
        });

        test('should handle invalid user ID', async () => {
            const fakeUserId = uuidv4();

            const response = await request(app.app)
                .post(`/api/bundles/${testBundleId}/users/${fakeUserId}`)
                .expect(500);

            expect(response.body.error).toBeDefined();
        });

        test('should handle malformed UUIDs', async () => {
            const invalidId = 'invalid-uuid';

            const response = await request(app.app)
                .post(`/api/bundles/${invalidId}/users/${testUserId}`)
                .expect(500);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /api/bundles/:id', () => {
        beforeEach(async () => {
            // Create test bundle with exercises
            const bundleResult = await exerciseBundleCrud.createExerciseBundle(
                new ExerciseBundle(null, "Bundle with Exercises", null, true)
            );
            testBundleId = bundleResult.id;

            // Add some exercises to the bundle
            await pool.query(
                'INSERT INTO speech_therapy.exercise (bundle_id, step, title, description) VALUES ($1, $2, $3, $4)',
                [testBundleId, 1, 'Exercise 1', 'First exercise']
            );
            await pool.query(
                'INSERT INTO speech_therapy.exercise (bundle_id, step, title, description) VALUES ($1, $2, $3, $4)',
                [testBundleId, 2, 'Exercise 2', 'Second exercise']
            );
        });

        test('should get bundle with exercises successfully', async () => {
            const response = await request(app.app)
                .get(`/api/bundles/${testBundleId}`)
                .expect(200);

            expect(response.body.id).toBe(testBundleId);
            expect(response.body.title).toBe('Bundle with Exercises');
            expect(response.body.global).toBe(true);
            expect(response.body.exercises).toBeDefined();
            expect(response.body.exercises.length).toBe(2);
            expect(response.body.exercises[0].title).toBe('Exercise 1');
            expect(response.body.exercises[1].title).toBe('Exercise 2');
        });

        test('should return 404 for non-existent bundle', async () => {
            const fakeId = uuidv4();

            const response = await request(app.app)
                .get(`/api/bundles/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe('Bundle not found');
        });

        test('should handle malformed UUID', async () => {
            const response = await request(app.app)
                .get('/api/bundles/invalid-uuid')
                .expect(500);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /api/bundles/users/:userId', () => {
        beforeEach(async () => {
            // Create test bundles
            const bundle1 = await exerciseBundleCrud.createExerciseBundle(
                new ExerciseBundle(null, "User Bundle 1", null, false)
            );
            const bundle2 = await exerciseBundleCrud.createExerciseBundle(
                new ExerciseBundle(null, "User Bundle 2", null, true)
            );

            testBundleId = bundle1.id;
            testBundleId2 = bundle2.id;

            // Associate bundles with user
            await userExerciseBundleAssociationCrud.createUserExerciseBundleAssociation(testUserId, testBundleId);
            await userExerciseBundleAssociationCrud.createUserExerciseBundleAssociation(testUserId, testBundleId2);
        });

        test('should get bundles for user successfully', async () => {
            const response = await request(app.app)
                .get(`/api/bundles/users/${testUserId}`)
                .expect(200);

            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(2);

            const titles = response.body.map(bundle => bundle.title);
            expect(titles).toContain('User Bundle 1');
            expect(titles).toContain('User Bundle 2');
        });

        test('should return 404 when no bundles found for user', async () => {
            const fakeUserId = uuidv4();

            const response = await request(app.app)
                .get(`/api/bundles/users/${fakeUserId}`)
                .expect(404);

            expect(response.body.error).toBe('No bundle not found');
        });

        test('should handle malformed UUID', async () => {
            const response = await request(app.app)
                .get('/api/bundles/users/invalid-uuid')
                .expect(500);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('PUT /api/bundles/:id', () => {
        beforeEach(async () => {
            // Create test bundle
            const bundleResult = await exerciseBundleCrud.createExerciseBundle(
                new ExerciseBundle(null, "Original Bundle", "Original Description", false)
            );
            testBundleId = bundleResult.id;
        });

        test('should update bundle successfully', async () => {
            const updateData = {
                title: 'Updated Bundle Title',
                global: true
            };

            const response = await request(app.app)
                .put(`/api/bundles/${testBundleId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.message).toBe('Bundle updated');

            // Verify update in database
            const updatedBundle = await exerciseBundleCrud.getBundleById(testBundleId);
            expect(updatedBundle.title).toBe('Updated Bundle Title');
            expect(updatedBundle.global).toBe(true);
        });

        test('should handle partial updates', async () => {
            const updateData = {
                title: 'Partially Updated Title'
                // global is not provided
            };

            const response = await request(app.app)
                .put(`/api/bundles/${testBundleId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.message).toBe('Bundle updated');

            // Verify partial update in database
            const updatedBundle = await exerciseBundleCrud.getBundleById(testBundleId);
            expect(updatedBundle.title).toBe('Partially Updated Title');
            // Original global value should be preserved (depending on your implementation)
        });

        test('should handle empty update', async () => {
            const response = await request(app.app)
                .put(`/api/bundles/${testBundleId}`)
                .send({})
                .expect(200);

            expect(response.body.message).toBe('Bundle updated');
        });

        test('should return error for non-existent bundle', async () => {
            const fakeId = uuidv4();
            const updateData = {
                title: 'Updated Title',
                global: true
            };

            const response = await request(app.app)
                .put(`/api/bundles/${fakeId}`)
                .send(updateData)
                .expect(404);

            expect(response.body.error).toBeDefined();
        });

        test('should handle malformed UUID', async () => {
            const updateData = {
                title: 'Updated Title'
            };

            const response = await request(app.app)
                .put('/api/bundles/invalid-uuid')
                .send(updateData)
                .expect(500);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('DELETE /api/bundles/:id', () => {
        beforeEach(async () => {
            // Create test bundle
            const bundleResult = await exerciseBundleCrud.createExerciseBundle(
                new ExerciseBundle(null, "Bundle to Delete", null, false)
            );
            testBundleId = bundleResult.id;
        });

        test('should delete bundle successfully', async () => {
            const response = await request(app.app)
                .delete(`/api/bundles/${testBundleId}`)
                .expect(200);

            expect(response.body.message).toBe('Bundle deleted');

            // Verify bundle is deleted from database
            const deletedBundle = await exerciseBundleCrud.getBundleById(testBundleId);
            expect(deletedBundle).toBeNull();
        });

        test('should return error for non-existent bundle', async () => {
            const fakeId = uuidv4();

            const response = await request(app.app)
                .delete(`/api/bundles/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBeDefined();
        });

        test('should handle bundle with associated exercises', async () => {
            // Add exercise to bundle
            await pool.query(
                'INSERT INTO speech_therapy.exercise (bundle_id, step, title) VALUES ($1, $2, $3)',
                [testBundleId, 1, 'Test Exercise']
            );

            const response = await request(app.app)
                .delete(`/api/bundles/${testBundleId}`)
                .expect(200);

            expect(response.body.message).toBe('Bundle deleted');

            // Due to CASCADE, exercises should also be deleted
            const exercises = await pool.query(
                'SELECT * FROM speech_therapy.exercise WHERE bundle_id = $1',
                [testBundleId]
            );
            expect(exercises.rows.length).toBe(0);
        });

        test('should handle bundle with user associations', async () => {
            // Associate bundle with user
            await userExerciseBundleAssociationCrud.createUserExerciseBundleAssociation(testUserId, testBundleId);

            const response = await request(app.app)
                .delete(`/api/bundles/${testBundleId}`)
                .expect(200);

            expect(response.body.message).toBe('Bundle deleted');

            // Verify user association is also deleted
            const associations = await pool.query(
                'SELECT * FROM speech_therapy.user_bundle WHERE bundle_id = $1',
                [testBundleId]
            );
            expect(associations.rows.length).toBe(0);
        });

        test('should handle malformed UUID', async () => {
            const response = await request(app.app)
                .delete('/api/bundles/invalid-uuid')
                .expect(500);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('Request Format Handling', () => {
        test('should handle malformed JSON in POST request', async () => {
            const response = await request(app.app)
                .post('/api/bundles')
                .send('{"invalid": json}')
                .set('Content-Type', 'application/json')
                .expect(400);
        });

        test('should handle missing Content-Type header', async () => {
            const bundleData = {
                title: 'Test Bundle',
                global: true
            };

            const response = await request(app.app)
                .post('/api/bundles')
                .send(bundleData)
                .expect(201);

            expect(response.body.title).toBe('Test Bundle');
        });

        test('should handle very long bundle titles', async () => {
            const longTitle = 'A'.repeat(500); // Long but reasonable title
            const bundleData = {
                title: longTitle,
                global: true
            };

            const response = await request(app.app)
                .post('/api/bundles')
                .send(bundleData)
                .expect(201);

            expect(response.body.title).toBe(longTitle);
        });

        test('should handle boolean string conversion', async () => {
            const bundleData = {
                title: 'Test Bundle',
                global: 'true' // String instead of boolean
            };

            const response = await request(app.app)
                .post('/api/bundles')
                .send(bundleData)
                .expect(201);

            expect(response.body.title).toBe('Test Bundle');
            expect(response.body.global).toBe('true'); // Will be stored as string
        });
    });

    describe('Integration with Exercises', () => {
        beforeEach(async () => {
            // Create bundle with exercises for integration testing
            const bundleResult = await exerciseBundleCrud.createExerciseBundle(
                new ExerciseBundle(null, "Integration Test Bundle", null, true)
            );
            testBundleId = bundleResult.id;
        });

        test('should cascade delete exercises when bundle is deleted', async () => {
            // Add multiple exercises to bundle
            const exercise1 = await pool.query(
                'INSERT INTO speech_therapy.exercise (bundle_id, step, title) VALUES ($1, $2, $3) RETURNING id',
                [testBundleId, 1, 'Exercise 1']
            );
            const exercise2 = await pool.query(
                'INSERT INTO speech_therapy.exercise (bundle_id, step, title) VALUES ($1, $2, $3) RETURNING id',
                [testBundleId, 2, 'Exercise 2']
            );

            // Verify exercises exist
            const exercisesBefore = await pool.query(
                'SELECT * FROM speech_therapy.exercise WHERE bundle_id = $1',
                [testBundleId]
            );
            expect(exercisesBefore.rows.length).toBe(2);

            // Delete bundle
            await request(app.app)
                .delete(`/api/bundles/${testBundleId}`)
                .expect(200);

            // Verify exercises are also deleted
            const exercisesAfter = await pool.query(
                'SELECT * FROM speech_therapy.exercise WHERE bundle_id = $1',
                [testBundleId]
            );
            expect(exercisesAfter.rows.length).toBe(0);
        });

        test('should return bundle with correct exercise count', async () => {
            // Add exercises to bundle
            await pool.query(
                'INSERT INTO speech_therapy.exercise (bundle_id, step, title) VALUES ($1, $2, $3)',
                [testBundleId, 1, 'Exercise 1']
            );
            await pool.query(
                'INSERT INTO speech_therapy.exercise (bundle_id, step, title) VALUES ($1, $2, $3)',
                [testBundleId, 2, 'Exercise 2']
            );
            await pool.query(
                'INSERT INTO speech_therapy.exercise (bundle_id, step, title) VALUES ($1, $2, $3)',
                [testBundleId, 3, 'Exercise 3']
            );

            const response = await request(app.app)
                .get(`/api/bundles/${testBundleId}`)
                .expect(200);

            expect(response.body.exercises).toBeDefined();
            expect(response.body.exercises.length).toBe(3);

            // Verify exercises are in correct order
            expect(response.body.exercises[0].step).toBe(1);
            expect(response.body.exercises[1].step).toBe(2);
            expect(response.body.exercises[2].step).toBe(3);
        });
    });
});