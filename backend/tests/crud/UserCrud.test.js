const exerciseCrud = require('../../src/crud/ExerciseCrud');
const exerciseBundleCrud = require('../../src/crud/ExerciseBundleCrud');
const Exercise = require("../../src/models/Exercise");
const pool = require("../../src/config/db-connection");
const ExerciseBundle = require("../../src/models/ExerciseBundle");
const userCrud = require("../../src/crud/UserCrud");
const User = require("../../src/models/User");
const userExerciseBundleAssociation = require("../../src/crud/UserExerciseBundleAssociationCrud");


describe('User CRUD operations', () => {
    let exercise11;
    let exercise12;
    let exerciseBundle1;

    let exercise21;
    let exercise22;
    let exerciseBundle2;

    beforeAll(async () => {
        exerciseBundle1 = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(
            null,
            "Test Bundle for CRUD",
            [],
            false
        ));


        exercise11 = await exerciseCrud.createExercise(new Exercise(null, exerciseBundle1.id, 1, "test", "test", null, null, null));
        exercise12 = await exerciseCrud.createExercise(new Exercise(null, exerciseBundle1.id, 2, "test", "test", null, null, null));


        exerciseBundle2 = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(
            null,
            "Test Bundle for CRUD",
            [],
            false
        ));


        exercise21 = await exerciseCrud.createExercise(new Exercise(null, exerciseBundle2.id, 1, "test", "test", null, null, null));
        exercise22 = await exerciseCrud.createExercise(new Exercise(null, exerciseBundle2.id, 2, "test", "test", null, null, null));

    });

    afterAll(async () => {
        await exerciseCrud.deleteExercise(exercise11.id);
        await exerciseCrud.deleteExercise(exercise12.id);
        await exerciseBundleCrud.deleteExerciseBundle(exerciseBundle1.id);
        await exerciseCrud.deleteExercise(exercise21.id);
        await exerciseCrud.deleteExercise(exercise22.id);
        await exerciseBundleCrud.deleteExerciseBundle(exerciseBundle2.id);
        await pool.end();
    });

    test('Create user', async () => {
        const user = await userCrud.createUser(new User(
                null,"patient","user@user.com","user","user", 2000, "hashed", null
            )
        );

        let testUserId = user.id;

        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.id).toBe(testUserId);
        expect(user.name).toBe("user");
        expect(user.surname).toBe("user");
        expect(user.email).toBe("user@user.com");
        expect(user.year_of_birth).toBe(2000);
        expect(user.hashed_password).toBe("private password");

        await userCrud.deleteUser(testUserId);
    });

    test('Get user by id', async () => {
        const user = await userCrud.createUser(new User(
                null,"patient","user@user.com","patient","user", 2000, "hashed", null
            )
        );

        let testUserId = user.id;

        const user1 = await userCrud.getUserById(user.id);

        expect(user1).toBeDefined();
        expect(user1.id).toBeDefined();
        expect(user1.id).toBe(testUserId);
        expect(user1.name).toBe("patient");
        expect(user1.surname).toBe("user");
        expect(user1.email).toBe("user@user.com");

        await userCrud.deleteUser(testUserId);
    });

    test('Get user by email', async () => {
        const user = await userCrud.createUser(new User(
                null,"patient","user@user.com","user","user", 2000, "hashed", null
            )
        );

        let testUserId = user.id;

        const user1 = await userCrud.getUserByEmail(user.email);

        expect(user1).toBeDefined();
        expect(user1.id).toBeDefined();
        expect(user1.id).toBe(testUserId);
        expect(user1.name).toBe("user");
        expect(user1.surname).toBe("user");
        expect(user1.email).toBe("user@user.com");

        await userCrud.deleteUser(testUserId);
    });

    test('Get users by clinician id', async () => {
        let clinician = await userCrud.createUser(new User(
                null,"clinician","clinician@clinician.com","clinician","clinician", 2000, "hashed", null
            )
        );

        let user1 = await userCrud.createUser(new User(
                null,"patient","user1@user1.com","user1","user1", 2000, "hashed", null
            )
        );
        user1.clinician_id = clinician.id;
        user1 = await userCrud.updateUser(user1);


        let user2 = await userCrud.createUser(new User(
                null,"patient","user2@user2.com","user2","user2", 2000, "hashed", null
            )
        );
        user2.clinician_id = clinician.id;
        user2 = await userCrud.updateUser(user2);

        let users = await userCrud.getUsersByClinicianId(clinician.id);

        expect(users).toBeDefined();
        expect(users.length).toBe(2);

        expect(users[0]).toBeDefined();
        expect(users[0].id).toBeDefined();
        expect(users[0].id).toBe(user1.id);
        expect(users[0].name).toBe(user1.name);
        expect(users[0].surname).toBe(user1.surname);
        expect(users[0].email).toBe(user1.email);
        expect(users[0].clinician_id).toBe(user1.clinician_id);

        expect(users[1]).toBeDefined();
        expect(users[1].id).toBeDefined();
        expect(users[1].id).toBe(user2.id);
        expect(users[1].name).toBe(user2.name);
        expect(users[1].surname).toBe(user2.surname);
        expect(users[1].email).toBe(user2.email);
        expect(users[1].clinician_id).toBe(user2.clinician_id);

        await userCrud.deleteUser(user1.id);
        await userCrud.deleteUser(user2.id);
        await userCrud.deleteUser(clinician.id);
    });


    test('Delete user', async () => {
        const user = await userCrud.createUser(new User(
                null,"patient","user@user.com","user","user", 2000, "hashed", null
            )
        );

        let testUserId = user.id;

        await userCrud.deleteUser(testUserId);

        let getUser = await userCrud.getUserById(testUserId);
        expect(getUser).toBeNull();
    });

    test('Update user', async () => {
        let user = await userCrud.createUser(new User(
                null,"patient","user@user.com","user","user", 2000, "hashed", null
            )
        );

        let testUserId = user.id;

        user.name = "user1"
        user.surname = "user1"
        user.email = "user1@user1.com"

        let user1 = await userCrud.updateUser(user);

        expect(user1).toBeDefined();
        expect(user1.id).toBeDefined();
        expect(user1.id).toBe(testUserId);
        expect(user1.name).toBe("user1");
        expect(user1.surname).toBe("user1");
        expect(user1.email).toBe("user1@user1.com");

        await userCrud.deleteUser(testUserId);
    });
});