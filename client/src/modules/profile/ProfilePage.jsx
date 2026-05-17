import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Shield, Calendar, Clock, Pencil, X, Check,
  ChevronLeft, BadgeCheck, AlertCircle, Trash2, LogOut,
  Info, Lock, Sparkles, Activity, Camera, ImageOff, Upload,
  MapPin, Star, MessageCircle, Phone,
} from "lucide-react";
import Input from "../../shared/components/Input";
import Button from "../../shared/components/Button";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateUserProfile, logout } from "../../features/auth/authSlice";
import { updateProfile, deleteProfile, uploadAvatar, removeAvatar } from "./services/profileService";
import LoadingState from "../../shared/components/LoadingState";
import { getProtectedAssetUrl } from "../../utils/protectedAssetUrl";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  student:   { label: "Student",   avatar: "from-indigo-500 to-blue-600",   glow: "rgba(99,102,241,0.4)",   icon: "🎓", banner: "from-indigo-400 via-blue-500 to-purple-600" },
  tutor:     { label: "Tutor",     avatar: "from-emerald-500 to-teal-600",  glow: "rgba(16,185,129,0.4)",   icon: "🧑‍🏫", banner: "from-emerald-400 via-teal-500 to-cyan-600" },
  recruiter: { label: "Recruiter", avatar: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.4)",   icon: "💼", banner: "from-violet-400 via-purple-500 to-pink-600" },
};

