const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  template_name: { type: String, required: true },
  description: { type: String, default: '' },
  phishing_link: { type: String, default: '' },
  html_code: { type: String, default: '' },
  tracked_elements: [{ type: String }],
  is_predefined: { type: Boolean, default: false },
  ai_generated: { type: Boolean, default: false },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);
