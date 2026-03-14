import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();

  // Show different dashboard based on role
  if (user?.role === 'employee') {
    return <EmployeeDashboard user={user} />;
  }

  return <AdminDashboard user={user} />;
};

// Employee Dashboard - Personal stats only
const EmployeeDashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/analytics/my-stats');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch personal stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-slate-500">Loading your dashboard...</p></div>;
  }

  const stats = data?.stats || {};
  const userData = data?.user || {};
  const recentActivity = data?.recentActivity || [];

  const getSecurityLevelColor = (level) => {
    const colors = {
      'Beginner': 'text-slate-600',
      'Aware': 'text-blue-600',
      'Intermediate': 'text-green-600',
      'Advanced': 'text-purple-600',
      'Expert': 'text-yellow-600'
    };
    return colors[level] || 'text-slate-600';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Security Dashboard</h1>
        <p className="text-slate-500">Track your cybersecurity awareness progress</p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl font-bold text-cyan-600">
                {userData.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{userData.name}</h2>
              <p className="text-slate-500">{userData.department} Department</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Security Level</p>
            <p className={`text-lg font-bold ${getSecurityLevelColor(userData.security_level)}`}>
              {userData.security_level}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <p className="text-sm text-slate-500">Security Score</p>
          <p className={`text-4xl font-bold mt-2 ${getScoreColor(stats.security_score)}`}>
            {stats.security_score || 100}
          </p>
          <p className="text-xs text-slate-400 mt-1">out of 100</p>
        </div>

        <div className="bg-white rounded-xl shadow p-5 text-center">
          <p className="text-sm text-slate-500">Your Points</p>
          <p className="text-4xl font-bold mt-2 text-cyan-600">{userData.points || 0}</p>
          <p className="text-xs text-slate-400 mt-1">gamification points</p>
        </div>

        <div className="bg-white rounded-xl shadow p-5 text-center">
          <p className="text-sm text-slate-500">Phishing Tests</p>
          <p className="text-4xl font-bold mt-2 text-slate-700">{stats.total_phishing_attempts || 0}</p>
          <p className="text-xs text-slate-400 mt-1">received</p>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.emails_opened || 0}</p>
            <p className="text-sm text-blue-700">Emails Opened</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats.links_clicked || 0}</p>
            <p className="text-sm text-red-700">Links Clicked</p>
            <p className="text-xs text-red-500">(-5 points each)</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{stats.forms_submitted || 0}</p>
            <p className="text-sm text-orange-700">Forms Submitted</p>
            <p className="text-xs text-orange-500">(-10 points each)</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.emails_reported || 0}</p>
            <p className="text-sm text-green-700">Emails Reported</p>
            <p className="text-xs text-green-500">(+10 points each)</p>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-cyan-800 mb-3">Security Tips</h3>
        <ul className="space-y-2 text-sm text-cyan-700">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            Always check the sender's email address carefully before clicking any links.
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            Hover over links to see where they actually lead before clicking.
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            Be suspicious of urgent requests, especially those asking for credentials.
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            When in doubt, report suspicious emails to your security team.
          </li>
        </ul>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Phishing Tests</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">{activity.campaign}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {activity.reported && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Reported
                    </span>
                  )}
                  {activity.linkClicked && !activity.reported && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      Clicked Link
                    </span>
                  )}
                  {activity.formSubmitted && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                      Submitted Form
                    </span>
                  )}
                  {!activity.linkClicked && !activity.reported && !activity.formSubmitted && activity.emailOpened && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Opened Only
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Admin/Cybersecurity/Analyst Dashboard - Full analytics
const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, insightRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/insights')
        ]);
        setStats(dashRes.data);
        setInsights(insightRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-slate-500">Loading dashboard...</p></div>;
  }

  const overview = stats?.overview || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Welcome back, {user?.name}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Campaigns" value={overview.total_campaigns || 0} color="bg-blue-500" />
        <StatCard label="Active Campaigns" value={overview.active_campaigns || 0} color="bg-green-500" />
        <StatCard label="Total Employees" value={overview.total_users || 0} color="bg-purple-500" />
        <StatCard label="Emails Sent" value={overview.total_emails_sent || 0} color="bg-orange-500" />
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <RateCard
          label="Phishing Click Rate"
          rate={overview.click_rate || 0}
          sublabel={`${overview.links_clicked || 0} clicks`}
          color="text-red-600"
        />
        <RateCard
          label="Report Rate"
          rate={overview.report_rate || 0}
          sublabel={`${overview.emails_reported || 0} reports`}
          color="text-green-600"
        />
        <RateCard
          label="Credential Submission Rate"
          rate={overview.submission_rate || 0}
          sublabel={`${overview.forms_submitted || 0} submissions`}
          color="text-orange-600"
        />
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">AI Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Department Breakdown */}
      {stats?.departmentBreakdown?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Department Breakdown</h2>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Department</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Opened</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Clicked</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Reported</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Submitted</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Click Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.departmentBreakdown.map((dept, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{dept.department}</td>
                    <td className="text-center px-4 py-3">{dept.total}</td>
                    <td className="text-center px-4 py-3">{dept.opened}</td>
                    <td className="text-center px-4 py-3 text-red-600">{dept.clicked}</td>
                    <td className="text-center px-4 py-3 text-green-600">{dept.reported}</td>
                    <td className="text-center px-4 py-3 text-orange-600">{dept.submitted}</td>
                    <td className="text-center px-4 py-3">{dept.click_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaign Performance */}
      {stats?.campaignPerformance?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Campaign Performance</h2>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Campaign</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Targets</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Clicked</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Reported</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {stats.campaignPerformance.map((c, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="text-center px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="text-center px-4 py-3">{c.total}</td>
                    <td className="text-center px-4 py-3 text-red-600">{c.clicked}</td>
                    <td className="text-center px-4 py-3 text-green-600">{c.reported}</td>
                    <td className="text-center px-4 py-3 text-orange-600">{c.submitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-xl shadow p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold`}>
        {String(value).charAt(0)}
      </div>
    </div>
  </div>
);

const RateCard = ({ label, rate, sublabel, color }) => (
  <div className="bg-white rounded-xl shadow p-5">
    <p className="text-sm text-slate-500">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${color}`}>{rate}%</p>
    <p className="text-xs text-slate-400 mt-1">{sublabel}</p>
  </div>
);

const InsightCard = ({ insight }) => {
  const colors = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    stat: 'bg-slate-50 border-slate-200 text-slate-800',
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[insight.type] || colors.info}`}>
      <h3 className="font-semibold text-sm">{insight.title}</h3>
      <p className="text-sm mt-1">{insight.message}</p>
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
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
};

export default DashboardPage;
