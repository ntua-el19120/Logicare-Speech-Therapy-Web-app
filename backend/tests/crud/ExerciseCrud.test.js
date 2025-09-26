const exerciseCrud = require('../../src/crud/ExerciseCrud');
const exerciseBundleCrud = require('../../src/crud/ExerciseBundleCrud');
const pool = require("../../src/config/db-connection");
const Exercise = require("../../src/models/Exercise");
const ExerciseBundle = require("../../src/models/ExerciseBundle");


describe('Exercise CRUD operations', () => {
    let testBundleId;
    let testExerciseId;

    beforeAll(async () => {
        // Create a test bundle to associate exercises with
        const bundle = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(null,'Test Bundle for CRUD',[], false));
        const bundle2 = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(null,'Test Bundle for CRUD 2',[], false));
        testBundleId = bundle.id;
        testBundleId2 = bundle2.id;
    });

    afterAll(async () => {
        // Clean up: delete bundle (cascades exercises)
        await exerciseBundleCrud.deleteExerciseBundle(testBundleId);
        await exerciseBundleCrud.deleteExerciseBundle(testBundleId2);
        await pool.end();
    });

    test('Create exercise', async () => {
        const exercise = await exerciseCrud.createExercise(new Exercise(
            null,
            testBundleId,
            1,
            'Test Exercise',
            'This is a test',
            Buffer.from('audio-data'),
            Buffer.from('image-data'),
            `uploads/videos/${testBundleId}/test-video.mp4`
            )
        );

        testExerciseId = exercise.id;

        expect(exercise).toBeDefined();
        expect(exercise.id).toBeDefined();
        expect(exercise.id).toBe(testExerciseId);
        expect(exercise.bundle_id).toBe(testBundleId);
        expect(exercise.title).toBe('Test Exercise');
        expect(exercise.description).toBe('This is a test');
        expect(exercise.video_file_path).toBe(`uploads/videos/${testBundleId}/test-video.mp4`);
        expect(exercise.audio).toStrictEqual(Buffer.from('audio-data'));
        expect(exercise.picture).toStrictEqual(Buffer.from('image-data'));

        await exerciseCrud.deleteExercise(testExerciseId);
    });

    test('Update exercise', async () => {
        const exercise = await exerciseCrud.createExercise(new Exercise(
                null,
                testBundleId,
                1,
                'Test Exercise',
                'This is a test',
                Buffer.from('audio-data'),
                Buffer.from('image-data'),
                `uploads/videos/${testBundleId}/test-video.mp4`
            )
        );

        testExerciseId = exercise.id;

        expect(exercise).toBeDefined();
        expect(exercise.id).toBeDefined();
        expect(exercise.id).toBe(testExerciseId);
        expect(exercise.bundle_id).toBe(testBundleId);
        expect(exercise.title).toBe('Test Exercise');
        expect(exercise.description).toBe('This is a test');
        expect(exercise.video_file_path).toBe(`uploads/videos/${testBundleId}/test-video.mp4`);
        expect(exercise.audio).toStrictEqual(Buffer.from('audio-data'));
        expect(exercise.picture).toStrictEqual(Buffer.from('image-data'));


        exercise.bundle_id = testBundleId2;
        exercise.step = 2;
        exercise.title = 'Test Exercise 2';
        exercise.description = 'This is a test 2';
        exercise.video_file_path = `uploads/videos/${testBundleId}/test-video-2.mp4`;
        exercise.audio = Buffer.from('audio-data-2');
        exercise.picture = Buffer.from('image-data-2');

        await exerciseCrud.updateExercise(exercise);

        expect(exercise).toBeDefined();
        expect(exercise.id).toBeDefined();
        expect(exercise.id).toBe(testExerciseId);
        expect(exercise.bundle_id).toBe(testBundleId2);
        expect(exercise.title).toBe('Test Exercise 2');
        expect(exercise.description).toBe('This is a test 2');
        expect(exercise.video_file_path).toBe(`uploads/videos/${testBundleId}/test-video-2.mp4`);
        expect(exercise.audio).toStrictEqual(Buffer.from('audio-data-2'));
        expect(exercise.picture).toStrictEqual(Buffer.from('image-data-2'));


        await exerciseCrud.deleteExercise(testExerciseId);
    });

    test('Update few field', async () => {
        const exercise = await exerciseCrud.createExercise(new Exercise(
                null,
                testBundleId,
                1,
                'Test Exercise',
                'This is a test',
                Buffer.from('audio-data'),
                Buffer.from('image-data'),
                `uploads/videos/${testBundleId}/test-video.mp4`
            )
        );

        testExerciseId = exercise.id;

        expect(exercise).toBeDefined();
        expect(exercise.id).toBeDefined();
        expect(exercise.id).toBe(testExerciseId);
        expect(exercise.bundle_id).toBe(testBundleId);
        expect(exercise.title).toBe('Test Exercise');
        expect(exercise.description).toBe('This is a test');
        expect(exercise.video_file_path).toBe(`uploads/videos/${testBundleId}/test-video.mp4`);
        expect(exercise.audio).toStrictEqual(Buffer.from('audio-data'));
        expect(exercise.picture).toStrictEqual(Buffer.from('image-data'));


        exercise.bundle_id = testBundleId2;
        exercise.step = 2;
        exercise.title = 'Test Exercise 2';

        await exerciseCrud.updateExercise(exercise);

        expect(exercise).toBeDefined();
        expect(exercise.id).toBeDefined();
        expect(exercise.id).toBe(testExerciseId);
        expect(exercise.bundle_id).toBe(testBundleId2);
        expect(exercise.title).toBe('Test Exercise 2');
        expect(exercise.description).toBe('This is a test');
        expect(exercise.video_file_path).toBe(`uploads/videos/${testBundleId}/test-video.mp4`);
        expect(exercise.audio).toStrictEqual(Buffer.from('audio-data'));
        expect(exercise.picture).toStrictEqual(Buffer.from('image-data'));


        await exerciseCrud.deleteExercise(testExerciseId);
    });

    test('Delete exercise', async () => {
        const exercise = await exerciseCrud.createExercise(new Exercise(
                null,
                testBundleId,
                1,
                'Test Exercise',
                'This is a test',
                Buffer.from('audio-data'),
                Buffer.from('image-data'),
                `uploads/videos/${testBundleId}/test-video.mp4`
            )
        );

        testExerciseId = exercise.id;

        expect(exercise).toBeDefined();
        expect(exercise.id).toBeDefined();
        expect(exercise.id).toBe(testExerciseId);
        expect(exercise.bundle_id).toBe(testBundleId);
        expect(exercise.title).toBe('Test Exercise');
        expect(exercise.description).toBe('This is a test');
        expect(exercise.video_file_path).toBe(`uploads/videos/${testBundleId}/test-video.mp4`);
        expect(exercise.audio).toStrictEqual(Buffer.from('audio-data'));
        expect(exercise.picture).toStrictEqual(Buffer.from('image-data'));

        await exerciseCrud.deleteExercise(testExerciseId);

        const deletedExercise = await exerciseCrud.getExerciseById(testExerciseId);

        expect(deletedExercise).toBeNull();
    });

    test('Find exercise by id', async () => {
        const exercise = await exerciseCrud.createExercise(new Exercise(
                null,
                testBundleId,
                1,
                'Test Exercise',
                'This is a test',
                Buffer.from('audio-data'),
                Buffer.from('image-data'),
                `uploads/videos/${testBundleId}/test-video.mp4`
            )
        );

        testExerciseId = exercise.id;

        expect(exercise).toBeDefined();
        expect(exercise.id).toBeDefined();
        expect(exercise.id).toBe(testExerciseId);
        expect(exercise.bundle_id).toBe(testBundleId);
        expect(exercise.title).toBe('Test Exercise');
        expect(exercise.description).toBe('This is a test');
        expect(exercise.video_file_path).toBe(`uploads/videos/${testBundleId}/test-video.mp4`);
        expect(exercise.audio).toStrictEqual(Buffer.from('audio-data'));
        expect(exercise.picture).toStrictEqual(Buffer.from('image-data'));

        const foundExercise = await exerciseCrud.getExerciseById(testExerciseId);

        expect(foundExercise).toBeDefined();
        expect(foundExercise.id).toBeDefined();
        expect(foundExercise.id).toBe(testExerciseId);
        expect(foundExercise.bundle_id).toBe(testBundleId);
        expect(foundExercise.title).toBe('Test Exercise');
        expect(foundExercise.description).toBe('This is a test');
        expect(foundExercise.video_file_path).toBe(`uploads/videos/${testBundleId}/test-video.mp4`);
        expect(foundExercise.audio).toStrictEqual(Buffer.from('audio-data'));
        expect(foundExercise.picture).toStrictEqual(Buffer.from('image-data'));

        await exerciseCrud.deleteExercise(testExerciseId);
    });

    test('Find exercises by bundle id', async () => {

        await exerciseCrud.createExercise(new Exercise(
                null,
                testBundleId,
                1,
                'Test Exercise',
                'This is a test',
                Buffer.from('audio-data'),
                Buffer.from('image-data'),
                `uploads/videos/${testBundleId}/test-video.mp4`
            )
        );

        await exerciseCrud.createExercise(new Exercise(
                null,
                testBundleId,
                2,
                'Test Exercise',
                'This is a test',
                Buffer.from('audio-data'),
                Buffer.from('image-data'),
                `uploads/videos/${testBundleId}/test-video.mp4`
            )
        );

        const foundExercises = await exerciseCrud.getExercisesByBundleId(testBundleId);
        expect(foundExercises).toBeDefined();

        for (const exercise of foundExercises) {
            expect(exercise).toBeDefined();
            expect(exercise.id).toBeDefined();
            expect(exercise.bundle_id).toBe(testBundleId);
            expect(exercise.title).toBe('Test Exercise');
            expect(exercise.description).toBe('This is a test');
            expect(exercise.video_file_path).toBe(`uploads/videos/${testBundleId}/test-video.mp4`);
            expect(exercise.audio).toStrictEqual(Buffer.from('audio-data'));
            expect(exercise.picture).toStrictEqual(Buffer.from('image-data'));
        }

        for (const exercise of foundExercises) {
            await exerciseCrud.deleteExercise(exercise.id);
        }

    });
});