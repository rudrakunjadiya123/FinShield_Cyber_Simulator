const express = require('express');
const AuditLog = require('../models/AuditLog');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/audit - get audit logs
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { limit = 50, resource_type } = req.query;
    const filter = { organization_id: req.user.organization_id };
    if (resource_type) filter.resource_type = resource_type;
    const logs = await AuditLog.find(filter)
      .populate('user_id', 'name email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
