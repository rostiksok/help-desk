'use client';

import { useEffect, useRef, useState } from 'react';
import Badge from './Badge';
import Card from './Card';
import { apiMyTickets, apiGetTicket, apiReply } from '@/lib/api';
import type { TicketListItem, TicketOut } from '@/lib/api';
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

  const [detailTicket, setDetailTicket] = useState<TicketOut | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async (p: number) => {
    setLoading(true);
    try {
      const data = await apiMyTickets({ page: p, limit: PAGE_SIZE });
      setTickets(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);
      setStatusCounts(data.status_counts || {});
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(1); }, []);

  const goToPage = (p: number) => {
    fetchTickets(p);
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRowClick = async (ticketId: string) => {
    if (detailTicket?.id === ticketId) { setDetailTicket(null); return; }
    try {
      const full = await apiGetTicket(ticketId);
      setDetailTicket(full);
      setReplyText('');
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    } catch { /* ignore */ }
  };

  const handleSendReply = async () => {
    if (!detailTicket || !replyText.trim()) return;
    setSending(true);
    try {
      await apiReply(detailTicket.id, replyText);
      const updated = await apiGetTicket(detailTicket.id);
      setDetailTicket(updated);
      setReplyText('');
    } catch { /* ignore */ }
    finally { setSending(false); }
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

  const isResolved = (status: string) => status === 'done' || status === 'closed';

  return (
    <>
      <div className={styles.summary}>
        {(['new', 'progress', 'done'] as const).map((s) => (
          <div key={s} className={styles.summaryItem}>
            <span className={styles.summaryDot} style={{ background: STATUS_COLORS[s] }} />
            <span className={styles.summaryLabel}>{STATUS_LABELS[s]}</span>
            <span className={styles.summaryCount}>{statusCounts[s] || 0}</span>
          </div>
        ))}
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
            <div
              key={t.id}
              className={`${styles.row} ${styles.rowClickable} ${detailTicket?.id === t.id ? styles.rowActive : ''}`}
              onClick={() => handleRowClick(t.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleRowClick(t.id)}
              aria-expanded={detailTicket?.id === t.id}
            >
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

        {!loading && pages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} з {total}
            </span>
            <div className={styles.paginationBtns}>
              <button className={styles.pageBtn} onClick={() => goToPage(page - 1)} disabled={page === 1}>
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
                    <span key={`e-${i}`} className={styles.pageEllipsis}>…</span>
                  ) : (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                      onClick={() => goToPage(p as number)}
                    >
                      {p}
                    </button>
                  )
                )}
              <button className={styles.pageBtn} onClick={() => goToPage(page + 1)} disabled={page === pages}>
                <i className="ti ti-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {detailTicket && (
        <div ref={detailRef}>
          <Card accentTop>
            {/* Header */}
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.detailMeta}>
                  <span>{detailTicket.id}</span>
                  <span>&bull;</span>
                  <span>{detailTicket.category ?? detailTicket.request_type}</span>
                  <span>&bull;</span>
                  <span>{new Date(detailTicket.created_at).toLocaleString('uk-UA')}</span>
                </div>
                <h2 className={styles.detailTitle}>{detailTicket.title}</h2>
              </div>
              <div className={styles.detailBadges}>
                <Badge variant={detailTicket.priority as Priority}>
                  {PRIORITY_LABELS[detailTicket.priority] ?? detailTicket.priority}
                </Badge>
                <Badge variant={detailTicket.status as Status}>
                  {STATUS_LABELS[detailTicket.status] ?? detailTicket.status}
                </Badge>
              </div>
            </div>

            {/* Operator info */}
            {detailTicket.operator_name && (
              <div className={styles.operatorInfo}>
                <i className="ti ti-user-check" />
                Відповідальний оператор: <strong>{detailTicket.operator_name}</strong>
              </div>
            )}

            {/* Description */}
            <div className="formGroup">
              <label className="formLabel">Опис звернення</label>
              <p className={styles.description}>{detailTicket.description}</p>
            </div>

            {/* Attachments */}
            {detailTicket.attachments.length > 0 && (
              <div className="formGroup">
                <label className="formLabel">
                  <i className="ti ti-paperclip" style={{ marginRight: 4 }} />
                  Вкладення ({detailTicket.attachments.length})
                </label>
                <div className={styles.attachments}>
                  {detailTicket.attachments.map((a) => {
                    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}${a.url}`;
                    return (
                      <a key={a.id} href={fileUrl} target="_blank" rel="noopener noreferrer" className={styles.attachmentItem} title={a.filename}>
                        <span className={styles.attachmentIcon}>
                          <i className={`ti ${a.content_type.startsWith('image/') ? 'ti-photo' : a.content_type === 'application/pdf' ? 'ti-file-type-pdf' : 'ti-file'}`} />
                        </span>
                        <span className={styles.attachmentName}>{a.filename}</span>
                        <i className="ti ti-external-link" style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Replies thread */}
            {detailTicket.replies.length > 0 && (
              <div className="formGroup">
                <label className="formLabel">Листування</label>
                <div className={styles.thread}>
                  {detailTicket.replies.map((r) => (
                    <div key={r.id} className={`${styles.replyItem} ${r.is_operator ? styles.replyOperator : styles.replyUser}`}>
                      <p className={styles.replyMeta}>
                        <i className={`ti ${r.is_operator ? 'ti-headset' : 'ti-user'}`} />
                        {r.is_operator ? (r.author_name ?? 'Оператор') : 'Ви'}
                        <span> · {new Date(r.created_at).toLocaleString('uk-UA')}</span>
                      </p>
                      <p className={styles.replyContent}>{r.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply form — hidden for resolved tickets */}
            {!isResolved(detailTicket.status) && (
              <div className="formGroup">
                <label className="formLabel">Додати повідомлення</label>
                <textarea
                  className="formTextarea"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Уточніть деталі або задайте питання оператору..."
                />
              </div>
            )}

            <div className={styles.detailActions}>
              <button className="btnSecondary" onClick={() => setDetailTicket(null)}>Закрити</button>
              {!isResolved(detailTicket.status) && (
                <button className="btnPrimary" onClick={handleSendReply} disabled={sending || !replyText.trim()}>
                  <i className={`ti ${sending ? 'ti-loader' : 'ti-send'}`} aria-hidden="true" />
                  {sending ? 'Надсилання...' : 'Надіслати'}
                </button>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
