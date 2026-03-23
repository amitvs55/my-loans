import styles from './Badge.module.css';

interface BadgeProps {
  variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export default function Badge({ variant, children, size = 'sm' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]}`}>
      {children}
    </span>
  );
}
