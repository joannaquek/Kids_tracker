import React, { useRef, useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { getAllMedicationPhotos, restoreMedicationPhotos } from '../lib/medicationPhotos';

export const BackupRestore: React.FC = () => {
  const { exportData, importData, clearAllData } = useTracker();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  const handleExport = async () => {
    try {
      const data = JSON.parse(exportData());
      data.medicationPhotos = await getAllMedicationPhotos();
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const dateStr = new Date().toISOString().slice(0, 10);
      const exportFileDefaultName = `kids-tracker-backup-${dateStr}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      console.error('Export failed', e);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;

    if (!files || files.length === 0) return;

    fileReader.onload = async (e) => {
      const target = e.target;
      if (!target || !target.result) return;

      const content = target.result as string;

      try {
        const parsed = JSON.parse(content) as {
          children?: unknown;
          sicknessLogs?: unknown;
          medicationSchedules?: unknown;
          doseLogs?: unknown;
          medicationPhotos?: Record<string, string>;
        };

        const { medicationPhotos, ...trackerData } = parsed;
        const success = importData(JSON.stringify(trackerData));

        if (!success) {
          setImportStatus({
            type: 'error',
            message: 'Failed to import. The file might be corrupted or contains invalid data.'
          });
          setTimeout(() => setImportStatus({ type: null, message: '' }), 4000);
          return;
        }

        if (medicationPhotos && typeof medicationPhotos === 'object') {
          await restoreMedicationPhotos(medicationPhotos);
        }
        setImportStatus({
          type: 'success',
          message: 'Data imported successfully! Your dashboard has been updated.'
        });
        setTimeout(() => setImportStatus({ type: null, message: '' }), 4000);
      } catch (error) {
        console.error('Import failed', error);
        setImportStatus({
          type: 'error',
          message: 'Failed to import. The file might be corrupted or contains invalid data.'
        });
        setTimeout(() => setImportStatus({ type: null, message: '' }), 4000);
      }

      // Reset file input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    fileReader.readAsText(files[0]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    const doubleConfirm =
      confirm('WARNING: This will permanently delete all kids profiles, medication schedules, and health logs.') &&
      confirm('Are you absolutely sure? This action cannot be undone.');

    if (doubleConfirm) {
      clearAllData();
      alert('All application data cleared.');
    }
  };

  return (
    <div className="card settings-card">
      <div className="card-header">
        <h3>App Settings & Data Backup</h3>
      </div>

      <div className="settings-body">
        <p className="settings-desc">
          Your data is stored locally in your browser's memory and is fully private.
          We recommend backing up your data regularly to prevent accidental loss if you clear browser caches.
        </p>

        <div className="settings-actions-row">
          <button className="btn btn-outline" onClick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Backup (.json)
          </button>

          <button className="btn btn-secondary" onClick={triggerFileInput}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Import Backup (.json)
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>

        {importStatus.type && (
          <div className={`import-alert ${importStatus.type}`}>
            {importStatus.type === 'success' ? '✅ ' : '❌ '}
            {importStatus.message}
          </div>
        )}

        <hr className="settings-divider" />

        <div className="danger-zone">
          <h4>Danger Zone</h4>
          <p>Delete all data and reset the application to its initial state.</p>
          <button className="btn btn-danger" onClick={handleReset}>
            Reset All Application Data
          </button>
        </div>
      </div>
    </div>
  );
};
