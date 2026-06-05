import React, { useState, useEffect } from 'react';
import { useTracker } from '../context/TrackerContext';
import type { MedicationSchedule } from '../types';

export const MedicationScheduler: React.FC = () => {
  const {
    children,
    selectedChildId,
    medicationSchedules,
    doseLogs,
    addMedicationSchedule,
    toggleMedicationSchedule,
    deleteMedicationSchedule,
    logDose
  } = useTracker();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form states
  const [childId, setChildId] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequencyHours, setFrequencyHours] = useState('6');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // Update current time every 10 seconds for countdown precision
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Sync selected child
  useEffect(() => {
    if (selectedChildId && selectedChildId !== 'all') {
      setChildId(selectedChildId);
    } else if (children.length > 0) {
      setChildId(children[0].id);
    }
  }, [selectedChildId, children]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId || !medicationName.trim() || !dosage.trim()) return;

    addMedicationSchedule({
      childId,
      medicationName: medicationName.trim(),
      dosage: dosage.trim(),
      frequencyHours: parseInt(frequencyHours, 10),
      startDate,
      endDate: endDate ? endDate : undefined,
      notes: notes.trim()
    });

    // Reset Form
    setMedicationName('');
    setDosage('');
    setFrequencyHours('6');
    setNotes('');
    setIsFormOpen(false);
  };

  const handleGiveNow = (schedule: MedicationSchedule) => {
    const confirmMessage = `Confirm giving ${schedule.dosage} of ${schedule.medicationName} to ${
      children.find((c) => c.id === schedule.childId)?.name || 'child'
    }?`;
    if (confirm(confirmMessage)) {
      logDose({
        childId: schedule.childId,
        scheduleId: schedule.id,
        medicationName: schedule.medicationName,
        dosage: schedule.dosage,
        notes: 'Dose administered via scheduler.'
      });
    }
  };

  // Filter schedules based on selection
  const filteredSchedules = medicationSchedules.filter((s) => {
    if (selectedChildId === 'all') return true;
    return s.childId === selectedChildId;
  });

  // Calculate scheduler details (last dose, next dose, time remaining)
  const getScheduleMetrics = (schedule: MedicationSchedule) => {
    // Find all doses for this schedule, sorted by time descending
    const scheduleDoses = doseLogs
      .filter((d) => d.scheduleId === schedule.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const lastDose = scheduleDoses[0] ? new Date(scheduleDoses[0].timestamp) : null;
    let nextDose: Date | null = null;
    let timeRemainingMs = 0;
    let isOverdue = false;

    if (lastDose) {
      nextDose = new Date(lastDose.getTime() + schedule.frequencyHours * 60 * 60 * 1000);
      timeRemainingMs = nextDose.getTime() - currentTime.getTime();
      isOverdue = timeRemainingMs < 0;
    }

    return {
      lastDose,
      nextDose,
      timeRemainingMs: lastDose ? timeRemainingMs : 0,
      isOverdue,
      totalDosesCount: scheduleDoses.length
    };
  };

  // Helper to format remaining time
  const formatTimeRemaining = (ms: number, isOverdue: boolean) => {
    const absMs = Math.abs(ms);
    const hours = Math.floor(absMs / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

    if (isOverdue) {
      return `Overdue by ${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    }
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m remaining`;
  };

  return (
    <div className="medication-container">
      <div className="section-header">
        <h2>Medication Schedules</h2>
        <button className="btn btn-secondary" onClick={() => setIsFormOpen(true)} disabled={children.length === 0}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Schedule
        </button>
      </div>

      {filteredSchedules.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">💊</div>
          <p>No medication schedules active. Add one to track dosage timings.</p>
        </div>
      ) : (
        <div className="schedules-grid">
          {filteredSchedules.map((sched) => {
            const child = children.find((c) => c.id === sched.childId);
            const { lastDose, nextDose, timeRemainingMs, isOverdue, totalDosesCount } = getScheduleMetrics(sched);

            if (!child) return null;

            return (
              <div
                key={sched.id}
                className={`schedule-card card ${!sched.isActive ? 'paused' : ''}`}
                style={{ '--child-color': child.color } as React.CSSProperties}
              >
                <div className="schedule-header">
                  <div className="schedule-meta">
                    <span className="child-tag" style={{ backgroundColor: child.color }}>
                      {child.avatar} {child.name}
                    </span>
                    <span className="frequency-badge">Every {sched.frequencyHours}h</span>
                  </div>
                  <div className="schedule-actions">
                    <button
                      className="action-btn toggle-active"
                      onClick={() => toggleMedicationSchedule(sched.id)}
                      title={sched.isActive ? 'Pause Schedule' : 'Resume Schedule'}
                    >
                      {sched.isActive ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      )}
                    </button>
                    <button
                      className="action-btn delete-schedule"
                      onClick={() => {
                        if (confirm(`Remove schedule for ${sched.medicationName}? History logs will be kept.`)) {
                          deleteMedicationSchedule(sched.id);
                        }
                      }}
                      title="Delete Schedule"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="schedule-body">
                  <h4 className="medication-title">{sched.medicationName}</h4>
                  <div className="dosage-info">
                    <strong>Dosage:</strong> {sched.dosage}
                  </div>
                  {sched.notes && <p className="schedule-notes">{sched.notes}</p>}

                  {sched.isActive ? (
                    <div className="timing-status">
                      {!lastDose ? (
                        <div className="status-indicator ready">
                          <span className="status-dot"></span>
                          <span>Ready for first dose</span>
                        </div>
                      ) : (
                        <div className={`status-indicator ${isOverdue ? 'overdue' : 'waiting'}`}>
                          <span className="status-dot"></span>
                          <span>
                            {formatTimeRemaining(timeRemainingMs, isOverdue)}
                          </span>
                        </div>
                      )}
                      {nextDose && (
                        <div className="next-dose-time">
                          Next scheduled: {nextDose.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {nextDose.toLocaleDateString() !== currentTime.toLocaleDateString() && ` (${nextDose.toLocaleDateString([], { month: 'short', day: 'numeric' })})`}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="timing-status paused-status">
                      <span>⏸️ Schedule Paused</span>
                    </div>
                  )}
                </div>

                <div className="schedule-footer">
                  <span className="doses-count">
                    Given: <strong>{totalDosesCount}</strong> doses
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!sched.isActive}
                    onClick={() => handleGiveNow(sched)}
                  >
                    Give Dose
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Medication Schedule</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {selectedChildId === 'all' && (
                <div className="form-group">
                  <label htmlFor="sched-child-select">Select Child</label>
                  <select
                    id="sched-child-select"
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                  >
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.avatar} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="med-name-input">Medication Name</label>
                <input
                  id="med-name-input"
                  type="text"
                  required
                  placeholder="e.g., Acetaminophen, Amoxicillin"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="dosage-input">Dosage</label>
                  <input
                    id="dosage-input"
                    type="text"
                    required
                    placeholder="e.g., 5 ml, 1 tablet"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                  />
                </div>
                <div className="form-group half">
                  <label htmlFor="freq-select">Frequency (Hours)</label>
                  <select
                    id="freq-select"
                    value={frequencyHours}
                    onChange={(e) => setFrequencyHours(e.target.value)}
                  >
                    <option value="4">Every 4 hours</option>
                    <option value="6">Every 6 hours</option>
                    <option value="8">Every 8 hours</option>
                    <option value="12">Every 12 hours (Twice daily)</option>
                    <option value="24">Every 24 hours (Once daily)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="start-date-input">Start Date</label>
                  <input
                    id="start-date-input"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group half">
                  <label htmlFor="end-date-input">End Date (Optional)</label>
                  <input
                    id="end-date-input"
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sched-notes-input">Instructions / Notes (Optional)</label>
                <input
                  id="sched-notes-input"
                  type="text"
                  placeholder="e.g., Take with food, finish entire course"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
