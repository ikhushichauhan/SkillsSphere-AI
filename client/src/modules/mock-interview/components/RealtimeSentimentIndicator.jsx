import React from 'react';
import { Activity, Brain, AlertCircle } from 'lucide-react';
import '../styles/mock-interview.css'; // Make sure styles are updated here

const RealtimeSentimentIndicator = ({ analysis }) => {
  if (!analysis) return null;

  const { confidence, tone, hesitationCount } = analysis;

  const getConfidenceColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getToneLabel = (score) => {
    if (score >= 60) return 'Positive';
    if (score >= 40) return 'Neutral';
    return 'Negative';
  };

  const getToneColor = (score) => {
    if (score >= 60) return '#10b981';
    if (score >= 40) return '#94a3b8';
    return '#ef4444';
  };

  return (
    <div className="realtime-sentiment-panel">
      <div className="rs-header">
        <Activity size={16} className="rs-icon animate-pulse" />
        <span>Live Analysis</span>
      </div>

      <div className="rs-metrics-grid">
        <div className="rs-metric-card">
          <div className="rs-metric-header">
            <Brain size={14} />
            <span>Confidence</span>
          </div>
          <div className="rs-metric-value" style={{ color: getConfidenceColor(confidence) }}>
            {confidence}%
          </div>
          <div className="rs-progress-bg">
            <div 
              className="rs-progress-fill" 
              style={{ 
                width: `${confidence}%`, 
                backgroundColor: getConfidenceColor(confidence),
                transition: 'width 0.5s ease-out, background-color 0.5s ease'
              }}
            />
          </div>
        </div>

        <div className="rs-metric-card">
          <div className="rs-metric-header">
            <Activity size={14} />
            <span>Tone</span>
          </div>
          <div className="rs-metric-value" style={{ color: getToneColor(tone) }}>
            {getToneLabel(tone)}
          </div>
          <div className="rs-progress-bg">
            <div 
              className="rs-progress-fill" 
              style={{ 
                width: `${tone}%`, 
                backgroundColor: getToneColor(tone),
                transition: 'width 0.5s ease-out, background-color 0.5s ease'
              }}
            />
          </div>
        </div>
        
        <div className="rs-metric-card">
          <div className="rs-metric-header">
            <AlertCircle size={14} />
            <span>Hesitations</span>
          </div>
          <div className="rs-metric-value" style={{ color: hesitationCount > 5 ? '#ef4444' : '#94a3b8' }}>
            {hesitationCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeSentimentIndicator;