const TABS = [
  { id: "info",     label: "Profile Info", icon: <User size={15} /> },
  { id: "account",  label: "Account",      icon: <Info size={15} /> },
  { id: "security", label: "Security",     icon: <Lock size={15} /> },
];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function timeAgo(iso) {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
function getInitials(name = "") {
  return name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal = ({ onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 mx-auto mb-4">
        <Trash2 size={22} className="text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-center text-slate-800 dark:text-white mb-2">Delete Account</h3>
      <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
        This will permanently delete your account. This action <strong>cannot be undone</strong>.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button variant="danger" fullWidth onClick={onConfirm} loading={loading}>Yes, Delete</Button>
      </div>
    </div>
  </div>
);

// ─── Avatar Editor ────────────────────────────────────────────────────────────

const AvatarEditor = ({ user, roleConfig, onUpload, onRemove, uploading, isEditing, token }) => {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    setPendingFile(file);
    setJustSaved(false);
  };

  const handleSavePhoto = () => {
    if (!pendingFile) return;
    onUpload(pendingFile);
    setPendingFile(null);
    setPreview(null);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setPendingFile(null);
  };

  const handleRemove = () => {
    setPreview(null);
    setPendingFile(null);
    setJustSaved(false);
    onRemove();
  };

  const displayPic = preview || getProtectedAssetUrl(user.profilePic, token);
  const initials = getInitials(user.name || "");
  const hasPendingChange = Boolean(pendingFile);

  // What to show below the avatar:
  // 1. hasPendingChange  → Save / Cancel
  // 2. uploading         → spinner text
  // 3. justSaved         → green success tick
  // 4. user.profilePic   → Change Photo / Remove
  // 5. no photo          → Upload Photo + hint

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${roleConfig.avatar} flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden select-none`}
          style={{ boxShadow: `0 4px 24px ${roleConfig.glow}` }}>
          {displayPic ? <img src={displayPic} alt={user.name} className="w-full h-full object-cover" /> : getInitials(user.name || "")}
        </div>
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {isEditing && !uploading && !hasPending && !justSaved && (
          <div onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer">
            <Camera size={18} className="text-white" />
            <span className="text-white text-[10px] font-semibold">{user.profilePic ? "Change" : "Upload"}</span>
          </div>
        )}
        {isEditing && user.profilePic && !hasPending && !uploading && !justSaved && (
          <button onClick={() => { setPreview(null); setPendingFile(null); onRemove(); }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md z-10">
            <X size={11} />
          </button>
        )}
      </div>
      {isEditing && hasPending && (
        <div className="flex gap-2 mt-1">
          <button onClick={handleSavePhoto} disabled={uploading}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50">
            <Check size={12} /> Save
          </button>
          <button onClick={() => { setPreview(null); setPendingFile(null); }} disabled={uploading}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
            <X size={12} /> Cancel
          </button>
        </div>
      )}
      {isEditing && !hasPending && !uploading && justSaved && (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <BadgeCheck size={13} /> Saved!
        </span>
      )}
      {isEditing && !hasPending && !uploading && !justSaved && !user.profilePic && (
        <button onClick={() => fileRef.current?.click()}
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 mt-1">
          <Upload size={11} /> Upload photo
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
        onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }} />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || "" });
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const roleConfig = ROLE_CONFIG[user?.role] ?? ROLE_CONFIG.student;

  const handleAvatarUpload = async (file) => {
    setAvatarUploading(true);
    setAvatarError("");
    const blobUrl = URL.createObjectURL(file);
    dispatch(updateUserProfile({ ...user, profilePic: blobUrl }));
    try {
      const response = await uploadAvatar(file, token);
      dispatch(updateUserProfile(response.user));
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      dispatch(updateUserProfile({ ...user, profilePic: user.profilePic ?? null }));
      URL.revokeObjectURL(blobUrl);
      setAvatarError(err.message || "Failed to upload photo");
    } finally { setAvatarUploading(false); }
  };

  const handleAvatarRemove = async () => {
    setAvatarUploading(true);
    try { const r = await removeAvatar(token); dispatch(updateUserProfile(r.user)); }
    catch (err) { setAvatarError(err.message || "Failed to remove photo"); }
    finally { setAvatarUploading(false); }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    const trimmed = formData.name.trim();
    if (!trimmed || trimmed.length < 2) { setErrors({ name: "Name must be at least 2 characters" }); return; }
    setIsSaving(true);
    try {
      setApiError("");
      const response = await updateProfile({ name: trimmed }, token);
      dispatch(updateUserProfile(response.user));
      setSaveSuccess(true);
      setIsEditing(false);
      setErrors({});
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) { setApiError(err.message || "Failed to update profile"); }
    finally { setIsSaving(false); }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try { await deleteProfile(token); dispatch(logout()); navigate("/login"); }
    catch (err) { alert(err.message || "Failed to delete account"); setIsDeleting(false); setShowDeleteModal(false); }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <LoadingState message="Loading profile..." />
    </div>
  );

  const isVerified = user.isVerified ?? user.isEmailVerified;
  const daysSinceJoined = user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000) : 0;

  const verificationBadge = isVerified
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"><BadgeCheck size={11} /> Verified</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30"><AlertCircle size={11} /> Not Verified</span>;

  return (
    <div className="min-h-screen transition-colors duration-300 relative bg-gradient-to-br from-[#f0eeff] via-[#f7f9fc] to-[#edfdf5] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >

      {/* Content wrapper */}
      <div className="relative" style={{ zIndex: 2 }}>

      {/* ── Cover Banner ── */}
      <div className="relative w-full h-52 sm:h-44 overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))`, backgroundSize: '200% 200%', animation: 'ctaBoxShift 12s ease infinite' }}
      >
        <div className={`absolute inset-0 bg-gradient-to-r ${roleConfig.banner} opacity-90`} />
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full bg-white/5" />

        {/* ── Glassy animated bubbles inside banner ── */}
        <div className="absolute w-24 h-24 rounded-full"
          style={{
            top: '10%', left: '8%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))',
            border: '1.5px solid rgba(255,255,255,0.30)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.40), 0 4px 16px rgba(0,0,0,0.10)',
            backdropFilter: 'blur(8px)',
            animation: 'profileBubble1 10s ease-in-out infinite alternate',
          }}
        />
        <div className="absolute w-16 h-16 rounded-full"
          style={{
            bottom: '15%', left: '30%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.06))',
            border: '1.5px solid rgba(255,255,255,0.25)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 12px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(6px)',
            animation: 'profileBubble2 14s ease-in-out infinite alternate',
          }}
        />
        <div className="absolute w-20 h-20 rounded-full"
          style={{
            top: '20%', right: '25%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.07))',
            border: '1.5px solid rgba(255,255,255,0.28)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.38), 0 4px 14px rgba(0,0,0,0.09)',
            backdropFilter: 'blur(7px)',
            animation: 'profileBubble3 18s ease-in-out infinite alternate',
          }}
        />
        <div className="absolute top-4 left-1/2 w-20 h-20 rounded-full bg-white/8" />
        {/* Top nav */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <ChevronLeft size={15} /> Back
          </Link>
          <button onClick={() => { dispatch(logout()); navigate("/login"); }}
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

        {/* ── Hero card ── */}
        <Card className="mb-5 overflow-hidden">
          {/* Gradient banner */}
          <div className={`h-24 bg-gradient-to-r ${roleConfig.avatar} opacity-80 dark:opacity-60`} />

          <div className="px-6 pb-6">
            {/* Avatar + info — centered layout */}
            <div className="flex flex-col items-center text-center -mt-14 mb-4">

              {/* Avatar Editor */}
              <AvatarEditor
                user={user}
                roleConfig={roleConfig}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
                uploading={avatarUploading}
                isEditing={isEditing}
                token={token}
              />

              {avatarError && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">{avatarError}</p>
              )}

              {/* Name + email */}
              <div className="mt-3">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white font-heading leading-tight">
                  {user.name}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
                  ${user.role === "student" ? "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-brand-600/20 dark:text-brand-300 dark:border-brand-500/30"
                  : user.role === "tutor" ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                  : "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30"}`}>
                  {roleConfig.icon} {roleConfig.label}
                </span>
                {verificationBadge}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                  <Sparkles size={11} /> Member since {formatDate(user.createdAt)}
                </span>
              </div>

            {/* Name + role + meta — starts after banner ends (~mt-16 offset) */}
            <div className="flex-1 min-w-0 mt-20 pb-1">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{user.name}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin size={12} /> Platform Member
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border
                      bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-brand-600/20 dark:text-brand-300 dark:border-brand-500/30">
                      {roleConfig.icon} {roleConfig.label}
                    </span>
                    {verificationBadge}
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <Sparkles size={11} /> Since {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
                {/* Edit / Save / Cancel */}
                <div className="flex gap-2 mt-2">
                  {!isEditing
                    ? <Button variant="outline" size="sm" onClick={() => { setFormData({ name: user?.name || "" }); setErrors({}); setApiError(""); setIsEditing(true); }} leftIcon={<Pencil size={13} />}>Edit Profile</Button>
                    : <>
                        <Button size="sm" onClick={handleSave} loading={isSaving} leftIcon={<Check size={13} />}
                          className="bg-gradient-to-r from-violet-500 to-indigo-500 border-none text-white hover:opacity-90">Save</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setFormData({ name: user?.name || "" }); setErrors({}); setApiError(""); setIsEditing(false); }} leftIcon={<X size={13} />}>Cancel</Button>
                      </>
                  }
                </div>
              </div>
              {apiError && <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1"><AlertCircle size={12} />{apiError}</p>}
              {saveSuccess && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><BadgeCheck size={12} /> Profile updated!</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content: sidebar + tabs ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

        {/* ── Left Sidebar ── */}
        <aside className="flex flex-col gap-4">
          {/* Contact card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#059669)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Contact Info
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <Mail size={15} className="text-slate-400 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <Shield size={15} className="text-slate-400 flex-shrink-0" />
                <span>{user.provider === "google" ? "Google OAuth" : "Email & Password"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <Calendar size={15} className="text-slate-400 flex-shrink-0" />
                <span>Joined {timeAgo(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Stats card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#059669)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Activity
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Days Active", value: daysSinceJoined, color: "text-violet-600 dark:text-violet-400" },
                { label: "Status", value: isVerified ? "Active" : "Pending", color: isVerified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400" },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center border border-slate-100 dark:border-white/5">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-red-50/60 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-500/20 p-5">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">Danger Zone</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Permanently delete your account.</p>
            <Button variant="danger" size="sm" leftIcon={<Trash2 size={13} />} onClick={() => setShowDeleteModal(true)}>
              Delete Account
            </Button>
          </div>
        </aside>

        {/* ── Right: Tabs + Content ── */}
        <div className="flex flex-col gap-4">
          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id ? "text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                style={activeTab === tab.id ? { background: 'linear-gradient(135deg,#7C3AED,#4F46E5,#059669)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' } : {}}>
                {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab: Profile Info */}
          {activeTab === "info" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-5"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#059669)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Basic Information
              </h3>
              {isEditing ? (
                <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
                  <Input id="name" label="Full Name" placeholder="Enter your full name" value={formData.name}
                    onChange={e => { setFormData(p => ({ ...p, name: e.target.value })); if (errors.name) setErrors({}); }}
                    error={errors.name} required leftIcon={<User size={16} />} />
                  <Input id="email-display" label="Email" type="email" value={user.email} disabled leftIcon={<Mail size={16} />} helperText="Email cannot be changed." />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-600 dark:text-gray-300">Role</label>
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-sm cursor-not-allowed">
                      <Shield size={15} /><span>{roleConfig.label}</span>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                  {[
                    { icon: <User size={15} />, label: "Full Name", value: user.name },
                    { icon: <Mail size={15} />, label: "Email", value: user.email },
                    { icon: <Shield size={15} />, label: "Role", value: `${roleConfig.icon} ${roleConfig.label}` },
                    { icon: <BadgeCheck size={15} />, label: "Verification", value: verificationBadge },
                  ].map((row, i) => (
                    <div key={i} className="flex items-start gap-3 py-3.5">
                      <span className="mt-0.5 text-slate-400 dark:text-slate-500 flex-shrink-0">{row.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{row.label}</p>
                        <div className="text-sm text-slate-700 dark:text-slate-200">{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Account */}
          {activeTab === "account" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-5"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#059669)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Account Details
              </h3>
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                {[
                  { icon: <Calendar size={15} />, label: "Member Since", value: formatDate(user.createdAt) },
                  { icon: <Clock size={15} />, label: "Last Updated", value: user.updatedAt ? `${formatDate(user.updatedAt)} (${timeAgo(user.updatedAt)})` : "—" },
                  { icon: <Shield size={15} />, label: "Auth Provider", value: user.provider === "google" ? "🔵 Google OAuth" : "🔑 Email & Password" },
                  { icon: <User size={15} />, label: "User ID", value: <span className="font-mono text-xs text-slate-400 break-all">{user.id || user._id}</span> },
                ].map((row, i) => (
                  <div key={i} className="flex items-start gap-3 py-3.5">
                    <span className="mt-0.5 text-slate-400 dark:text-slate-500 flex-shrink-0">{row.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{row.label}</p>
                      <div className="text-sm text-slate-700 dark:text-slate-200">{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Security */}
          {activeTab === "security" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-5"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#059669)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Password & Access
              </h3>
              {user.provider === "google"
                ? <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-sm text-blue-700 dark:text-blue-300">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <p>Your account uses Google OAuth. Password management is handled by Google.</p>
                  </div>
                : <div className="flex flex-col gap-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">To change your password, use the forgot password flow.</p>
                    <Link to="/forgot-password"><Button variant="outline" size="sm" leftIcon={<Lock size={14} />}>Change Password</Button></Link>
                  </div>
              }
            </div>
          )}
        </div>
      </div>
      </div>{/* end content wrapper */}

      {showDeleteModal && <DeleteModal onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteModal(false)} loading={isDeleting} />}
    </div>
  );
};

export default ProfilePage;
