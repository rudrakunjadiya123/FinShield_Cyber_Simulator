import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CampaignPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', template_id: '', target_departments: [], launch_date: '', status: 'draft'
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campRes, tempRes, deptRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/templates'),
        api.get('/users/departments')
      ]);
      setCampaigns(campRes.data);
      setTemplates(tempRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/campaigns', form);
      setMessage('Campaign created successfully');
      setShowForm(false);
      setForm({ name: '', template_id: '', target_departments: [], launch_date: '', status: 'draft' });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating campaign');
    }
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

  const toggleDept = (dept) => {
    setForm(prev => ({
      ...prev,
      target_departments: prev.target_departments.includes(dept)
        ? prev.target_departments.filter(d => d !== dept)
        : [...prev.target_departments, dept]
    }));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Campaigns</h1>
        <button
          onClick={() => setShowForm(!showForm)}
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
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Campaign</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
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
                  <option key={t._id} value={t._id}>{t.template_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Departments</label>
              <div className="flex flex-wrap gap-2">
                {departments.map(dept => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDept(dept)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                      form.target_departments.includes(dept)
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-cyan-400'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
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
              Create Campaign
            </button>
          </form>
        </div>
      )}

      {/* Campaign List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
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
                  <td className="px-4 py-3 font-medium">{c.name}</td>
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
