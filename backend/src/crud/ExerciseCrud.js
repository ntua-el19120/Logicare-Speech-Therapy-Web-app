const Exercise = require('../models/Exercise');
const { v4: uuidv4 } = require('uuid');
const pool = require("../config/db-connection");

async function getExerciseById(id) {
    if (!id) {
        throw new Error("Exercise 'id' is required.");
    }

    const query = `
    SELECT id, bundle_id, step, title, description, audio, picture, video_file_path
    FROM speech_therapy.exercise
    WHERE id = $1;
  `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
        return null; // or throw new Error("Exercise not found");
    }

    return result.rows[0];
}

async function getExercisesByBundleId(id) {
    if (!id) {
        throw new Error("Exercise bundle 'id' is required.");
    }

    const query = `
    SELECT id, bundle_id, step, title, description, audio, picture, video_file_path
    FROM speech_therapy.exercise
    WHERE bundle_id = $1 ORDER BY step;
  `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
        return null; // or throw new Error("Exercise not found");
    }

    return result.rows;
}


/**
 * @returns {Promise<Exercise>}
 * @param exercise is an Exercise object
 */
async function createExercise(exercise) {
    const id = uuidv4();
    await pool.query(`INSERT INTO speech_therapy.exercise 
    (id, bundle_id, step, title, description, audio, picture, video_file_path) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, exercise.bundle_id, exercise.step, exercise.title, exercise.description, exercise.audio, exercise.picture, exercise.video_file_path]);

    exercise.id = id;
    return exercise;
}

async function updateExercise(exercise) {
    if (!exercise.id) {
        throw new Error("Exercise 'id' is required for update.");
    }
    // Filter out null or undefined fields (destructure [key, value])
    const entries = Object.entries(exercise)
       .filter(([, value]) => value !== null && value !== undefined);

    if (entries.length === 0) {
        throw new Error("No valid fields provided for update.");
    }

    const setClauses = entries.map(([key], index) => `${key} = $${index + 1}`);
    const values = entries.map(([, value]) => value);

    const query = `UPDATE speech_therapy.exercise
        SET ${setClauses.join(', ')}
        WHERE id = $${values.length + 1}
        RETURNING *;`;

    values.push(exercise.id);

    const result = await pool.query(query, values);
    return result.rows[0];

}

async function deleteExercise(id) {
    await pool.query('DELETE FROM speech_therapy.exercise WHERE id = $1', [id]);
}


module.exports = {
    getExerciseById,
    getExercisesByBundleId,
    createExercise,
    updateExercise,
    deleteExercise
};