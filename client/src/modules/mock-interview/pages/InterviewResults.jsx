import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getResults } from "../services/interviewService";
import InterviewResultsSkeleton from "../components/InterviewResultsSkeleton";
import { analyzeText } from "../utils/sentiment";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import {
  Trophy,
  Brain,
  MessageSquare,
  Target,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import "../styles/mock-interview.css";

const InterviewResults = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await getResults(sessionId);
        setResults(res.data);
      } catch (err) {
        setError("Failed to load results.");
        console.error("[InterviewResults] Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [sessionId]);

  const toggleCard = (idx) => {
    setExpandedCards((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  if (loading) {
    return (
      <div className="results-container">
        <InterviewResultsSkeleton />
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="results-container">
        <div className="session-error-state">
          <AlertTriangle size={48} />
          <p>{error || "No results found."}</p>
          <button
            className="btn-back"
            onClick={() => navigate("/mock-interview")}
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const overallScore = results.overallScore || 0;
  const circumference = 2 * Math.PI * 56;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  // Calculate per-category averages from answers
  const answers = results.answers || [];
  const avgTechnical = answers.length
    ? Math.round(
        answers.reduce((s, a) => s + (a.scores?.technical || 0), 0) /
          answers.length,
      )
    : 0;
  const avgCommunication = answers.length
    ? Math.round(
        answers.reduce((s, a) => s + (a.scores?.communication || 0), 0) /
          answers.length,
      )
    : 0;
  const avgRelevance = answers.length
    ? Math.round(
        answers.reduce((s, a) => s + (a.scores?.relevance || 0), 0) /
          answers.length,
      )
    : 0;

  let totalHesitations = 0;
  let totalConfidence = 0;
  let totalTone = 0;

  if (answers.length) {
    answers.forEach(a => {
      const analysis = analyzeText(a.transcript || "");
      totalHesitations += analysis.hesitationCount;
      totalConfidence += analysis.confidence;
      totalTone += analysis.tone;
    });
  }

  const avgConfidence = answers.length ? Math.round(totalConfidence / answers.length) : 0;
  const avgTone = answers.length ? Math.round(totalTone / answers.length) : 0;

  const radarData = [
    { subject: 'Technical', A: avgTechnical, fullMark: 100 },
    { subject: 'Communication', A: avgCommunication, fullMark: 100 },
    { subject: 'Relevance', A: avgRelevance, fullMark: 100 },
    { subject: 'Confidence', A: avgConfidence, fullMark: 100 },
    { subject: 'Tone', A: avgTone, fullMark: 100 },
  ];

  return (
    <div className="results-container">
      {/* Header */}
      <div className="results-header">
        <h1>Interview Results</h1>
        <div className="results-meta">
          <span className="results-badge badge-topic">
            {results.topic?.toUpperCase()}
          </span>
          <span className="results-badge badge-difficulty">
            {results.difficulty}
          </span>
          {results.duration && (
            <span className="results-badge badge-duration">
              <Clock size={12} style={{ display: "inline", marginRight: 4 }} />
              {results.duration}s
            </span>
          )}
        </div>
      </div>

      {/* Overall Score Ring */}
      <div className="overall-score-card">
        <div className="overall-ring">
          <svg width="140" height="140">
            <circle
              cx="70"
              cy="70"
              r="56"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="10"
            />
            <circle
              cx="70"
              cy="70"
              r="56"
              fill="none"
              stroke={getScoreColor(overallScore)}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="overall-ring-label">{overallScore}</div>
        </div>

        <div className="score-breakdown">
          <div className="score-item">
            <Brain size={20} style={{ color: "#818cf8" }} />
            <span className="score-item-value">{avgTechnical}%</span>
            <span className="score-item-label">Technical</span>
          </div>
          <div className="score-item">
            <MessageSquare size={20} style={{ color: "#818cf8" }} />
            <span className="score-item-value">{avgCommunication}%</span>
            <span className="score-item-label">Communication</span>
          </div>
          <div className="score-item">
            <Target size={20} style={{ color: "#818cf8" }} />
            <span className="score-item-value">{avgRelevance}%</span>
            <span className="score-item-label">Relevance</span>
          </div>
        </div>
      </div>

      {/* Soft Skills Report */}
      <div className="soft-skills-card">
        <h3>
          <Target size={16} style={{ color: "#10b981", marginRight: 8, display: "inline" }} />
          Soft Skills & Delivery
        </h3>
        <div className="soft-skills-content">
          <div className="radar-chart-container" style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Candidate" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="soft-skills-stats">
            <div className="stat-pill">
              <span className="stat-label">Avg Confidence</span>
              <span className="stat-val">{avgConfidence}%</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Avg Tone Positivity</span>
              <span className="stat-val">{avgTone}%</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Total Hesitations</span>
              <span className="stat-val">{totalHesitations}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weak Concepts */}
      {results.weakConcepts?.length > 0 && (
        <div className="weak-concepts-card">
          <h3>
            <AlertTriangle
              size={16}
              style={{ color: "#f59e0b", marginRight: 8, display: "inline" }}
            />
            Concepts to Review
          </h3>
          <div className="concept-badges">
            {results.weakConcepts.map((c, i) => (
              <span key={i} className="concept-badge missed">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-Question Breakdown */}
      {answers.map((a, idx) => (
        <div key={idx} className="answer-card">
          <div className="answer-card-header" onClick={() => toggleCard(idx)}>
            <span className="answer-card-q">
              Q{idx + 1}. {a.questionText}
            </span>
            <span
              className="answer-card-score"
              style={{ color: getScoreColor(a.scores?.technical || 0) }}
            >
              {a.scores?.technical || 0}%
            </span>
            {expandedCards[idx] ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </div>
          {expandedCards[idx] && (
            <div className="answer-card-body">
              <p>
                <strong>Your Answer:</strong>{" "}
                {a.transcript || "No answer submitted"}
              </p>
              <div className="answer-scores-row">
                <span className="answer-score-pill">
                  Tech: {a.scores?.technical || 0}%
                </span>
                <span className="answer-score-pill">
                  Comm: {a.scores?.communication || 0}%
                </span>
                <span className="answer-score-pill">
                  Rel: {a.scores?.relevance || 0}%
                </span>
              </div>
              {a.concepts && (
                <div className="concept-badges" style={{ marginTop: "0.5rem" }}>
                  {a.concepts.detected?.map((c, i) => (
                    <span key={`d-${i}`} className="concept-badge detected">
                      ✓ {c}
                    </span>
                  ))}
                  {a.concepts.missed?.map((c, i) => (
                    <span key={`m-${i}`} className="concept-badge missed">
                      ✗ {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Actions */}
      <div className="results-actions">
        <button
          className="btn-retake"
          onClick={() => navigate("/mock-interview")}
        >
          <RefreshCw size={16} /> New Interview
        </button>
        <button
          className="btn-history"
          onClick={() => navigate("/mock-interview/history")}
        >
          <ArrowLeft size={16} /> View History
        </button>
      </div>
    </div>
  );
};

export default InterviewResults;
