const pool = require("../config/db-connection");
const { v4: uuidv4 } = require("uuid");

//
// ===== USER MANAGEMENT =====
//
async function getUsers({ role, search }) {
  let sql = `SELECT id, name, surname, email, type, year_of_birth 
             FROM speech_therapy.user`;
  let params = [];

  if (role) {
    params.push(role);
    sql += ` WHERE type = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    sql += params.length === 1 ? ' WHERE' : ' AND';
    sql += ` (LOWER(name) LIKE LOWER($${params.length}) 
           OR LOWER(surname) LIKE LOWER($${params.length}) 
           OR LOWER(email) LIKE LOWER($${params.length}))`;
  }

  const { rows } = await pool.query(sql, params);
  return rows;
}

async function deleteUser(id) {
  await pool.query(`DELETE FROM speech_therapy.user WHERE id=$1`, [id]);
  return true;
}

async function resetPassword(id, hashedPassword) {
  await pool.query(
    `UPDATE speech_therapy.user SET hashed_password=$1 WHERE id=$2`,
    [hashedPassword, id]
  );
  return true;
}

//
// ===== BUNDLE MANAGEMENT =====
//
async function getBundles() {
  const { rows } = await pool.query(`
    SELECT 
      b.id,
      b.title,
      b.global,
      u.id   AS creator_id,
      u.name AS creator_name,
      u.surname AS creator_surname
    FROM speech_therapy.exercise_bundle b
    LEFT JOIN speech_therapy.user_bundle ub 
      ON b.id = ub.bundle_id
    LEFT JOIN speech_therapy."user" u 
      ON ub.user_id = u.id AND u.type = 'clinician'
    ORDER BY b.title;
  `);

  return rows;
}


async function createGlobalBundle(title) {
  const { rows } = await pool.query(
    `INSERT INTO speech_therapy.exercise_bundle (id, title, global) 
     VALUES ($1, $2, true) RETURNING *`,
    [uuidv4(), title]
  );
  return rows[0];
}

async function updateGlobalBundle(id, title) {
  const { rows } = await pool.query(
    `UPDATE speech_therapy.exercise_bundle 
     SET title=$1 
     WHERE id=$2 AND global=true 
     RETURNING *`,
    [title, id]
  );
  return rows[0] || null;
}

async function deleteGlobalBundle(id) {
  const { rowCount } = await pool.query(
    `DELETE FROM speech_therapy.exercise_bundle 
     WHERE id=$1 AND global=true`,
    [id]
  );
  return rowCount > 0;
}


async function getStats() {
  const patients = await pool.query(`SELECT COUNT(*) FROM speech_therapy.user WHERE type='patient'`);
  const clinicians = await pool.query(`SELECT COUNT(*) FROM speech_therapy.user WHERE type='clinician'`);
  const admins = await pool.query(`SELECT COUNT(*) FROM speech_therapy.user WHERE type='admin'`);

  return {
    patients: parseInt(patients.rows[0].count, 10),
    clinicians: parseInt(clinicians.rows[0].count, 10),
    admins: parseInt(admins.rows[0].count, 10),
  };
}



module.exports = {
  // users
  getUsers,
  deleteUser,
  resetPassword,
  // bundles
  getBundles,
  createGlobalBundle,
  updateGlobalBundle,
  deleteGlobalBundle,
  getStats
};
