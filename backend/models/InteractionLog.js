const mongoose = require('mongoose');

const interactionLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },

  link_clicked: { type: Boolean, default: false },
  link_clicked_at: { type: Date },
  reported_email: { type: Boolean, default: false },
  reported_at: { type: Date },
  report_subject: { type: String },
  report_link: { type: String },
  report_time: { type: Date },
  report_description: { type: String },
  report_visited: { type: Boolean, default: false },
  form_submitted: { type: Boolean, default: false },
  form_submitted_at: { type: Date },
  time_taken: { type: Number, default: 0 },
  elements_clicked: [{ element_id: String, clicked_at: Date }],
  tracking_token: { type: String, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.model('InteractionLog', interactionLogSchema);
