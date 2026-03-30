import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

const CampaignPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', email_subject: '', email_body: '', template_id: '', target_departments: [], target_emails: [], launch_date: '', status: 'draft'
  });
  const [message, setMessage] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campRes, tempRes, deptRes, userRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/templates'),
        api.get('/users/departments'),
        api.get('/users')
      ]);
      setCampaigns(campRes.data);
      setTemplates(tempRes.data);
      setDepartments(deptRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/campaigns/${editId}`, form);
        setMessage('Campaign updated successfully');
      } else {
        await api.post('/campaigns', form);
        setMessage('Campaign created successfully');
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: '', email_subject: '', email_body: '', template_id: '', target_departments: [], target_emails: [], launch_date: '', status: 'draft' });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error saving campaign');
    }
  };

  const handleEdit = (c) => {
    setForm({
      name: c.name,
      email_subject: c.email_subject,
      email_body: c.email_body,
      template_id: c.template_id?._id || '',
      target_departments: c.target_departments || [],
      target_emails: c.target_emails || [],
      launch_date: c.launch_date ? new Date(c.launch_date).toISOString().slice(0, 16) : '',
      status: c.status
    });
    setEditId(c._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      setMessage('Campaign deleted successfully');
      if (editId === id) {
        setShowForm(false);
        setEditId(null);
        setForm({ name: '', email_subject: '', email_body: '', template_id: '', target_departments: [], target_emails: [], launch_date: '', status: 'draft' });
      }
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error deleting campaign');
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await api.post('/campaigns/generate-description', { prompt: aiPrompt });
      setForm(prev => ({
        ...prev,
        email_subject: res.data.email_subject || prev.email_subject,
        email_body: res.data.email_body || '',
      }));
      setShowAiPrompt(false);
      setAiPrompt('');
      setMessage('AI content generated! You can edit Title and Description below.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to generate content');
    }
    setAiGenerating(false);
  };

  const handleLaunch = async (id) => {
    if (!window.confirm('Are you sure you want to launch this campaign? Emails will be sent to target users.')) return;
    try {
      const res = await api.post(`/campaigns/${id}/launch`);
      setMessage(`Campaign launched! ${res.data.total_targets} emails queued.`);
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error launching campaign');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.post(`/campaigns/${id}/complete`);
      setMessage('Campaign marked as completed');
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };


  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Campaigns</h1>
        <button
          onClick={() => {
            if (showForm) {
               setEditId(null);
               setForm({ name: '', email_subject: '', email_body: '', template_id: '', target_departments: [], target_emails: [], launch_date: '', status: 'draft' });
            }
            setShowForm(!showForm);
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Campaign' : 'Create New Campaign'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template</label>
              <select
                value={form.template_id}
                onChange={(e) => setForm({ ...form, template_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                required
              >
                <option value="">Select a template</option>
                {templates.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.template_name} {t.is_predefined ? '(System)' : ''} {t.ai_generated ? '(AI)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Departments</label>
              <MultiSelectDropdown
                options={departments.map(d => ({ label: d, value: d }))}
                selectedValues={form.target_departments}
                onChange={(vals) => setForm({ ...form, target_departments: vals })}
                placeholder="Select Departments"
                searchPlaceholder="Search departments..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Individual Users</label>
              <MultiSelectDropdown
                options={users.map(u => ({ label: `${u.name} (${u.department})`, value: u.email }))}
                selectedValues={form.target_emails}
                onChange={(vals) => setForm({ ...form, target_emails: vals })}
                placeholder="Select Users"
                searchPlaceholder="Search specific users by name..."
              />
              <p className="text-xs text-slate-400 mt-1">Select specific users, or leave blank to strictly use the department selections above.</p>
            </div>

            {/* Description with AI generation */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Email Campaign Settings</label>
                <button type="button" onClick={() => setShowAiPrompt(!showAiPrompt)}
                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full font-medium transition-colors">
                  ✨ AI Generate Subject & Body
                </button>
              </div>

              {showAiPrompt && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe what kind of phishing email to generate...&#10;e.g. A convincing password reset email from the IT department"
                    rows={2}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none mb-2"
                  />
                  <button type="button" onClick={handleAIGenerate} disabled={aiGenerating || !aiPrompt.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm px-4 py-1.5 rounded-lg font-medium">
                    {aiGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              )}
              
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email Subject *</label>
                  <input
                    type="text"
                    value={form.email_subject}
                    onChange={(e) => setForm({ ...form, email_subject: e.target.value })}
                    placeholder="e.g. Action Required: Update Your Password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email Body (HTML) *</label>
                  <textarea
                    value={form.email_body}
                    onChange={(e) => setForm({ ...form, email_body: e.target.value })}
                    placeholder="<p>Dear {{name}},</p><p>Please click <a href='{{link}}'>here</a>.</p>"
                    rows={5}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm font-mono"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">Use {"{{name}}"}, {"{{department}}"}, and {"{{link}}"} as placeholders.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Launch Date</label>
              <input
                type="datetime-local"
                value={form.launch_date}
                onChange={(e) => setForm({ ...form, launch_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                required
              />
            </div>
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium">
              {editId ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </form>
        </div>
      )}

      {/* Campaign List */}
      <div className="table-glass overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Template</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Departments</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Launch Date</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">No campaigns yet</td></tr>
            ) : (
              campaigns.map(c => (
                <tr key={c._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.template_id?.template_name || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.target_departments?.map(d => (
                        <span key={d} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{d}</span>
                      ))}
                    </div>
                  </td>
                  <td className="text-center px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.launch_date ? new Date(c.launch_date).toLocaleString() : 'N/A'}
                  </td>
                  <td className="text-center px-4 py-3">
                    <div className="flex justify-center gap-2">
                      {new Date() < new Date(c.launch_date) && c.status !== 'running' && c.status !== 'completed' && (
                        <>
                          <button
                            onClick={() => handleEdit(c)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-3 py-1 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {(c.status === 'draft' || c.status === 'scheduled') && (
                        <button
                          onClick={() => handleLaunch(c._id)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors"
                        >
                          Launch
                        </button>
                      )}
                      {c.status === 'running' && (
                        <button
                          onClick={() => handleComplete(c._id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded transition-colors"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/campaigns/${c._id}`)}
                        className="bg-slate-600 hover:bg-slate-700 text-white text-xs px-3 py-1 rounded transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    draft: 'bg-slate-100 text-slate-600',
    scheduled: 'bg-blue-100 text-blue-700',
    running: 'bg-green-100 text-green-700',
    completed: 'bg-purple-100 text-purple-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>{status}</span>;
};

export default CampaignPage;
