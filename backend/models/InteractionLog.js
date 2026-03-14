const mongoose = require('mongoose');

const interactionLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  email_opened: { type: Boolean, default: false },
  email_opened_at: { type: Date },
  link_clicked: { type: Boolean, default: false },
  link_clicked_at: { type: Date },
  reported_email: { type: Boolean, default: false },
  reported_at: { type: Date },
  form_submitted: { type: Boolean, default: false },
  form_submitted_at: { type: Date },
  time_taken: { type: Number, default: 0 },
  tracking_token: { type: String, unique: true, required: true }
}, { timestamps: true });

module.exports = mongoose.model('InteractionLog', interactionLogSchema);
