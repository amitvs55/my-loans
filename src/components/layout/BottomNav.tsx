import { NavLink } from 'react-router';
import { LayoutDashboard, PlusCircle, TrendingUp, Settings } from 'lucide-react';
import styles from './BottomNav.module.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/add-loan', icon: PlusCircle, label: 'Add Loan' },
  { to: '/strategies', icon: TrendingUp, label: 'Strategies' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <Icon size={22} strokeWidth={1.8} />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
