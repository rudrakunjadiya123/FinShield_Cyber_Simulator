const mongoose = require('mongoose');

const emailDeliveryLogSchema = new mongoose.Schema({
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  email_status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  smtp_response: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('EmailDeliveryLog', emailDeliveryLogSchema);
