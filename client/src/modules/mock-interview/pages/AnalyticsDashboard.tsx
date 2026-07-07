import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { Activity, Brain, Target, ArrowLeft, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { getInterviewAnalytics } from "../services/interviewService";
import Navbar from "../../../shared/components/Navbar";
import Footer from "../../../shared/components/Footer";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import logger from "../../../utils/logger";

const AnalyticsDashboard = () => {
  useDocumentTitle("Interview Analytics");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await getInterviewAnalytics();
        setData(res.data);
      } catch (err) {
        logger.error("Failed to fetch interview analytics", err);
        setError("Could not load analytics. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] flex flex-col pt-20">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] flex flex-col pt-20">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center text-text-muted gap-4">
          <AlertTriangle size={48} className="text-red-500" />
          <p>{error || "No data available."}</p>
        </div>
      </div>
    );
  }

  const { overallScoreProgress, strengthAreas, weakConcepts, history } = data;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] text-gray-900 dark:text-text-main font-sans pt-20 flex flex-col overflow-hidden relative">
      <Navbar />
      <main className="flex-grow max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 animate-fade-in relative z-10">
        
        <div className="py-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Interview</span> Analytics
          </h1>
          <p className="text-text-muted max-w-xl mx-auto">Track your cognitive evaluation progress, strengths, and targeted areas for improvement over time.</p>
        </div>

        {overallScoreProgress && overallScoreProgress.length > 0 ? (
          <div className="space-y-6">
            
            {/* Trend Chart */}
            <div className="bg-white dark:bg-surface border border-border shadow-sm rounded-3xl p-6 md:p-8">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Activity className="text-indigo-500" /> Performance Trends
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={overallScoreProgress} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="overall" name="Overall Score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="technical" name="Technical" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="communication" name="Communication" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Strengths & Weaknesses Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-3xl p-6 md:p-8">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-emerald-700 dark:text-emerald-400">
                  <Brain size={20} /> Top Strength Areas
                </h2>
                {strengthAreas && strengthAreas.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={strengthAreas} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="concept" type="category" width={100} tick={{ fill: 'currentColor', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="count" fill="#34d399" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-10">Not enough data to determine strengths yet.</p>
                )}
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-3xl p-6 md:p-8">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-amber-700 dark:text-amber-400">
                  <Target size={20} /> Frequently Missed Concepts
                </h2>
                {weakConcepts && weakConcepts.length > 0 ? (
                   <div className="h-[250px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={weakConcepts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                       <XAxis type="number" hide />
                       <YAxis dataKey="concept" type="category" width={100} tick={{ fill: 'currentColor', fontSize: 12 }} axisLine={false} tickLine={false} />
                       <Tooltip cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                       <Bar dataKey="count" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={20} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-10">No frequently missed concepts found! Great job.</p>
                )}
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white dark:bg-surface border border-border shadow-sm rounded-3xl p-6 md:p-8 overflow-hidden">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                 Recent Sessions
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-sm font-bold text-text-muted uppercase tracking-wider">
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 px-4">Topic</th>
                      <th className="pb-3 px-4">Difficulty</th>
                      <th className="pb-3 px-4">Score</th>
                      <th className="pb-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {history?.map((session: any) => (
                      <tr key={session._id} className="border-b border-border/50 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="py-4 px-4 text-text-muted">{new Date(session.date).toLocaleDateString()}</td>
                        <td className="py-4 px-4 font-semibold uppercase">{session.topic}</td>
                        <td className="py-4 px-4 capitalize">{session.difficulty}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded font-bold text-xs ${session.overallScore >= 75 ? 'bg-emerald-500/10 text-emerald-500' : session.overallScore >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                            {session.overallScore}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link to={`/mock-interview/results/${session._id}`} className="inline-flex items-center gap-1 text-indigo-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            View Report <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-3xl border border-border">
            <h3 className="text-xl font-bold mb-2">No data yet</h3>
            <p className="text-text-muted mb-6">Complete a mock interview to see your analytics dashboard!</p>
            <Link to="/mock-interview" className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold">Start Interview</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AnalyticsDashboard;
