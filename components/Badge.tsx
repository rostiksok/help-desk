import type { BadgeVariant } from '@/lib/types';
import styles from './Badge.module.css';

interface Props {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export default function Badge({ variant, children }: Props) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
}
