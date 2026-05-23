import Badge from './Badge';
import styles from './AiBox.module.css';

interface Props {
  category: string;
  priority: string;
  summary: string;
  recommendation: string;
}

export default function AiBox({ category, priority, summary, recommendation }: Props) {
  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <i className="ti ti-sparkles" aria-hidden="true" />
        <Badge variant="ai">AI-аналіз завершено</Badge>
      </div>
      <div className={styles.body}>
        <strong>Категорія:</strong> {category} &nbsp;&middot;&nbsp;{' '}
        <strong>Пріоритет:</strong> {priority}
        <br /><br />
        <strong>Стислий опис:</strong> {summary}
        <br /><br />
        <strong>Рекомендація:</strong> {recommendation}
      </div>
    </div>
  );
}
