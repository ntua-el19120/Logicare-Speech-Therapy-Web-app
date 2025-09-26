const express = require('express');
const bodyParser = require('body-parser');
const exerciseBundleCrud = require('../crud/ExerciseBundleCrud');
const ExerciseBundle = require("../models/ExerciseBundle");
const userExerciseBundleAssociation = require("../crud/UserExerciseBundleAssociationCrud");
const userBundleLogCrud = require("../crud/UserBundleLogCrud");
const UserBundleLog = require("../models/UserBundleLog");

const router = express.Router();

router.use(bodyParser.json());

// Create bundle
router.post('/bundles', async (req, res) => {
    try {
        const { title, global } = req.body;
        const bundle = await exerciseBundleCrud.createExerciseBundle(new ExerciseBundle(null,title, null, global));
        res.status(201).json(bundle);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add user to bundle
router.post('/bundles/:bundleId/users/:userId', async (req, res) => {
    const{ notifications } = req.body;
    try {
        await userExerciseBundleAssociation.createUserExerciseBundleAssociation(req.params.userId, req.params.bundleId, notifications);
        res.json({ message: 'Bundle assigned to user' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get bundle with exercises
router.get('/bundles/:id', async (req, res) => {
    try {
        const bundle = await exerciseBundleCrud.getBundleById(req.params.id, true);
        if (!bundle) return res.status(404).json({ error: 'Bundle not found' });
        res.json(bundle);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get bundles with user id
// TODO : get whole bundles (without exercises)
// Get bundles with user id (always return an array)
router.get('/bundles/users/:userId', async (req, res) => {
  try {
    const bundles = await exerciseBundleCrud.getBundlesByUserId(req.params.userId);
    // If CRUD ever returns null/undefined, normalize to []
    return res.json(Array.isArray(bundles) ? bundles : []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});



//Get the global exercises
router.get('/globalexercises', async (req, res) => {
  try {
    const bundles = await exerciseBundleCrud.getGlobalExercises();
    return res.json(bundles); // [] when none
  } catch (err) {
    console.error('GET /globalexercises failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});





// Update bundle
router.put('/bundles/:id', async (req, res) => {
    try {
        const { title, global } = req.body;
        let updatedBundle = new ExerciseBundle(req.params.id, title,null, global);

        let bundleExists = await exerciseBundleCrud.getBundleById(updatedBundle.id, false);
        if (!bundleExists) return res.status(404).json({ error: 'Bundle not found' });

        await exerciseBundleCrud.updateExerciseBundle(updatedBundle);
        res.json({ message: 'Bundle updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete bundle
router.delete('/bundles/:id', async (req, res) => {
    try {
        let bundleExists = await exerciseBundleCrud.getBundleById(req.params.id, false);
        if (!bundleExists) return res.status(404).json({ error: 'Bundle not found' });

        await exerciseBundleCrud.deleteExerciseBundle(req.params.id);
        res.json({ message: 'Bundle deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// Create NON-global bundle for the logged-in clinician and auto-assign it
router.post('/bundles/clinician', async (req, res) => {
  try {
    const me = req.user; // <- must be set by your session/deserialize middleware
    if (!me) return res.status(401).json({ error: 'Unauthorized' });
    if (me.type !== 'clinician' && me.type !== 'admin') {
      return res.status(403).json({ error: 'Only clinicians/admins can create bundles here' });
    }

    const { title } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    // Always non-global for this route
    const bundle = await exerciseBundleCrud.createExerciseBundle(
      new ExerciseBundle(null, title.trim(), null, false)
    );

    // Assign bundle to the clinician (use the logged-in user id, not a client-provided one)
    await userExerciseBundleAssociation.createUserExerciseBundleAssociation(me.id, bundle.id);

    return res.status(201).json(bundle);
  } catch (err) {
    console.error('POST /bundles/clinician failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Clone a bundle to the current clinician and return the new bundle
router.post('/bundles/:id/clone-for-me', async (req, res) => {
  try {
    // however you store auth; try req.user first, fall back to session/body
    const userId = req.user?.id || req.session?.user?.id || req.body.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const cloned = await exerciseBundleCrud.cloneBundleForUser(req.params.id, userId);
    if (!cloned) return res.status(404).json({ error: 'Bundle not found' });

    res.status(201).json(cloned);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clone bundle' });
  }
});

// Remove user from bundle (delete assignment)
router.delete('/bundles/:bundleId/users/:userId', async (req, res) => {
  try {
    await userExerciseBundleAssociation.deleteUserExerciseBundleAssociation(
      req.params.userId,
      req.params.bundleId
    );
    res.json({ message: 'Bundle unassigned from user' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add user bundle log
router.post('/log/bundles/:bundleId/users/:userId', async (req, res) => {
    const{ state,step,timestamp } = req.body;
    try {
        let userBundleLog = new UserBundleLog(req.params.userId, req.params.bundleId, state, step, timestamp)
        await userBundleLogCrud.createUserBundleLog(userBundleLog);
        res.json({ message: 'Bundle assigned to user' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




module.exports = router;