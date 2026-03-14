const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { auth, authorize } = require('../middleware/auth');
const { logAudit } = require('../services/auditService');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// GET /api/users - list users within same organization
router.get('/', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const filter = { organization_id: req.user.organization_id };
    if (req.query.role) filter.role = req.query.role;
    if (req.query.department) filter.department = req.query.department;
    const users = await User.find(filter).select('-password').sort({ department: 1, name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/departments - departments within same org
router.get('/departments', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const departments = await User.distinct('department', {
      role: 'employee',
      organization_id: req.user.organization_id
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users/upload - upload CSV of target users
router.post('/upload', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const orgId = req.user.organization_id;
    const users = [];
    const errors = [];
    const defaultPassword = 'FinShield@2024';

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          if (row.name && row.email && row.department) {
            users.push({
              name: row.name.trim(),
              email: row.email.trim().toLowerCase(),
              department: row.department.trim(),
              password: defaultPassword,
              role: 'employee',
              organization_id: orgId
            });
          } else {
            errors.push(row);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const results = { created: 0, skipped: 0, errors: errors.length };
    const newDepts = new Set();
    for (const userData of users) {
      try {
        const existing = await User.findOne({ email: userData.email });
        if (existing) {
          results.skipped++;
        } else {
          await User.create(userData);
          results.created++;
          newDepts.add(userData.department);
        }
      } catch (err) {
        results.errors++;
      }
    }

    // Update organization departments
    if (newDepts.size > 0) {
      const org = await Organization.findById(orgId);
      if (org) {
        for (const dept of newDepts) {
          if (!org.departments.includes(dept)) org.departments.push(dept);
        }
        await org.save();
      }
    }

    fs.unlinkSync(req.file.path);

    await logAudit(req.user._id, 'upload', 'users', null, `Uploaded ${results.created} users`, orgId);
    res.json({ message: 'Upload complete', ...results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users/add - add single target user to same org
router.post('/add', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, department } = req.body;
    const orgId = req.user.organization_id;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    const user = await User.create({
      name,
      email,
      department,
      password: 'FinShield@2024',
      role: 'employee',
      organization_id: orgId
    });

    // Add department to org if new
    const org = await Organization.findById(orgId);
    if (org && !org.departments.includes(department)) {
      org.departments.push(department);
      await org.save();
    }

    await logAudit(req.user._id, 'create', 'user', user._id, `Added user: ${name}`, orgId);
    res.status(201).json({ message: 'User added', user: { id: user._id, name, email, department } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
