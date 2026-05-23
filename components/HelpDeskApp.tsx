'use client';

import { useState, useEffect } from 'react';
import type { Screen } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SubmitScreen from './SubmitScreen';
import OperatorScreen from './OperatorScreen';
import DashboardScreen from './DashboardScreen';
import MyTicketsScreen from './MyTicketsScreen';
import LoginScreen from './LoginScreen';
import styles from './HelpDeskApp.module.css';

const SCREEN_TITLES: Record<Screen, string> = {
  submit:      'Нове звернення',
  operator:    'Кабінет оператора',
  dashboard:   'Аналітичний дашборд',
  'my-tickets': 'Мої звернення',
};

const DEFAULT_SCREEN: Record<string, Screen> = {
  user:     'submit',
  operator: 'operator',
  admin:    'dashboard',
};

export default function HelpDeskApp() {
  const { user, loading } = useAuth();
  const [activeScreen, setActiveScreen] = useState<Screen>('submit');

  useEffect(() => {
    if (user) {
      setActiveScreen(DEFAULT_SCREEN[user.role] ?? 'submit');
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%' }}>
        <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
          <i className="ti ti-loader" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
          <span style={{ fontSize: 14 }}>Завантаження...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className={styles.app}>
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <div className={styles.main}>
        <Topbar title={SCREEN_TITLES[activeScreen]} />
        <main className={styles.content} key={activeScreen}>
          {activeScreen === 'submit'      && <SubmitScreen />}
          {activeScreen === 'operator'    && <OperatorScreen />}
          {activeScreen === 'dashboard'   && <DashboardScreen />}
          {activeScreen === 'my-tickets'  && <MyTicketsScreen />}
        </main>
      </div>
    </div>
  );
}
