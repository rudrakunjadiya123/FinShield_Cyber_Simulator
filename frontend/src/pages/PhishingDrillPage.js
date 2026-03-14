import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const PhishingDrillPage = () => {
  const { token } = useParams();
  const [, setInfo] = useState(null);
  const [step, setStep] = useState('warning'); // warning, form, result, reported
  const [explanation, setExplanation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        // Record link click when page loads (fallback tracking)
        try { await api.get(`/track/click/${token}`); } catch (e) {}

        const res = await api.get(`/track/info/${token}`);
        setInfo(res.data);
        if (res.data.already_reported) setStep('reported');
        else if (res.data.already_submitted) setStep('result');
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchInfo();
  }, [token]);

  const handleReport = async () => {
    setSubmitting(true);
    try {
      await api.post(`/track/report/${token}`);
      setStep('reported');
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleIgnore = () => {
    setStep('form');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/track/submit/${token}`);
      setExplanation(res.data.explanation || []);
      setStep('result');
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  // Warning Dialog
  if (step === 'warning') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#9888;</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Security Alert</h1>
          <p className="text-slate-600 mb-6">
            This email may be suspicious. It may be a phishing attempt designed to steal your information.
            What would you like to do?
          </p>
          <div className="space-y-3">
            <button
              onClick={handleReport}
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Report to IT Department
            </button>
            <button
              onClick={handleIgnore}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 rounded-lg transition-colors"
            >
              Ignore & Continue
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            If you suspect this email is malicious, reporting it helps protect the organization.
          </p>
        </div>
      </div>
    );
  }

  // Reported successfully
  if (step === 'reported') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 via-green-700 to-emerald-900 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#10003;</span>
          </div>
          <h1 className="text-xl font-bold text-green-700 mb-2">Excellent Work!</h1>
          <p className="text-slate-600 mb-4">
            You correctly identified this as a suspicious email and reported it to IT.
            This was a cybersecurity awareness drill conducted by FinShield.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-semibold">+10 Points Earned!</p>
            <p className="text-sm text-green-600">Your alertness helps keep the organization safe.</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-sm text-slate-700 mb-2">Tips for spotting phishing emails:</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>&#8226; Check the sender's email domain carefully</li>
              <li>&#8226; Be wary of urgent or threatening language</li>
              <li>&#8226; Hover over links before clicking</li>
              <li>&#8226; Never enter credentials from email links</li>
              <li>&#8226; When in doubt, contact IT directly</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Fake Form (user chose to ignore warning)
  if (step === 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
          <h1 className="text-xl font-bold text-slate-800 mb-1">Account Verification</h1>
          <p className="text-sm text-slate-500 mb-6">Please verify your identity to continue.</p>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="your.email@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="Enter your password"
              />
              <p className="text-xs text-slate-400 mt-1">This is a simulation. No data will be stored.</p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {submitting ? 'Processing...' : 'Verify'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Result - drill revealed with XAI
  if (step === 'result') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-slate-800 to-slate-900 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">&#128274;</span>
            </div>
            <h1 className="text-xl font-bold text-red-600 mb-2">This Was a Cybersecurity Awareness Drill</h1>
            <p className="text-slate-600">
              You submitted information to a simulated phishing page. Don't worry - <strong>no data was collected or stored</strong>.
              This exercise was designed to help you recognize phishing attacks.
            </p>
          </div>

          {/* XAI Explanation */}
          {explanation.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-slate-800 mb-3">What you should have noticed:</h2>
              <div className="space-y-3">
                {explanation.map((e, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-4 border-l-4 border-red-400">
                    <h3 className="font-semibold text-sm text-red-700">{e.indicator}</h3>
                    <p className="text-sm text-slate-600 mt-1">{e.description}</p>
                    <p className="text-sm text-green-700 mt-1 font-medium">Tip: {e.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-yellow-800 mb-2">How to protect yourself:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>&#8226; Always verify the sender's email address</li>
              <li>&#8226; Never enter passwords from email links</li>
              <li>&#8226; Report suspicious emails to IT immediately</li>
              <li>&#8226; Look for urgency tactics and unusual requests</li>
              <li>&#8226; When unsure, contact the sender through official channels</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PhishingDrillPage;
