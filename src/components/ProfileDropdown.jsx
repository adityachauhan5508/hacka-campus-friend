import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CurrentUserAvatar } from './Avatar';

/**
 * ProfileDropdown – premium redesigned dropdown under the avatar in the Navbar.
 * Features: user card, My Profile / Account Settings links, sign-out confirmation modal.
 * Closes on outside click or Escape key.
 */
export default function ProfileDropdown({ onClose, onNavigate }) {
  const { user, profile, signOut } = useAuth();
  const ref = useRef(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const go = (page) => {
    onClose();
    onNavigate(page);
  };

  const handleConfirmSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      onClose();
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Campus User';
  const displayEmail = user?.email || profile?.email || '';
  const displayRole = profile?.role || 'student';
  const isGoogle = user?.app_metadata?.provider === 'google';

  // Get initials for fallback avatar
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Dropdown panel */}
      <div
        ref={ref}
        className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-campus-border z-50 overflow-hidden animate-fade-in"
        style={{ boxShadow: '0 8px 32px rgba(15,34,64,0.15), 0 2px 8px rgba(0,0,0,0.08)' }}
      >
        {/* ── User Card Header ─────────────────────────────────── */}
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-campus-navy via-[#1a3560] to-[#0f2240] overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-campus-blue/10 pointer-events-none" />

          <div className="relative flex items-center gap-3.5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <CurrentUserAvatar size="lg" />
              {isGoogle && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow">
                  {/* Google G */}
                  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
              )}
            </div>

            {/* User info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate leading-tight">{displayName}</p>
              <p className="text-[11px] text-blue-200 truncate mt-0.5">{displayEmail}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-campus-blue text-white font-semibold capitalize">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                  </svg>
                  {displayRole}
                </span>
                {isGoogle && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-blue-200 font-medium">
                    Google
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Menu Items ───────────────────────────────────────── */}
        <div className="p-2">
          {/* My Profile */}
          <button
            onClick={() => go('my-profile')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-campus-text hover:bg-blue-50 hover:text-campus-blue transition-all group"
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-campus-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <div className="text-left min-w-0">
              <p className="font-semibold text-sm">My Profile</p>
              <p className="text-[11px] text-campus-muted">View and edit your details</p>
            </div>
            <svg className="w-3.5 h-3.5 text-campus-muted ml-auto group-hover:text-campus-blue transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Account Settings */}
          <button
            onClick={() => go('account-settings')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-campus-text hover:bg-slate-50 hover:text-campus-navy transition-all group"
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <div className="text-left min-w-0">
              <p className="font-semibold text-sm">Account Settings</p>
              <p className="text-[11px] text-campus-muted">Password, security & preferences</p>
            </div>
            <svg className="w-3.5 h-3.5 text-campus-muted ml-auto group-hover:text-campus-navy transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Divider */}
          <div className="my-1.5 mx-2 border-t border-campus-border" />

          {/* Sign Out */}
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all group"
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            <div className="text-left">
              <p className="font-semibold text-sm">Sign Out</p>
              <p className="text-[11px] text-red-400">End your current session</p>
            </div>
          </button>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="px-4 py-2 bg-slate-50 border-t border-campus-border">
          <p className="text-[10px] text-campus-muted text-center">
            Smart Campus 2.0 · Aarambhathon 2.0
          </p>
        </div>
      </div>

      {/* ── Sign Out Confirmation Modal ─────────────────────── */}
      {showSignOutConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15,34,64,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSignOutConfirm(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in">
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-campus-navy">Sign Out?</h3>
              <p className="text-sm text-campus-muted mt-1">
                You will be signed out and redirected to the login page.
              </p>
            </div>

            {/* Modal actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                disabled={signingOut}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-campus-border text-campus-navy hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOut}
                disabled={signingOut}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {signingOut ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing out…
                  </>
                ) : (
                  'Confirm Sign Out'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
