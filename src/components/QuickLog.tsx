import React, { useState, useEffect } from 'react';
import { useTracker } from '../context/TrackerContext';

export const QuickLog: React.FC = () => {
  const { children, selectedChildId, addSicknessLog } = useTracker();
  
  // Local form state
  const [childId, setChildId] = useState('');
  const [temp, setTemp] = useState('');
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync childId selection with global selection
  useEffect(() => {
    if (selectedChildId && selectedChildId !== 'all') {
      setChildId(selectedChildId);
    } else if (children.length > 0) {
      setChildId(children[0].id);
    } else {
      setChildId('');
    }
  }, [selectedChildId, children]);

  const presetSymptoms = [
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

  const handleSymptomToggle = (symptomName: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomName)
        ? prev.filter((s) => s !== symptomName)
        : [...prev, symptomName]
    );
  };

  const handleAddCustomSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms((prev) => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const getFeverStatus = (temperatureVal: number, unit: 'C' | 'F') => {
    const value = unit === 'F' ? ((temperatureVal - 32) * 5) / 9 : temperatureVal;
    if (value <= 37.5) return { text: 'Normal', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    if (value <= 38.4) return { text: 'Low Grade Fever', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
    return { text: 'High Fever', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
  };

  const parsedTemp = parseFloat(temp);
  const tempStatus = !isNaN(parsedTemp) ? getFeverStatus(parsedTemp, tempUnit) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId) {
      alert('Please add a child profile first!');
      return;
    }

    addSicknessLog({
      childId,
      temperature: temp ? parseFloat(temp) : undefined,
      temperatureUnit: tempUnit,
      symptoms: selectedSymptoms,
      notes: notes.trim()
    });

    // Reset form
    setTemp('');
    setSelectedSymptoms([]);
    setNotes('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const activeChild = children.find((c) => c.id === childId);

  return (
    <div className="card quick-log-card">
      <div className="card-header">
        <h3>Log Sickness & Symptoms</h3>
        {activeChild && (
          <span className="badge" style={{ backgroundColor: activeChild.color, color: '#fff' }}>
            Logging for {activeChild.name}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="quick-log-form">
        {selectedChildId === 'all' && children.length > 0 && (
          <div className="form-group">
            <label htmlFor="log-child-select">Select Child</label>
            <select
              id="log-child-select"
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

        <div className="form-row">
          <div className="form-group temp-input-group">
            <label htmlFor="temp-input">Temperature</label>
            <div className="temp-input-wrapper">
              <input
                id="temp-input"
                type="number"
                step="0.1"
                placeholder={tempUnit === 'C' ? 'e.g. 38.2' : 'e.g. 100.8'}
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
              />
              <button
                type="button"
                className={`temp-unit-toggle ${tempUnit === 'C' ? 'active' : ''}`}
                onClick={() => setTempUnit('C')}
              >
                °C
              </button>
              <button
                type="button"
                className={`temp-unit-toggle ${tempUnit === 'F' ? 'active' : ''}`}
                onClick={() => setTempUnit('F')}
              >
                °F
              </button>
            </div>
          </div>

          {tempStatus && (
            <div
              className="temp-status-alert"
              style={{
                borderColor: tempStatus.color,
                color: tempStatus.color,
                backgroundColor: tempStatus.bg
              }}
            >
              <span className="glow-indicator" style={{ backgroundColor: tempStatus.color }} />
              <strong>{tempStatus.text}</strong>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Select Symptoms</label>
          <div className="symptom-chips">
            {presetSymptoms.map((sym) => {
              const isSelected = selectedSymptoms.includes(sym.name);
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
          <label htmlFor="custom-symptom-input">Other Symptom</label>
          <div className="input-with-button">
            <input
              id="custom-symptom-input"
              type="text"
              placeholder="Type symptom and press Add"
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
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

        {selectedSymptoms.length > 0 && (
          <div className="selected-symptoms-list">
            <strong>Selected: </strong>
            {selectedSymptoms.map((sym) => (
              <span key={sym} className="symptom-tag">
                {sym}
                <button type="button" onClick={() => handleSymptomToggle(sym)}>
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="notes-textarea">Notes & Observations</label>
          <textarea
            id="notes-textarea"
            rows={3}
            placeholder="e.g., lethargic, sleeping more than usual, complaining of stomach ache, took some fluids..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={children.length === 0}>
          {children.length === 0 ? 'Create a profile first' : 'Save Health Log'}
        </button>

        {showSuccess && (
          <div className="success-toast">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Health log saved successfully!
          </div>
        )}
      </form>
    </div>
  );
};
