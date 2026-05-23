'use client';

import { useAuth } from '@/lib/auth-context';
import type { Screen } from '@/lib/types';
import styles from './Sidebar.module.css';

interface NavItem {
  id: Screen;
  icon: string;
  label: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'submit',     icon: 'ti-circle-plus', label: 'Нове звернення', roles: ['user', 'operator', 'admin'] },
  { id: 'my-tickets', icon: 'ti-files',       label: 'Мої звернення',  roles: ['user'] },
  { id: 'operator',   icon: 'ti-list-check',  label: 'Кабінет оператора', roles: ['operator', 'admin'] },
  { id: 'dashboard',  icon: 'ti-chart-bar',   label: 'Дашборд',        roles: ['operator', 'admin'] },
];

interface Props {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function Sidebar({ activeScreen, onNavigate }: Props) {
  const { user } = useAuth();
  const role = user?.role ?? 'user';

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <i className="ti ti-headset" aria-hidden="true" />
        Help<span>Desk</span>
      </div>

      <nav className={styles.nav} aria-label="Головна навігація">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activeScreen === item.id ? styles.active : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={activeScreen === item.id ? 'page' : undefined}
          >
            <i className={`ti ${item.icon}`} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className={styles.navBottom}>
        {role === 'admin' && (
          <div className={styles.adminBadge}>
            <i className="ti ti-shield-check" />
            Адміністратор
          </div>
        )}
      </div>
    </aside>
  );
}
