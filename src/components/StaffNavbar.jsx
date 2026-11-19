import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function StaffNavbar({ staffTab, setStaffTab, onExitToStudent, pendingEscalationsCount = 0 }) {
  const { signOut } = useAuth();
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'inbox', label: 'Staff Inbox', icon: '📥', badge: pendingEscalationsCount },
    { id: 'kb', label: 'Knowledge Base', icon: '📚' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-campus-navy text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Staff Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-campus-blue flex items-center justify-center text-white shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">
                  Staff Control Center
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Protected Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Institutional Verification, Answer-Once & KB Governance
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const isActive = staffTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStaffTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-campus-blue text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Return to Student Navigation */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col text-right text-xs">
              <span className="font-semibold text-slate-200">Admin: Dr. S. K. Raman</span>
              <span className="text-slate-400 text-[10px]">Academic & Examination Controller</span>
            </div>

            <button
              onClick={onExitToStudent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Student View</span>
            </button>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600/80 hover:bg-red-600 text-white transition-all shadow-xs"
              title="Sign Out"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>

        </div>

        {/* Mobile Sub-tabs */}
        <div className="md:hidden flex overflow-x-auto py-2 space-x-2 border-t border-white/10">
          {tabs.map((tab) => {
            const isActive = staffTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStaffTab(tab.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs whitespace-nowrap ${
                  isActive ? 'bg-campus-blue text-white' : 'text-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="ml-1 px-1 rounded-full text-[10px] bg-amber-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
