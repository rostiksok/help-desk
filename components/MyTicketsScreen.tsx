'use client';

import { useEffect, useRef, useState } from 'react';
import Badge from './Badge';
import Card from './Card';
import { apiMyTickets } from '@/lib/api';
import type { TicketListItem } from '@/lib/api';
import type { Status, Priority } from '@/lib/types';
import styles from './MyTicketsScreen.module.css';

const STATUS_LABELS: Record<string, string> = {
  new: 'Новий',
  progress: 'В роботі',
  done: 'Вирішено',
  closed: 'Закрито',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Високий',
  medium: 'Середній',
  low: 'Низький',
};

const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  progress: '#F59E0B',
  done: '#10B981',
  closed: '#6B7280',
};

const PAGE_SIZE = 10;

export default function MyTicketsScreen() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async (p: number) => {
    setLoading(true);
    try {
      const data = await apiMyTickets({ page: p, limit: PAGE_SIZE });
      setTickets(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);
      setStatusCounts(data.status_counts || {});
    } catch (err) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(1);
  }, []);

  const goToPage = (p: number) => {
    fetchTickets(p);
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading && tickets.length === 0) {
    return (
      <Card>
        <div className={styles.empty}>
          <i className="ti ti-loader" style={{ fontSize: 28, color: '#9CA3AF' }} />
          <p>Завантаження...</p>
        </div>
      </Card>
    );
  }

  if (!loading && total === 0) {
    return (
      <Card>
        <div className={styles.empty}>
          <i className="ti ti-inbox" style={{ fontSize: 40, color: '#D1D5DB' }} />
          <p>У вас ще немає звернень</p>
          <span>Створіть нове звернення через форму зліва</span>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className={styles.summary}>
        {(['new', 'progress', 'done'] as const).map((s) => {
          const count = statusCounts[s] || 0;
          return (
            <div key={s} className={styles.summaryItem}>
              <span className={styles.summaryDot} style={{ background: STATUS_COLORS[s] }} />
              <span className={styles.summaryLabel}>{STATUS_LABELS[s]}</span>
              <span className={styles.summaryCount}>{count}</span>
            </div>
          );
        })}
      </div>

      <Card noPadding>
        <div ref={tableRef} className={styles.tableHeader}>
          <span>ID</span>
          <span>Тема</span>
          <span>Категорія</span>
          <span>Статус</span>
          <span>Пріоритет</span>
          <span className={styles.right}>Дата</span>
        </div>
        <div className={styles.tableBody}>
          {loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
              Завантаження...
            </div>
          )}
          {!loading && tickets.map((t) => (
            <div key={t.id} className={styles.row}>
              <span className={styles.ticketId}>{t.id}</span>
              <span className={styles.ticketTitle}>{t.title}</span>
              <span className={styles.category}>{t.category ?? '—'}</span>
              <Badge variant={t.status as Status}>{STATUS_LABELS[t.status] ?? t.status}</Badge>
              <Badge variant={t.priority as Priority}>{PRIORITY_LABELS[t.priority] ?? t.priority}</Badge>
              <span className={styles.time}>
                {new Date(t.created_at).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </span>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className={styles.pagination} style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} з {total}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, border: '1px solid #E5E7EB', background: '#FFF',
                  cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1
                }}
              >
                <i className="ti ti-chevron-left" />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, color: '#6B7280' }}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p as number)}
                      style={{
                        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 6, border: '1px solid #E5E7EB',
                        background: p === page ? '#EEF2FF' : '#FFF',
                        color: p === page ? '#4F46E5' : '#374151',
                        fontWeight: p === page ? 600 : 400,
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === pages}
                style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, border: '1px solid #E5E7EB', background: '#FFF',
                  cursor: page === pages ? 'not-allowed' : 'pointer', opacity: page === pages ? 0.5 : 1
                }}
              >
                <i className="ti ti-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
