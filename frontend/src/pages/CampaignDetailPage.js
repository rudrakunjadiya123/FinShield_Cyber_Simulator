import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [campRes, statsRes] = await Promise.all([
        api.get(`/campaigns/${id}`),
        api.get(`/campaigns/${id}/stats`)
      ]);
      setCampaign(campRes.data);
      setStats(statsRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchData(true); }, [fetchData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto mb-3"></div>
        <p className="text-slate-500">Loading campaign...</p>
      </div>
    </div>
  );

  if (!campaign) return <div className="text-center py-8 text-slate-500">Campaign not found</div>;

  const noData = !stats || stats.total_targets === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button onClick={() => navigate('/campaigns')} className="text-cyan-600 hover:text-cyan-700 mb-4 inline-flex items-center gap-1 text-sm">
        &larr; Back to Campaigns
      </button>

      {/* Campaign Header */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{campaign.name}</h1>
            <p className="text-slate-500 mt-1">Template: <span className="font-medium">{campaign.template_id?.template_name || 'N/A'}</span></p>
            <p className="text-slate-500">Departments: <span className="font-medium">{campaign.target_departments?.join(', ') || 'All'}</span></p>
            <p className="text-slate-500">Launch: <span className="font-medium">{new Date(campaign.launch_date).toLocaleString()}</span></p>
          </div>
          <div className="text-right">
            <StatusBadge status={campaign.status} />
            <div className="mt-2 flex items-center justify-end gap-1 text-xs text-green-600">
              <span className={`inline-block w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></span>
              {isRefreshing ? 'Updating...' : 'Live - Refreshing every 5s'}
            </div>
            {lastUpdated && (
              <p className="text-xs text-slate-400 mt-1">Updated: {lastUpdated.toLocaleTimeString()}</p>
            )}
            <button
              onClick={() => fetchData(false)}
              className="mt-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      {noData ? (
        <div className="bg-white rounded-xl shadow p-10 text-center mb-6">
          <div className="text-5xl mb-3">📭</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No Interaction Data Yet</h3>
          <p className="text-slate-500 text-sm">
            {campaign.status === 'draft' || campaign.status === 'scheduled'
              ? 'Campaign has not launched. Data will appear once emails are sent.'
              : 'Waiting for user interactions. Page auto-refreshes every 5 seconds.'}
          </p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard label="Total Targets" value={stats.total_targets} />
            <StatCard label="Emails Opened" value={stats.email_opened} sub={`${stats.open_rate}%`} color="text-blue-600" />
            <StatCard label="Links Clicked" value={stats.link_clicked} sub={`${stats.click_rate}%`} color="text-red-600" />
            <StatCard label="Reported" value={stats.reported_email} sub={`${stats.report_rate}%`} color="text-green-600" />
            <StatCard label="Form Submitted" value={stats.form_submitted} sub={`${stats.submission_rate}%`} color="text-orange-600" />
          </div>

          {/* Progress Bars */}
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Interaction Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: 'Email Opened', value: stats.email_opened, rate: stats.open_rate, color: 'bg-blue-500' },
                { label: 'Link Clicked', value: stats.link_clicked, rate: stats.click_rate, color: 'bg-red-500' },
                { label: 'Form Submitted', value: stats.form_submitted, rate: stats.submission_rate, color: 'bg-orange-500' },
                { label: 'Reported', value: stats.reported_email, rate: stats.report_rate, color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-slate-600">{item.label}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(parseFloat(item.rate) || 0, item.value > 0 ? 4 : 0)}%` }}
                    >
                      {item.value > 0 && <span className="text-white text-xs font-bold">{item.value}</span>}
                    </div>
                  </div>
                  <div className="w-12 text-xs text-slate-500 text-right">{item.rate}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* User Interactions Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-base font-semibold text-slate-800">User Interactions</h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{stats.logs?.length || 0} users</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Department</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Opened</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Clicked</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Reported</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.logs?.map(log => (
                    <tr key={log._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{log.user_id?.name}</p>
                        <p className="text-xs text-slate-400">{log.user_id?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{log.user_id?.department}</td>
                      <td className="text-center px-4 py-3">{log.email_opened ? <Check /> : <Cross />}</td>
                      <td className="text-center px-4 py-3">{log.link_clicked ? <Check color="red" /> : <Cross />}</td>
                      <td className="text-center px-4 py-3">{log.reported_email ? <Check color="green" /> : <Cross />}</td>
                      <td className="text-center px-4 py-3">{log.form_submitted ? <Check color="orange" /> : <Cross />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value, sub, color = 'text-slate-800' }) => (
  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-xs text-slate-500">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${color}`}>{value ?? 0}</p>
    {sub && <p className="text-xs text-slate-400">{sub}</p>}
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    draft: 'bg-slate-100 text-slate-600',
    scheduled: 'bg-blue-100 text-blue-700',
    running: 'bg-green-100 text-green-700',
    completed: 'bg-purple-100 text-purple-700',
  };
  return <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.draft}`}>{status}</span>;
};

const Check = ({ color = 'blue' }) => {
  const cols = { blue: 'text-blue-500', red: 'text-red-500', green: 'text-green-500', orange: 'text-orange-500' };
  return <span className={`${cols[color]} font-bold text-base`}>&#10003;</span>;
};

const Cross = () => <span className="text-slate-300 text-base">&#10007;</span>;

export default CampaignDetailPage;
