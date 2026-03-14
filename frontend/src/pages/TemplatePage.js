import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TemplatePage = () => {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    template_name: '', email_subject: '', email_body: '', phishing_link: '', difficulty_level: 'medium'
  });
  const [aiForm, setAiForm] = useState({
    theme: 'password-reset', department: '', difficulty: 'medium'
  });

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ template_name: '', email_subject: '', email_body: '', phishing_link: '', difficulty_level: 'medium' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/templates/update/${editId}`, form);
        setMessage('Template updated');
      } else {
        await api.post('/templates/create', form);
        setMessage('Template created');
      }
      resetForm();
      fetchTemplates();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (t) => {
    setForm({
      template_name: t.template_name,
      email_subject: t.email_subject,
      email_body: t.email_body,
      phishing_link: t.phishing_link || '',
      difficulty_level: t.difficulty_level || 'medium'
    });
    setEditId(t._id);
    setShowForm(true);
    setShowAI(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/templates/delete/${id}`);
      setMessage('Template deleted');
      fetchTemplates();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/templates/generate-ai', aiForm);
      setMessage(`AI template "${res.data.template_name}" generated`);
      setShowAI(false);
      fetchTemplates();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Templates</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowAI(!showAI); setShowForm(false); }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            {showAI ? 'Cancel' : 'AI Generate'}
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowAI(false); resetForm(); }} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            {showForm ? 'Cancel' : '+ New Template'}
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* AI Generator Form */}
      {showAI && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 border-2 border-purple-200">
          <h2 className="text-lg font-semibold mb-4 text-purple-700">AI Template Generator</h2>
          <form onSubmit={handleAIGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Theme</label>
              <select value={aiForm.theme} onChange={(e) => setAiForm({ ...aiForm, theme: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                <option value="password-reset">Password Reset</option>
                <option value="invoice-payment">Invoice Payment</option>
                <option value="hr-policy">HR Policy Update</option>
                <option value="delivery-notification">Delivery Notification</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Department</label>
              <input type="text" value={aiForm.department} onChange={(e) => setAiForm({ ...aiForm, department: e.target.value })} placeholder="e.g. Finance, HR, Engineering" className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty Level</label>
              <select value={aiForm.difficulty} onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium">Generate Template</button>
          </form>
        </div>
      )}

      {/* Manual Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Template' : 'Create New Template'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
              <input type="text" value={form.template_name} onChange={(e) => setForm({ ...form, template_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Subject</label>
              <input type="text" value={form.email_subject} onChange={(e) => setForm({ ...form, email_subject: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Body (HTML)</label>
              <textarea value={form.email_body} onChange={(e) => setForm({ ...form, email_body: e.target.value })} rows={6} className="w-full px-4 py-2 border rounded-lg font-mono text-sm" required />
              <p className="text-xs text-slate-400 mt-1">Use {"{{name}}"}, {"{{department}}"}, {"{{link}}"} as placeholders</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty Level</label>
              <select value={form.difficulty_level} onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium">
              {editId ? 'Update Template' : 'Create Template'}
            </button>
          </form>
        </div>
      )}

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <div key={t._id} className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-slate-800">{t.template_name}</h3>
                <p className="text-sm text-slate-500">{t.email_subject}</p>
              </div>
              <div className="flex gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.difficulty_level === 'easy' ? 'bg-green-100 text-green-700' : t.difficulty_level === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {t.difficulty_level}
                </span>
                {t.ai_generated && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">AI</span>}
              </div>
            </div>
            <div className="text-sm text-slate-600 mb-3 max-h-24 overflow-hidden" dangerouslySetInnerHTML={{ __html: t.email_body?.substring(0, 200) + '...' }} />
            <div className="flex gap-2">
              <button onClick={() => handleEdit(t)} className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded transition-colors">Edit</button>
              <button onClick={() => handleDelete(t._id)} className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplatePage;
