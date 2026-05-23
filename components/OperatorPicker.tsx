'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './OperatorPicker.module.css';

interface Operator {
  id: string;
  name: string;
  active_tickets: number;
}

interface Props {
  operators: Operator[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

const AVATAR_COLORS = [
  { bg: '#DBEAFE', color: '#1E40AF' },
  { bg: '#D1FAE5', color: '#065F46' },
  { bg: '#EDE9FE', color: '#5B21B6' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#FCE7F3', color: '#9D174D' },
];

export default function OperatorPicker({ operators, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = operators.find((o) => o.id === value) ?? null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
      >
        {selected ? (
          <>
            <span
              className={styles.triggerAvatar}
              style={AVATAR_COLORS[operators.indexOf(selected) % AVATAR_COLORS.length]}
            >
              {getInitials(selected.name)}
            </span>
            <span className={styles.triggerName}>{selected.name}</span>
            <span className={styles.triggerCount}>{selected.active_tickets} активних</span>
          </>
        ) : (
          <>
            <span className={styles.triggerAvatarEmpty}>
              <i className="ti ti-user-question" />
            </span>
            <span className={styles.triggerPlaceholder}>— не призначено —</span>
          </>
        )}
        <i className={`ti ti-chevron-down ${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div
            className={`${styles.option} ${!value ? styles.optionActive : ''}`}
            onClick={() => handleSelect('')}
          >
            <span className={styles.avatarEmpty}>
              <i className="ti ti-user-off" />
            </span>
            <span className={styles.optionName}>— не призначено —</span>
          </div>

          <div className={styles.divider} />

          {operators.map((op, i) => {
            const style = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const isSelected = op.id === value;
            return (
              <div
                key={op.id}
                className={`${styles.option} ${isSelected ? styles.optionActive : ''}`}
                onClick={() => handleSelect(op.id)}
              >
                <span className={styles.avatar} style={style}>
                  {getInitials(op.name)}
                </span>
                <span className={styles.optionName}>{op.name}</span>
                <span className={`${styles.badge} ${op.active_tickets >= 5 ? styles.badgeBusy : ''}`}>
                  {op.active_tickets} активних
                </span>
                {isSelected && <i className="ti ti-check" style={{ marginLeft: 'auto', color: '#2563EB', fontSize: 15 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
