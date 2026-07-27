const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { auth, authorize } = require('../middleware/auth');
const { logAudit } = require('../services/auditService');
const { sendWelcomeEmail } = require('../services/emailService');
const crypto = require('crypto');

const generateRandomPassword = () => {
  return crypto.randomBytes(6).toString('hex'); // 12 character hex string
};

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

// POST /api/users/upload - upload CSV or XLSX of target users
router.post('/upload', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const orgId = req.user.organization_id;
    const users = [];
    const errors = [];
    const ext = path.extname(req.file.originalname).toLowerCase();

    // Parse file based on extension
    if (ext === '.xlsx' || ext === '.xls') {
      // Handle Excel files
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      for (const row of rows) {
        // Try to find name/email/department columns (case-insensitive)
        const name = row.name || row.Name || row.NAME || row['Full Name'] || row['full name'] || '';
        const email = row.email || row.Email || row.EMAIL || row['Email ID'] || row['email id'] || row['Email Id'] || row['email Id'] || '';
        const department = row.department || row.Department || row.DEPARTMENT || row.dept || row.Dept || '';
        const employee_id = row.employee_id || row['Employee ID'] || row.id || row.ID || row.Id || '';

        if (name.toString().trim() && email.toString().trim() && department.toString().trim() && employee_id.toString().trim()) {
          users.push({
            name: name.toString().trim(),
            email: email.toString().trim().toLowerCase(),
            department: department.toString().trim(),
            employee_id: employee_id.toString().trim(),
            password: generateRandomPassword(),
            role: 'employee',
            organization_id: orgId
          });
        } else {
          errors.push(row);
        }
      }
    } else {
      // Handle CSV files
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => {
            const name = row.name || row.Name || row.NAME || '';
            const email = row.email || row.Email || row.EMAIL || '';
            const department = row.department || row.Department || row.DEPARTMENT || '';
            const employee_id = row.employee_id || row['Employee ID'] || row.id || row.ID || row.Id || '';

            if (name.trim() && email.trim() && department.trim() && employee_id.trim()) {
              users.push({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                department: department.trim(),
                employee_id: employee_id.trim(),
                password: generateRandomPassword(),
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
    }

    const results = { created: 0, skipped: 0, updated: 0, errors: errors.length };
    const newDepts = new Set();
    for (const userData of users) {
      try {
        const existing = await User.findOne({ email: userData.email, organization_id: orgId });
        if (existing) {
          // User exists in THIS org - skip
          results.skipped++;
        } else {
          await User.create(userData);
          // Send welcome email completely before returning response
          await sendWelcomeEmail(userData.email, userData.name, userData.password);
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

    await logAudit(req.user._id, 'upload', 'users', null, `Uploaded: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`, orgId);
    res.json({ message: 'Upload complete', ...results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users/add - add single target user to same org
router.post('/add', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, department, role, employee_id } = req.body;
    const orgId = req.user.organization_id;
    const existing = await User.findOne({ email, organization_id: orgId });
    if (existing) {
      return res.status(400).json({ message: 'User already exists in your organization' });
    }
    
    if (employee_id) {
       const idExists = await User.findOne({ employee_id, organization_id: orgId });
       if (idExists) return res.status(400).json({ message: 'Employee ID is already in use in your organization' });
    }
    
    const assignedRole = role || 'employee';
    const generatedPassword = generateRandomPassword();
    
    const user = await User.create({
      name,
      email,
      department,
      employee_id,
      password: generatedPassword,
      role: assignedRole,
      organization_id: orgId
    });

    // Send welcome email completely before returning response
    await sendWelcomeEmail(email, name, generatedPassword);

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

// PUT /api/users/update/:id - edit an employee user
router.put('/update/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, department, employee_id } = req.body;
    const orgId = req.user.organization_id;
    const user = await User.findOne({ _id: req.params.id, organization_id: orgId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot edit admin users' });

    // Check if email is being changed to one that already exists in this org
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, organization_id: orgId });
      if (emailExists) return res.status(400).json({ message: 'Email already in use in your organization' });
    }
    
    if (employee_id && employee_id !== user.employee_id) {
       const idExists = await User.findOne({ employee_id, organization_id: orgId });
       if (idExists) return res.status(400).json({ message: 'Employee ID already in use in your organization' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (department) user.department = department;
    if (employee_id) user.employee_id = employee_id;
    await user.save();

    await logAudit(req.user._id, 'update', 'user', user._id, `Updated user: ${user.name}`, orgId);
    res.json({ message: 'User updated', user: { _id: user._id, name: user.name, email: user.email, department: user.department } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/users/delete/:id - delete an employee user
router.delete('/delete/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const user = await User.findOne({ _id: req.params.id, organization_id: orgId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin users' });

    await User.findByIdAndDelete(user._id);
    await logAudit(req.user._id, 'delete', 'user', user._id, `Deleted user: ${user.name}`, orgId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
