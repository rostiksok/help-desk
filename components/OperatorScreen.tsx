'use client';

import { useEffect, useRef, useState } from 'react';
import Badge from './Badge';
import Card from './Card';
import AiBox from './AiBox';
import { apiListTickets, apiGetTicket, apiUpdateStatus, apiReply, apiAssignTicket, apiListOperators } from '@/lib/api';
import type { TicketListItem, TicketOut } from '@/lib/api';
import type { Status, Priority } from '@/lib/types';
import OperatorPicker from './OperatorPicker';
import styles from './OperatorScreen.module.css';

const STATUS_LABELS: Record<string, string> = {
  new: 'Новий', progress: 'В роботі', done: 'Вирішено', closed: 'Закрито',
};
const PRIORITY_LABELS: Record<string, string> = {
  high: 'Високий', medium: 'Середній', low: 'Низький',
};
const STATUS_FILTERS: Record<string, string> = {
  '': 'Усі', new: 'Нові', progress: 'В роботі', done: 'Вирішені',
};
const PAGE_SIZE = 10;

export default function OperatorScreen() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [activeFilter, setActiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [detailTicket, setDetailTicket] = useState<TicketOut | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [operators, setOperators] = useState<{ id: string; name: string; active_tickets: number }[]>([]);
  const [assigning, setAssigning] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async (status: string, q: string, p: number) => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await apiListTickets({
        status: status || undefined,
        search: q || undefined,
        page: p,
        limit: PAGE_SIZE,
      });
      setTickets(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Помилка завантаження');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchTickets(activeFilter, search, 1);
  }, [activeFilter, search]);

  useEffect(() => {
    apiListOperators().then(setOperators).catch(() => { });
  }, []);

  const goToPage = (p: number) => {
    fetchTickets(activeFilter, search, p);
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRowClick = async (ticket: TicketListItem) => {
    if (detailTicket?.id === ticket.id) { setDetailTicket(null); return; }
    try {
      const full = await apiGetTicket(ticket.id);
      setDetailTicket(full);
      setReplyText('');
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    } catch { /* ignore */ }
  };

  const handleAssign = async (operatorId: string) => {
    if (!detailTicket) return;
    setAssigning(true);
    try {
      const updated = await apiAssignTicket(detailTicket.id, operatorId);
      setDetailTicket(updated);
      fetchTickets(activeFilter, search, page);
    } catch { /* ignore */ }
    finally { setAssigning(false); }
  };

  const handleSendReply = async () => {
    if (!detailTicket || !replyText.trim()) return;
    setSending(true);
    try {
      await apiReply(detailTicket.id, replyText);
      await apiUpdateStatus(detailTicket.id, 'done');
      const updated = await apiGetTicket(detailTicket.id);
      setDetailTicket(updated);
      setReplyText('');
      fetchTickets(activeFilter, search, page);
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          {(Object.entries(STATUS_FILTERS) as [string, string][]).map(([key, label]) => (
            <button
              key={key}
              className={`${styles.filterBtn} ${activeFilter === key ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveFilter(key)}
            >
              {label}
              {key === '' && <span> ({total})</span>}
            </button>
          ))}
        </div>
        <input
          className={styles.search}
          placeholder="Пошук..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card noPadding>
        <div ref={tableRef} className={styles.tableHeader} role="row">
          <span>ID</span>
          <span>Тема</span>
          <span>Категорія</span>
          <span>Статус</span>
          <span>Пріоритет</span>
          <span className={styles.alignRight}>Час</span>
        </div>
        <div className={styles.tableBody} role="rowgroup">
          {loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
              Завантаження...
            </div>
          )}
          {!loading && fetchError && (
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', background: '#FEF2F2', fontSize: 13 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 16 }} />
              {fetchError}
              <button onClick={() => fetchTickets(activeFilter, search, page)} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #FECACA', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#991B1B' }}>
                Повторити
              </button>
            </div>
          )}
          {!loading && !fetchError && tickets.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
              Звернень не знайдено
            </div>
          )}
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`${styles.row} ${styles.rowClickable} ${detailTicket?.id === ticket.id ? styles.rowActive : ''}`}
              onClick={() => handleRowClick(ticket)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleRowClick(ticket)}
              aria-expanded={detailTicket?.id === ticket.id}
            >
              <span className={styles.ticketId}>{ticket.id}</span>
              <span className={styles.ticketTitle}>{ticket.title}</span>
              <span className={styles.category}>{ticket.category ?? '—'}</span>
              <Badge variant={ticket.status as Status}>{STATUS_LABELS[ticket.status] ?? ticket.status}</Badge>
              <Badge variant={ticket.priority as Priority}>{PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</Badge>
              <span className={styles.time}>
                {new Date(ticket.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {!loading && !fetchError && pages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} з {total}
            </span>
            <div className={styles.paginationBtns}>
              <button
                className={styles.pageBtn}
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                aria-label="Попередня сторінка"
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
                    <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
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
              <button
                className={styles.pageBtn}
                onClick={() => goToPage(page + 1)}
                disabled={page === pages}
                aria-label="Наступна сторінка"
              >
                <i className="ti ti-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {detailTicket && (
        <div ref={detailRef}>
          <Card accentTop>
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
                  {PRIORITY_LABELS[detailTicket.priority] ?? detailTicket.priority} пріоритет
                </Badge>
                <Badge variant={detailTicket.status as Status}>
                  {STATUS_LABELS[detailTicket.status] ?? detailTicket.status}
                </Badge>
              </div>
            </div>

            {detailTicket.ai_analyzed && detailTicket.ai_summary && (
              <AiBox
                category={detailTicket.ai_category ?? '—'}
                priority={PRIORITY_LABELS[detailTicket.ai_priority ?? ''] ?? '—'}
                summary={detailTicket.ai_summary}
                recommendation={detailTicket.ai_recommendation ?? ''}
              />
            )}

            <div className={styles.assignRow}>
              <span className={styles.assignLabel}>
                <i className="ti ti-user-check" />
                Відповідальний:
              </span>
              <OperatorPicker
                operators={operators}
                value={detailTicket.operator_id ?? ''}
                onChange={handleAssign}
                disabled={assigning}
              />
              {assigning && <i className="ti ti-loader" style={{ fontSize: 16, color: '#6B7280' }} />}
            </div>

            {detailTicket.attachments.length > 0 && (
              <div className="formGroup">
                <span className="formLabel">
                  <i className="ti ti-paperclip" style={{ marginRight: 4 }} />
                  Вкладення ({detailTicket.attachments.length})
                </span>
                <div className={styles.attachments}>
                  {detailTicket.attachments.map((a) => {
                    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}${a.url}`;
                    const isImage = a.content_type.startsWith('image/');
                    return (
                      <a
                        key={a.id}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.attachmentItem}
                        title={a.filename}
                      >
                        {isImage ? (
                          <img
                            src={fileUrl}
                            alt={a.filename}
                            className={styles.attachmentThumb}
                          />
                        ) : (
                          <span className={styles.attachmentIcon}>
                            <i className={`ti ${
                              a.content_type === 'application/pdf' ? 'ti-file-type-pdf' :
                              a.content_type.startsWith('text/') ? 'ti-file-type-txt' :
                              'ti-file'
                            }`} />
                          </span>
                        )}
                        <span className={styles.attachmentName}>{a.filename}</span>
                        <i className="ti ti-external-link" style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {detailTicket.replies.map((r) => (
              <div key={r.id} className="formGroup" style={{ borderLeft: r.is_operator ? '3px solid #6366F1' : '3px solid #E5E7EB', paddingLeft: 12 }}>
                <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                  {r.author_name ?? 'Користувач'} · {new Date(r.created_at).toLocaleString('uk-UA')}
                </p>
                <p style={{ margin: 0 }}>{r.content}</p>
              </div>
            ))}

            <div className="formGroup">
              <label className="formLabel">Відповідь оператора</label>
              <textarea
                className="formTextarea"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Введіть відповідь..."
              />
            </div>

            <div className={styles.detailActions}>
              <button className="btnSecondary" onClick={() => setDetailTicket(null)}>Закрити</button>
              <button className="btnPrimary" onClick={handleSendReply} disabled={sending}>
                <i className={`ti ${sending ? 'ti-loader' : 'ti-check'}`} aria-hidden="true" />
                {sending ? 'Надсилання...' : 'Надіслати відповідь'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
