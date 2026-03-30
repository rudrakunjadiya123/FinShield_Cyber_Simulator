const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correct_answer: { type: Number, required: true },
  explanation: { type: String, default: '' }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  prompt: { type: String, default: '' },
  target_departments: [{ type: String }],
  target_emails: [{ type: String }],
  questions: [questionSchema],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
