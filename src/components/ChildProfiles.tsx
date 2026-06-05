import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import type { Child } from '../types';

export const ChildProfiles: React.FC = () => {
  const { children, selectedChildId, setSelectedChildId, addChild, updateChild, deleteChild } = useTracker();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [avatar, setAvatar] = useState('👦');
  const [color, setColor] = useState('hsl(210, 100%, 65%)');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [allergies, setAllergies] = useState('');

  const avatars = ['👦', '👧', '👶', '🦁', '🐼', '🦊', '🐨', '🦄', '🦖', '🐝', '🐸', '🐙'];
  const colors = [
    { name: 'Blue', value: 'hsl(210, 100%, 65%)' },
    { name: 'Pink/Coral', value: 'hsl(340, 100%, 70%)' },
    { name: 'Green', value: 'hsl(140, 75%, 65%)' },
    { name: 'Purple', value: 'hsl(270, 85%, 72%)' },
    { name: 'Orange', value: 'hsl(30, 95%, 65%)' },
    { name: 'Teal', value: 'hsl(180, 75%, 60%)' }
  ];

  const handleOpenAdd = () => {
    setEditingChild(null);
    setName('');
    setDob('');
    setAvatar('👦');
    setColor('hsl(210, 100%, 65%)');
    setWeight('');
    setWeightUnit('kg');
    setAllergies('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (child: Child, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection when clicking edit
    setEditingChild(child);
    setName(child.name);
    setDob(child.dob);
    setAvatar(child.avatar);
    setColor(child.color);
    setWeight(child.weight ? child.weight.toString() : '');
    setWeightUnit(child.weightUnit);
    setAllergies(child.allergies || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dob) return;

    const childPayload = {
      name,
      dob,
      avatar,
      color,
      weight: weight ? parseFloat(weight) : undefined,
      weightUnit,
      allergies: allergies.trim() || 'None'
    };

    if (editingChild) {
      updateChild({
        ...childPayload,
        id: editingChild.id
      });
    } else {
      addChild(childPayload);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this child profile? This will delete all their health logs.')) {
      deleteChild(id);
      setIsFormOpen(false);
    }
  };

  return (
    <div className="profiles-container">
      <div className="section-header">
        <h2>Children Profiles</h2>
        <button className="btn btn-secondary" onClick={handleOpenAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Child
        </button>
      </div>

      <div className="profiles-list">
        <div
          className={`profile-card ${selectedChildId === 'all' ? 'active' : ''}`}
          style={{ '--child-color': 'var(--accent)' } as React.CSSProperties}
          onClick={() => setSelectedChildId('all')}
        >
          <div className="profile-avatar all-kids-avatar">👥</div>
          <div className="profile-details">
            <span className="profile-name">All Kids</span>
            <span className="profile-subtitle">{children.length} profiles</span>
          </div>
        </div>

        {children.map((child) => (
          <div
            key={child.id}
            className={`profile-card ${selectedChildId === child.id ? 'active' : ''}`}
            style={{ '--child-color': child.color } as React.CSSProperties}
            onClick={() => setSelectedChildId(child.id)}
          >
            <div className="profile-avatar" style={{ backgroundColor: child.color }}>
              {child.avatar}
            </div>
            <div className="profile-details">
              <span className="profile-name">{child.name}</span>
              <span className="profile-subtitle">
                {calculateAge(child.dob)}
              </span>
            </div>
            <button
              className="profile-edit-btn"
              onClick={(e) => handleOpenEdit(child, e)}
              title="Edit Profile"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingChild ? `Edit Profile: ${editingChild.name}` : 'Add New Child'}</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Liam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Weight (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="form-group half">
                  <label>Weight Unit</label>
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lbs')}
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Allergies / Health Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Penicillin, Ibuprofen (or 'None')"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Select Avatar</label>
                <div className="avatar-picker">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      className={`avatar-option ${avatar === av ? 'selected' : ''}`}
                      onClick={() => setAvatar(av)}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Select Theme Color</label>
                <div className="color-picker">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`color-option ${color === c.value ? 'selected' : ''}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setColor(c.value)}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                {editingChild && (
                  <button
                    type="button"
                    className="btn btn-danger mr-auto"
                    onClick={(e) => handleDelete(editingChild.id, e)}
                  >
                    Delete Profile
                  </button>
                )}
                <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingChild ? 'Save Changes' : 'Add Child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate age in human-readable format
function calculateAge(dobString: string): string {
  if (!dobString) return '';
  const dob = new Date(dobString);
  const now = new Date();
  
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  
  if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
    years--;
    months += 12;
  }
  
  if (years >= 2) {
    return `${years} yrs`;
  } else if (years === 1) {
    return `1 yr ${months} mos`;
  } else {
    return `${months} mos`;
  }
}
