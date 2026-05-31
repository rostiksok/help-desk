'use client';

import { useEffect, useState } from 'react';
import Card from './Card';
import { apiListOperators, apiCreateOperator } from '@/lib/api';
import styles from './ManageOperatorsScreen.module.css';

interface OperatorRow {
  id: string;
  name: string;
  initials: string;
  active_tickets: number;
  avatar_bg?: string;
  avatar_color?: string;
}

const AVATAR_FALLBACK = { bg: '#EEF2FF', color: '#4F46E5' };

export default function ManageOperatorsScreen() {
  const [operators, setOperators] = useState<OperatorRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchOperators = async () => {
    setLoadingList(true);
    try {
      const data = await apiListOperators();
      setOperators(data);
    } catch {
      setOperators([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchOperators(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const created = await apiCreateOperator({ name: name.trim(), email: email.trim(), password });
      setSuccess(`Оператора ${created.name} успішно створено`);
      setName('');
      setEmail('');
      setPassword('');
      await fetchOperators();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка при створенні оператора');
    } finally {
      setSaving(false);
    }
  };

  const isValid = name.trim().length >= 2 && email.includes('@') && password.length >= 6;

  return (
    <div className={styles.layout}>

      {/* ── Список операторів ── */}
      <Card>
        <h3 className={styles.sectionTitle}>
          <i className="ti ti-users" />
          Оператори системи
        </h3>

        {loadingList ? (
          <div className={styles.empty}>
            <i className="ti ti-loader" style={{ fontSize: 24, color: '#9CA3AF' }} />
          </div>
        ) : operators.length === 0 ? (
          <div className={styles.empty}>
            <i className="ti ti-user-off" style={{ fontSize: 32, color: '#D1D5DB' }} />
            <p>Операторів ще немає</p>
          </div>
        ) : (
          <div className={styles.operatorList}>
            {operators.map((op) => (
              <div key={op.id} className={styles.operatorRow}>
                <div
                  className={styles.avatar}
                  style={{
                    background: op.avatar_bg ?? AVATAR_FALLBACK.bg,
                    color: op.avatar_color ?? AVATAR_FALLBACK.color,
                  }}
                >
                  {op.initials}
                </div>
                <div className={styles.operatorInfo}>
                  <span className={styles.operatorName}>{op.name}</span>
                  <span className={styles.operatorMeta}>
                    {op.active_tickets > 0
                      ? `${op.active_tickets} активних тікетів`
                      : 'Немає активних тікетів'}
                  </span>
                </div>
                <span className={`${styles.ticketBadge} ${op.active_tickets > 0 ? styles.ticketBadgeActive : ''}`}>
                  {op.active_tickets}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Форма створення оператора ── */}
      <Card accentTop>
        <h3 className={styles.sectionTitle}>
          <i className="ti ti-user-plus" />
          Додати оператора
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="formGroup">
            <label className="formLabel" htmlFor="op-name">Повне ім'я</label>
            <input
              id="op-name"
              className="formInput"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Іваненко І.І."
              autoComplete="off"
            />
          </div>

          <div className="formGroup">
            <label className="formLabel" htmlFor="op-email">Email</label>
            <input
              id="op-email"
              className="formInput"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@helpdesk.ua"
              autoComplete="off"
            />
          </div>

          <div className="formGroup">
            <label className="formLabel" htmlFor="op-password">
              Пароль
              <span className={styles.hint}>мінімум 6 символів</span>
            </label>
            <input
              id="op-password"
              className="formInput"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className={styles.alertError}>
              <i className="ti ti-alert-circle" />
              {error}
            </div>
          )}

          {success && (
            <div className={styles.alertSuccess}>
              <i className="ti ti-circle-check" />
              {success}
            </div>
          )}

          <button className="btnPrimary" type="submit" disabled={saving || !isValid} style={{ width: '100%' }}>
            <i className={`ti ${saving ? 'ti-loader' : 'ti-user-plus'}`} aria-hidden="true" />
            {saving ? 'Створення...' : 'Створити оператора'}
          </button>
        </form>
      </Card>

    </div>
  );
}
