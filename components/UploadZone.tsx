'use client';

import { useRef, useState } from 'react';
import styles from './UploadZone.module.css';

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
}

const MAX_SIZE_MB = 10;

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const FILE_ICONS: Record<string, string> = {
  'application/pdf': 'ti-file-type-pdf',
  'image/': 'ti-photo',
  'text/': 'ti-file-type-txt',
  'application/zip': 'ti-file-zip',
  'application/': 'ti-file',
};

function getIcon(type: string) {
  for (const [prefix, icon] of Object.entries(FILE_ICONS)) {
    if (type.startsWith(prefix)) return icon;
  }
  return 'ti-file';
}

export default function UploadZone({ files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(
      (f) => f.size <= MAX_SIZE_MB * 1024 * 1024
    );
    const merged = [...files, ...valid].filter(
      (f, i, arr) => arr.findIndex((x) => x.name === f.name) === i
    );
    onChange(merged);
  };

  const remove = (name: string) => onChange(files.filter((f) => f.name !== name));

  return (
    <div>
      <div
        className={`${styles.zone} ${dragging ? styles.dragging : ''} ${files.length > 0 ? styles.zoneCompact : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Завантажити файл"
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          aria-hidden="true"
          onChange={(e) => addFiles(e.target.files)}
        />
        <i className="ti ti-cloud-upload" aria-hidden="true" />
        <span>
          {files.length > 0
            ? 'Додати ще файли'
            : 'Перетягніть файл або клікніть для завантаження'}
        </span>
        <span className={styles.hint}>Максимум {MAX_SIZE_MB} МБ на файл</span>
      </div>

      {files.length > 0 && (
        <ul className={styles.list}>
          {files.map((f) => (
            <li key={f.name} className={styles.item}>
              <i className={`ti ${getIcon(f.type)} ${styles.fileIcon}`} />
              <span className={styles.fileName}>{f.name}</span>
              <span className={styles.fileSize}>{formatSize(f.size)}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={(e) => { e.stopPropagation(); remove(f.name); }}
                aria-label={`Видалити ${f.name}`}
              >
                <i className="ti ti-x" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
