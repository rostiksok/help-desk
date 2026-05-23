'use client';

import { useEffect, useState } from 'react';
import Card from './Card';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';
import OperatorCard from './OperatorCard';
import { apiDashboard } from '@/lib/api';
import type { DashboardResponse } from '@/lib/api';
import styles from './DashboardScreen.module.css';

const FALLBACK: DashboardResponse = {
  stats: [
    { label: 'Всього звернень', value: '—', sub: 'за 30 днів' },
    { label: 'Відкрито зараз', value: '—', sub: '...' },
    { label: 'Середній час відповіді', value: '—', sub: '...' },
    { label: 'Точність AI-аналізу', value: '—', sub: '...' },
  ],
  categories: [],
  week_data: [0, 0, 0, 0, 0, 0, 0],
  week_days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  operators: [],
};

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardResponse>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiDashboard()
      .then(setData)
      .catch(() => {/* keep fallback */})
      .finally(() => setLoading(false));
  }, []);

  const maxBar = Math.max(...data.week_data, 1);

  return (
    <>
      <div className={styles.statGrid}>
        {data.stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            valueColor={stat.value_color ?? undefined}
            subColor={stat.sub_color ?? undefined}
          />
        ))}
      </div>

      <div className={styles.twoCol}>
        <Card>
          <h2 className="sectionTitle">Звернення за тиждень</h2>
          {loading ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>
              Завантаження...
            </div>
          ) : (
            <>
              <div className={styles.chartWrap} role="img" aria-label="Стовпчаста діаграма звернень за тиждень">
                {data.week_data.map((val, i) => (
                  <div
                    key={data.week_days[i]}
                    className={styles.bar}
                    style={{ height: `${Math.round((val / maxBar) * 100)}%` }}
                    title={`${data.week_days[i]}: ${val}`}
                  />
                ))}
              </div>
              <div className={styles.chartLabels} aria-hidden="true">
                {data.week_days.map((day) => (
                  <span key={day} className={styles.chartLabel}>{day}</span>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card>
          <h2 className="sectionTitle">Категорії звернень</h2>
          <div style={{ marginTop: 12 }}>
            {data.categories.length === 0 && !loading && (
              <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>
                Даних ще немає
              </p>
            )}
            {data.categories.map((cat) => (
              <ProgressBar key={cat.label} label={cat.label} percentage={cat.percentage} color={cat.color} />
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="sectionTitle">Навантаження операторів</h2>
        {data.operators.length === 0 && !loading ? (
          <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '16px 0' }}>
            Операторів не знайдено
          </p>
        ) : (
          <div className={styles.operatorsGrid}>
            {data.operators.map((op) => (
              <OperatorCard
                key={op.id}
                operator={{
                  initials: op.initials,
                  name: op.name,
                  activeTickets: op.active_tickets,
                  avatarBg: op.avatar_bg,
                  avatarColor: op.avatar_color,
                }}
              />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
