import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// Multi-Select Dropdown Component
const MultiSelectDropdown = ({ label, options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (value) => {
    if (value === 'all') {
      onChange(['all']);
    } else {
      let newSelected = selected.filter(s => s !== 'all');
      if (newSelected.includes(value)) {
        newSelected = newSelected.filter(s => s !== value);
      } else {
        newSelected.push(value);
      }
      if (newSelected.length === 0) newSelected = ['all'];
      onChange(newSelected);
    }
  };

  const displayText = () => {
    if (selected.includes('all') || selected.length === 0) return `All ${label}`;
    if (selected.length === 1) {
      const opt = options.find(o => o.value === selected[0]);
      return opt?.label || selected[0];
    }
    return `${selected.length} selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-left text-sm flex items-center justify-between hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        <span className="truncate">{displayText()}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              placeholder={placeholder || 'Search...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            <label className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100">
              <input
                type="checkbox"
                checked={selected.includes('all') || selected.length === 0}
                onChange={() => handleToggle('all')}
                className="mr-2 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm font-medium text-slate-700">All {label}</span>
            </label>
            {filteredOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => handleToggle(opt.value)}
                  className="mr-2 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Admin/Cybersecurity/Analyst Dashboard - Full analytics with charts
const AdminDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filter states
  const [selectedDepartments, setSelectedDepartments] = useState(['all']);
  const [selectedCampaigns, setSelectedCampaigns] = useState(['all']);
  const [selectedUsers, setSelectedUsers] = useState(['all']);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  // Chart colors
  const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#6366f1'];

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await api.get('/analytics/filters');
        setFilterOptions(res.data);
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (!selectedDepartments.includes('all')) {
        params.append('departments', selectedDepartments.join(','));
      }
      if (!selectedCampaigns.includes('all')) {
        params.append('campaigns', selectedCampaigns.join(','));
      }
      if (!selectedUsers.includes('all')) {
        params.append('users', selectedUsers.join(','));
      }
      if (selectedTimeRange !== 'all') {
        params.append('timeRange', selectedTimeRange);
      }

      const [dashRes, insightRes] = await Promise.all([
        api.get(`/analytics/dashboard-v2?${params.toString()}`),
        api.get('/analytics/insights')
      ]);
      setDashboardData(dashRes.data);
      setInsights(insightRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartments, selectedCampaigns, selectedUsers, selectedTimeRange]);

  // Initial load
  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchDashboardData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Generate PDF Report
  const generateReport = () => {
    if (!dashboardData) return;
    const { overview, interactionRate, highRiskEmployees, departmentBreakdown, funnelData, attackTypeDistribution } = dashboardData;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFillColor(6, 182, 212); // cyan-500
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FinShield Security Report', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });

    yPos = 45;
    doc.setTextColor(30, 41, 59); // slate-800

    // Overview Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Overview', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const overviewData = [
      ['Total Users', overview.total_users || 0],
      ['Total Campaigns', overview.total_campaigns || 0],
      ['Active Campaigns', overview.active_campaigns || 0],
      ['Total Emails Sent', overview.total_emails_sent || 0],
      ['Click Rate', `${overview.click_rate || 0}%`],
      ['Report Rate', `${overview.report_rate || 0}%`]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: overviewData,
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold' } },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 12;

    // Interaction Metrics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Interaction Metrics', 14, yPos);
    yPos += 8;

    const interactionData = [
      ['Emails Opened', interactionRate.emails_opened || 0],
      ['Links Clicked', interactionRate.links_clicked || 0],
      ['Credentials Entered', interactionRate.credentials_entered || 0],
      ['Emails Reported', interactionRate.emails_reported || 0]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Action', 'Count']],
      body: interactionData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 12;

    // Campaign Funnel
    if (funnelData?.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Campaign Performance Funnel', 14, yPos);
      yPos += 8;

      const maxValue = funnelData[0]?.value || 1;
      const funnelTableData = funnelData.map(item => [
        item.name,
        item.value,
        `${maxValue > 0 ? ((item.value / maxValue) * 100).toFixed(1) : 0}%`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Stage', 'Count', 'Rate']],
        body: funnelTableData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 12;
    }

    // Attack Type Distribution
    if (attackTypeDistribution?.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Attack Type Distribution', 14, yPos);
      yPos += 8;

      const total = attackTypeDistribution.reduce((sum, item) => sum + item.value, 0);
      const attackData = attackTypeDistribution.map(item => [
        item.name,
        item.value,
        `${total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Attack Type', 'Count', 'Percentage']],
        body: attackData,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 12;
    }

    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // High-Risk Employees
    if (highRiskEmployees?.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top High-Risk Employees', 14, yPos);
      yPos += 8;

      const employeeData = highRiskEmployees.map((emp, i) => [
        i + 1,
        emp.name,
        emp.department,
        emp.risk_score,
        emp.clicked,
        emp.submitted,
        emp.reported
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Name', 'Department', 'Risk Score', 'Clicked', 'Submitted', 'Reported']],
        body: employeeData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 12 },
          3: { fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 12;
    }

    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // Department Breakdown
    if (departmentBreakdown?.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Department Risk Summary', 14, yPos);
      yPos += 8;

      const deptData = departmentBreakdown.map(dept => [
        dept.department,
        dept.risk_score,
        dept.total,
        dept.clicked,
        dept.submitted,
        dept.reported,
        `${dept.click_rate}%`,
        `${dept.report_rate}%`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Department', 'Risk', 'Total', 'Clicked', 'Submitted', 'Reported', 'Click Rate', 'Report Rate']],
        body: deptData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 1: { fontStyle: 'bold' } },
        margin: { left: 14, right: 14 }
      });
    }

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${i} of ${pageCount} | FinShield - Cybersecurity Simulation Platform`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`finshield-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  const overview = dashboardData?.overview || {};
  const interactionRate = dashboardData?.interactionRate || {};
  const departmentRiskTimeline = dashboardData?.departmentRiskTimeline || [];
  const attackTypeDistribution = dashboardData?.attackTypeDistribution || [];
  const highRiskEmployees = dashboardData?.highRiskEmployees || [];
  const funnelData = dashboardData?.funnelData || [];
  const departmentBreakdown = dashboardData?.departmentBreakdown || [];
  const departments = dashboardData?.departments || [];

  // Prepare bar chart data
  const interactionBarData = [
    { name: 'Emails Opened', value: interactionRate.emails_opened || 0, fill: '#3b82f6' },
    { name: 'Links Clicked', value: interactionRate.links_clicked || 0, fill: '#ef4444' },
    { name: 'Credentials Entered', value: interactionRate.credentials_entered || 0, fill: '#f59e0b' },
    { name: 'Emails Reported', value: interactionRate.emails_reported || 0, fill: '#10b981' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-green-600 flex items-center justify-end gap-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Data
            </p>
            {lastUpdated && (
              <p className="text-xs text-slate-400">Updated: {lastUpdated.toLocaleTimeString()}</p>
            )}
          </div>
          <button
            onClick={() => fetchDashboardData(false)}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={generateReport}
            className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Report
          </button>
        </div>
      </div>

      {/* Filters */}
      {filterOptions && (
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium text-slate-700">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MultiSelectDropdown
              label="Departments"
              options={filterOptions.departments.map(d => ({ value: d, label: d }))}
              selected={selectedDepartments}
              onChange={setSelectedDepartments}
              placeholder="Search departments..."
            />
            <MultiSelectDropdown
              label="Campaigns"
              options={filterOptions.campaigns.map(c => ({ value: c.id, label: c.name }))}
              selected={selectedCampaigns}
              onChange={setSelectedCampaigns}
              placeholder="Search campaigns..."
            />
            <MultiSelectDropdown
              label="Users"
              options={filterOptions.users.map(u => ({ value: u.id, label: `${u.name} (${u.department})` }))}
              selected={selectedUsers}
              onChange={setSelectedUsers}
              placeholder="Search users..."
            />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Time Range</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {filterOptions.timeRanges.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Users" value={overview.total_users || 0} icon="users" color="bg-purple-500" />
        <StatCard label="Campaigns" value={overview.total_campaigns || 0} icon="folder" color="bg-blue-500" />
        <StatCard label="Active" value={overview.active_campaigns || 0} icon="play" color="bg-green-500" />
        <StatCard label="Emails Sent" value={overview.total_emails_sent || 0} icon="mail" color="bg-orange-500" />
        <StatCard label="Click Rate" value={`${overview.click_rate || 0}%`} icon="cursor" color="bg-red-500" />
        <StatCard label="Report Rate" value={`${overview.report_rate || 0}%`} icon="flag" color="bg-emerald-500" />
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">AI Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Charts Row 1: Bar Chart & Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart - Phishing Email Interaction Rate */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Phishing Email Interaction Rate</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interactionBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value) => [value, 'Count']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {interactionBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart - Department Risk Over Time */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Department Risk Level Over Time</h3>
          <div className="h-64">
            {departmentRiskTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={departmentRiskTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {departments.map((dept, i) => (
                    <Line
                      key={dept}
                      type="monotone"
                      dataKey={dept}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No timeline data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Pie Chart & Funnel Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart - Attack Type Distribution */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Attack Type Distribution</h3>
          <div className="h-64">
            {attackTypeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attackTypeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {attackTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No attack type data available
              </div>
            )}
          </div>
        </div>

        {/* Simple Funnel - Campaign Performance */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Campaign Performance Funnel</h3>
          <div className="space-y-3">
            {funnelData.length > 0 ? (
              funnelData.map((item, index) => {
                const maxValue = funnelData[0]?.value || 1;
                const percentage = maxValue > 0 ? ((item.value / maxValue) * 100).toFixed(1) : 0;
                const colors = ['bg-cyan-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500'];
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-32 text-xs text-slate-600 text-right">{item.name}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                      <div
                        className={`h-full ${colors[index % colors.length]} rounded-full flex items-center justify-end pr-3 transition-all duration-500`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      >
                        <span className="text-xs font-medium text-white">{item.value}</span>
                      </div>
                    </div>
                    <div className="w-14 text-xs text-slate-500">{percentage}%</div>
                  </div>
                );
              })
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400">
                No funnel data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* High-Risk Employees Table */}
      {highRiskEmployees.length > 0 && (
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Top High-Risk Employees</h3>
            <p className="text-xs text-slate-500 mt-1">Employees with highest vulnerability scores (0–100, higher = more at risk). See Leaderboard for Security Score (higher = safer).</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Rank</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Department</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Vuln. Score</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Clicked</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Submitted</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Reported</th>
                </tr>
              </thead>
              <tbody>
                {highRiskEmployees.map((emp, i) => (
                  <tr key={emp.id || i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        i < 3 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{emp.department}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        emp.risk_score >= 70 ? 'bg-red-100 text-red-700' :
                        emp.risk_score >= 40 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {emp.risk_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-red-600 font-medium">{emp.clicked}</td>
                    <td className="px-4 py-3 text-center text-orange-600 font-medium">{emp.submitted}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{emp.reported}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Department Risk Summary */}
      {departmentBreakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Department Risk Summary</h3>
            <p className="text-xs text-slate-500 mt-1">Risk scores and interaction metrics by department</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Department</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Vuln. Score</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Opened</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Clicked</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Submitted</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Reported</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Click Rate</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Report Rate</th>
                </tr>
              </thead>
              <tbody>
                {departmentBreakdown.map((dept, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{dept.department}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        dept.risk_score >= 50 ? 'bg-red-100 text-red-700' :
                        dept.risk_score >= 25 ? 'bg-orange-100 text-orange-700' :
                        dept.risk_score >= 10 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {dept.risk_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{dept.total}</td>
                    <td className="px-4 py-3 text-center text-blue-600">{dept.opened}</td>
                    <td className="px-4 py-3 text-center text-red-600">{dept.clicked}</td>
                    <td className="px-4 py-3 text-center text-orange-600">{dept.submitted}</td>
                    <td className="px-4 py-3 text-center text-green-600">{dept.reported}</td>
                    <td className="px-4 py-3 text-center">{dept.click_rate}%</td>
                    <td className="px-4 py-3 text-center">{dept.report_rate}%</td>
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

// Stat Card Component
const StatCard = ({ label, value, icon, color }) => {
  const icons = {
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    folder: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
    play: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />,
    mail: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    cursor: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />,
    flag: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icons[icon]}
          </svg>
        </div>
      </div>
    </div>
  );
};

// Insight Card Component
const InsightCard = ({ insight }) => {
  const colors = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    stat: 'bg-slate-50 border-slate-200 text-slate-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };
  const icons = {
    warning: '⚠️',
    critical: '🚨',
    info: 'ℹ️',
    stat: '📊',
    success: '✅'
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[insight.type] || colors.info}`}>
      <div className="flex items-start gap-2">
        <span>{icons[insight.type] || icons.info}</span>
        <div>
          <h3 className="font-semibold text-sm">{insight.title}</h3>
          <p className="text-xs mt-1 opacity-90">{insight.message}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
