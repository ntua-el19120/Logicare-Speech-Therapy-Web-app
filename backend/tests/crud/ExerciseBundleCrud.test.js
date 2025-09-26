const exerciseCrud = require('../../src/crud/ExerciseCrud');
const exerciseBundleCrud = require('../../src/crud/ExerciseBundleCrud');
const pool = require("../../src/config/db-connection");
const Exercise = require("../../src/models/Exercise");
const ExerciseBundle = require("../../src/models/ExerciseBundle");
const User = require("../../src/models/User");
const userCrud = require("../../src/crud/UserCrud");
const userExerciseBundleAssociationCrud = require("../../src/crud/UserExerciseBundleAssociationCrud");


describe('Exercise Bundle CRUD operations', () => {
    let testBundleId;
    let testExerciseId;
    let user

    beforeAll(async () => {
        user = await userCrud.createUser(new User(
            null,"patient","user@user.com","user","user", 2000,"hashed",null
        ))
    });

    afterAll(async () => {
        await userCrud.deleteUser(user.id);
        await pool.end();
    });

    test('Create exercise bundle', async () => {
        const exerciseBundle = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(
                null,
                "Test Bundle for CRUD",
                [],
                false
            )
        );

        let testBundleId = exerciseBundle.id;

        expect(exerciseBundle).toBeDefined();
        expect(exerciseBundle.id).toBeDefined();
        expect(exerciseBundle.id).toBe(testBundleId);
        expect(exerciseBundle.title).toBe('Test Bundle for CRUD');
        expect(exerciseBundle.exercises).toStrictEqual([]);
        expect(exerciseBundle.global).toBe(false);

        await exerciseBundleCrud.deleteExerciseBundle(testBundleId);
    });

    test('Update exercise bundle', async () => {
        const exerciseBundle = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(
                null,
                "Test Bundle for CRUD",
                [],
                false
            )
        );

        let testBundleId = exerciseBundle.id;

        expect(exerciseBundle).toBeDefined();
        expect(exerciseBundle.id).toBeDefined();
        expect(exerciseBundle.id).toBe(testBundleId);
        expect(exerciseBundle.title).toBe('Test Bundle for CRUD');
        expect(exerciseBundle.exercises).toStrictEqual([]);
        expect(exerciseBundle.global).toBe(false);


        let exercise1 = await exerciseCrud.createExercise(new Exercise(null, testBundleId, 1, "test", "test", null, null, null));
        let exercise2 = await exerciseCrud.createExercise(new Exercise(null, testBundleId, 2, "test", "test", null, null, null));

        exerciseBundle.title = 'Test Bundle for CRUD 2';
        exerciseBundle.global = true;

        await exerciseBundleCrud.updateExerciseBundle(exerciseBundle);

        expect(exerciseBundle).toBeDefined();
        expect(exerciseBundle.id).toBeDefined();
        expect(exerciseBundle.id).toBe(testBundleId);
        expect(exerciseBundle.title).toBe('Test Bundle for CRUD 2');
        expect(exerciseBundle.exercises).toStrictEqual([]);
        expect(exerciseBundle.global).toBe(true);


        await exerciseBundleCrud.deleteExerciseBundle(testBundleId);
        await exerciseCrud.getExerciseById(exercise1.id);
        await exerciseCrud.getExerciseById(exercise2.id);
    });

    test('Update few field', async () => {
        const exerciseBundle = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(
                null,
                "Test Bundle for CRUD",
                [],
                false
            )
        );

        let testBundleId = exerciseBundle.id;

        expect(exerciseBundle).toBeDefined();
        expect(exerciseBundle.id).toBeDefined();
        expect(exerciseBundle.id).toBe(testBundleId);
        expect(exerciseBundle.title).toBe('Test Bundle for CRUD');
        expect(exerciseBundle.exercises).toStrictEqual([]);
        expect(exerciseBundle.global).toBe(false);


        exerciseBundle.title = 'Test Bundle for CRUD 2';

        await exerciseBundleCrud.updateExerciseBundle(exerciseBundle);

        expect(exerciseBundle).toBeDefined();
        expect(exerciseBundle.id).toBeDefined();
        expect(exerciseBundle.id).toBe(testBundleId);
        expect(exerciseBundle.title).toBe('Test Bundle for CRUD 2');
        expect(exerciseBundle.exercises).toStrictEqual([]);
        expect(exerciseBundle.global).toBe(false);


        await exerciseBundleCrud.deleteExerciseBundle(testBundleId);
    });

    test('Delete exercise Bundle', async () => {
        const exerciseBundle = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(
                null,
                "Test Bundle for CRUD",
                [],
                false
            )
        );

        testBundleId = exerciseBundle.id;

        expect(exerciseBundle).toBeDefined();
        expect(exerciseBundle.id).toBeDefined();
        expect(exerciseBundle.id).toBe(testBundleId);
        expect(exerciseBundle.title).toBe('Test Bundle for CRUD');
        expect(exerciseBundle.exercises).toStrictEqual([]);
        expect(exerciseBundle.global).toBe(false);

        let exercise1 = await exerciseCrud.createExercise(new Exercise(null, testBundleId, 1, "test", "test", null, null, null));
        let exercise2 = await exerciseCrud.createExercise(new Exercise(null, testBundleId, 2, "test", "test", null, null, null));

        await exerciseBundleCrud.deleteExerciseBundle(testBundleId);

        const deletedExerciseBundle = await exerciseBundleCrud.getBundleById(testBundleId, false);

        expect(deletedExerciseBundle).toBeNull();

        let deletedExercise1 = await exerciseCrud.getExerciseById(exercise1.id);
        let deletedExercise2 = await exerciseCrud.getExerciseById(exercise2.id);
        expect(deletedExercise1).toBeNull();
        expect(deletedExercise2).toBeNull();
    });

    test('Find exercise Bundle by id dont fetch', async () => {
        const exerciseBundle = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(
                null,
                "Test Bundle for CRUD",
                [],
                false
            )
        );

        testBundleId = exerciseBundle.id;

        expect(exerciseBundle).toBeDefined();
        expect(exerciseBundle.id).toBeDefined();
        expect(exerciseBundle.id).toBe(testBundleId);
        expect(exerciseBundle.title).toBe('Test Bundle for CRUD');
        expect(exerciseBundle.exercises).toStrictEqual([]);
        expect(exerciseBundle.global).toBe(false);

        let exercise1 = await exerciseCrud.createExercise(new Exercise(null, testBundleId, 1, "test", "test", null, null, null));
        let exercise2 = await exerciseCrud.createExercise(new Exercise(null, testBundleId, 2, "test", "test", null, null, null));



        const foundExerciseBundle = await exerciseBundleCrud.getBundleById(testBundleId, false);

        expect(foundExerciseBundle).toBeDefined();
        expect(foundExerciseBundle.id).toBeDefined();
        expect(foundExerciseBundle.id).toBe(testBundleId);
        expect(foundExerciseBundle.title).toBe('Test Bundle for CRUD');
        expect(foundExerciseBundle.exercises).toBeNull();
        expect(foundExerciseBundle.global).toBe(false);

        await exerciseBundleCrud.deleteExerciseBundle(testBundleId);

        let deletedExercise1 = await exerciseCrud.getExerciseById(exercise1.id);
        let deletedExercise2 = await exerciseCrud.getExerciseById(exercise2.id);
        expect(deletedExercise1).toBeNull();
        expect(deletedExercise2).toBeNull();
    });

    test('Find exercise Bundle by id fetch', async () => {
        const exerciseBundle = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(
                null,
                "Test Bundle for CRUD",
                [],
                false
            )
        );

        testBundleId = exerciseBundle.id;

        expect(exerciseBundle).toBeDefined();
        expect(exerciseBundle.id).toBeDefined();
        expect(exerciseBundle.id).toBe(testBundleId);
        expect(exerciseBundle.title).toBe('Test Bundle for CRUD');
        expect(exerciseBundle.exercises).toStrictEqual([]);
        expect(exerciseBundle.global).toBe(false);

        let exercise1 = await exerciseCrud.createExercise(new Exercise(null, testBundleId, 1, "test", "test", null, null, null));
        let exercise2 = await exerciseCrud.createExercise(new Exercise(null, testBundleId, 2, "test", "test", null, null, null));



        const foundExerciseBundle = await exerciseBundleCrud.getBundleById(testBundleId, true);

        expect(foundExerciseBundle).toBeDefined();
        expect(foundExerciseBundle.id).toBeDefined();
        expect(foundExerciseBundle.id).toBe(testBundleId);
        expect(foundExerciseBundle.title).toBe('Test Bundle for CRUD');
        expect(foundExerciseBundle.exercises).toStrictEqual([exercise1, exercise2]);
        expect(foundExerciseBundle.global).toBe(false);

        await exerciseBundleCrud.deleteExerciseBundle(testBundleId);

        let deletedExercise1 = await exerciseCrud.getExerciseById(exercise1.id);
        let deletedExercise2 = await exerciseCrud.getExerciseById(exercise2.id);
        expect(deletedExercise1).toBeNull();
        expect(deletedExercise2).toBeNull();
    });

    test('Find exercise bundles by user id', async () => {
        const exerciseBundle = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(
                null,
                "Test Bundle for CRUD",
                [],
                false
            )
        );

        testBundleId = exerciseBundle.id;

        let exercise1 = await exerciseCrud.createExercise(new Exercise(null, testBundleId, 1, "test", "test", null, null, null));
        let exercise2 = await exerciseCrud.createExercise(new Exercise(null, testBundleId, 2, "test", "test", null, null, null));

        await userExerciseBundleAssociationCrud.createUserExerciseBundleAssociation(user.id,testBundleId)

        const foundExerciseBundles = await exerciseBundleCrud.getBundlesByUserId(user.id);

        expect(foundExerciseBundles).toBeDefined();

        expect(foundExerciseBundles[0].id).toBeDefined();
        expect(foundExerciseBundles[0].id).toBe(testBundleId);
        expect(foundExerciseBundles[0].title).toBe('Test Bundle for CRUD');
        expect(foundExerciseBundles[0].exercises).toBeNull();
        expect(foundExerciseBundles[0].global).toBe(false);

        await exerciseBundleCrud.deleteExerciseBundle(testBundleId);

        let deletedExercise1 = await exerciseCrud.getExerciseById(exercise1.id);
        let deletedExercise2 = await exerciseCrud.getExerciseById(exercise2.id);
        expect(deletedExercise1).toBeNull();
        expect(deletedExercise2).toBeNull();
    });
});