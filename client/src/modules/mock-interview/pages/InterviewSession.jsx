import React, { useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";

// Hooks
import { useInterviewState } from "../hooks/useInterviewState";
import { useInterviewSocket } from "../hooks/useInterviewSocket";
import { useInterviewAudio } from "../hooks/useInterviewAudio";

// Presentational Components
import { SessionSidebar } from "../components/SessionSidebar";
import { AnswerInputSection } from "../components/AnswerInputSection";
import InterviewSessionSkeleton from "../components/InterviewSessionSkeleton";
import ObserverPanel from "../components/ObserverPanel";
import RealtimeSentimentIndicator from "../components/RealtimeSentimentIndicator";
import Navbar from "../../../shared/components/Navbar";
import Footer from "../../../shared/components/Footer";

// Icons & Utilities
import {
  CheckCircle,
  Trophy,
  Loader2,
  AlertCircle,
  Target,
  MessageSquare,
  Brain
} from "lucide-react";

const InterviewSession = () => {
  useDocumentTitle("Interview Session");
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  // 1. Manage State, Timers, Persistence, and API operations
  const state = useInterviewState(sessionId, false);
  const isObserver = state.session && user && user._id !== state.session.userId;

  // 2. Manage Socket.IO Network Connectivity
  const socketState = useInterviewSocket({
    sessionId,
    user,
    session: state.session,
    isObserver,
    elapsedTime: state.elapsedTime,
    uploadStatus: state.uploadStatus,
    setAnswer: state.setAnswer,
    setError: state.setError,
    setSubmitting: state.setSubmitting,
    setUploadStatus: state.setUploadStatus,
    setRecoveryMessage: state.setRecoveryMessage,
    handleEvaluationResult: state.handleEvaluationResult,
    persistBackup: state.persistBackup,
    textareaRef,
    setFailedAction: state.setFailedAction,
  });

  // 3. Manage Microphone voice inputs (MediaRecorder API)
  const audioState = useInterviewAudio({
    sessionId,
    socket: socketState.socket,
    socketStatus: socketState.socketStatus,
    setUploadStatus: state.setUploadStatus,
    setError: state.setError,
    setMediaWarning: state.setMediaWarning,
    persistBackup: state.persistBackup,
    setRecoveryMessage: state.setRecoveryMessage,
    setFailedAction: state.setFailedAction,
  });

  // Cleanup audio tracks on unmount
  useEffect(() => {
    return () => {
      audioState.cleanupAudio();
    };
  }, [audioState]);

  const handleManualRetry = () => {
    if (state.failedAction === "submit") {
      handleSubmit();
    } else if (state.failedAction === "complete") {
      state.completeInterviewApi();
    } else if (state.failedAction === "media") {
      audioState.startRecording();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey && !state.submitting) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!state.answer.trim() || state.submitting || state.requestStatus) return;
    const isSocketSubmitted = socketState.submitSocketAnswer(state.answer.trim());
    
    if (isSocketSubmitted) {
      state.setSubmitting(true);
      state.persistBackup({
        answer: state.answer.trim(),
        uploadStatus: "submitting",
        messages: [{ role: "candidate", content: state.answer.trim(), timestamp: Date.now() }],
      });
    } else {
      try {
        await state.submitAnswerApi(textareaRef);
      } catch (err) {
        state.setFailedAction("submit");
      }
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] pt-24">
        <Navbar />
        <InterviewSessionSkeleton />
      </div>
    );
  }

  if (state.error && !state.session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col pt-24">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-10 rounded-3xl flex flex-col items-center max-w-md text-center shadow-xl">
            <AlertCircle size={56} className="text-red-500 mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Session Error</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">{state.error}</p>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold border-none cursor-pointer transition-all shadow-lg hover:shadow-blue-500/25"
              onClick={() => navigate("/mock-interview")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalQuestions = state.session?.totalQuestions || state.session?.answers?.length || 0;
  const progressPercent = totalQuestions
    ? ((state.currentIndex + 1) / totalQuestions) * 100
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col font-sans transition-colors duration-300 pt-24">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mt-24 sm:mt-28 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT COLUMN: Telemetry & Status */}
        <SessionSidebar
          session={state.session}
          elapsedTime={state.elapsedTime}
          socketStatus={socketState.socketStatus}
          recoveryMessage={state.recoveryMessage}
          requestStatus={state.requestStatus}
          mediaWarning={state.mediaWarning}
          uploadStatus={state.uploadStatus}
          currentIndex={state.currentIndex}
          totalQuestions={totalQuestions}
          progressPercent={progressPercent}
          onExit={() => {
            if (window.confirm("Are you sure you want to exit? Your progress may be lost.")) {
              navigate("/dashboard");
            }
          }}
        />
        
        {/* RIGHT COLUMN: Interaction Zone */}
        <div className="flex-1 w-full flex flex-col gap-6">
          
          {/* Question Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col">
            <div className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide uppercase mb-6">
              Question {state.currentIndex + 1}
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold leading-relaxed text-slate-900 dark:text-white tracking-tight">
              {state.currentQuestion?.questionText || "Loading question..."}
            </h2>
          </div>

          {!state.showScores && !isObserver && (
            <div className="w-full">
              <RealtimeSentimentIndicator analysis={state.analysis} />
            </div>
          )}

          {/* Score Flash */}
          {state.showScores && state.lastScores && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-[fadeInUp_0.4s_ease-out]">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:border-blue-500/30 transition-colors">
                <Brain size={24} className="text-blue-500 mb-3" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Technical</span>
                <strong className="text-3xl font-black text-slate-900 dark:text-white">{state.lastScores.technical}%</strong>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:border-emerald-500/30 transition-colors">
                <MessageSquare size={24} className="text-emerald-500 mb-3" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Communication</span>
                <strong className="text-3xl font-black text-slate-900 dark:text-white">{state.lastScores.communication}%</strong>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:border-amber-500/30 transition-colors">
                <Target size={24} className="text-amber-500 mb-3" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Relevance</span>
                <strong className="text-3xl font-black text-slate-900 dark:text-white">{state.lastScores.relevance}%</strong>
              </div>
            </div>
          )}

          {/* Answer Input */}
          {!state.showScores && (
            <AnswerInputSection
              isObserver={isObserver}
              textareaRef={textareaRef}
              liveTyping={socketState.liveTyping}
              answer={state.answer}
              onChange={(e) => state.handleAnswerChange(e, socketState.socket)}
              onKeyDown={handleKeyDown}
              submitting={state.submitting}
              error={state.error}
              failedAction={state.failedAction}
              onRetry={handleManualRetry}
              isRecording={audioState.isRecording}
              startRecording={audioState.startRecording}
              stopRecording={audioState.stopRecording}
              onSubmit={handleSubmit}
              requestStatus={state.requestStatus}
            />
          )}

          {/* Completion State */}
          {state.showScores && state.isLastQuestion && (
            <div className="mt-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-3xl p-8 flex flex-col items-center gap-6 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Interview Complete!</h3>
                <p className="text-slate-600 dark:text-slate-400">All questions have been evaluated successfully.</p>
              </div>
              <button
                className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 border-none py-3.5 px-8 rounded-xl font-bold cursor-pointer flex justify-center items-center gap-2 transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
                onClick={state.completeInterviewApi}
                disabled={state.completing || Boolean(state.requestStatus)}
              >
                {state.completing ? (
                  <><Loader2 className="animate-spin" size={18} /> Saving Results...</>
                ) : (
                  <><Trophy size={18} /> View Detailed Analytics</>
                )}
              </button>
              {state.error && (
                <span className="text-sm font-semibold text-red-500 flex items-center justify-center gap-1.5 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg mt-2">
                  <AlertCircle size={16} /> {state.error}
                  {state.failedAction && (
                    <button
                      type="button"
                      onClick={handleManualRetry}
                      disabled={state.submitting || state.completing || Boolean(state.requestStatus)}
                      className="ml-2 underline underline-offset-2 disabled:opacity-50 bg-transparent border-none cursor-pointer text-red-500 font-bold"
                    >
                      Retry
                    </button>
                  )}
                </span>
              )}
            </div>
          )}

          {state.showScores && !state.isLastQuestion && (
            <div className="mt-4 p-4 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
              <Loader2 className="animate-spin text-blue-500" size={18} />
              Loading next question...
            </div>
          )}
        </div>
      </main>

      {/* Observer Panel */}
      {isObserver && (
        <ObserverPanel 
          participants={socketState.participants} 
          onSendFeedback={socketState.handleSendFeedback} 
          isConductor={true} 
        />
      )}
      <Footer />
    </div>
  );
};

export default InterviewSession;
