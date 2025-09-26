const express = require('express');
const bodyParser = require('body-parser');
const userCrud = require('../crud/UserCrud');
const User = require("../models/User");
const notesCrud = require('../crud/ClinicianPatientNoteCrud');
const router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not logged in" });
}



router.use(bodyParser.json());

// Create user


const bcrypt = require("bcrypt");
const exerciseBundleCrud = require("../crud/ExerciseBundleCrud");
const saltRounds = 10;

router.post('/users', async (req, res) => {
  try {
    const { type, email, password, year, name, surname } = req.body;

    // 1. Check if user is already registered
    const existingUser = await userCrud.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    // 2. Hash the password
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.status(500).json({ error: "Error hashing password" });
      }

      // 3. Create the user
      const user = await userCrud.createUser(
        new User(null, type, email, name, surname, year, hash, null)
      );

      // 4. Send back the created user
      res.status(201).json(user);
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user with bundles and exercises
router.get('/users/:id', async (req, res) => {
    try {
        const user = await userCrud.getUserById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const dayMap = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// Utility to convert timestamp -> day string
function getDayStringFromTimestamp(ts) {
    const date = new Date(ts);
    if (date.getDay() === 0)
        return dayMap[6];
    return dayMap[date.getDay()-1];
}

// Get weekly user notifications
router.get('/users/notifications/:id', async (req, res) => {

    try {
        const bundles = await exerciseBundleCrud.getBundlesByUserId(req.params.id);
        const bundleLogs = await exerciseBundleCrud.getBundleLogsByUserId(req.params.id);
        if (!bundles) return res.status(404).json({ error: 'User not found' });

        if (bundles.length === 0) return [];

        let notifications = [];

        for (const bundle of bundles) {
            if (bundle.notifications.length && bundle.notifications.length > 0) {
                let today = getDayStringFromTimestamp(new Date());
                let currentWeekDays = dayMap.slice(0, dayMap.indexOf(today)+1);
                for (const day of currentWeekDays) {
                    if(bundle.notifications.indexOf(day) !== -1 && bundleLogs.findIndex(row => row.bundle_id === bundle.id) === -1) {
                        notifications.push(bundle.title)
                    } else if (bundle.notifications.indexOf(day) !== -1 && bundleLogs.findIndex(row => row.bundle_id === bundle.id) !== -1) {
                        bundleLogs.splice(bundleLogs.findIndex(row => row.bundle_id === bundle.id), 1);
                    }
                }
            }
        }
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { type, email, name, surname, year_of_birth, hashed_password, clinician_id } = req.body;

    const user = new User(
      req.params.id,
      type,
      email,
      name,
      surname,
      year_of_birth,
      hashed_password,
      clinician_id
    );

    const updatedUser = await userCrud.updateUser(user);
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        await userCrud.deleteUser(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Clinician gets his patients
router.get("/my-patients", ensureAuthenticated, async (req, res) => {
  try {
    // Only allow clinicians (or admins if you want)
    if (req.user.type !== "clinician") {
      return res.status(403).json({ message: "Access denied" });
    }

    const patients = await userCrud.getUsersByClinicianId(req.user.id);
    res.json(patients || []); // Return empty array if no patients
  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).json({ error: "Failed to load patients" });
  }
});

router.post('/assign-patient', ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.type !== 'clinician' && req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const { name, surname, year_of_birth, note } = req.body   // ← accept note too
    if (!name || !surname || !year_of_birth) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const patient = await userCrud.assignPatientToClinician({
      name,
      surname,
      year_of_birth,
      clinicianId: req.user.id
    })

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or already assigned' })
    }

    // create/update the clinician's note for this patient
    const savedNote = await notesCrud.upsertNote({
      clinician_id: req.user.id,
      patient_id: patient.id,
      note: String(note ?? '')  // default to empty string
    })

    res.json({
      message: 'Patient assigned successfully',
      patient,
      note: savedNote
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to assign patient' })
  }
})


// Get patient info (only if belongs to clinician) + note
router.get('/patients/:id', ensureAuthenticated, async (req, res) => {
  try {
    const isAdmin = req.user.type === 'admin';
    const clinicianId = req.user.id;
    const patientId = req.params.id;

    // fetch patient
    const patient = await userCrud.getUserById(patientId);
    if (!patient || patient.type !== 'patient') {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // access control: admin OR this clinician owns the patient
    if (!isAdmin && patient.clinician_id !== clinicianId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // clinician's personal note (empty default if none)
    const noteRow = await notesCrud.getNote(clinicianId, patientId);
    const note = noteRow ? noteRow.note : '';
    const note_updated_at = noteRow ? noteRow.updated_at : null;

    // return minimal safe fields + note
    res.json({
      id: patient.id,
      email: patient.email,
      name: patient.name,
      surname: patient.surname,
      year_of_birth: patient.year_of_birth,
      clinician_id: patient.clinician_id,
      note,
      note_updated_at
    });
  } catch (err) {
    console.error('GET /patients/:id error', err);
    res.status(500).json({ error: 'Failed to load patient' });
  }
});

// Upsert the clinician's note for a patient
router.put('/patients/:id/note', ensureAuthenticated, async (req, res) => {
  try {
    const isAdmin = req.user.type === 'admin';
    const clinicianId = req.user.id;
    const patientId = req.params.id;
    const { note } = req.body;

    if (typeof note !== 'string') {
      return res.status(400).json({ error: 'Invalid note' });
    }

    // ensure patient exists and access allowed
    const patient = await userCrud.getUserById(patientId);
    if (!patient || patient.type !== 'patient') {
      return res.status(404).json({ error: 'Patient not found' });
    }
    if (!isAdmin && patient.clinician_id !== clinicianId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const saved = await notesCrud.upsertNote({
      clinician_id: clinicianId,
      patient_id: patientId,
      note
    });

    res.json(saved);
  } catch (err) {
    console.error('PUT /patients/:id/note error', err);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Change password
router.put('/users/:id/password', ensureAuthenticated, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Get the user from DB (with hashed_password!)
    const user = await userCrud.getUserWithPassword(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check old password
    const match = await bcrypt.compare(oldPassword, user.hashed_password);
    if (!match) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }

    // Hash new password
    const hash = await bcrypt.hash(newPassword, saltRounds);

    // Save
    await userCrud.updatePassword(user.id, hash);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});



module.exports = router;