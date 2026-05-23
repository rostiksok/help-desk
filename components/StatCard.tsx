import type { StatData } from '@/lib/types';
import styles from './StatCard.module.css';

export default function StatCard({ label, value, sub, valueColor, subColor }: StatData) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      <div className={styles.sub} style={subColor ? { color: subColor } : undefined}>
        {sub}
      </div>
    </div>
  );
}
