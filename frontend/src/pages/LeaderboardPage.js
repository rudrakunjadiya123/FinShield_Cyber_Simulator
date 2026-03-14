import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [deptRanking, setDeptRanking] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetail, setEmployeeDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const params = selectedDept !== 'all' ? `?department=${selectedDept}` : '';
      const [lbRes, deptRes, deptsRes] = await Promise.all([
        api.get(`/gamification/leaderboard${params}`),
        api.get('/gamification/department-ranking'),
        api.get('/gamification/departments')
      ]);
      setLeaderboard(lbRes.data);
      setDeptRanking(deptRes.data);
      setDepartments(deptsRes.data);
      setLastUpdated(new Date());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedDept]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchLeaderboard(), 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const fetchEmployeeDetail = async (userId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/gamification/employee/${userId}`);
      setEmployeeDetail(res.data);
      setSelectedEmployee(userId);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Security Leaderboard</h1>
          <p className="text-sm text-slate-500 mt-1">Track employee security awareness performance</p>
          {lastUpdated && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live · Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLeaderboard()}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm text-slate-600"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowScoreInfo(!showScoreInfo)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700"
          >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How Scoring Works
        </button>
        </div>
      </div>

      {/* Score Explanation Panel */}
      {showScoreInfo && <ScoreExplanation onClose={() => setShowScoreInfo(false)} />}

      {/* Department Filter */}
      <div className="bg-white rounded-xl shadow mb-6 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-slate-600">Filter by Department:</span>
          <button
            onClick={() => { setSelectedDept('all'); setSelectedEmployee(null); setEmployeeDetail(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedDept === 'all' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Departments
          </button>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => { setSelectedDept(dept); setSelectedEmployee(null); setEmployeeDetail(null); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedDept === dept ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Employee Leaderboard - Left Column */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Employee Rankings</h2>
              <p className="text-xs text-slate-400 mt-0.5">Click on an employee to see detailed analysis</p>
            </div>
            <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500">{leaderboard.length} employees</span>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {leaderboard.length === 0 ? (
              <p className="px-5 py-8 text-center text-slate-400">No employee data yet</p>
            ) : (
              leaderboard.map((user, i) => (
                <button
                  key={user._id}
                  onClick={() => fetchEmployeeDetail(user._id)}
                  className={`w-full flex items-center px-5 py-3 hover:bg-cyan-50 transition-colors text-left ${
                    selectedEmployee === user._id ? 'bg-cyan-50 border-l-4 border-cyan-500' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-400 text-yellow-900' :
                    i === 1 ? 'bg-slate-300 text-slate-700' :
                    i === 2 ? 'bg-orange-300 text-orange-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.department} &middot; {user.email}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-lg font-bold text-cyan-600">{user.security_score ?? 100}<span className="text-xs font-normal text-slate-400">/100</span></p>
                    <p className="text-xs text-slate-400">{user.points} pts</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.security_level === 'Security Champion' ? 'bg-green-100 text-green-700' :
                      user.security_level === 'Aware' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{user.security_level}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Department Ranking - Right Column */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-slate-800">Department Ranking</h2>
          </div>
          {deptRanking.length > 0 ? (
            <>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={deptRanking.map(d => ({ name: d.department, score: d.avg_points }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="divide-y">
                {deptRanking.map((dept, i) => (
                  <div key={dept.department} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                        i === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-100 text-slate-500'
                      }`}>{i+1}</span>
                      <span className="font-medium text-slate-800 text-sm">{dept.department}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cyan-600">{dept.avg_points} avg</p>
                      <p className="text-xs text-slate-400">{dept.total_users} employees</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="px-5 py-8 text-center text-slate-400">No department data</p>
          )}
        </div>
      </div>

      {/* Employee Detail Panel with XAI */}
      {selectedEmployee && (
        <EmployeeDetailPanel
          data={employeeDetail}
          loading={detailLoading}
          onClose={() => { setSelectedEmployee(null); setEmployeeDetail(null); }}
        />
      )}
    </div>
  );
};

/* ======================== Score Explanation Panel ======================== */
const ScoreExplanation = ({ onClose }) => (
  <div className="bg-white rounded-xl shadow mb-6 overflow-hidden">
    <div className="px-5 py-4 border-b flex items-center justify-between bg-gradient-to-r from-cyan-50 to-white">
      <h2 className="text-lg font-semibold text-slate-800">How the Scoring System Works</h2>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div className="p-5">
      {/* Points System */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Points System (used for Security Level badge)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">+10</p>
            <p className="text-xs text-green-700 mt-1 font-medium">Report Phishing Email</p>
            <p className="text-xs text-green-600 mt-0.5">Best response - alerts the team</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">+5</p>
            <p className="text-xs text-green-700 mt-1 font-medium">Ignore Phishing Link</p>
            <p className="text-xs text-green-600 mt-0.5">Awarded when campaign ends</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">-5</p>
            <p className="text-xs text-red-700 mt-1 font-medium">Click Phishing Link</p>
            <p className="text-xs text-red-600 mt-0.5">Risky - opened malicious link</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">-10</p>
            <p className="text-xs text-red-700 mt-1 font-medium">Submit Credentials</p>
            <p className="text-xs text-red-600 mt-0.5">Critical - data breach risk</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">* The +5 ignore bonus is automatically awarded to employees who received an email but did not click, submit, or report when the admin marks the campaign as complete.</p>
      </div>

      {/* Security Score Formula */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-1">Security Score (shown in Leaderboard & Employee Dashboard)</h3>
        <p className="text-xs text-slate-500 mb-3">Range: 0–100 · Higher is better · Calculated live from all campaign interactions</p>
        <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm">
          <p className="text-slate-600">Score = 100</p>
          <p className="text-green-600 ml-4">+ (reported / total) x 20 &nbsp;<span className="text-slate-400 font-sans">Reporting bonus</span></p>
          <p className="text-red-600 ml-4">- (clicked / total) x 30 &nbsp;<span className="text-slate-400 font-sans">Click penalty</span></p>
          <p className="text-red-600 ml-4">- (submitted / total) x 40 &nbsp;<span className="text-slate-400 font-sans">Submission penalty</span></p>
          <div className="border-t border-slate-300 mt-2 pt-2">
            <p className="text-slate-800 font-semibold">= Final Security Score (clamped 0–100)</p>
          </div>
        </div>
      </div>

      {/* Vulnerability Score (Admin) */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-1">Vulnerability Score (shown in Admin Dashboard)</h3>
        <p className="text-xs text-slate-500 mb-3">Range: 0–100 · Higher means more at risk · Used to identify employees needing training</p>
        <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm">
          <p className="text-slate-600">VScore = (clicked×20 + submitted×40) / total × (100/60)</p>
          <div className="border-t border-slate-300 mt-2 pt-2 font-sans text-xs text-slate-500">
            This score rises when an employee frequently clicks or submits — it does NOT factor in reporting.
          </div>
        </div>
      </div>

      {/* Security Levels */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Security Levels (Based on Points)</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div>
              <p className="text-sm font-semibold text-red-700">Beginner</p>
              <p className="text-xs text-red-600">0 - 20 points</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div>
              <p className="text-sm font-semibold text-yellow-700">Aware</p>
              <p className="text-xs text-yellow-600">21 - 50 points</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm font-semibold text-green-700">Security Champion</p>
              <p className="text-xs text-green-600">51+ points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ======================== Employee Detail Panel ======================== */
const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];

const EmployeeDetailPanel = ({ data, loading, onClose }) => {
  if (loading) return (
    <div className="bg-white rounded-xl shadow p-8 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full"></div>
    </div>
  );
  if (!data) return null;

  const { user, stats, scoreBreakdown, xaiInsights, strengths, weaknesses, campaignHistory } = data;

  const pieData = [
    { name: 'Clicked', value: stats.links_clicked },
    { name: 'Submitted', value: stats.forms_submitted },
    { name: 'Reported', value: stats.emails_reported },
    { name: 'Ignored', value: stats.ignored > 0 ? stats.ignored : 0 }
  ].filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-lg">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.department} &middot; {user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-cyan-600">{user.points} pts</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              user.security_level === 'Security Champion' ? 'bg-green-100 text-green-700' :
              user.security_level === 'Aware' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>{user.security_level}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total Attempts" value={stats.total_attempts} color="text-slate-700" />
          <StatCard label="Emails Opened" value={stats.emails_opened} color="text-blue-600" />
          <StatCard label="Links Clicked" value={stats.links_clicked} color="text-red-600" />
          <StatCard label="Forms Submitted" value={stats.forms_submitted} color="text-red-700" />
          <StatCard label="Reported" value={stats.emails_reported} color="text-green-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Security Score Gauge */}
          <div className="bg-slate-50 rounded-xl p-5 text-center">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">Security Score</h3>
            <div className="relative w-32 h-32 mx-auto mb-3">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={stats.security_score >= 80 ? '#22c55e' : stats.security_score >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${stats.security_score * 3.14} 314`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{stats.security_score}</span>
              </div>
            </div>
            {/* Score Breakdown */}
            <div className="text-left text-xs space-y-1 bg-white rounded-lg p-3">
              <div className="flex justify-between"><span className="text-slate-500">Base Score</span><span className="font-mono">100</span></div>
              <div className="flex justify-between"><span className="text-green-600">Report Bonus</span><span className="font-mono text-green-600">{scoreBreakdown.report_bonus}</span></div>
              <div className="flex justify-between"><span className="text-red-600">Click Penalty</span><span className="font-mono text-red-600">{scoreBreakdown.click_penalty}</span></div>
              <div className="flex justify-between"><span className="text-red-600">Submit Penalty</span><span className="font-mono text-red-600">{scoreBreakdown.submit_penalty}</span></div>
              <div className="flex justify-between border-t pt-1 font-semibold"><span>Final Score</span><span>{scoreBreakdown.final_score}/100</span></div>
            </div>
          </div>

          {/* Interaction Breakdown Pie */}
          <div className="bg-slate-50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-600 mb-3 text-center">Interaction Breakdown</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {pieData.map((entry, idx) => (
                    <span key={entry.name} className="flex items-center gap-1 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      {entry.name}: {entry.value}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-slate-400 text-sm py-8">No interactions yet</p>
            )}
          </div>

          {/* XAI Overall Assessment */}
          <div className="bg-slate-50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">AI Assessment</h3>
            <div className="space-y-3">
              {xaiInsights.map((insight, i) => (
                <div key={i} className={`rounded-lg p-3 border-l-4 ${
                  insight.type === 'success' ? 'bg-green-50 border-green-500' :
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  insight.type === 'critical' ? 'bg-red-50 border-red-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <p className={`text-xs font-semibold ${
                    insight.type === 'success' ? 'text-green-700' :
                    insight.type === 'warning' ? 'text-yellow-700' :
                    insight.type === 'critical' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>{insight.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div className="bg-green-50 rounded-xl p-5 border border-green-200">
            <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Strengths
            </h3>
            {strengths.length > 0 ? (
              <div className="space-y-2">
                {strengths.map((s, i) => (
                  <div key={i} className="bg-white rounded-lg p-3">
                    <p className="text-sm font-medium text-green-700">{s.area}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{s.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600">No notable strengths identified yet.</p>
            )}
          </div>

          {/* Weaknesses & Recommendations */}
          <div className="bg-red-50 rounded-xl p-5 border border-red-200">
            <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Areas to Improve
            </h3>
            {weaknesses.length > 0 ? (
              <div className="space-y-2">
                {weaknesses.map((w, i) => (
                  <div key={i} className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-red-700">{w.area}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        w.severity === 'critical' ? 'bg-red-200 text-red-800' :
                        w.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                        w.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>{w.severity}</span>
                    </div>
                    <p className="text-xs text-slate-600">{w.detail}</p>
                    <p className="text-xs text-cyan-700 mt-1 font-medium">Recommendation: {w.recommendation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-red-600">No weaknesses identified. Great performance!</p>
            )}
          </div>
        </div>

        {/* Campaign History */}
        {campaignHistory.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Campaign History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-2 font-medium text-slate-600">Campaign</th>
                    <th className="px-4 py-2 font-medium text-slate-600">Date</th>
                    <th className="px-4 py-2 font-medium text-slate-600 text-center">Opened</th>
                    <th className="px-4 py-2 font-medium text-slate-600 text-center">Clicked</th>
                    <th className="px-4 py-2 font-medium text-slate-600 text-center">Submitted</th>
                    <th className="px-4 py-2 font-medium text-slate-600 text-center">Reported</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {campaignHistory.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-800">{c.campaign}</td>
                      <td className="px-4 py-2 text-slate-500">{new Date(c.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-center">
                        <StatusBadge ok={c.email_opened} goodLabel="Yes" badLabel="No" reverse />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <StatusBadge ok={!c.link_clicked} goodLabel="No" badLabel="Yes" />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <StatusBadge ok={!c.form_submitted} goodLabel="No" badLabel="Yes" />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <StatusBadge ok={c.reported} goodLabel="Yes" badLabel="No" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-slate-50 rounded-lg p-3 text-center">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
  </div>
);

const StatusBadge = ({ ok, goodLabel, badLabel, reverse = false }) => {
  const isGood = reverse ? !ok : ok;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${
      isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {ok ? goodLabel : badLabel}
    </span>
  );
};

export default LeaderboardPage;
