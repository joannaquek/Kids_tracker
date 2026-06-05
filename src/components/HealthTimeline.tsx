import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import type { SicknessLog, DoseLog } from '../types';

type TimelineEvent =
  | { type: 'sickness'; data: SicknessLog; timestamp: string }
  | { type: 'dose'; data: DoseLog; timestamp: string };

type EditingKey = `${TimelineEvent['type']}-${string}`;

const PRESET_SYMPTOMS = [
  { name: 'Fever', emoji: '🤒' },
  { name: 'Cough', emoji: '💨' },
  { name: 'Runny Nose', emoji: '💧' },
  { name: 'Sore Throat', emoji: '🍒' },
  { name: 'Congestion', emoji: '😤' },
  { name: 'Lethargy', emoji: '💤' },
  { name: 'Vomiting', emoji: '🤢' },
  { name: 'Diarrhea', emoji: '🧻' },
  { name: 'Rash', emoji: '🔴' },
  { name: 'Headache', emoji: '🧠' },
  { name: 'Loss of Appetite', emoji: '🥣' }
];

const toDatetimeLocal = (isoString: string) => {
  const date = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getEventKey = (event: TimelineEvent): EditingKey => `${event.type}-${event.data.id}`;

export const HealthTimeline: React.FC = () => {
  const {
    children,
    selectedChildId,
    sicknessLogs,
    doseLogs,
    updateSicknessLog,
    updateDoseLog,
    deleteSicknessLog,
    deleteDoseLog
  } = useTracker();

  const [filterType, setFilterType] = useState<'all' | 'sickness' | 'dose'>('all');
  const [editingKey, setEditingKey] = useState<EditingKey | null>(null);

  const [editTimestamp, setEditTimestamp] = useState('');
  const [editTemp, setEditTemp] = useState('');
  const [editTempUnit, setEditTempUnit] = useState<'C' | 'F'>('C');
  const [editSymptoms, setEditSymptoms] = useState<string[]>([]);
  const [editCustomSymptom, setEditCustomSymptom] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editMedicationName, setEditMedicationName] = useState('');
  const [editDosage, setEditDosage] = useState('');

  const allEvents: TimelineEvent[] = [];

  if (filterType === 'all' || filterType === 'sickness') {
    sicknessLogs.forEach((log) => {
      allEvents.push({ type: 'sickness', data: log, timestamp: log.timestamp });
    });
  }

  if (filterType === 'all' || filterType === 'dose') {
    doseLogs.forEach((dose) => {
      allEvents.push({ type: 'dose', data: dose, timestamp: dose.timestamp });
    });
  }

  const sortedEvents = allEvents
    .filter((event) => {
      if (selectedChildId === 'all') return true;
      return event.data.childId === selectedChildId;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleStartEdit = (event: TimelineEvent) => {
    setEditingKey(getEventKey(event));
    setEditTimestamp(toDatetimeLocal(event.timestamp));
    setEditNotes(event.data.notes || '');

    if (event.type === 'sickness') {
      const log = event.data as SicknessLog;
      setEditTemp(log.temperature !== undefined ? log.temperature.toString() : '');
      setEditTempUnit(log.temperatureUnit);
      setEditSymptoms([...log.symptoms]);
      setEditCustomSymptom('');
      setEditMedicationName('');
      setEditDosage('');
    } else {
      const log = event.data as DoseLog;
      setEditMedicationName(log.medicationName);
      setEditDosage(log.dosage);
      setEditTemp('');
      setEditTempUnit('C');
      setEditSymptoms([]);
      setEditCustomSymptom('');
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
  };

  const handleSymptomToggle = (symptomName: string) => {
    setEditSymptoms((prev) =>
      prev.includes(symptomName)
        ? prev.filter((s) => s !== symptomName)
        : [...prev, symptomName]
    );
  };

  const handleAddCustomSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editCustomSymptom.trim();
    if (trimmed && !editSymptoms.includes(trimmed)) {
      setEditSymptoms((prev) => [...prev, trimmed]);
      setEditCustomSymptom('');
    }
  };

  const handleSaveEdit = (event: TimelineEvent) => {
    if (!editTimestamp) return;

    const timestamp = new Date(editTimestamp).toISOString();

    if (event.type === 'sickness') {
      const log = event.data as SicknessLog;
      updateSicknessLog({
        ...log,
        timestamp,
        temperature: editTemp ? parseFloat(editTemp) : undefined,
        temperatureUnit: editTempUnit,
        symptoms: editSymptoms,
        notes: editNotes.trim() || undefined
      });
    } else {
      const log = event.data as DoseLog;
      if (!editMedicationName.trim() || !editDosage.trim()) return;

      updateDoseLog({
        ...log,
        timestamp,
        medicationName: editMedicationName.trim(),
        dosage: editDosage.trim(),
        notes: editNotes.trim() || undefined
      });
    }

    setEditingKey(null);
  };

  const handleDeleteEvent = (event: TimelineEvent) => {
    const confirmMessage =
      event.type === 'sickness'
        ? 'Delete this sickness log?'
        : `Delete the dose log for ${event.data.medicationName}?`;

    if (confirm(confirmMessage)) {
      if (editingKey === getEventKey(event)) {
        setEditingKey(null);
      }
      if (event.type === 'sickness') {
        deleteSicknessLog(event.data.id);
      } else {
        deleteDoseLog(event.data.id);
      }
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="timeline-container">
      <div className="section-header">
        <h2>Health History Timeline</h2>
        <div className="filter-tabs">
          <button
            className={`tab-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Logs
          </button>
          <button
            className={`tab-btn ${filterType === 'sickness' ? 'active' : ''}`}
            onClick={() => setFilterType('sickness')}
          >
            Symptoms
          </button>
          <button
            className={`tab-btn ${filterType === 'dose' ? 'active' : ''}`}
            onClick={() => setFilterType('dose')}
          >
            Medication
          </button>
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📂</div>
          <p>No logged history matching your filters. Make a quick log or give medication to start your history.</p>
        </div>
      ) : (
        <div className="timeline-list">
          <div className="timeline-spine"></div>
          {sortedEvents.map((event, idx) => {
            const child = children.find((c) => c.id === event.data.childId);
            if (!child) return null;

            const isSickness = event.type === 'sickness';
            const sLog = isSickness ? (event.data as SicknessLog) : null;
            const dLog = !isSickness ? (event.data as DoseLog) : null;
            const eventKey = getEventKey(event);
            const isEditing = editingKey === eventKey;

            return (
              <div
                key={`${event.type}-${event.data.id}-${idx}`}
                className={`timeline-item ${event.type}-item`}
                style={{ '--child-color': child.color } as React.CSSProperties}
              >
                <div className="timeline-node" style={{ backgroundColor: child.color }}>
                  {isSickness ? '🤒' : '💊'}
                </div>

                <div className={`timeline-card card ${isEditing ? 'timeline-card-editing' : ''}`}>
                  <div className="timeline-card-header">
                    <div className="child-profile-pill">
                      <span className="child-avatar-mini" style={{ backgroundColor: child.color }}>
                        {child.avatar}
                      </span>
                      <span className="child-name-text">{child.name}</span>
                    </div>

                    <div className="timeline-time-actions">
                      {!isEditing && (
                        <span className="event-time" title={new Date(event.timestamp).toLocaleString()}>
                          {formatTime(event.timestamp)}
                        </span>
                      )}
                      {!isEditing && (
                        <button
                          className="edit-log-btn"
                          onClick={() => handleStartEdit(event)}
                          title="Edit log entry"
                          aria-label="Edit log entry"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                      )}
                      {!isEditing && (
                        <button
                          className="delete-log-btn"
                          onClick={() => handleDeleteEvent(event)}
                          title="Delete log entry"
                          aria-label="Delete log entry"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="timeline-card-body">
                    {isEditing ? (
                      <form
                        className="timeline-edit-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveEdit(event);
                        }}
                      >
                        <div className="form-group">
                          <label htmlFor={`edit-timestamp-${eventKey}`}>Date & Time</label>
                          <input
                            id={`edit-timestamp-${eventKey}`}
                            type="datetime-local"
                            value={editTimestamp}
                            onChange={(e) => setEditTimestamp(e.target.value)}
                            required
                          />
                        </div>

                        {isSickness && (
                          <>
                            <div className="form-group temp-input-group">
                              <label htmlFor={`edit-temp-${eventKey}`}>Temperature</label>
                              <div className="temp-input-wrapper">
                                <input
                                  id={`edit-temp-${eventKey}`}
                                  type="number"
                                  step="0.1"
                                  placeholder={editTempUnit === 'C' ? 'e.g. 38.2' : 'e.g. 100.8'}
                                  value={editTemp}
                                  onChange={(e) => setEditTemp(e.target.value)}
                                />
                                <button
                                  type="button"
                                  className={`temp-unit-toggle ${editTempUnit === 'C' ? 'active' : ''}`}
                                  onClick={() => setEditTempUnit('C')}
                                >
                                  °C
                                </button>
                                <button
                                  type="button"
                                  className={`temp-unit-toggle ${editTempUnit === 'F' ? 'active' : ''}`}
                                  onClick={() => setEditTempUnit('F')}
                                >
                                  °F
                                </button>
                              </div>
                            </div>

                            <div className="form-group">
                              <label>Symptoms</label>
                              <div className="symptom-chips">
                                {PRESET_SYMPTOMS.map((sym) => {
                                  const isSelected = editSymptoms.includes(sym.name);
                                  return (
                                    <button
                                      key={sym.name}
                                      type="button"
                                      className={`symptom-chip ${isSelected ? 'selected' : ''}`}
                                      onClick={() => handleSymptomToggle(sym.name)}
                                    >
                                      <span className="chip-emoji">{sym.emoji}</span>
                                      <span className="chip-name">{sym.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="form-group add-custom-symptom-group">
                              <label htmlFor={`edit-custom-symptom-${eventKey}`}>Other Symptom</label>
                              <div className="input-with-button">
                                <input
                                  id={`edit-custom-symptom-${eventKey}`}
                                  type="text"
                                  placeholder="Type symptom and press Add"
                                  value={editCustomSymptom}
                                  onChange={(e) => setEditCustomSymptom(e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={handleAddCustomSymptom}
                                >
                                  Add
                                </button>
                              </div>
                            </div>

                            {editSymptoms.length > 0 && (
                              <div className="selected-symptoms-list">
                                <strong>Selected: </strong>
                                {editSymptoms.map((sym) => (
                                  <span key={sym} className="symptom-tag">
                                    {sym}
                                    <button type="button" onClick={() => handleSymptomToggle(sym)}>
                                      &times;
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {!isSickness && (
                          <>
                            <div className="form-group">
                              <label htmlFor={`edit-med-name-${eventKey}`}>Medication</label>
                              <input
                                id={`edit-med-name-${eventKey}`}
                                type="text"
                                value={editMedicationName}
                                onChange={(e) => setEditMedicationName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor={`edit-dosage-${eventKey}`}>Dosage</label>
                              <input
                                id={`edit-dosage-${eventKey}`}
                                type="text"
                                value={editDosage}
                                onChange={(e) => setEditDosage(e.target.value)}
                                required
                              />
                            </div>
                          </>
                        )}

                        <div className="form-group">
                          <label htmlFor={`edit-notes-${eventKey}`}>Notes</label>
                          <textarea
                            id={`edit-notes-${eventKey}`}
                            rows={2}
                            placeholder="Optional notes..."
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                          />
                        </div>

                        <div className="timeline-edit-actions">
                          <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary btn-sm">
                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {isSickness && sLog && (
                          <div className="sickness-details">
                            {sLog.temperature !== undefined && (
                              <div className="temperature-tag">
                                <span className="temp-number">
                                  🌡️ {sLog.temperature}°{sLog.temperatureUnit}
                                </span>
                              </div>
                            )}

                            {sLog.symptoms.length > 0 && (
                              <div className="symptoms-list-tags">
                                {sLog.symptoms.map((s) => (
                                  <span key={s} className="symptom-tag-static">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {!isSickness && dLog && (
                          <div className="dose-details">
                            <div className="dose-title-row">
                              <span className="med-capsule">💊</span>
                              <span className="med-name-bold">{dLog.medicationName}</span>
                              <span className="dose-amount">{dLog.dosage}</span>
                            </div>
                          </div>
                        )}

                        {event.data.notes && (
                          <p className="event-notes-content">
                            <em>Notes:</em> {event.data.notes}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
