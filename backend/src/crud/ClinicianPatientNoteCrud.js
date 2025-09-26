// src/crud/ClinicianPatientNoteCrud.js
const pool = require("../config/db-connection");
const ClinicianPatientNote = require("../models/ClinicianPatientNote");


async function getNote(clinician_id, patient_id) {
  const { rows } = await pool.query(
    `SELECT clinician_id, patient_id, note, updated_at
     FROM speech_therapy.clinician_patient_note
     WHERE clinician_id = $1 AND patient_id = $2`,
    [clinician_id, patient_id]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return new ClinicianPatientNote(r.clinician_id, r.patient_id, r.note, r.updated_at);
}


async function createNote(noteObj) {
  const { rows } = await pool.query(
    `INSERT INTO speech_therapy.clinician_patient_note (clinician_id, patient_id, note)
     VALUES ($1, $2, $3)
     RETURNING clinician_id, patient_id, note, updated_at`,
    [noteObj.clinician_id, noteObj.patient_id, noteObj.note]
  );
  const r = rows[0];
  return new ClinicianPatientNote(r.clinician_id, r.patient_id, r.note, r.updated_at);
}


async function updateNote(noteObj) {
  const { rows } = await pool.query(
    `UPDATE speech_therapy.clinician_patient_note
     SET note = $3, updated_at = now()
     WHERE clinician_id = $1 AND patient_id = $2
     RETURNING clinician_id, patient_id, note, updated_at`,
    [noteObj.clinician_id, noteObj.patient_id, noteObj.note]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return new ClinicianPatientNote(r.clinician_id, r.patient_id, r.note, r.updated_at);
}


async function upsertNote({ clinician_id, patient_id, note }) {
  const { rows } = await pool.query(
    `INSERT INTO speech_therapy.clinician_patient_note (clinician_id, patient_id, note)
     VALUES ($1, $2, $3)
     ON CONFLICT (clinician_id, patient_id)
     DO UPDATE SET note = EXCLUDED.note, updated_at = now()
     RETURNING clinician_id, patient_id, note, updated_at`,
    [clinician_id, patient_id, note]
  );
  const r = rows[0];
  return new ClinicianPatientNote(r.clinician_id, r.patient_id, r.note, r.updated_at);
}


// "Delete" a note: just reset its value to empty string
 
async function deleteNote(clinician_id, patient_id) {
  const { rows } = await pool.query(
    `UPDATE speech_therapy.clinician_patient_note
     SET note = '', updated_at = now()
     WHERE clinician_id = $1 AND patient_id = $2
     RETURNING clinician_id, patient_id, note, updated_at`,
    [clinician_id, patient_id]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return new ClinicianPatientNote(r.clinician_id, r.patient_id, r.note, r.updated_at);
}




module.exports = {
  getNote,
  createNote,
  updateNote,
  upsertNote,
  deleteNote,
};
