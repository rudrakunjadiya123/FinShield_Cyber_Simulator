const User = require('../models/User');
const mongoose = require('mongoose');

const updateUserPoints = async (userId, action) => {
  const pointsMap = {
    'report_email': 10,
    'ignore_phishing': 5,
    'click_link': -5,
    'submit_form': -10
  };

  const points = pointsMap[action] || 0;
  const user = await User.findById(userId);
  if (!user) return;

  user.points = Math.max(0, user.points + points);
  await user.save();
  return user;
};

const getLeaderboard = async (limit = 20, organizationId = null) => {
  const filter = { role: 'employee' };
  if (organizationId) filter.organization_id = organizationId;
  return User.find(filter)
    .select('name email department points security_level')
    .sort({ points: -1 })
    .limit(limit);
};

const getDepartmentRanking = async (organizationId = null) => {
  const match = { role: 'employee' };
  if (organizationId) match.organization_id = new mongoose.Types.ObjectId(organizationId);
  const result = await User.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$department',
        avg_points: { $avg: '$points' },
        total_users: { $sum: 1 },
        total_points: { $sum: '$points' }
      }
    },
    { $sort: { avg_points: -1 } }
  ]);

  return result.map(dept => ({
    department: dept._id,
    avg_points: Math.round(dept.avg_points * 10) / 10,
    total_users: dept.total_users,
    total_points: dept.total_points
  }));
};

module.exports = { updateUserPoints, getLeaderboard, getDepartmentRanking };
