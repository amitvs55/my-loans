import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  percentage: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({
  percentage,
  color = 'var(--color-accent)',
  height = 6,
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className={styles.wrapper}>
      <div className={styles.track} style={{ height }}>
        <div
          className={styles.fill}
          style={{
            width: `${clamped}%`,
            backgroundColor: color,
            height,
          }}
        />
      </div>
      {showLabel && (
        <span className={styles.label}>{Math.round(clamped)}%</span>
      )}
    </div>
  );
}
