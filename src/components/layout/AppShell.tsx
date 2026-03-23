import { Outlet } from 'react-router';
import { useEffect, useRef } from 'react';
import BottomNav from './BottomNav';
import { useLoanStore } from '../../store/loan-store';
import styles from './AppShell.module.css';

export default function AppShell() {
  const seedDataLoaded = useLoanStore(s => s.settings.seedDataLoaded);
  const loadSampleData = useLoanStore(s => s.loadSampleData);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!seedDataLoaded && !hasLoaded.current) {
      hasLoaded.current = true;
      loadSampleData();
    }
  }, [seedDataLoaded, loadSampleData]);

  return (
    <div className={styles.shell}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
