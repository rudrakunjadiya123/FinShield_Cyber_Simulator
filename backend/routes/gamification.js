const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getLeaderboard, getDepartmentRanking } = require('../services/gamificationService');

const router = express.Router();

// GET /api/gamification/leaderboard
router.get('/leaderboard', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await getLeaderboard(limit, req.user.organization_id);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/gamification/department-ranking
router.get('/department-ranking', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const ranking = await getDepartmentRanking(req.user.organization_id);
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
