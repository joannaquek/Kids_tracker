export interface Child {
  id: string;
  name: string;
  dob: string;
  avatar: string; // Emoji or custom avatar
  color: string;  // Accent color (HSL or Hex)
  weight?: number;
  weightUnit: 'kg' | 'lbs';
  allergies?: string;
}

export interface SicknessLog {
  id: string;
  childId: string;
  timestamp: string; // ISO string
  temperature?: number;
  temperatureUnit: 'C' | 'F';
  symptoms: string[];
  notes?: string;
}

export interface MedicationSchedule {
  id: string;
  childId: string;
  medicationName: string;
  dosage: string;
  frequencyHours: number; // Interval in hours (e.g., 4, 6, 12)
  startDate: string;      // YYYY-MM-DD
  endDate?: string;       // YYYY-MM-DD (optional)
  isActive: boolean;
  notes?: string;
  photoId?: string;       // IndexedDB key for saved medication photo
}

export interface DoseLog {
  id: string;
  childId: string;
  scheduleId?: string; // Optional if logged as a one-off medication
  medicationName: string;
  dosage: string;
  timestamp: string; // ISO string
  notes?: string;
}
