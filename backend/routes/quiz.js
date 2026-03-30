const express = require('express');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { auth, authorize } = require('../middleware/auth');
const { logAudit } = require('../services/auditService');
const { generateQuizQuestions } = require('../services/geminiService');

const router = express.Router();

// POST /api/quiz/generate - Generate quiz questions via Gemini AI
router.post('/generate', auth, authorize('admin', 'cybersecurity'), async (req, res) => {
  try {
    const { prompt, count } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    const questions = await generateQuizQuestions(prompt, count || 5);
    res.json({ questions });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate quiz questions' });
  }
});

// POST /api/quiz/create - Save a quiz (admin reviews/edits before saving)
router.post('/create', auth, authorize('admin', 'cybersecurity'), async (req, res) => {
  try {
    const { title, prompt, target_departments, target_emails, questions } = req.body;
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Title and questions are required' });
    }
    const quiz = await Quiz.create({
      title,
      prompt: prompt || '',
      target_departments: target_departments || [],
      target_emails: target_emails || [],
      questions,
      created_by: req.user._id,
      organization_id: req.user.organization_id
    });
    await logAudit(req.user._id, 'create', 'quiz', quiz._id, `Created quiz: ${title}`, req.user.organization_id);
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/quiz - List quizzes
router.get('/', auth, async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    let filter = { organization_id: orgId, is_active: true };

    // Employees only see quizzes for their department
    if (req.user.role === 'employee') {
      filter.$or = [
        { target_departments: { $in: [req.user.department] } },
        { target_emails: { $in: [req.user.email] } }
      ];
    }

    const quizzes = await Quiz.find(filter)
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });

    // For each quiz, get attempt info for current user
    const quizzesWithAttempts = await Promise.all(quizzes.map(async (quiz) => {
      const quizObj = quiz.toObject();
      const attempt = await QuizAttempt.findOne({ quiz_id: quiz._id, user_id: req.user._id });
      quizObj.attempted = !!attempt;
      quizObj.my_score = attempt ? attempt.percentage : null;

      // For admin, get stats
      if (req.user.role === 'admin' || req.user.role === 'cybersecurity') {
        const attempts = await QuizAttempt.find({ quiz_id: quiz._id });
        quizObj.total_attempts = attempts.length;
        quizObj.avg_score = attempts.length > 0
          ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
          : 0;
      }

      // Don't send correct answers in list view for employees
      if (req.user.role === 'employee' && !attempt) {
        quizObj.questions = quizObj.questions.map(q => ({
          question: q.question,
          options: q.options
        }));
      }

      return quizObj;
    }));

    res.json(quizzesWithAttempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/quiz/:id - Get quiz details
router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, organization_id: req.user.organization_id })
      .populate('created_by', 'name email');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const quizObj = quiz.toObject();
    const attempt = await QuizAttempt.findOne({ quiz_id: quiz._id, user_id: req.user._id });
    quizObj.attempted = !!attempt;
    quizObj.my_score = attempt ? attempt.percentage : null;
    quizObj.my_answers = attempt ? attempt.answers : null;

    // Hide correct answers for employees who haven't attempted
    if (req.user.role === 'employee' && !attempt) {
      quizObj.questions = quizObj.questions.map(q => ({
        question: q.question,
        options: q.options
      }));
    }

    res.json(quizObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/quiz/:id/attempt - Submit quiz attempt
router.post('/:id/attempt', auth, async (req, res) => {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findOne({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Check if already attempted
    const existing = await QuizAttempt.findOne({ quiz_id: quiz._id, user_id: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already attempted this quiz' });
    }

    if (!answers || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: `Please answer all ${quiz.questions.length} questions` });
    }

    // Calculate score
    let score = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      if (answers[i] === quiz.questions[i].correct_answer) {
        score++;
      }
    }
    const percentage = Math.round((score / quiz.questions.length) * 100);

    const attempt = await QuizAttempt.create({
      quiz_id: quiz._id,
      user_id: req.user._id,
      organization_id: req.user.organization_id,
      answers,
      score,
      total_questions: quiz.questions.length,
      percentage
    });

    // Return quiz with correct answers and explanations for review
    res.status(201).json({
      attempt,
      questions: quiz.questions,
      message: `You scored ${score}/${quiz.questions.length} (${percentage}%)`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/quiz/:id/results - Admin view: all attempts for a quiz
router.get('/:id/results', auth, authorize('admin', 'cybersecurity'), async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const attempts = await QuizAttempt.find({ quiz_id: quiz._id })
      .populate('user_id', 'name email department')
      .sort({ createdAt: -1 });

    const totalAttempts = attempts.length;
    const avgPercentage = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts)
      : 0;
    const passCount = attempts.filter(a => a.percentage >= 70).length;

    res.json({
      quiz: { title: quiz.title, total_questions: quiz.questions.length, target_departments: quiz.target_departments },
      stats: {
        total_attempts: totalAttempts,
        avg_percentage: avgPercentage,
        pass_rate: totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0,
        highest_score: totalAttempts > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0,
        lowest_score: totalAttempts > 0 ? Math.min(...attempts.map(a => a.percentage)) : 0
      },
      attempts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/quiz/my-attempts - Employee view: own quiz history
router.get('/my-attempts/list', auth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user_id: req.user._id })
      .populate('quiz_id', 'title target_departments')
      .sort({ createdAt: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/quiz/:id - Admin delete quiz
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    await QuizAttempt.deleteMany({ quiz_id: quiz._id });
    await logAudit(req.user._id, 'delete', 'quiz', quiz._id, `Deleted quiz: ${quiz.title}`, req.user.organization_id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
