'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiRegister } from '@/lib/api';
import styles from './LoginScreen.module.css';

export default function LoginScreen() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'operator'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await apiRegister({ email, name, password, role });
      }
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка. Перевірте дані.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <i className="ti ti-headset" aria-hidden="true" />
          Help<span>Desk</span> <span className={styles.ai}>AI</span>
        </div>
        <p className={styles.sub}>
          {mode === 'login' ? 'Увійдіть у свій акаунт' : 'Створіть новий акаунт'}
        </p>

        {error && (
          <div className={styles.error}>
            <i className="ti ti-alert-circle" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'register' && (
            <div className="formGroup">
              <label className="formLabel" htmlFor="name">Повне ім'я</label>
              <input
                id="name"
                className="formInput"
                placeholder="Іванenko І.І."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="formGroup">
            <label className="formLabel" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="formInput"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="formGroup">
            <label className="formLabel" htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              className="formInput"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {mode === 'register' && (
            <div className="formGroup">
              <label className="formLabel" htmlFor="role">Роль</label>
              <select
                id="role"
                className="formSelect"
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'operator')}
              >
                <option value="user">Користувач</option>
                <option value="operator">Оператор</option>
              </select>
            </div>
          )}

          <button type="submit" className={`btnPrimary ${styles.submitBtn}`} disabled={loading}>
            <i className={`ti ${loading ? 'ti-loader' : mode === 'login' ? 'ti-login' : 'ti-user-plus'}`} />
            {loading ? 'Завантаження...' : mode === 'login' ? 'Увійти' : 'Зареєструватись'}
          </button>
        </form>

        <div className={styles.switchRow}>
          {mode === 'login' ? (
            <>
              Немає акаунту?{' '}
              <button className={styles.switchBtn} onClick={() => { setMode('register'); setError(''); }}>
                Зареєструватись
              </button>
            </>
          ) : (
            <>
              Вже є акаунт?{' '}
              <button className={styles.switchBtn} onClick={() => { setMode('login'); setError(''); }}>
                Увійти
              </button>
            </>
          )}
        </div>

        <div className={styles.demo}>
          <p className={styles.demoTitle}>Демо-акаунти:</p>
          <div className={styles.demoGrid}>
            {[
              { label: 'Адмін', email: 'admin@helpdesk.ua', pass: 'admin123' },
              { label: 'Оператор', email: 'zhygailo@helpdesk.ua', pass: 'operator123' },
              { label: 'Користувач', email: 'user@example.com', pass: 'user123' },
            ].map((d) => (
              <button
                key={d.email}
                className={styles.demoBtn}
                type="button"
                onClick={() => { setEmail(d.email); setPassword(d.pass); setMode('login'); }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
