const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  analyst_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  risk_score: { type: Number, required: true },
  recommendations: [{ type: String }],
  department_risks: [{
    department: String,
    risk_score: Number,
    vulnerabilities: [String]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
