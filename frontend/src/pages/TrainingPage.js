import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

const TrainingPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'cybersecurity';
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [myAttempts, setMyAttempts] = useState([]);

  // Create quiz state — single form with title, departments, prompt
  const [quizForm, setQuizForm] = useState({ title: '', target_departments: [], target_emails: [], prompt: '' });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  // Attempt state
  const [answers, setAnswers] = useState([]);
  const [attemptResult, setAttemptResult] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const quizRes = await api.get('/quiz');
      setQuizzes(quizRes.data);
      if (isAdmin) {
        const deptRes = await api.get('/users/departments');
        setDepartments(deptRes.data);
        const userRes = await api.get('/users');
        setUsers(userRes.data);
      }
      if (!isAdmin) {
        const attRes = await api.get('/quiz/my-attempts/list');
        setMyAttempts(attRes.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Generate quiz: title + departments + prompt all collected first
  const handleGenerate = async () => {
    if (!quizForm.title.trim()) { setMessage('Please enter a quiz title'); return; }
    if (quizForm.target_departments.length === 0 && quizForm.target_emails.length === 0) { setMessage('Please select at least one department or user'); return; }
    if (!quizForm.prompt.trim()) { setMessage('Please enter a prompt to generate questions'); return; }
    setGenerating(true);
    setMessage('');
    try {
      const res = await api.post('/quiz/generate', { prompt: quizForm.prompt, count: 5 });
      setGeneratedQuestions(res.data.questions);
      setShowReview(true);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to generate quiz. Please try again.');
    }
    setGenerating(false);
  };

  // Save quiz after reviewing generated questions
  const handleSaveQuiz = async () => {
    try {
      await api.post('/quiz/create', {
        title: quizForm.title,
        prompt: quizForm.prompt,
        target_departments: quizForm.target_departments,
        target_emails: quizForm.target_emails,
        questions: generatedQuestions
      });
      setMessage('Quiz created successfully!');
      resetCreate();
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating quiz');
    }
  };

  const resetCreate = () => {
    setShowCreate(false);
    setShowReview(false);
    setQuizForm({ title: '', target_departments: [], target_emails: [], prompt: '' });
    setGeneratedQuestions([]);
  };

  // Start quiz attempt
  const startQuiz = async (quizId) => {
    try {
      const res = await api.get(`/quiz/${quizId}`);
      setActiveQuiz(res.data);
      setAnswers(new Array(res.data.questions.length).fill(-1));
      setAttemptResult(null);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error loading quiz');
    }
  };

  // Submit attempt
  const handleSubmitAttempt = async () => {
    if (answers.includes(-1)) { setMessage('Please answer all questions'); return; }
    try {
      const res = await api.post(`/quiz/${activeQuiz._id}/attempt`, { answers });
      setAttemptResult(res.data);
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error submitting quiz');
    }
  };

  // Admin: View results
  const viewResults = async (quizId) => {
    try {
      const res = await api.get(`/quiz/${quizId}/results`);
      setQuizResults(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error loading results');
    }
  };

  // Delete quiz
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quiz and all attempts?')) return;
    try {
      await api.delete(`/quiz/${id}`);
      setMessage('Quiz deleted');
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };

  // Toggle functions removed since we use MultiSelectDropdown now

  // Update a generated question
  const updateQuestion = (index, field, value) => {
    setGeneratedQuestions(prev => {
      const updated = [...prev];
      if (field === 'option') {
        const [optIdx, val] = value;
        updated[index] = { ...updated[index], options: updated[index].options.map((o, i) => i === optIdx ? val : o) };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  // ==================== Quiz Results View (Admin) ====================
  if (quizResults) {
    return (
      <div className="page-container">
        <button onClick={() => setQuizResults(null)} className="text-cyan-600 hover:text-cyan-700 mb-4 font-medium">&larr; Back to Quizzes</button>
        <h1 className="page-title mb-4">{quizResults.quiz.title} - Results</h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Attempts" value={quizResults.stats.total_attempts} />
          <StatCard label="Avg Score" value={`${quizResults.stats.avg_percentage}%`} color={quizResults.stats.avg_percentage >= 70 ? 'text-green-600' : 'text-red-600'} />
          <StatCard label="Pass Rate" value={`${quizResults.stats.pass_rate}%`} />
          <StatCard label="Highest" value={`${quizResults.stats.highest_score}%`} color="text-green-600" />
          <StatCard label="Lowest" value={`${quizResults.stats.lowest_score}%`} color="text-red-600" />
        </div>

        <div className="table-glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Department</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Score</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Percentage</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {quizResults.attempts.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">No attempts yet</td></tr>
              ) : (
                quizResults.attempts.map(a => (
                  <tr key={a._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{a.user_id?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-slate-600">{a.user_id?.department || '-'}</td>
                    <td className="text-center px-4 py-3">{a.score}/{a.total_questions}</td>
                    <td className="text-center px-4 py-3">
                      <span className={`font-semibold ${a.percentage >= 70 ? 'text-green-600' : a.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {a.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(a.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==================== Active Quiz / Attempt View ====================
  if (activeQuiz) {
    if (attemptResult) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button onClick={() => { setActiveQuiz(null); setAttemptResult(null); }} className="text-cyan-600 hover:text-cyan-700 mb-4 font-medium">&larr; Back to Quizzes</button>
          <div className="glass-card p-6 mb-6 text-center">
            <h2 className="page-title mb-2">Quiz Complete!</h2>
            <p className="text-lg text-slate-600 mb-4">{attemptResult.message}</p>
            <div className={`text-5xl font-bold mb-4 ${attemptResult.attempt.percentage >= 70 ? 'text-green-600' : attemptResult.attempt.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {attemptResult.attempt.percentage}%
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-800 mb-4">Review Answers</h3>
          {attemptResult.questions.map((q, idx) => (
            <div key={idx} className={`glass-card p-5 mb-4 border-l-4 ${answers[idx] === q.correct_answer ? 'border-green-500' : 'border-red-500'}`}>
              <p className="font-medium text-slate-800 mb-3">Q{idx + 1}. {q.question}</p>
              <div className="space-y-2 mb-3">
                {q.options.map((opt, oi) => (
                  <div key={oi} className={`px-3 py-2 rounded-lg text-sm ${oi === q.correct_answer ? 'bg-green-100 text-green-800 font-medium' : oi === answers[idx] ? 'bg-red-100 text-red-800' : 'bg-slate-50 text-slate-600'}`}>
                    {String.fromCharCode(65 + oi)}. {opt}
                    {oi === q.correct_answer && ' ✓'}
                    {oi === answers[idx] && oi !== q.correct_answer && ' ✗'}
                  </div>
                ))}
              </div>
              {q.explanation && <p className="text-sm text-slate-500 bg-blue-50 p-3 rounded-lg"><strong>Explanation:</strong> {q.explanation}</p>}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button onClick={() => setActiveQuiz(null)} className="text-cyan-600 hover:text-cyan-700 mb-4 font-medium">&larr; Back to Quizzes</button>
        <div className="glass-card p-6 mb-6">
          <h1 className="page-title mb-2">{activeQuiz.title}</h1>
          <p className="text-slate-500 text-sm">{activeQuiz.questions.length} questions</p>
        </div>

        {message && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {message}<button onClick={() => setMessage('')} className="float-right font-bold">&times;</button>
          </div>
        )}

        {activeQuiz.questions.map((q, idx) => (
          <div key={idx} className="glass-card p-5 mb-4">
            <p className="font-medium text-slate-800 mb-3">Q{idx + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => { const newAnswers = [...answers]; newAnswers[idx] = oi; setAnswers(newAnswers); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm border transition-all ${answers[idx] === oi ? 'border-cyan-500 bg-cyan-50 text-cyan-800 font-medium' : 'border-slate-200 hover:border-cyan-300 hover:bg-slate-50'}`}
                >
                  {String.fromCharCode(65 + oi)}. {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button onClick={handleSubmitAttempt} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold text-lg transition-colors">
          Submit Quiz
        </button>
      </div>
    );
  }

  // ==================== Main List View ====================
  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Training & Quizzes</h1>
        {isAdmin && (
          <button onClick={() => { setShowCreate(!showCreate); if (showCreate) resetCreate(); }}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            {showCreate ? 'Cancel' : '+ Create Quiz'}
          </button>
        )}
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
          {message}<button onClick={() => setMessage('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* ========== Admin: Create Quiz — All fields on one screen ========== */}
      {showCreate && isAdmin && !showReview && (
        <div className="glass-card p-6 mb-6 border-2 border-cyan-200">
          <h2 className="text-lg font-semibold mb-4 text-cyan-700">Create Quiz with AI</h2>
          <div className="space-y-4">
            {/* Quiz Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Name *</label>
              <input
                type="text"
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                placeholder="e.g., Phishing Awareness Quiz - March 2024"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            {/* Target Departments & Users in 50-50 grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Departments</label>
                <MultiSelectDropdown
                  options={departments.map(d => ({ label: d, value: d }))}
                  selectedValues={quizForm.target_departments}
                  onChange={(vals) => setQuizForm({ ...quizForm, target_departments: vals })}
                  placeholder="Select Departments"
                  searchPlaceholder="Search departments..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Specific Users</label>
                <MultiSelectDropdown
                  options={users.map(u => ({ label: `${u.name} (${u.department})`, value: u.email }))}
                  selectedValues={quizForm.target_emails}
                  onChange={(vals) => setQuizForm({ ...quizForm, target_emails: vals })}
                  placeholder="Select Users"
                  searchPlaceholder="Search users by name..."
                />
              </div>
            </div>

            {/* AI Prompt */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Describe the quiz topic *</label>
              <textarea
                value={quizForm.prompt}
                onChange={(e) => setQuizForm({ ...quizForm, prompt: e.target.value })}
                placeholder="e.g., Generate 5 questions about phishing email indicators, safe browsing practices, and password security best practices"
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            {/* Generate Button */}
            <button onClick={handleGenerate} disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-3 rounded-lg font-semibold text-lg transition-colors">
              {generating ? '✨ Generating Quiz...' : '✨ Generate Quiz with AI'}
            </button>
          </div>
        </div>
      )}

      {/* ========== Review Generated Questions ========== */}
      {showCreate && isAdmin && showReview && (
        <div className="glass-card p-6 mb-6 border-2 border-green-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-green-700">Review Generated Questions — {quizForm.title}</h2>
            <span className="text-sm text-slate-500">{quizForm.target_departments.join(', ')}</span>
          </div>
          <p className="text-sm text-slate-500 mb-4">Review and edit the questions below, then save the quiz.</p>

          {generatedQuestions.map((q, idx) => (
            <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Question {idx + 1}</label>
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2 mb-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${idx}`}
                      checked={q.correct_answer === oi}
                      onChange={() => updateQuestion(idx, 'correct_answer', oi)}
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateQuestion(idx, 'option', [oi, e.target.value])}
                      className={`flex-1 px-2 py-1 border rounded text-sm ${q.correct_answer === oi ? 'border-green-400 bg-green-50' : ''}`}
                    />
                  </div>
                ))}
              </div>
              <input
                type="text"
                value={q.explanation}
                onChange={(e) => updateQuestion(idx, 'explanation', e.target.value)}
                placeholder="Explanation..."
                className="w-full px-3 py-1 border rounded text-xs text-slate-500"
              />
            </div>
          ))}

          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowReview(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2 rounded-lg font-medium">
              ← Back to Edit Details
            </button>
            <button onClick={handleSaveQuiz} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold text-lg">
              ✅ Save Quiz
            </button>
          </div>
        </div>
      )}

      {/* ========== Quiz List ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            {isAdmin ? 'No quizzes yet. Create one using the button above!' : 'No quizzes available for your department yet.'}
          </div>
        ) : (
          quizzes.map(q => (
            <div key={q._id} className="glass-card p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-slate-800">{q.title}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{q.questions.length}Q</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {q.target_departments?.map(d => (
                  <span key={d} className="bg-cyan-50 text-cyan-700 text-xs px-2 py-0.5 rounded">{d}</span>
                ))}
                {isAdmin && q.target_emails?.length > 0 && (
                  <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded">+{q.target_emails.length} Users</span>
                )}
              </div>

              {isAdmin && (
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Attempts: {q.total_attempts || 0}</span>
                    <span>Avg Score: <strong className={q.avg_score >= 70 ? 'text-green-600' : 'text-red-600'}>{q.avg_score || 0}%</strong></span>
                  </div>
                </div>
              )}

              {!isAdmin && q.attempted && (
                <div className="bg-green-50 rounded-lg p-3 mb-3 text-center">
                  <span className="text-sm text-green-700 font-medium">Completed — Score: {q.my_score}%</span>
                </div>
              )}

              <div className="flex gap-2">
                {isAdmin ? (
                  <>
                    <button onClick={() => viewResults(q._id)} className="flex-1 text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors">View Results</button>
                    <button onClick={() => handleDelete(q._id)} className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded transition-colors">Delete</button>
                  </>
                ) : (
                  q.attempted ? (
                    <button onClick={() => startQuiz(q._id)} className="flex-1 text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors">Review Answers</button>
                  ) : (
                    <button onClick={() => startQuiz(q._id)} className="flex-1 text-sm bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded transition-colors font-medium">Take Quiz</button>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Employee: My Attempts History */}
      {!isAdmin && myAttempts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">My Quiz History</h2>
          <div className="table-glass overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Quiz</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Score</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Percentage</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {myAttempts.map(a => (
                  <tr key={a._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{a.quiz_id?.title || 'N/A'}</td>
                    <td className="text-center px-4 py-3">{a.score}/{a.total_questions}</td>
                    <td className="text-center px-4 py-3">
                      <span className={`font-semibold ${a.percentage >= 70 ? 'text-green-600' : a.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {a.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(a.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="glass-card p-4 text-center">
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color || 'text-slate-800'}`}>{value}</p>
  </div>
);

export default TrainingPage;
