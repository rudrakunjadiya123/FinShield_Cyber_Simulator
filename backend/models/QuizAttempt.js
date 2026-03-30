const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  answers: [{ type: Number }],
  score: { type: Number, required: true },
  total_questions: { type: Number, required: true },
  percentage: { type: Number, required: true },
  completed_at: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
