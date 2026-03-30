import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Target, ChevronRight, BarChart, ShieldAlert, MailWarning } from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-cyan-500/30 overflow-hidden font-sans">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-cyan-600" />
            <span className="text-xl font-bold tracking-tight text-slate-800">AttackSimulator</span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard" className="text-sm font-semibold text-cyan-700 bg-cyan-50 px-5 py-2 rounded-full hover:bg-cyan-100 transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
                <Link to="/register" className="text-sm font-semibold bg-cyan-600 text-white px-5 py-2 rounded-full hover:bg-cyan-700 transition-colors shadow-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        
        {/* Modern Light Theme Hero Section */}
        <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 flex flex-col items-center text-center">
          {/* Ambient Background Accents */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-100/50 rounded-full blur-[100px] -z-10 pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-purple-100/50 rounded-full blur-[100px] -z-10 pointer-events-none" />

          <motion.div initial="initial" animate="animate" variants={staggerChildren} className="max-w-4xl mx-auto space-y-6 relative z-10">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-semibold text-cyan-800 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Cybersecurity Simulation & Risk Assessment Platform
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Evaluate readiness. <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600">
                Simulate real-world threats.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mt-6">
              A structured tool to safely simulate phishing, credential theft, and social engineering attacks. 
              Identify vulnerabilities, train your workforce, and measure organizational risk—defensively and ethically.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              {user ? (
                <Link to="/dashboard" className="h-14 px-8 rounded-full bg-slate-900 text-white font-semibold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md">
                  Enter Dashboard <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link to="/register" className="h-14 px-8 rounded-full bg-cyan-600 text-white font-semibold text-lg flex items-center gap-2 hover:bg-cyan-700 transition-all shadow-md hover:shadow-lg">
                  Launch Your First Drill <ChevronRight className="w-5 h-5" />
                </Link>
              )}
            </motion.div>
          </motion.div>

          {/* Clean Dashboard Preview Graphic */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
            className="mt-20 w-full max-w-5xl mx-auto relative rounded-2xl border border-slate-200 bg-white shadow-xl p-2 md:p-4 overflow-hidden"
          >
            <div className="bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
              {/* Fake Window Header */}
              <div className="h-10 border-b border-slate-200 flex items-center px-4 gap-2 bg-white rounded-t-xl">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-xs font-medium text-slate-400">Department Risk Analytics</span>
              </div>
              {/* Fake Dashboard Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50">
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center text-center">
                  <p className="text-slate-500 text-sm font-medium mb-1">Simulated Emails Sent</p>
                  <p className="text-4xl font-bold text-slate-800">2,450</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center text-center">
                  <p className="text-slate-500 text-sm font-medium mb-1">Overall Phish Click Rate</p>
                  <p className="text-4xl font-bold text-amber-500">12.4%</p>
                  <p className="text-xs font-semibold text-green-600 mt-2">↓ 5% from last month</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center text-center">
                  <p className="text-slate-500 text-sm font-medium mb-1">Avg Reporting Time</p>
                  <p className="text-4xl font-bold text-cyan-600">4m 12s</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Actionable Insights Section aligned with Problem Statement */}
        <section className="bg-white border-y border-slate-200 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">Empower your human firewall</h2>
              <p className="text-slate-600 text-lg">
                Many organizations lack structured tools to safely simulate attacks. We provide a secure, ethical platform to generate analytics that highlight vulnerability patterns across your departments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <MailWarning className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Phishing Campaigns</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Design and run controlled email simulations leveraging AI. Test employee recognition of deceptive links and credential harvesting landing pages.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mb-4">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Targeted User Groups</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Upload and group users by department or role. Schedule specific, highly-contextualized simulation campaigns designed for their unique threat model.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <BarChart className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Risk Dashboards</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Monitor participation and behavioral responses. Generate detailed analytics showing risk levels and vulnerability trends across your entire organization.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Incident Drills & Training</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Strengthen incident preparedness through interactive awareness quizzes and training modules triggered immediately after a failed simulation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA suited for problem statement */}
        <section className="max-w-5xl mx-auto px-6 py-24">
          <div className="relative rounded-3xl bg-slate-900 overflow-hidden text-center p-12 lg:p-16">
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
              Ready to evaluate your organization's preparedness?
            </h2>
            <p className="text-slate-400 mb-10 max-w-xl mx-auto text-lg">
              Operate strictly in a defensive and ethical manner. No real credentials or malicious payloads are ever stored.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-cyan-500 text-slate-900 font-bold text-lg hover:bg-cyan-400 transition-colors shadow-lg">
              Start Simulating Attacks <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Shield className="w-5 h-5 text-slate-400" />
            <span className="text-lg font-bold text-slate-700">AttackSimulator</span>
          </div>
          <p className="text-sm text-slate-500">
            Designed for cybersecurity teams, IT admins, and training coordinators.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
