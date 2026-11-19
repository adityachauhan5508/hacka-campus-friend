import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

// Toast notification
function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const styles = type === 'success'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : 'bg-red-50 border-red-200 text-red-800';

  return (
    <div className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-fade-in max-w-sm ${styles}`}>
      {type === 'success' ? (
        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14A7 7 0 0012 5z" />
        </svg>
      )}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onDismiss} className="text-current opacity-50 hover:opacity-100 ml-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-campus-blue-light flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-campus-navy">{title}</h3>
        {subtitle && <p className="text-xs text-campus-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Field ───────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-campus-muted uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, disabled, type = 'text', readOnly }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all focus:outline-none
        ${readOnly || disabled
          ? 'bg-slate-50 border-slate-200 text-campus-muted cursor-default'
          : 'bg-white border-campus-border text-campus-text focus:border-campus-blue focus:ring-2 focus:ring-campus-blue/10'}
      `}
    />
  );
}

function Select({ value, onChange, disabled, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all focus:outline-none
        ${disabled
          ? 'bg-slate-50 border-slate-200 text-campus-muted cursor-default'
          : 'bg-white border-campus-border text-campus-text focus:border-campus-blue focus:ring-2 focus:ring-campus-blue/10'}
      `}
    >
      {children}
    </select>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function MyProfilePage({ onNavigate }) {
  const { user, profile, updateProfile, fetchProfileCooldown, refreshProfile } = useAuth();

  // Form state
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    college_name: '',
    course: '',
    academic_year: '',
    semester: '',
    student_id: '',
  });

  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [cooldown, setCooldown]   = useState({ isLocked: false, nextAvailableDate: null, daysRemaining: 0 });
  const [loading, setLoading]     = useState(true);

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setForm({
        full_name:     profile.full_name     || '',
        phone:         profile.phone         || '',
        college_name:  profile.college_name  || '',
        course:        profile.course        || '',
        academic_year: profile.academic_year || '',
        semester:      profile.semester      || '',
        student_id:    profile.student_id    || '',
      });
      setCooldown(fetchProfileCooldown());
      setLoading(false);
    } else if (user) {
      setLoading(false);
    }
  }, [profile, fetchProfileCooldown, user]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const hasFilledAny = Object.values(form).some(v => v.trim() !== '');

  const handleSave = async () => {
    if (cooldown.isLocked) return;
    setSaving(true);
    try {
      const { error } = await updateProfile(form);
      if (error) {
        if (error.isCooldown) {
          setCooldown({ isLocked: true, nextAvailableDate: error.nextAvailableDate, daysRemaining: cooldown.daysRemaining });
          setToast({ message: 'Profile update is restricted. Please wait 7 days between edits.', type: 'error' });
        } else {
          setToast({ message: error.message || 'Failed to save profile. Please try again.', type: 'error' });
        }
      } else {
        // Refresh profile to get latest last_profile_update timestamp
        if (refreshProfile) await refreshProfile();
        setToast({ message: 'Profile saved successfully!', type: 'success' });
        // Recompute cooldown after save
        setCooldown(fetchProfileCooldown());
      }
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Campus User';
  const displayEmail = user?.email || profile?.email || '';
  const displayRole = profile?.role || 'student';

  // Avatar initials
  const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const avatarUrl = profile?.profile_picture_url || user?.user_metadata?.avatar_url;

  if (loading) {
    return (
      <div className="min-h-screen bg-campus-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-campus-blue-light flex items-center justify-center mx-auto mb-3 animate-pulse">
            <svg className="w-6 h-6 text-campus-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-sm text-campus-muted">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-campus-bg">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="bg-white border-b border-campus-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg text-campus-muted hover:text-campus-navy hover:bg-slate-100 transition-colors"
              title="Go back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-campus-navy">My Profile</h1>
              <p className="text-xs text-campus-muted">Manage your personal and academic information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Profile Hero Card ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-campus-border shadow-sm overflow-hidden">
          <div className="relative h-20 bg-gradient-to-r from-campus-navy via-[#1a3560] to-campus-blue">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white -translate-y-1/2 translate-x-1/4" />
            </div>
          </div>
          <div className="px-6 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-campus-blue to-campus-navy flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{initials}</span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-campus-navy truncate">{displayName}</h2>
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-campus-blue-light text-campus-blue font-semibold capitalize">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                    </svg>
                    {displayRole}
                  </span>
                </div>
                <p className="text-sm text-campus-muted truncate mt-0.5">{displayEmail}</p>
                {profile?.created_at && (
                  <p className="text-xs text-campus-muted mt-0.5">
                    Member since {formatDate(profile.created_at)}
                  </p>
                )}
              </div>
              {/* Profile completion hint */}
              {!hasFilledAny && (
                <div className="sm:ml-auto flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14A7 7 0 0012 5z" />
                    </svg>
                    Profile incomplete
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 7-Day Cooldown Banner ─────────────────────────── */}
        {cooldown.isLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">Profile editing is locked</p>
              <p className="text-sm text-amber-700 mt-0.5">
                You can only update your profile once every 7 days.{' '}
                {cooldown.daysRemaining > 0 && (
                  <span className="font-semibold">{cooldown.daysRemaining} day{cooldown.daysRemaining !== 1 ? 's' : ''} remaining.</span>
                )}
              </p>
              {cooldown.nextAvailableDate && (
                <p className="text-xs text-amber-600 mt-1">
                  Next edit available: <span className="font-semibold">{formatDateTime(cooldown.nextAvailableDate)}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Empty State ──────────────────────────────────────── */}
        {!hasFilledAny && !cooldown.isLocked && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-campus-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-campus-blue">Complete your profile</p>
              <p className="text-sm text-blue-600 mt-0.5">
                All fields are optional. Fill in as much or as little as you like. You can skip this and use the platform normally.
              </p>
            </div>
          </div>
        )}

        {/* ── Section 1: Personal Information ─────────────────── */}
        <div className="bg-white rounded-2xl border border-campus-border shadow-sm p-6">
          <SectionHeader
            icon={
              <svg className="w-4.5 h-4.5 text-campus-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            title="Personal Information"
            subtitle="Your name and contact details"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name">
              <Input
                value={form.full_name}
                onChange={set('full_name')}
                placeholder="e.g. Aditya Chauhan"
                disabled={cooldown.isLocked || saving}
              />
            </Field>
            <Field label="Phone Number">
              <Input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="e.g. +91 9876543210"
                disabled={cooldown.isLocked || saving}
              />
            </Field>
          </div>
        </div>

        {/* ── Section 2: Academic Information ─────────────────── */}
        <div className="bg-white rounded-2xl border border-campus-border shadow-sm p-6">
          <SectionHeader
            icon={
              <svg className="w-4.5 h-4.5 text-campus-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            }
            title="Academic Information"
            subtitle="Your college and course details"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Field label="College / University Name">
                <Input
                  value={form.college_name}
                  onChange={set('college_name')}
                  placeholder="e.g. IIT Bombay / DTU / NSUT"
                  disabled={cooldown.isLocked || saving}
                />
              </Field>
            </div>
            <Field label="Course / Programme">
              <Input
                value={form.course}
                onChange={set('course')}
                placeholder="e.g. B.Tech CSE, BCA, MBA"
                disabled={cooldown.isLocked || saving}
              />
            </Field>
            <Field label="Roll Number / Student ID">
              <Input
                value={form.student_id}
                onChange={set('student_id')}
                placeholder="e.g. 2021UCS1234"
                disabled={cooldown.isLocked || saving}
              />
            </Field>
            <Field label="Current Year">
              <Select value={form.academic_year} onChange={set('academic_year')} disabled={cooldown.isLocked || saving}>
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </Select>
            </Field>
            <Field label="Current Semester">
              <Select value={form.semester} onChange={set('semester')} disabled={cooldown.isLocked || saving}>
                <option value="">Select semester</option>
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                ))}
                <option value="Postgraduate Sem 1">PG Sem 1</option>
                <option value="Postgraduate Sem 2">PG Sem 2</option>
                <option value="Postgraduate Sem 3">PG Sem 3</option>
                <option value="Postgraduate Sem 4">PG Sem 4</option>
              </Select>
            </Field>
          </div>
        </div>

        {/* ── Section 3: Account Information (read-only) ──────── */}
        <div className="bg-white rounded-2xl border border-campus-border shadow-sm p-6">
          <SectionHeader
            icon={
              <svg className="w-4.5 h-4.5 text-campus-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            title="Account Information"
            subtitle="These details are managed by the system"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Registered Email">
              <Input value={displayEmail} readOnly />
            </Field>
            <Field label="Account Role">
              <Input value={displayRole.charAt(0).toUpperCase() + displayRole.slice(1)} readOnly />
            </Field>
            <Field label="Account Created">
              <Input value={profile?.created_at ? formatDate(profile.created_at) : '—'} readOnly />
            </Field>
            <Field label="Last Profile Update">
              <Input value={profile?.last_profile_update ? formatDateTime(profile.last_profile_update) : 'Never updated'} readOnly />
            </Field>
          </div>
        </div>

        {/* ── Save Button + Footer ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-campus-border shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            {cooldown.isLocked ? (
              <p className="text-sm text-amber-700 font-medium">
                🔒 Editing locked — {cooldown.daysRemaining} day{cooldown.daysRemaining !== 1 ? 's' : ''} until next update
              </p>
            ) : (
              <p className="text-sm text-campus-muted">
                All fields are optional. Changes are saved to your Supabase profile.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-campus-border text-campus-navy hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={cooldown.isLocked || saving}
              title={cooldown.isLocked ? `Next edit available on ${formatDateTime(cooldown.nextAvailableDate)}` : 'Save your profile'}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm
                ${cooldown.isLocked || saving
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-campus-blue hover:bg-campus-navy text-white active:scale-95'}
              `}
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Saving…
                </>
              ) : cooldown.isLocked ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Locked
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-campus-muted pb-4">
          Profile updates are limited to once every 7 days and enforced securely on the database.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
