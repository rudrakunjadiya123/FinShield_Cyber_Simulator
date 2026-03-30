const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email_subject: { type: String, required: true },
  email_body: { type: String, required: true },
  template_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
  target_departments: [{ type: String }],
  target_emails: [{ type: String }],
  launch_date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'running', 'completed'],
    default: 'draft'
  },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
