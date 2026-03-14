import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0ea5e9', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'];

const AnalyticsDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [riskScores, setRiskScores] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, riskRes, insightRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/risk-score'),
          api.get('/analytics/insights')
        ]);
        setDashboard(dashRes.data);
        setRiskScores(riskRes.data);
        setInsights(insightRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading analytics...</p></div>;

  const overview = dashboard?.overview || {};
  const deptData = dashboard?.departmentBreakdown || [];
  const campData = dashboard?.campaignPerformance || [];

  // Prepare chart data
  const deptChartData = deptData.map(d => ({
    name: d.department,
    'Click Rate': parseFloat(d.click_rate) || 0,
    'Report Rate': parseFloat(d.report_rate) || 0,
    Clicked: d.clicked,
    Reported: d.reported,
    Submitted: d.submitted
  }));

  const pieData = [
    { name: 'Clicked', value: overview.links_clicked || 0 },
    { name: 'Reported', value: overview.emails_reported || 0 },
    { name: 'Submitted', value: overview.forms_submitted || 0 },
    { name: 'No Action', value: Math.max(0, (overview.total_emails_sent || 0) - (overview.links_clicked || 0) - (overview.emails_reported || 0)) }
  ].filter(d => d.value > 0);

  const riskChartData = riskScores.map(r => ({
    name: r.department,
    'Risk Score': r.risk_score,
    Users: r.total_users
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Analytics Dashboard</h1>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {insights.map((ins, i) => {
            const bgColors = { warning: 'bg-yellow-50 border-yellow-300', critical: 'bg-red-50 border-red-300', info: 'bg-blue-50 border-blue-300', stat: 'bg-slate-50 border-slate-300' };
            return (
              <div key={i} className={`border-l-4 rounded-lg p-4 ${bgColors[ins.type] || bgColors.info}`}>
                <h3 className="font-semibold text-sm text-slate-800">{ins.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{ins.message}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Click & Report Rates */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Department Click & Report Rates (%)</h2>
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Click Rate" fill="#ef4444" />
                <Bar dataKey="Report Rate" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-12">No data available</p>}
        </div>

        {/* User Response Distribution Pie */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">User Response Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-12">No data available</p>}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Risk Scores */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Department Risk Scores (AI)</h2>
          {riskChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Risk Score" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-12">No data available</p>}
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Campaign Performance</h2>
          {campData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campData.map(c => ({ name: c.name.substring(0, 15), Clicked: c.clicked, Reported: c.reported, Submitted: c.submitted }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Clicked" fill="#ef4444" />
                <Bar dataKey="Reported" fill="#22c55e" />
                <Bar dataKey="Submitted" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-12">No data available</p>}
        </div>
      </div>

      {/* Participation Stats */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Participation Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
          <MiniStat label="Total Emails" value={overview.total_emails_sent} />
          <MiniStat label="Opened" value={overview.emails_opened} />
          <MiniStat label="Clicked" value={overview.links_clicked} color="text-red-600" />
          <MiniStat label="Reported" value={overview.emails_reported} color="text-green-600" />
          <MiniStat label="Submitted" value={overview.forms_submitted} color="text-orange-600" />
          <MiniStat label="Employees" value={overview.total_users} />
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value, color = "text-slate-800" }) => (
  <div>
    <p className={`text-2xl font-bold ${color}`}>{value || 0}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </div>
);

export default AnalyticsDashboard;
