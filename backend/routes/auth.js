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

    let organization;

    if (orgAction === 'create') {
      // ===== ADMIN CREATING A NEW ORGANIZATION =====
      if (role !== 'admin') {
        return res.status(400).json({ message: 'Only admins can create new organizations' });
      }
      if (!orgName) {
        return res.status(400).json({ message: 'Organization name is required' });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      organization = await Organization.create({
        name: orgName,
        industry: orgIndustry || '',
        size: orgSize || '1-50',
        departments: department ? [department] : ['General']
      });

      const user = await User.create({
        name,
        email,
        password,
        department: department || 'General',
        role: 'admin',
        organization_id: organization._id
      });

      organization.created_by = user._id;
      await organization.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
      return res.status(201).json({
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

    } else if (orgAction === 'join') {
      // ===== JOINING EXISTING ORGANIZATION =====
      if (!orgCode) {
        return res.status(400).json({ message: 'Organization code is required to join' });
      }
      organization = await Organization.findOne({ code: orgCode.toUpperCase() });
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found. Check the code and try again.' });
      }

      if (role === 'employee') {
        // EMPLOYEE: Must already exist in the system (uploaded via CSV by admin)
        // This ensures only CSV-uploaded employees can sign up
        const existingUser = await User.findOne({ email, organization_id: organization._id });
        if (!existingUser) {
          return res.status(403).json({
            message: 'Your email is not registered in this organization. Ask your admin to add you first.'
          });
        }

        // Update their password with the one they chose (replaces default password)
        existingUser.password = password;
        if (name) existingUser.name = name;
        await existingUser.save(); // bcrypt pre-save hook will hash the password

        const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        return res.status(200).json({
          token,
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            department: existingUser.department,
            organization_id: organization._id,
            organization_name: organization.name,
            organization_code: organization.code,
            points: existingUser.points,
            security_level: existingUser.security_level
          }
        });

      } else {
        // NON-EMPLOYEE (cybersecurity, analyst, admin) can join directly
        const existing = await User.findOne({ email });
        if (existing) {
          return res.status(400).json({ message: 'User with this email already exists' });
        }

        if (department && !organization.departments.includes(department)) {
          organization.departments.push(department);
          await organization.save();
        }

        const user = await User.create({
          name,
          email,
          password,
          department: department || 'General',
          role: role || 'employee',
          organization_id: organization._id
        });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({
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
      }
    } else {
      return res.status(400).json({ message: 'Please select to create or join an organization' });
    }
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
