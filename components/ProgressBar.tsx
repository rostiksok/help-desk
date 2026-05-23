import type { CategoryData } from '@/lib/types';
import styles from './ProgressBar.module.css';

export default function ProgressBar({ label, percentage, color }: CategoryData) {
  return (
    <div className={styles.item}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{percentage}%</span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{
            width: `${percentage}%`,
            ...(color ? { background: color } : {}),
          }}
        />
      </div>
    </div>
  );
}
