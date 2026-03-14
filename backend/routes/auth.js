const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register - Register new user + optionally create org
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, role, orgAction, orgName, orgIndustry, orgSize, orgCode } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    let organization;

    if (orgAction === 'create') {
      // Admin creating a new organization
      if (role !== 'admin') {
        return res.status(400).json({ message: 'Only admins can create new organizations' });
      }
      if (!orgName) {
        return res.status(400).json({ message: 'Organization name is required' });
      }
      organization = await Organization.create({
        name: orgName,
        industry: orgIndustry || '',
        size: orgSize || '1-50',
        departments: department ? [department] : ['General']
      });
    } else if (orgAction === 'join') {
      // User joining existing organization by code
      if (!orgCode) {
        return res.status(400).json({ message: 'Organization code is required to join' });
      }
      organization = await Organization.findOne({ code: orgCode.toUpperCase() });
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found. Check the code and try again.' });
      }
      // Add department to org if it's new
      if (department && !organization.departments.includes(department)) {
        organization.departments.push(department);
        await organization.save();
      }
    } else {
      return res.status(400).json({ message: 'Please select to create or join an organization' });
    }

    // Create the user
    const user = await User.create({
      name,
      email,
      password,
      department: department || 'General',
      role: role || 'employee',
      organization_id: organization._id
    });

    // If this is the org creator, set created_by
    if (orgAction === 'create') {
      organization.created_by = user._id;
      await organization.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        organization_id: organization._id,
        organization_name: organization.name,
        organization_code: organization.code,
        points: user.points,
        security_level: user.security_level
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('organization_id', 'name code');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        organization_id: user.organization_id?._id,
        organization_name: user.organization_id?.name,
        organization_code: user.organization_id?.code,
        points: user.points,
        security_level: user.security_level
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('organization_id', 'name code industry size departments');
  res.json({ user });
});

// GET /api/auth/organizations - list all organizations (for joining)
router.get('/organizations', async (req, res) => {
  try {
    const orgs = await Organization.find().select('name code industry size').sort({ name: 1 });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
