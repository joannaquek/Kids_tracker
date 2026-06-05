import { useState } from 'react';
import { TrackerProvider } from './context/TrackerContext';
import { ChildProfiles } from './components/ChildProfiles';
import { QuickLog } from './components/QuickLog';
import { MedicationScheduler } from './components/MedicationScheduler';
import { HealthTimeline } from './components/HealthTimeline';
import { HealthAnalytics } from './components/HealthAnalytics';
import { BackupRestore } from './components/BackupRestore';

type ActiveTab = 'dashboard' | 'analytics' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  return (
    <div className="app-wrapper">
      {/* Sticky Header Bar */}
      <header className="header-bar">
        <div className="logo-section">
          <span className="logo-icon">🧸</span>
          <div className="logo-text">
            <h1>TinyCare</h1>
            <span className="logo-tagline">Kids Sickness & Medication Tracker</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </button>
          <button
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Analytics
          </button>
          <button
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </button>
      </nav>
    </header>

    <main className="main-content">
      {/* Child Profile Picker (affects Dashboard and Analytics tabs) */}
      {activeTab !== 'settings' && <ChildProfiles />}

      {/* Conditional Rendering of Tabs */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-grid">
          {/* Left Column: Quick Logging Form */}
          <div className="dashboard-left">
            <QuickLog />
          </div>

          {/* Right Column: Active Medication Courses + Logged History List */}
          <div className="dashboard-right" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <MedicationScheduler />
            <HealthTimeline />
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-tab-wrapper">
          <HealthAnalytics />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="settings-tab-wrapper">
          <BackupRestore />
        </div>
      )}
    </main>
  </div>
);
}

export default function App() {
  return (
    <TrackerProvider>
      <AppContent />
    </TrackerProvider>
  );
}
