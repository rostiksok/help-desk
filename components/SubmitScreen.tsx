'use client';

import { useState } from 'react';
import Card from './Card';
import UploadZone from './UploadZone';
import { apiCreateTicket } from '@/lib/api';
import type { TicketCreate } from '@/lib/api';
import styles from './SubmitScreen.module.css';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const REQUEST_TYPE_MAP: Record<string, TicketCreate['request_type']> = {
  'Технічна проблема': 'technical',
  'Оплата / підписка': 'payment',
  'Консультація': 'consultation',
  'Скарга': 'complaint',
};

const PRIORITY_MAP: Record<string, TicketCreate['priority']> = {
  'Визначити автоматично (AI)': 'auto',
  'Низький': 'low',
  'Середній': 'medium',
  'Високий': 'high',
};

async function uploadFile(ticketId: string, file: File) {
  const token = localStorage.getItem('token');
  const form = new FormData();
  form.append('file', file);
  await fetch(`${BASE}/api/tickets/${ticketId}/attachments`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
}

export default function SubmitScreen() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [requestType, setRequestType] = useState('Технічна проблема');
  const [priority, setPriority] = useState('Визначити автоматично (AI)');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      alert('Будь ласка, заповніть тему та опис проблеми.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const ticket = await apiCreateTicket({
        title: subject,
        description,
        request_type: REQUEST_TYPE_MAP[requestType] ?? 'technical',
        priority: PRIORITY_MAP[priority] ?? 'auto',
      });

      // upload attachments sequentially after ticket is created
      for (const file of files) {
        await uploadFile(ticket.id, file);
      }

      setCreatedId(ticket.id);
      setSubject('');
      setDescription('');
      setFiles([]);
      setTimeout(() => setCreatedId(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка відправки');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSubject('');
    setDescription('');
    setFiles([]);
    setCreatedId(null);
    setError(null);
  };

  return (
    <>
      {createdId && (
        <div className={styles.success} role="alert">
          <i className="ti ti-circle-check-filled" aria-hidden="true" />
          <span>
            Звернення <strong>{createdId}</strong> створено.
            {files.length > 0 && ` Завантажено ${files.length} файл(ів).`}
            {' '}AI-аналіз виконується...
          </span>
        </div>
      )}
      {error && (
        <div className={styles.success} role="alert" style={{ background: '#FEE2E2', color: '#991B1B' }}>
          <i className="ti ti-alert-circle" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <h2 className="sectionTitle">Форма подання звернення</h2>

        <div className="formGroup">
          <label className="formLabel" htmlFor="subject">Тема звернення *</label>
          <input
            id="subject"
            className="formInput"
            placeholder="Коротко опишіть проблему..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="twoCol">
          <div className="formGroup">
            <label className="formLabel" htmlFor="requestType">Тип запиту</label>
            <select id="requestType" className="formSelect" value={requestType} onChange={(e) => setRequestType(e.target.value)}>
              <option>Технічна проблема</option>
              <option>Оплата / підписка</option>
              <option>Консультація</option>
              <option>Скарга</option>
            </select>
          </div>
          <div className="formGroup">
            <label className="formLabel" htmlFor="priority">Пріоритет</label>
            <select id="priority" className="formSelect" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option>Визначити автоматично (AI)</option>
              <option>Низький</option>
              <option>Середній</option>
              <option>Високий</option>
            </select>
          </div>
        </div>

        <div className="formGroup">
          <label className="formLabel" htmlFor="description">Опис проблеми *</label>
          <textarea
            id="description"
            className="formTextarea"
            placeholder="Детально опишіть ситуацію..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="formGroup">
          <span className="formLabel">
            Вкладення
            {files.length > 0 && (
              <span style={{ marginLeft: 8, fontWeight: 400, color: '#6B7280' }}>
                {files.length} файл{files.length > 1 ? 'и' : ''}
              </span>
            )}
          </span>
          <UploadZone files={files} onChange={setFiles} />
        </div>

        <div className={styles.actions}>
          <button className="btnSecondary" onClick={handleCancel}>
            Скасувати
          </button>
          <button
            className="btnPrimary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <i className={`ti ${isSubmitting ? 'ti-loader' : 'ti-send'}`} aria-hidden="true" />
            {isSubmitting
              ? files.length > 0 ? 'Завантаження...' : 'Відправка...'
              : 'Надіслати звернення'}
          </button>
        </div>
      </Card>
    </>
  );
}
