import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area
} from 'recharts';
import { Shield, TrendingUp, Users, Zap, LayoutDashboard, Clock, User, ChevronRight } from 'lucide-react';

const COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  amber: '#f59e0b',
  slateDark: '#1e293b',
  slateMedium: '#334155',
  slateLight: '#94a3b8'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e1e1e] border border-[#333] p-3 rounded-md shadow-xl text-xs font-mono">
        <p className="text-slate-300 font-bold mb-2 border-b border-[#333] pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="text-white font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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

  if (loading) return <div className="flex items-center justify-center h-48"><p className="text-[#888] font-mono text-sm animate-pulse">Loading intelligence...</p></div>;
  if (!dashboard) return null;

  // Destructure backend data
  const { 
    overview = {}, 
    departmentBreakdown = [], 
    highRiskEmployees = [], 
    departmentRiskTimeline = [], 
    funnelData = [],
    recentReports = []
  } = dashboard;

  // Calculate composite org risk score (0-100, where 100 is perfectly safe).
  // E.g., baseline 100, minus click_rate * 2. 
  const rawClickRate = parseFloat(overview.click_rate || 0);
  const orgRiskScore = Math.max(0, Math.round(100 - (rawClickRate * 2.5)));
  const orgScoreColor = orgRiskScore > 80 ? COLORS.emerald : orgRiskScore > 50 ? COLORS.amber : COLORS.rose;

  // Dynamic AI Insights
  const highestRiskDept = departmentBreakdown.length > 0 ? departmentBreakdown[0].department : 'None';
  
  // Format Data for charts
  const lineChartData = departmentRiskTimeline.map(item => {
    const obj = { month: item.month };
    Object.keys(item).forEach(k => {
      if (k !== 'month') obj[k] = item[k];
    });
    return obj;
  });
  const allDeptsInTimeline = dashboard.departments || [];

  const heatmapData = departmentBreakdown.map(d => ({
    name: d.department,
    Clicks: d.clicked || 0,
    Submits: d.submitted || 0,
    Reports: d.reported || 0
  }));

  const funnelChartData = funnelData.map(d => ({
    name: d.name,
    Count: d.value
  }));

  return (
    <div className="bg-[#121212] min-h-screen text-[#e0e0e0] font-mono p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ROW 1: Overview & Top Stats */}
        <div className="border border-[#333] bg-[#1a1a1a] rounded-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#ffffff02] to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-5">
            <div className="flex items-center gap-5">
              <div className="w-[4.5rem] h-[4.5rem] rounded bg-[#1e1e1e] border border-[#333] flex items-center justify-center">
                <Shield className="w-8 h-8" strokeWidth={1.5} style={{ color: orgScoreColor, fill: 'none' }} />
              </div>
              <div>
                <h2 className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-1.5">Organization Cyber Risk Score</h2>
                <div className="flex items-end gap-2">
                  <span className="text-[2rem] leading-none font-bold text-white">{orgRiskScore}</span>
                  <span className="text-[#666] text-lg mb-0.5 font-mono">/ 100</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-14 mt-6 md:mt-0 md:px-8">
              <div className="text-right flex flex-col items-center">
                <p className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-2">Risk Trend</p>
                <p className="text-emerald-400 text-base flex items-center gap-1 font-bold">
                  <TrendingUp className="w-4 h-4" /> 12%
                </p>
              </div>
              <div className="text-right flex flex-col items-center">
                <p className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-2">Active Campaigns</p>
                <p className="text-white text-base font-bold">{overview.active_campaigns || 0}</p>
              </div>
              <div className="text-right flex flex-col items-center">
                <p className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-2">High Risk Users</p>
                <p className="text-rose-400 text-base font-bold">{highRiskEmployees.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 1B: Insights */}
        <div className="border border-[#333] bg-[#1a1a1a] rounded-sm p-5 relative overflow-hidden">
          {/* AI Security Insights */}
          <div className="flex items-start gap-4 p-1">
            <Zap className="w-5 h-5 text-amber-500 mt-1 shrink-0" />
            <div>
              <h3 className="text-white font-bold text-[11px] tracking-widest uppercase mb-3">AI Security Insights</h3>
              <ul className="space-y-2.5 text-xs font-mono text-[#aaa]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <strong className="text-[#ddd]">{highestRiskDept}</strong> department remains at the highest vulnerability index.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Click rate across organization stands at <strong className="text-[#ddd]">{overview.click_rate || 0}%</strong>.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Recommend mandatory simulated credential training for <strong className="text-[#ddd]">{highestRiskDept}</strong>.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ROW 2: Heatmap & Funnel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[#333] bg-[#1a1a1a] rounded-sm p-6 pb-2">
            <h3 className="text-[#888] text-[10px] uppercase font-bold tracking-widest border-b border-[#333] pb-4 mb-6">Risk Heatmap Array</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapData} layout="horizontal" barSize={16}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 'dataMax']} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#222' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#888', paddingTop: '10px' }} iconType="circle" iconSize={6} />
                  <Bar dataKey="Clicks" stackId="a" fill="#f43f5e" />
                  <Bar dataKey="Submits" stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="Reports" stackId="a" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-[#333] bg-[#1a1a1a] rounded-sm p-6 pb-2">
            <h3 className="text-[#888] text-[10px] uppercase font-bold tracking-widest border-b border-[#333] pb-4 mb-6">Campaign Funnel</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={funnelChartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 30 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#333" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#222' }} />
                  <Bar dataKey="Count" fill={COLORS.cyan} barSize={20} radius={[0, 4, 4, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 3: Risk Trend & Top Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[#333] bg-[#1a1a1a] rounded-sm p-6 pb-2">
            <h3 className="text-[#888] text-[10px] uppercase font-bold tracking-widest border-b border-[#333] pb-4 mb-6">Department Risk Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#333" />
                  <XAxis dataKey="month" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} iconType="plainline" />
                  {allDeptsInTimeline.map((dept, i) => (
                    <Line 
                      key={dept} 
                      type="monotone" 
                      dataKey={dept} 
                      stroke={Object.values(COLORS)[i % Object.values(COLORS).length]} 
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#1a1a1a', strokeWidth: 2 }} 
                      activeDot={{ r: 5 }} 
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-[#333] bg-[#1a1a1a] rounded-sm flex flex-col">
            <div className="px-6 py-5 border-b border-[#333]">
              <h3 className="text-[#888] text-[10px] uppercase font-bold tracking-widest">Top High Risk Employees</h3>
            </div>
            <div className="p-6 pt-5 flex-grow overflow-auto max-h-[17.5rem]">
              {highRiskEmployees.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#555] text-xs">No high risk targets detected</div>
              ) : (
                <div className="space-y-3">
                  {highRiskEmployees.map((emp, i) => (
                    <div key={emp.id || i} className="flex items-center justify-between p-3.5 border border-[#333] bg-transparent rounded hover:bg-[#151515] hover:border-[#444] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded border border-[#333] bg-transparent flex items-center justify-center text-[#666]">
                          <User className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white mb-0.5">{emp.name}</p>
                          <p className="text-[10px] text-[#666] font-medium uppercase font-mono tracking-wider">{emp.department}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-center justify-center pr-2">
                        <p className="text-lg font-bold text-rose-500 mb-0.5">{emp.risk_score}</p>
                        <p className="text-[9px] text-[#666] uppercase font-bold tracking-widest">Risk Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 4: Activity Timeline */}
        <div className="border border-[#333] bg-[#1a1a1a] rounded-sm p-6 pt-5">
          <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-5">
            <h3 className="text-[#888] text-[10px] uppercase font-bold tracking-widest">Recent Campaign Activity Timeline</h3>
            <button className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1 transition-colors">
              View Audit Log <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-0 relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-[#333] z-0"></div>
            
            {recentReports.length === 0 ? (
              <p className="text-[#555] text-xs pl-12 h-16 flex items-center">No recent activity flows recorded.</p>
            ) : (
              recentReports.map((report, i) => (
                <div key={report._id || i} className="flex gap-6 relative z-10 py-5">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#444] flex items-center justify-center mt-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#888]" />
                  </div>
                  <div className="bg-[#111] border border-[#2a2a2a] rounded p-4 flex-grow relative hover:border-[#444] transition-colors">
                    <div className="absolute left-0 top-5 -translate-x-full w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-[#2a2a2a]"></div>
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm text-[#eee] font-bold">
                        <span className="text-emerald-400">Phishing Reported</span> by {report.user_id?.name || 'Unknown'}
                      </p>
                      <span className="text-[10px] text-[#666] uppercase tracking-wider">{new Date(report.reported_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-[#888]">
                      Originating from Campaign: <span className="text-[#ccc]">{report.campaign_id?.name || 'Unlinked Campaign'}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
