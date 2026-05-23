'use client';

import { useAuth } from '@/lib/auth-context';
import styles from './Topbar.module.css';

interface Props {
  title: string;
}

const ROLE_LABELS: Record<string, string> = {
  user: 'Користувач',
  operator: 'Оператор',
  admin: 'Адміністратор',
};

export default function Topbar({ title }: Props) {
  const { user, logout } = useAuth();

  const initials = user
    ? user.name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
    : '??';

  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.right}>
        {user && (
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRole}>{ROLE_LABELS[user.role] ?? user.role}</span>
          </div>
        )}
        <div className={styles.avatarWrap}>
          <div className={styles.avatar} aria-label="Профіль" title={user?.name}>
            {initials}
          </div>
          <button className={styles.logoutBtn} onClick={logout} title="Вийти">
            <i className="ti ti-logout" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
