import { useState, useRef } from 'react';
import { Database, Download, Upload, Trash2, RefreshCw, Info } from 'lucide-react';
import { useLoanStore } from '../store/loan-store';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { loadSampleData, clearAllData, exportData, importData } = useLoanStore();
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-loans-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const success = importData(text);
      setImportStatus(success ? 'Data imported successfully!' : 'Invalid file format.');
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    if (window.confirm('Are you sure? This will delete all your loan data. This action cannot be undone.')) {
      clearAllData();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </div>

      <div className={styles.content}>
        <Card className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Database size={18} /> Data Management
          </h3>

          <div className={styles.actions}>
            <div className={styles.actionItem}>
              <div className={styles.actionInfo}>
                <strong>Load Sample Data</strong>
                <p>Add 2 demo loans to explore the app</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={loadSampleData}
                icon={<RefreshCw size={14} />}
              >
                Load
              </Button>
            </div>

            <div className={styles.actionItem}>
              <div className={styles.actionInfo}>
                <strong>Export Data</strong>
                <p>Download all loan data as JSON</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleExport}
                icon={<Download size={14} />}
              >
                Export
              </Button>
            </div>

            <div className={styles.actionItem}>
              <div className={styles.actionInfo}>
                <strong>Import Data</strong>
                <p>Restore from a JSON backup file</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload size={14} />}
              >
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </div>

            {importStatus && (
              <p className={styles.status}>{importStatus}</p>
            )}

            <div className={styles.divider} />

            <div className={styles.actionItem}>
              <div className={styles.actionInfo}>
                <strong>Clear All Data</strong>
                <p>Delete all loans and payments permanently</p>
              </div>
              <Button
                size="sm"
                variant="danger"
                onClick={handleClear}
                icon={<Trash2 size={14} />}
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>

        <Card className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Info size={18} /> About
          </h3>
          <div className={styles.about}>
            <p><strong>My Loans</strong> — Loan Management App</p>
            <p>Version 1.0.0</p>
            <p>All data is stored locally on your device. No data is sent to any server.</p>
            <div className={styles.features}>
              <span className={styles.featureTag}>EMI Calculator</span>
              <span className={styles.featureTag}>Amortization</span>
              <span className={styles.featureTag}>Payoff Acceleration</span>
              <span className={styles.featureTag}>Avalanche Strategy</span>
              <span className={styles.featureTag}>Snowball Strategy</span>
              <span className={styles.featureTag}>Payment Tracking</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
