const express = require('express');
const bcrypt = require("bcrypt");
const adminCrud = require('../crud/AdminCrud');

const router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not logged in" });
}

function ensureAdmin(req, res, next) {
  if (req.user?.type !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' });
  }
  next();
}

//
// ===== USER MANAGEMENT =====
//
router.get('/users', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { role, search } = req.query;
    const users = await adminCrud.getUsers({ role, search });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    await adminCrud.deleteUser(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/reset-password', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const tempPassword = Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(tempPassword, 10);
    await adminCrud.resetPassword(req.params.id, hash);
    res.json({ tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// ===== BUNDLE MANAGEMENT =====
//
router.get('/bundles', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const bundles = await adminCrud.getBundles();
    res.json(bundles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bundles', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { title } = req.body;
    const bundle = await adminCrud.createGlobalBundle(title);
    res.status(201).json(bundle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/bundles/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { title } = req.body;
    const bundle = await adminCrud.updateGlobalBundle(req.params.id, title);
    if (!bundle) return res.status(404).json({ error: "Global bundle not found" });
    res.json(bundle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bundles/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const success = await adminCrud.deleteGlobalBundle(req.params.id);
    if (!success) return res.status(404).json({ error: "Global bundle not found" });
    res.json({ message: "Bundle deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/stats', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const stats = await adminCrud.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
