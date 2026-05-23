import type { Operator } from '@/lib/types';
import styles from './OperatorCard.module.css';

interface Props {
  operator: Operator;
}

export default function OperatorCard({ operator }: Props) {
  const avatarStyle =
    operator.avatarBg
      ? { background: operator.avatarBg, color: operator.avatarColor }
      : undefined;

  return (
    <div className={styles.card}>
      <div className={styles.avatar} style={avatarStyle}>
        {operator.initials}
      </div>
      <div>
        <div className={styles.name}>{operator.name}</div>
        <div className={styles.tickets}>{operator.activeTickets} активних тікетів</div>
      </div>
    </div>
  );
}
