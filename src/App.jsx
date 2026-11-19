import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import StaffNavbar from './components/StaffNavbar';
import Footer from './components/Footer';

// Student Pages (The 4 core pages from PPT — NEVER change these)
import HomePage from './pages/HomePage';
import AssistantPage from './pages/AssistantPage';
import CampusMapPage from './pages/CampusMapPage';
import MyQuestionsPage from './pages/MyQuestionsPage';

// Protected Staff Dashboard
import StaffDashboard from './pages/staff/StaffDashboard';

// Auth Pages
import { LoginPage, SignupPage, ForgotPasswordPage } from './pages/auth/AuthPages';
import AccountSettingsPage from './pages/auth/AccountSettingsPage';
import MyProfilePage from './pages/MyProfilePage';

// State and storage services
import {
  getStoredDocuments,
  saveDocuments,
  getStoredHistory,
  getStoredEscalations,
  resolveEscalation as executeResolveEscalation,
  resetDemoData
} from './services/storage';

// ─── Inner App (needs AuthContext already mounted) ────────────────────────────
function AppInner() {
  const { isAuthenticated, loading, isStaff } = useAuth();

  // Active page state
  const [activePage, setActivePage] = useState('home');
  const [viewMode, setViewMode]     = useState('student'); // 'student' | 'staff'
  const [staffTab, setStaffTab]     = useState('overview');

  // Data state
  const [documents, setDocuments]     = useState([]);
  const [history, setHistory]         = useState([]);
  const [escalations, setEscalations] = useState([]);

  // Cross-page params
  const [assistantInitialQuery, setAssistantInitialQuery] = useState('');
  const [targetBuildingId, setTargetBuildingId]           = useState(null);

  // Auth sub-page (login | signup | forgot-password)
  const [authSubPage, setAuthSubPage] = useState('login');

  // Load stored data
  useEffect(() => {
    setDocuments(getStoredDocuments());
    setHistory(getStoredHistory());
    setEscalations(getStoredEscalations());
  }, []);

  // After authentication, redirect from any auth-page back to home
  useEffect(() => {
    if (isAuthenticated && activePage === 'auth') {
      setActivePage('home');
    }
  }, [isAuthenticated, activePage]);

  const refreshData = () => {
    setDocuments(getStoredDocuments());
    setHistory(getStoredHistory());
    setEscalations(getStoredEscalations());
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleNavigate = (page) => {
    // Auth sub-pages
    if (['login', 'signup', 'forgot-password'].includes(page)) {
      setAuthSubPage(page);
      setActivePage('auth');
    } else {
      setActivePage(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectQuestion = (queryText) => {
    setAssistantInitialQuery(queryText);
    handleNavigate('assistant');
  };

  const handleNavigateToMap = (buildingId) => {
    setTargetBuildingId(buildingId);
    handleNavigate('map');
  };

  const handleAskAboutBuilding = (queryText) => {
    setAssistantInitialQuery(queryText);
    handleNavigate('assistant');
  };

  // ── Staff actions ──────────────────────────────────────────────────────────
  const handleResolveEscalation = (escId, answer, staffName) => {
    executeResolveEscalation(escId, answer, staffName);
    refreshData();
  };

  const handleToggleActiveDocument = (docId) => {
    const updated = documents.map(d =>
      d.id === docId ? { ...d, isActive: !d.isActive } : d
    );
    setDocuments(updated);
    saveDocuments(updated);
  };

  const handleAddDocument = (newDoc) => {
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    saveDocuments(updated);
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset all demo data to Aarambhathon initial state?')) {
      const reset = resetDemoData();
      setDocuments(reset.documents);
      setHistory(reset.history);
      setEscalations(reset.escalations);
    }
  };

  const pendingEscalationsCount = escalations.filter(e => e.status === 'PENDING').length;

  // ── LOADING STATE ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-campus-navy via-[#1a3560] to-[#0f2240] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-campus-blue shadow-lg mb-4 animate-pulse">
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2zm0 13.5l-7-3.18V17l7 3.5 7-3.5v-4.68l-7 3.18z"/>
            </svg>
          </div>
          <h2 className="text-white text-lg font-bold mb-2">Smart Campus</h2>
          <p className="text-blue-300 text-sm">Verifying session…</p>
        </div>
      </div>
    );
  }

  // ── GATE: Show Login/Signup/ForgotPassword FIRST if not authenticated ──────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        {authSubPage === 'login'           && <LoginPage onNavigate={handleNavigate} />}
        {authSubPage === 'signup'          && <SignupPage onNavigate={handleNavigate} />}
        {authSubPage === 'forgot-password' && <ForgotPasswordPage onNavigate={handleNavigate} />}
      </div>
    );
  }

  // ── AUTHENTICATED USER — Full Platform ───────────────────────────────────
  const isStaffMode = viewMode === 'staff' && isStaff;

  return (
    <div className="min-h-screen flex flex-col bg-campus-bg text-campus-text">
      
      {/* Demo banner */}
      <div className="bg-campus-navy-dark text-slate-300 text-[11px] py-1.5 px-4 text-center border-b border-slate-800 flex items-center justify-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <strong>Aarambhathon 2.0 Official Project:</strong> Smart Campus Assistant (33 Docs · 6 Buildings · 75% Confidence Floor)
        </span>
        <button
          onClick={handleResetDemo}
          className="text-slate-400 hover:text-white underline text-[10px] ml-2"
          title="Reset demo data"
        >
          Reset Demo State
        </button>
      </div>

      {/* Conditional Header */}
      {isStaffMode ? (
        <StaffNavbar
          staffTab={staffTab}
          setStaffTab={setStaffTab}
          onExitToStudent={() => setViewMode('student')}
          pendingEscalationsCount={pendingEscalationsCount}
        />
      ) : (
        <Navbar
          activePage={activePage}
          setActivePage={handleNavigate}
          onOpenStaffDashboard={() => {
            if (!isStaff) {
              alert("Access Restricted: The Staff Portal is reserved for verified university staff and administrative officers. Your current account role is 'student'.");
              return;
            }
            setViewMode('staff');
          }}
          pendingEscalationsCount={pendingEscalationsCount}
        />
      )}

      {/* Main Content */}
      <main className="grow">
        {isStaffMode ? (
          <StaffDashboard
            staffTab={staffTab}
            setStaffTab={setStaffTab}
            documents={documents}
            escalations={escalations}
            history={history}
            onResolveEscalation={handleResolveEscalation}
            onToggleActiveDocument={handleToggleActiveDocument}
            onAddDocument={handleAddDocument}
          />
        ) : (
          <>
            {activePage === 'account-settings' && (
              <AccountSettingsPage onNavigate={handleNavigate} />
            )}

            {activePage === 'my-profile' && (
              <MyProfilePage onNavigate={handleNavigate} />
            )}

            {/* ─── The 4 Core Student Pages ────────────────────────────── */}
            {activePage === 'home' && (
              <HomePage
                onSelectQuestion={handleSelectQuestion}
                onNavigateToAssistant={() => handleNavigate('assistant')}
                onNavigateToMap={() => handleNavigate('map')}
                onNavigateToSettings={() => handleNavigate('account-settings')}
              />
            )}

            {activePage === 'assistant' && (
              <AssistantPage
                initialQuery={assistantInitialQuery}
                onNavigateToMap={handleNavigateToMap}
                onRefreshEscalationsCount={refreshData}
              />
            )}

            {activePage === 'map' && (
              <CampusMapPage
                targetBuildingId={targetBuildingId}
                onAskAboutBuilding={handleAskAboutBuilding}
              />
            )}

            {activePage === 'questions' && (
              <MyQuestionsPage
                history={history}
                onAskNewQuestion={() => {
                  setAssistantInitialQuery('');
                  handleNavigate('assistant');
                }}
                onNavigateToMap={handleNavigateToMap}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      {!isStaffMode && (
        <Footer
          setActivePage={handleNavigate}
          onOpenStaffDashboard={() => {
            setViewMode('staff');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}

// ─── Root App wraps everything in AuthProvider ────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
