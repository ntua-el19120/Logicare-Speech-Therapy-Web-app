const Exercise = require('../models/Exercise');
const ExerciseBundle = require('../models/ExerciseBundle');
const exerciseCrud = require('../crud/ExerciseCrud');
const userBundle = require('../crud/UserExerciseBundleAssociationCrud');

const { v4: uuidv4 } = require('uuid');
const pool = require("../config/db-connection");

async function createExerciseBundle(exerciseBundle) {
    const id = uuidv4();
    await pool.query('INSERT INTO speech_therapy.exercise_bundle (id, title, global) VALUES ($1, $2, $3)', [id, exerciseBundle.title, exerciseBundle.global]);
    exerciseBundle.id = id
    exerciseBundle.exercises = [];
    return exerciseBundle;
}
async function getBundleById(id, fetchExercises) {
    if (!id) {
        throw new Error("Exercise Bundle 'id' is required.");
    }

    const bundleRes = await pool.query('SELECT * FROM speech_therapy.exercise_bundle WHERE id = $1', [id]);
    if (bundleRes.rows.length === 0) return null;

    let exercises = null;
    if (fetchExercises) {
        const exercisesRes = await exerciseCrud.getExercisesByBundleId(id);
        exercises = exercisesRes.map(e => new Exercise(
            e.id, e.bundle_id, e.step, e.title, e.description, e.audio, e.picture, e.video_file_path
        ));
    }

    const bundle = bundleRes.rows[0];
    return new ExerciseBundle(bundle.id, bundle.title, exercises, bundle.global);
}

async function getBundlesByUserId(user_id) {
    if (!user_id) {
        throw new Error("user_id is required.");
    }

    const query = `
    SELECT b.id, b.title, b.global, ub.notifications
    FROM speech_therapy.exercise_bundle b
    INNER JOIN speech_therapy.user_bundle ub ON ub.bundle_id = b.id
    WHERE ub.user_id = $1;
  `;

    const result = await pool.query(query, [user_id]);

    if (result.rows.length === 0) return null;

    let exerciseBundles = result.rows.map(row => (new ExerciseBundle(row.id, row.title, [], row.global, row.notifications)));

    return exerciseBundles;
}

// get the weekly notifications for a user
async function getBundleLogsByUserId(user_id) {
    if (!user_id) {
        throw new Error("user_id is required.");
    }

    const query = `
    SELECT ubl,bundle_id, ubl.timestamp
    FROM speech_therapy.user_bundle_log ubl
    WHERE ubl.user_id = $1 AND ubl.state = 'ENDED' AND ubl.timestamp >= date_trunc('week', now())
      AND ubl.timestamp < date_trunc('week', now()) + interval '1 week';;
  `;

    const result = await pool.query(query, [user_id]);

    return result.rows;
}

async function updateExerciseBundle(exerciseBundle) {
    if (!exerciseBundle.id) {
        throw new Error("Exercise Bundle 'id' is required for update.");
    }

    // Update only the main values (not exercises)
    // Filter out null or undefined fields
    const entries = Object.entries(exerciseBundle)
        .filter(([key,value]) => key !== 'exercises' && value !== null && value !== undefined);

    let updatedMainEntries;

    if (entries.length !== 0) {

        const setClauses = entries.map(([key], index) => `${key} = $${index + 1}`);
        const values = entries.map(([, value]) => value);

        const query = `UPDATE speech_therapy.exercise_bundle
            SET ${setClauses.join(', ')}
            WHERE id = $${values.length + 1}
            RETURNING *;`;

        values.push(exerciseBundle.id);

        updatedMainEntries = await pool.query(query, values);

    }

    return updatedMainEntries.rows[0];
}

async function deleteExerciseBundle(id) {
    await pool.query('DELETE FROM speech_therapy.exercise_bundle WHERE id = $1', [id]);
}



async function getGlobalExercises() {
  const query = `
    SELECT b.id, b.title, b.global
    FROM speech_therapy.exercise_bundle b
    WHERE b.global = true
    ORDER BY b.title;
  `;
  const { rows } = await pool.query(query);
  return rows.map(row => new ExerciseBundle(row.id, row.title, [], row.global));
}


/**
 * Clone a bundle (and all its exercises) to a new NON-global bundle,
 * associate it to the given user, and return the new bundle.
 */
async function cloneBundleForUser(sourceBundleId, userId) {
  const src = await getBundleById(sourceBundleId, true);
  if (!src) return null;

  // create new non-global bundle with same title
  const newBundle = await createExerciseBundle(
    new ExerciseBundle(null, src.title, null, false)
  );

  // link to clinician
  await userBundle.createUserExerciseBundleAssociation(userId, newBundle.id);

  // duplicate exercises (reuse media; OK because audio/picture are bytea
  // and video_file_path is a string path)
  if (src.exercises?.length) {
    for (const ex of src.exercises) {
      await exerciseCrud.createExercise(
        new Exercise(
          null,
          newBundle.id,
          ex.step,
          ex.title,
          ex.description,
          ex.audio,
          ex.picture,
          ex.video_file_path
        )
      );
    }
  }
  return newBundle;
}









module.exports = {
    createExerciseBundle,
    getBundleById,
    getBundlesByUserId,
    updateExerciseBundle,
    deleteExerciseBundle,
    getGlobalExercises,
    cloneBundleForUser,
    getBundleLogsByUserId,
};


