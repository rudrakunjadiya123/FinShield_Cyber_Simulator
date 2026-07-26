import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search } from 'lucide-react';

const TemplatePage = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [previewHtml, setPreviewHtml] = useState(null);
  const [htmlFileName, setHtmlFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [form, setForm] = useState({
    template_name: '', description: '', phishing_link: '',
    html_code: '', tracked_elements_input: '', attack_category: 'Email'
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
      html_code: '', tracked_elements_input: '', attack_category: 'Email'
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
      const payload = {
        ...form,
        tracked_elements: form.tracked_elements_input.split(',').map(s => s.trim()).filter(s => s)
      };
      
      if (editId) {
        await api.put(`/templates/update/${editId}`, payload);
        setMessage('Template updated');
      } else {
        await api.post('/templates/create', payload);
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
      html_code: t.html_code || '',
      tracked_elements_input: (t.tracked_elements || []).join(', '),
      attack_category: t.attack_category || 'Email'
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

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.template_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || t.attack_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="text-sm text-slate-500">Manage and deploy security awareness campaign templates.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Template'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <select 
           value={categoryFilter}
           onChange={(e) => setCategoryFilter(e.target.value)}
           className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm bg-white text-slate-700 font-medium"
        >
           <option value="All">All Categories</option>
           <option value="Email">Email</option>
           <option value="Credential">Credential</option>
           <option value="QR">QR</option>
           <option value="SMS">SMS</option>
           <option value="Incident Drill">Incident Drill</option>
           <option value="Cloud">Cloud</option>
        </select>
        
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input
             type="text"
             placeholder="Search templates..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-64 text-slate-600"
           />
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
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Attack Category *</label>
              <select value={form.attack_category} onChange={(e) => setForm({ ...form, attack_category: e.target.value })} className="w-full px-4 py-2 border rounded-lg bg-white" required>
                <option value="Email">Email</option>
                <option value="Credential">Credential</option>
                <option value="QR">QR</option>
                <option value="SMS">SMS</option>
                <option value="Incident Drill">Incident Drill</option>
                <option value="Cloud">Cloud</option>
              </select>
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

            {/* Tracked Elements */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                🎯 Tracked Element IDs
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Enter a comma-separated list of <code className="bg-slate-100 px-1 rounded">id</code> or <code className="bg-slate-100 px-1 rounded">name</code> attributes of the buttons/inputs in your HTML file that you want to specifically track.
              </p>
              <input
                type="text"
                value={form.tracked_elements_input}
                onChange={(e) => setForm({ ...form, tracked_elements_input: e.target.value })}
                placeholder="e.g. login-btn, password-input, submit-form"
                className="w-full px-4 py-2 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
            
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors">
              {editId ? 'Update Template' : 'Create Template'}
            </button>
          </form>
        </div>
      )}

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(t => (
          <div key={t._id} className={`bg-white rounded-xl shadow-sm border ${t.is_predefined ? 'border-cyan-200' : 'border-slate-200'} p-5 flex flex-col h-full hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-800 text-lg pr-4">{t.template_name}</h3>
              <div className="flex gap-1 flex-col items-end shrink-0">
                {t.is_predefined && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">System</span>}
                {t.tracked_elements && t.tracked_elements.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-medium whitespace-nowrap outline outline-1 outline-cyan-200">🎯 {t.tracked_elements.length} Tracked</span>}
              </div>
            </div>
            
            <div className="mb-4 flex-grow">
               {t.attack_category && <span className="inline-block mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{t.attack_category}</span>}
               {t.description && <p className="text-sm text-slate-500">{t.description}</p>}
            </div>

            <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
              <div className="flex gap-3">
                {t.html_code && (
                  <button onClick={() => setPreviewHtml(t.html_code)} className="text-sm font-medium text-cyan-600 hover:text-cyan-700">Preview Page</button>
                )}
                {(!t.is_predefined || user?.role === 'admin') && (
                  <button onClick={() => handleEdit(t)} className="text-sm font-medium text-slate-600 hover:text-slate-800">Edit</button>
                )}
              </div>
                <button onClick={() => handleDelete(t._id)} className="text-sm font-medium text-red-500 hover:text-red-700">Delete</button>
            </div>
          </div>
        ))}
        
        {/* Dashed Create New Card */}
        <button 
          onClick={() => { setShowForm(true); resetForm(); }}
          className="border-2 border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center text-center h-full min-h-[220px] hover:border-cyan-400 hover:bg-cyan-50/50 transition-colors bg-slate-50/50 group"
        >
          <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mb-3 group-hover:scale-110 transition-transform">
             <span className="text-2xl font-normal">+</span>
          </div>
          <h3 className="font-bold text-slate-800">Create New</h3>
          <p className="text-xs text-slate-500">Start from a blank canvas</p>
        </button>
      </div>
    </div>
  );
};

export default TemplatePage;
