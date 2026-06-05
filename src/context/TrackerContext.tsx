import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Child, SicknessLog, MedicationSchedule, DoseLog } from '../types';
import { clearAllMedicationPhotos, deleteMedicationPhoto } from '../lib/medicationPhotos';

interface TrackerState {
  children: Child[];
  sicknessLogs: SicknessLog[];
  medicationSchedules: MedicationSchedule[];
  doseLogs: DoseLog[];
}

interface TrackerContextType {
  children: Child[];
  sicknessLogs: SicknessLog[];
  medicationSchedules: MedicationSchedule[];
  doseLogs: DoseLog[];
  selectedChildId: string | 'all';
  setSelectedChildId: (id: string | 'all') => void;
  addChild: (child: Omit<Child, 'id'>) => void;
  updateChild: (child: Child) => void;
  deleteChild: (id: string) => void;
  addSicknessLog: (log: Omit<SicknessLog, 'id' | 'timestamp'>) => void;
  updateSicknessLog: (log: SicknessLog) => void;
  deleteSicknessLog: (id: string) => void;
  addMedicationSchedule: (schedule: Omit<MedicationSchedule, 'id' | 'isActive'>) => void;
  toggleMedicationSchedule: (id: string) => void;
  deleteMedicationSchedule: (id: string) => void;
  logDose: (dose: Omit<DoseLog, 'id' | 'timestamp'>) => void;
  updateDoseLog: (dose: DoseLog) => void;
  deleteDoseLog: (id: string) => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  clearAllData: () => void;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'kids_tracker_app_data';

const initialDemoData: TrackerState = {
  children: [
    {
      id: 'demo-liam',
      name: 'Liam',
      dob: '2022-03-12',
      avatar: '👦',
      color: 'hsl(210, 100%, 65%)', // Soft blue
      weight: 15.5,
      weightUnit: 'kg',
      allergies: 'Amoxicillin'
    },
    {
      id: 'demo-emma',
      name: 'Emma',
      dob: '2024-07-25',
      avatar: '👧',
      color: 'hsl(340, 100%, 70%)', // Soft pink/coral
      weight: 11.2,
      weightUnit: 'kg',
      allergies: 'None'
    }
  ],
  sicknessLogs: [
    {
      id: 'log-1',
      childId: 'demo-liam',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      temperature: 38.5,
      temperatureUnit: 'C',
      symptoms: ['Fever', 'Runny Nose'],
      notes: 'Feeling lethargic, warm to touch. Gave water.'
    },
    {
      id: 'log-2',
      childId: 'demo-emma',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      temperature: 37.1,
      temperatureUnit: 'C',
      symptoms: ['Cough'],
      notes: 'Mild cough in the morning. Otherwise active and happy.'
    }
  ],
  medicationSchedules: [
    {
      id: 'sched-1',
      childId: 'demo-liam',
      medicationName: 'Ibuprofen (Infant)',
      dosage: '4 ml',
      frequencyHours: 8,
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      notes: 'Take after meals. Max 3 times a day.'
    },
    {
      id: 'sched-2',
      childId: 'demo-emma',
      medicationName: 'Acetaminophen (Drops)',
      dosage: '3 ml',
      frequencyHours: 6,
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      notes: 'For fever control.'
    }
  ],
  doseLogs: [
    {
      id: 'dose-1',
      childId: 'demo-liam',
      scheduleId: 'sched-1',
      medicationName: 'Ibuprofen (Infant)',
      dosage: '4 ml',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(), // 2.5h ago
      notes: 'Fever reduced to 37.8C after dose.'
    }
  ]
};

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TrackerState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved data', e);
      }
    }
    return initialDemoData;
  });

  const [selectedChildId, setSelectedChildId] = useState<string | 'all'>('all');

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addChild = (childData: Omit<Child, 'id'>) => {
    const newChild: Child = {
      ...childData,
      id: `child-${Date.now()}`
    };
    setState((prev) => ({
      ...prev,
      children: [...prev.children, newChild]
    }));
  };

  const updateChild = (updatedChild: Child) => {
    setState((prev) => ({
      ...prev,
      children: prev.children.map((c) => (c.id === updatedChild.id ? updatedChild : c))
    }));
  };

  const deleteChild = (id: string) => {
    state.medicationSchedules
      .filter((s) => s.childId === id && s.photoId)
      .forEach((s) => {
        deleteMedicationPhoto(s.photoId!).catch((error) => {
          console.error('Failed to delete medication photo', error);
        });
      });

    setState((prev) => ({
      ...prev,
      children: prev.children.filter((c) => c.id !== id),
      sicknessLogs: prev.sicknessLogs.filter((l) => l.childId !== id),
      medicationSchedules: prev.medicationSchedules.filter((s) => s.childId !== id),
      doseLogs: prev.doseLogs.filter((d) => d.childId !== id)
    }));
    if (selectedChildId === id) {
      setSelectedChildId('all');
    }
  };

  const addSicknessLog = (logData: Omit<SicknessLog, 'id' | 'timestamp'>) => {
    const newLog: SicknessLog = {
      ...logData,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setState((prev) => ({
      ...prev,
      sicknessLogs: [newLog, ...prev.sicknessLogs]
    }));
  };

  const updateSicknessLog = (updatedLog: SicknessLog) => {
    setState((prev) => ({
      ...prev,
      sicknessLogs: prev.sicknessLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l))
    }));
  };

  const deleteSicknessLog = (id: string) => {
    setState((prev) => ({
      ...prev,
      sicknessLogs: prev.sicknessLogs.filter((l) => l.id !== id)
    }));
  };

  const addMedicationSchedule = (scheduleData: Omit<MedicationSchedule, 'id' | 'isActive'>) => {
    const newSchedule: MedicationSchedule = {
      ...scheduleData,
      id: `sched-${Date.now()}`,
      isActive: true
    };
    setState((prev) => ({
      ...prev,
      medicationSchedules: [...prev.medicationSchedules, newSchedule]
    }));
  };

  const toggleMedicationSchedule = (id: string) => {
    setState((prev) => ({
      ...prev,
      medicationSchedules: prev.medicationSchedules.map((s) =>
        s.id === id ? { ...s, isActive: !s.isActive } : s
      )
    }));
  };

  const deleteMedicationSchedule = (id: string) => {
    const schedule = state.medicationSchedules.find((s) => s.id === id);
    if (schedule?.photoId) {
      deleteMedicationPhoto(schedule.photoId).catch((error) => {
        console.error('Failed to delete medication photo', error);
      });
    }

    setState((prev) => ({
      ...prev,
      medicationSchedules: prev.medicationSchedules.filter((s) => s.id !== id),
      // Keep doseLogs for historical data but unlink scheduling ID
      doseLogs: prev.doseLogs.map((d) => (d.scheduleId === id ? { ...d, scheduleId: undefined } : d))
    }));
  };

  const logDose = (doseData: Omit<DoseLog, 'id' | 'timestamp'>) => {
    const newDose: DoseLog = {
      ...doseData,
      id: `dose-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setState((prev) => ({
      ...prev,
      doseLogs: [newDose, ...prev.doseLogs]
    }));
  };

  const updateDoseLog = (updatedDose: DoseLog) => {
    setState((prev) => ({
      ...prev,
      doseLogs: prev.doseLogs.map((d) => (d.id === updatedDose.id ? updatedDose : d))
    }));
  };

  const deleteDoseLog = (id: string) => {
    setState((prev) => ({
      ...prev,
      doseLogs: prev.doseLogs.filter((d) => d.id !== id)
    }));
  };

  const exportData = () => {
    return JSON.stringify(state, null, 2);
  };

  const importData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (
        parsed &&
        Array.isArray(parsed.children) &&
        Array.isArray(parsed.sicknessLogs) &&
        Array.isArray(parsed.medicationSchedules) &&
        Array.isArray(parsed.doseLogs)
      ) {
        setState(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  const clearAllData = () => {
    clearAllMedicationPhotos().catch((error) => {
      console.error('Failed to clear medication photos', error);
    });
    setState({
      children: [],
      sicknessLogs: [],
      medicationSchedules: [],
      doseLogs: []
    });
    setSelectedChildId('all');
  };

  return (
    <TrackerContext.Provider
      value={{
        children: state.children,
        sicknessLogs: state.sicknessLogs,
        medicationSchedules: state.medicationSchedules,
        doseLogs: state.doseLogs,
        selectedChildId,
        setSelectedChildId,
        addChild,
        updateChild,
        deleteChild,
        addSicknessLog,
        updateSicknessLog,
        deleteSicknessLog,
        addMedicationSchedule,
        toggleMedicationSchedule,
        deleteMedicationSchedule,
        logDose,
        updateDoseLog,
        deleteDoseLog,
        exportData,
        importData,
        clearAllData
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
};
