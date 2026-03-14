import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReportPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [form, setForm] = useState({
    campaign_id: '', title: '', summary: '', recommendations: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repRes, campRes] = await Promise.all([
          api.get('/reports'),
          api.get('/campaigns')
        ]);
        setReports(repRes.data);
        setCampaigns(campRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        recommendations: form.recommendations.split('\n').filter(r => r.trim())
      };
      await api.post('/reports', data);
      setMessage('Report created with AI-calculated risk score');
      setShowForm(false);
      setForm({ campaign_id: '', title: '', summary: '', recommendations: '' });
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating report');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Security Reports</h1>
        {user?.role === 'analyst' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium">
            {showForm ? 'Cancel' : '+ New Report'}
          </button>
        )}
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Security Report</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Campaign</label>
              <select value={form.campaign_id} onChange={(e) => setForm({ ...form, campaign_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required>
                <option value="">Select campaign</option>
                {campaigns.map(c => <option key={c._id} value={c._id}>{c.name} ({c.status})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Report Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
              <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={4} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recommendations (one per line)</label>
              <textarea value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} rows={4} className="w-full px-4 py-2 border rounded-lg" placeholder="Conduct security training for Finance dept&#10;Implement 2FA&#10;Regular phishing simulations" />
            </div>
            <p className="text-xs text-slate-400">Risk score will be automatically calculated by AI based on campaign interaction data.</p>
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium">Create Report</button>
          </form>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-slate-800">{selectedReport.title}</h2>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div><span className="text-sm text-slate-500">Campaign:</span> <span className="font-medium">{selectedReport.campaign_id?.name}</span></div>
              <div><span className="text-sm text-slate-500">Analyst:</span> <span className="font-medium">{selectedReport.analyst_id?.name}</span></div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Risk Score:</span>
                <span className={`text-2xl font-bold ${selectedReport.risk_score > 50 ? 'text-red-600' : selectedReport.risk_score > 25 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {selectedReport.risk_score}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Summary</p>
                <p className="text-slate-700">{selectedReport.summary}</p>
              </div>
              {selectedReport.recommendations?.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Recommendations</p>
                  <ul className="list-disc list-inside text-slate-700 space-y-1">
                    {selectedReport.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {selectedReport.department_risks?.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Department Risk Assessment</p>
                  {selectedReport.department_risks.map((dr, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-3 mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{dr.department}</span>
                        <span className={`font-bold ${dr.risk_score > 50 ? 'text-red-600' : dr.risk_score > 25 ? 'text-yellow-600' : 'text-green-600'}`}>
                          Risk: {dr.risk_score}
                        </span>
                      </div>
                      {dr.vulnerabilities?.length > 0 && (
                        <ul className="text-xs text-slate-500 space-y-0.5">
                          {dr.vulnerabilities.map((v, j) => <li key={j}>- {v}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.length === 0 ? (
          <p className="text-slate-400 col-span-2 text-center py-8">No reports created yet</p>
        ) : (
          reports.map(r => (
            <div key={r._id} className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedReport(r)}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-800">{r.title}</h3>
                <span className={`text-lg font-bold ${r.risk_score > 50 ? 'text-red-600' : r.risk_score > 25 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {r.risk_score}
                </span>
              </div>
              <p className="text-sm text-slate-500">Campaign: {r.campaign_id?.name || 'N/A'}</p>
              <p className="text-sm text-slate-500">By: {r.analyst_id?.name}</p>
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{r.summary}</p>
              <p className="text-xs text-slate-400 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportPage;
