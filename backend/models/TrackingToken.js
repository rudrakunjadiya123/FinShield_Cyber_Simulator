const mongoose = require('mongoose');

const trackingTokenSchema = new mongoose.Schema({
  token: { type: String, unique: true, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  email_sent_time: { type: Date },
  clicked: { type: Boolean, default: false },
  click_time: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TrackingToken', trackingTokenSchema);
