const User = require("../models/User");
const Exercise = require('../models/Exercise');
const ExerciseBundle = require('../models/ExerciseBundle');
const { v4: uuidv4 } = require('uuid');
const pool = require("../config/db-connection");
const exerciseBundleCrud = require("./ExerciseBundleCrud");
const userData = require("../models/User");
const notesCrud = require('../crud/ClinicianPatientNoteCrud');


async function createUser(user) {
    const id = uuidv4();
    await pool.query(
        'INSERT INTO speech_therapy.user (id, type, email, name, surname, year_of_birth, hashed_password) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, user.type, user.email, user.name, user.surname, user.year_of_birth, user.hashed_password]
    );
    return new User(id, user.type, user.email, user.name, user.surname, user.year_of_birth,"private password", null);

}

async function getUserByEmail(email) {
    const userRes = await pool.query('SELECT * FROM speech_therapy.user WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return null;
    let userData = userRes.rows[0];

    return new User(userData.id, userData.type, userData.email, userData.name, userData.surname, userData.year_of_birth, userData.hashed_password, userData.clinician_id);
}

async function getUserById(id) {
    const userRes = await pool.query('SELECT * FROM speech_therapy.user WHERE id = $1', [id]);
    if (userRes.rows.length === 0) return null;
    let userData = userRes.rows[0];

    return new User(userData.id, userData.type, userData.email, userData.name, userData.surname,userData.year_of_birth, "private password", userData.clinician_id);
}


async function getUsersByClinicianId(clinician_id) {
    const userRes = await pool.query(`SELECT * FROM speech_therapy.user WHERE clinician_id = $1 AND type = 'patient' ORDER BY surname, name`, [clinician_id]);
    if (userRes.rows.length === 0) return null;
    let users = userRes.rows.map(item => new User(item.id, item.type, item.email, item.name, item.surname, item.year_of_birth, "private password", item.clinician_id));

    return users;
}


async function updateUser(user) {
  const entries = Object.entries(user)
    .filter(([key, value]) =>
      key !== 'exerciseBundles' &&
      value !== null &&
      value !== undefined &&
      key !== 'hashed_password' // don’t overwrite password accidentally
    );

  // force integer for year_of_birth
  entries.forEach(([key, value], i) => {
    if (key === 'year_of_birth' && value !== null) {
      entries[i][1] = parseInt(value, 10);
    }
  });

  if (entries.length === 0) return null;

  const setClauses = entries.map(([key], index) => `${key} = $${index + 1}`);
  const values = entries.map(([, value]) => value);

  const query = `
    UPDATE speech_therapy.user
    SET ${setClauses.join(', ')}
    WHERE id = $${values.length + 1}
    RETURNING *;
  `;

  values.push(user.id);
  const updatedEntry = await pool.query(query, values);
  return updatedEntry.rows[0];
}


async function deleteUser(id) {
    await pool.query('DELETE FROM speech_therapy.user WHERE id = $1', [id]);
}

async function assignPatientToClinician({ name, surname, year_of_birth, clinicianId }) {
  // Find a patient without clinician
  const patientRes = await pool.query(
    `SELECT * FROM speech_therapy.user 
     WHERE type = 'patient' 
       AND name = $1 
       AND surname = $2 
       AND year_of_birth = $3
       AND clinician_id IS NULL
     LIMIT 1`,
    [name, surname, year_of_birth]
  )

  if (patientRes.rows.length === 0) {
    return null // patient not found or already assigned
  }

  const patientId = patientRes.rows[0].id

  await pool.query(
    `UPDATE speech_therapy.user
     SET clinician_id = $1
     WHERE id = $2`,
    [clinicianId, patientId]
  )

  // Return updated patient as User instance
  const updated = await pool.query(`SELECT * FROM speech_therapy.user WHERE id = $1`, [patientId])
  const p = updated.rows[0]
  return new User(
    p.id,
    p.type,
    p.email,
    p.name,
    p.surname,
    p.year_of_birth,
    'private password',
    p.clinician_id
  )
}

async function getUserWithPassword(id) {
  const res = await pool.query('SELECT * FROM speech_therapy.user WHERE id = $1', [id]);
  return res.rows.length ? res.rows[0] : null;
}

async function updatePassword(id, hashed_password) {
  await pool.query(
    'UPDATE speech_therapy.user SET hashed_password = $1 WHERE id = $2',
    [hashed_password, id]
  );
  return true;
}




module.exports = {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getUserByEmail,
    getUsersByClinicianId,
    assignPatientToClinician,
    getUserWithPassword,
    updatePassword,
};
