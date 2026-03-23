import type { ReactNode, CSSProperties } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'accent';
  style?: CSSProperties;
  onClick?: () => void;
}

export default function Card({ children, className = '', variant = 'default', style, onClick }: CardProps) {
  return (
    <div
      className={`${styles.card} ${styles[variant]} ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
