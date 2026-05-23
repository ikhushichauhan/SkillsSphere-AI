import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { submitAnswer, completeInterview } from "../services/interviewService";
import { apiRequest } from "../../../services/apiClient";
import InterviewSessionSkeleton from "../components/InterviewSessionSkeleton";
import ObserverPanel from "../components/ObserverPanel";
import RealtimeSentimentIndicator from "../components/RealtimeSentimentIndicator";
import { analyzeText, debounce } from "../utils/sentiment";
import {
  Send,
  CheckCircle,
  Clock,
  ChevronRight,
  Trophy,
  Loader2,
  AlertCircle,
  Target,
  MessageSquare,
  Brain,
} from "lucide-react";
import "../styles/mock-interview.css";

const TOKEN_KEY = "skillssphere.auth.token";

const InterviewSession = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastScores, setLastScores] = useState(null);
  const [showScores, setShowScores] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const debouncedAnalyze = useRef(
    debounce((text) => {
      setAnalysis(analyzeText(text));
    }, 500)
  ).current;

  // Socket & Multi-role state
  const [socket, setSocket] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [liveTyping, setLiveTyping] = useState("");
  const [socketStatus, setSocketStatus] = useState("connecting");

  const isObserver = user && session && user._id !== session.userId;

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const token =
          localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
        const res = await apiRequest(`/api/interviews/${sessionId}`, {
          method: "GET",
          token,
        });
        const data = res.data;
        setSession(data);

        // Find the first unanswered question
        const unansweredIdx = data.answers.findIndex(
          (a) => !a.transcript && !a.scores,
        );
        const idx = unansweredIdx >= 0 ? unansweredIdx : 0;
        setCurrentIndex(idx);
        setCurrentQuestion({
          questionText: data.answers[idx]?.questionText,
          questionId: data.answers[idx]?.questionId,
        });
        setIsLastQuestion(idx === data.answers.length - 1);
      } catch (err) {
        setError("Failed to load interview session.");
        console.error("[InterviewSession] Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  // Socket Connection
  useEffect(() => {
    if (!session || !user) return;
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    
    // In production, VITE_API_URL should be used. Using standard URL for now.
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const newSocket = io(socketUrl, { auth: { token } });

    newSocket.on("connect", () => {
      setSocketStatus("connected");
      newSocket.emit("join-interview", { sessionId });
    });

    newSocket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    newSocket.on("reconnect_attempt", () => {
      setSocketStatus("reconnecting");
    });

    newSocket.on("interview-participants", (pts) => {
      setParticipants(pts.filter(p => p.user.id !== user._id));
    });

    newSocket.on("participant-joined", (data) => {
      setParticipants(prev => [...prev.filter(p => p.socketId !== data.socketId), data]);
    });

    newSocket.on("participant-left", (data) => {
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
    });

    newSocket.on("interview-typing", ({ text }) => {
      setLiveTyping(text);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [session, user, sessionId]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await submitAnswer(sessionId, answer.trim());
      const data = res.data;

      setLastScores(data.scores);
      setShowScores(true);
      setAnswer("");

      if (data.isLastQuestion) {
        setIsLastQuestion(true);
      } else if (data.nextQuestion) {
        // Wait 3 seconds to show scores, then load next question
        setTimeout(() => {
          setCurrentQuestion(data.nextQuestion);
          setCurrentIndex(data.nextQuestion.index);
          setShowScores(false);
          setLastScores(null);
          if (textareaRef.current) textareaRef.current.focus();
        }, 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to submit answer.");
      console.error("[InterviewSession] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);

    try {
      await completeInterview(sessionId);
      navigate(`/mock-interview/${sessionId}/results`, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to complete interview.");
      console.error("[InterviewSession] Complete error:", err);
    } finally {
      setCompleting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey && !submitting) {
      handleSubmitAnswer();
    }
  };

  const handleAnswerChange = (e) => {
    setAnswer(e.target.value);
    debouncedAnalyze(e.target.value);
    if (socket && !isObserver) {
      socket.emit("interview-typing", { sessionId, text: e.target.value });
    }
  };

  const handleSendFeedback = (note) => {
    if (socket) {
      socket.emit("save-private-note", { sessionId, note });
    }
  };

  if (loading) {
    return <InterviewSessionSkeleton />;
  }

  if (error && !session) {
    return (
      <div className="session-container">
        <div className="session-error-state">
          <AlertCircle size={48} />
          <p>{error}</p>
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

  const totalQuestions = session?.totalQuestions || 0;

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden p-6">
      <div className="flex-1 max-w-4xl mx-auto flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        {/* Header Bar */}
        <div className="session-header">
        <div className="session-meta">
          <span className="session-topic">{session?.topic?.toUpperCase()}</span>
          <span className="session-difficulty">{session?.difficulty}</span>
        </div>

        <div className="session-progress">
          <div className="progress-text">
            Question {currentIndex + 1} of {totalQuestions}
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="session-timer">
          <Clock size={16} />
          {formatTime(elapsedTime)}
        </div>
        <div className="socket-status">
          <span className={`status-dot status-${socketStatus}`} />
          <span className="status-text">
            {socketStatus === "connected" && "Connected"}
            {socketStatus === "disconnected" && "Disconnected"}
            {socketStatus === "reconnecting" && "Reconnecting"}
            {socketStatus === "connecting" && "Connecting..."}
          </span>
        </div>
      </div>

      {/* Question Area */}
      <div className="question-area">
        <div className="question-number">Q{currentIndex + 1}</div>
        <h2 className="question-text">
          {currentQuestion?.questionText || "Loading question..."}
        </h2>
      </div>

      {!showScores && !isObserver && (
        <RealtimeSentimentIndicator analysis={analysis} />
      )}

      {/* Score Flash */}
      {showScores && lastScores && (
        <div className="score-flash">
          <div className="score-flash-item">
            <Brain size={18} />
            <span>Technical</span>
            <strong>{lastScores.technical}%</strong>
          </div>
          <div className="score-flash-item">
            <MessageSquare size={18} />
            <span>Communication</span>
            <strong>{lastScores.communication}%</strong>
          </div>
          <div className="score-flash-item">
            <Target size={18} />
            <span>Relevance</span>
            <strong>{lastScores.relevance}%</strong>
          </div>
        </div>
      )}

      {/* Answer Input / Observer View */}
      {!showScores && (
        <div className="answer-area">
          {isObserver ? (
            <div className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-6 h-48 overflow-y-auto">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500 mb-2 block flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Candidate Typing Live...
              </span>
              <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                {liveTyping || <span className="text-slate-600 italic">Waiting for candidate to start typing...</span>}
              </p>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              className="answer-textarea"
              placeholder="Type your answer here... (Ctrl+Enter to submit)"
              value={answer}
              onChange={handleAnswerChange}
              onKeyDown={handleKeyDown}
              disabled={submitting}
              rows={6}
            />
          )}
          
          <div className="answer-footer">
            <span className="word-count">
              {isObserver ? liveTyping.trim().split(/\s+/).filter(Boolean).length : answer.trim().split(/\s+/).filter(Boolean).length} words
            </span>

            {error && (
              <span className="inline-error">
                <AlertCircle size={14} /> {error}
              </span>
            )}

            <button
              className="btn-submit"
              onClick={handleSubmitAnswer}
              disabled={!answer.trim() || submitting || isObserver}
              style={{ display: isObserver ? 'none' : 'flex' }}
            >
              {submitting ? (
                <>
                  <Loader2 className="spin-icon" size={16} /> Evaluating...
                </>
              ) : (
                <>
                  <Send size={16} /> Submit Answer
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Complete / Next */}
      {showScores && isLastQuestion && (
        <div className="complete-section">
          <p className="complete-message">
            <CheckCircle size={20} /> All questions answered!
          </p>
          <button
            className="btn-complete"
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? (
              <>
                <Loader2 className="spin-icon" size={16} /> Calculating
                Results...
              </>
            ) : (
              <>
                <Trophy size={16} /> View Results
              </>
            )}
          </button>
        </div>
      )}

      {showScores && !isLastQuestion && (
        <div className="next-question-hint">
          <Loader2 className="spin-icon" size={16} />
          Loading next question...
        </div>
      )}
      </div>

      {/* Observer Panel (Only visible if observer) */}
      {isObserver && (
        <ObserverPanel 
          participants={participants} 
          onSendFeedback={handleSendFeedback} 
          isConductor={true} 
        />
      )}
    </div>
  );
};

export default InterviewSession;
