const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  template_name: { type: String, required: true },
  email_subject: { type: String, required: true },
  email_body: { type: String, required: true },
  phishing_link: { type: String, default: '' },
  difficulty_level: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  ai_generated: { type: Boolean, default: false },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);
