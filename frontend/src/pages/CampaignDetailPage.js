import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campRes, statsRes] = await Promise.all([
          api.get(`/campaigns/${id}`),
          api.get(`/campaigns/${id}/stats`)
        ]);
        setCampaign(campRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;
  if (!campaign) return <div className="text-center py-8">Campaign not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button onClick={() => navigate('/campaigns')} className="text-cyan-600 hover:text-cyan-700 mb-4 inline-block">&larr; Back to Campaigns</button>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{campaign.name}</h1>
            <p className="text-slate-500 mt-1">Template: {campaign.template_id?.template_name}</p>
            <p className="text-slate-500">Departments: {campaign.target_departments?.join(', ')}</p>
            <p className="text-slate-500">Launch: {new Date(campaign.launch_date).toLocaleString()}</p>
          </div>
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Stat label="Total Targets" value={stats.total_targets} />
            <Stat label="Emails Opened" value={stats.email_opened} sub={`${stats.open_rate}%`} />
            <Stat label="Links Clicked" value={stats.link_clicked} sub={`${stats.click_rate}%`} color="text-red-600" />
            <Stat label="Reported" value={stats.reported_email} sub={`${stats.report_rate}%`} color="text-green-600" />
            <Stat label="Form Submitted" value={stats.form_submitted} sub={`${stats.submission_rate}%`} color="text-orange-600" />
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <h2 className="text-lg font-semibold px-4 py-3 border-b">User Interactions</h2>
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
                  <tr key={log._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium">{log.user_id?.name}</p>
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
        </>
      )}
    </div>
  );
};

const Stat = ({ label, value, sub, color = "text-slate-800" }) => (
  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-xs text-slate-500">{label}</p>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
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
  return <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}>{status}</span>;
};

const Check = ({ color = "blue" }) => {
  const colors = { blue: "text-blue-500", red: "text-red-500", green: "text-green-500", orange: "text-orange-500" };
  return <span className={`${colors[color]} font-bold`}>&#10003;</span>;
};
const Cross = () => <span className="text-slate-300">&#10007;</span>;

export default CampaignDetailPage;
