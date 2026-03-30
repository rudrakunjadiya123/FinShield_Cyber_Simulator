import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0ea5e9', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'];

const AnalyticsDashboard = ({ filters = {} }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.departments && !filters.departments.includes('all')) {
        params.append('departments', filters.departments.join(','));
      }
      if (filters.campaigns && !filters.campaigns.includes('all')) {
        params.append('campaigns', filters.campaigns.join(','));
      }
      if (filters.users && !filters.users.includes('all')) {
        params.append('users', filters.users.join(','));
      }
      if (filters.timeRange && filters.timeRange !== 'all') {
        params.append('timeRange', filters.timeRange);
      }

      const res = await api.get(`/analytics/dashboard-v2?${params.toString()}`);
      setDashboard(res.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="flex items-center justify-center h-32"><p className="text-slate-400 text-sm">Loading analytics...</p></div>;
  if (!dashboard) return null;

  const overview = dashboard.overview || {};
  const departmentBreakdown = dashboard.departmentBreakdown || [];
  const interactionRate = dashboard.interactionRate || {};

  // Department chart data
  const deptChartData = departmentBreakdown.map(d => ({
    name: d.department,
    'Click Rate': parseFloat(d.click_rate) || 0,
    'Report Rate': parseFloat(d.report_rate) || 0,
    Clicked: d.clicked,
    Reported: d.reported,
    Submitted: d.submitted
  }));

  // Pie data
  const pieData = [
    { name: 'Clicked', value: interactionRate.links_clicked || 0 },
    { name: 'Reported', value: interactionRate.emails_reported || 0 },
    { name: 'Submitted', value: interactionRate.credentials_entered || 0 },
    { name: 'No Action', value: Math.max(0, (overview.total_emails_sent || 0) - (interactionRate.links_clicked || 0) - (interactionRate.emails_reported || 0)) }
  ].filter(d => d.value > 0);

  // Risk chart data from department breakdown
  const riskChartData = departmentBreakdown.map(d => ({
    name: d.department,
    'Risk Score': d.risk_score || 0,
  }));

  return (
    <div className="page-container">

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Click & Report Rates */}
        <div className="glass-card p-5">
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
        <div className="glass-card p-5">
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
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Department Risk Scores</h2>
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

        {/* Participation Stats */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Participation Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <MiniStat label="Total Emails" value={overview.total_emails_sent} />
            <MiniStat label="Opened" value={overview.emails_opened} />
            <MiniStat label="Clicked" value={overview.links_clicked} color="text-red-600" />
            <MiniStat label="Reported" value={overview.emails_reported} color="text-green-600" />
            <MiniStat label="Submitted" value={overview.credentials_entered} color="text-orange-600" />
            <MiniStat label="Employees" value={overview.total_users} />
          </div>
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
