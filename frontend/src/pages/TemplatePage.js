import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TemplatePage = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [previewHtml, setPreviewHtml] = useState(null);
  const [htmlFileName, setHtmlFileName] = useState('');
  const [form, setForm] = useState({
    template_name: '', description: '', phishing_link: '',
    difficulty_level: 'medium', html_code: '', target_button_id: ''
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
    setForm({
      template_name: '', description: '', phishing_link: '',
      difficulty_level: 'medium', html_code: '', target_button_id: ''
    });
    setHtmlFileName('');
    setEditId(null);
    setShowForm(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setMessage('Please upload an .html file only.');
      return;
    }
    setHtmlFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({ ...prev, html_code: event.target.result }));
      setMessage(`File "${file.name}" loaded successfully.`);
    };
    reader.readAsText(file);
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
      description: t.description || '',
      phishing_link: t.phishing_link || '',
      difficulty_level: t.difficulty_level || 'medium',
      html_code: t.html_code || '',
      target_button_id: t.target_button_id || ''
    });
    setHtmlFileName(t.html_code ? 'Existing HTML content' : '');
    setEditId(t._id);
    setShowForm(true);
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

  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  // HTML Preview Modal
  if (previewHtml) {
    return (
      <div className="page-container">
        <button onClick={() => setPreviewHtml(null)} className="text-cyan-600 hover:text-cyan-700 mb-4 font-medium">&larr; Back to Templates</button>
        <div className="glass-card p-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Landing Page Preview</h2>
          <p className="text-xs text-slate-400 mb-3">This is the phishing simulation page that target users see after clicking the link</p>
        </div>
        <div className="table-glass overflow-hidden" style={{ height: '600px' }}>
          <iframe
            title="Template Preview"
            srcDoc={previewHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-scripts"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Templates</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
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

      {/* New Template / Edit Form */}
      {showForm && (
        <div className="glass-card p-6 mb-6 border-2 border-cyan-200">
          <h2 className="text-lg font-semibold mb-4 text-cyan-700">{editId ? 'Edit Template' : 'Create New Template'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template Name *</label>
              <input type="text" value={form.template_name} onChange={(e) => setForm({ ...form, template_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows="2" placeholder="Describe the template" />
            </div>

            {/* HTML File Upload */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                📄 Upload Landing Page HTML File
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Upload the .html file that users will see when they click the phishing link. This file should contain all HTML, CSS, and JS.
              </p>
              <input
                type="file"
                accept=".html,.htm"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 cursor-pointer"
              />
              {htmlFileName && (
                <p className="text-sm text-green-600 mt-2 font-medium">✅ {htmlFileName}</p>
              )}
            </div>

            {/* Target Button ID */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                🎯 Target Button ID (for tracking)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Enter the <code className="bg-slate-100 px-1 rounded">id</code> attribute of the button/link in your HTML file that you want to track.
                When a user clicks this button, it will be recorded in the database.
              </p>
              <input
                type="text"
                value={form.target_button_id}
                onChange={(e) => setForm({ ...form, target_button_id: e.target.value })}
                placeholder="e.g. login-btn, download-btn, submit-form"
                className="w-full px-4 py-2 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty Level</label>
              <select value={form.difficulty_level} onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              {editId ? 'Update Template' : 'Create Template'}
            </button>
          </form>
        </div>
      )}

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <div key={t._id} className={`glass-card p-5 ${t.is_predefined ? 'border-l-4 border-cyan-500' : ''}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-slate-800">{t.template_name}</h3>
                {t.description && <p className="text-sm text-slate-600 mt-0.5">{t.description}</p>}
              </div>
              <div className="flex gap-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.difficulty_level === 'easy' ? 'bg-green-100 text-green-700' : t.difficulty_level === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {t.difficulty_level}
                </span>
                {t.is_predefined && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-medium">System</span>}
                {t.ai_generated && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">AI</span>}
                {t.target_button_id && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">🎯 #{t.target_button_id}</span>}
                {t.category && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{t.category}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {t.html_code && (
                <button onClick={() => setPreviewHtml(t.html_code)} className="text-sm bg-cyan-50 hover:bg-cyan-100 text-cyan-700 px-3 py-1 rounded transition-colors font-medium">Preview Page</button>
              )}
              {(!t.is_predefined || user?.role === 'admin') && (
                <button onClick={() => handleEdit(t)} className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded transition-colors">Edit</button>
              )}
              {!t.is_predefined && (
                <button onClick={() => handleDelete(t._id)} className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded transition-colors">Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplatePage;
