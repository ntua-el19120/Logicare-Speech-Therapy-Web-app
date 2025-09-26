class ClinicianPatientNote {
  clinician_id;
  patient_id;
  note;
  updated_at;

  constructor(clinician_id, patient_id, note, updated_at) {
    this.clinician_id = clinician_id;
    this.patient_id = patient_id;
    this.note = note;
    this.updated_at = updated_at; // Date or string (timestamp from DB)
  }
}

module.exports = ClinicianPatientNote;