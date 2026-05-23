import type { Ticket, Operator, StatData, CategoryData } from './types';

export const tickets: Ticket[] = [
  {
    id: '#TK-1041',
    title: 'Не можу увійти в акаунт після зміни пароля',
    category: 'Авторизація',
    status: 'new',
    priority: 'high',
    time: '2хв тому',
    hasDetail: true,
  },
  {
    id: '#TK-1040',
    title: 'Оплата пройшла, підписка не активована',
    category: 'Оплата',
    status: 'progress',
    priority: 'high',
    time: '18хв тому',
    hasDetail: true,
  },
  {
    id: '#TK-1039',
    title: 'Як завантажити архів моїх даних?',
    category: 'Консультація',
    status: 'new',
    priority: 'low',
    time: '34хв тому',
  },
  {
    id: '#TK-1038',
    title: 'Помилка 500 при завантаженні файлу',
    category: 'Технічна',
    status: 'progress',
    priority: 'medium',
    time: '1год тому',
  },
  {
    id: '#TK-1037',
    title: 'Запит на повернення коштів за квітень',
    category: 'Оплата',
    status: 'done',
    priority: 'medium',
    time: '3год тому',
  },
];

export const operators: Operator[] = [
  { initials: 'ЖВ', name: 'Жигайло В.М.', activeTickets: 8 },
  { initials: 'МО', name: 'Мороз О.С.', activeTickets: 5, avatarBg: '#D1FAE5', avatarColor: '#065F46' },
  { initials: 'ДК', name: 'Демченко К.І.', activeTickets: 5, avatarBg: '#EDE9FE', avatarColor: '#5B21B6' },
];

export const stats: StatData[] = [
  { label: 'Всього звернень', value: '247', sub: 'за 30 днів' },
  { label: 'Відкрито зараз', value: '18', sub: '7 термінових', valueColor: '#DC2626' },
  { label: 'Середній час відповіді', value: '1.4г', sub: '−18% vs минулий міс.', subColor: '#059669' },
  { label: 'Точність AI-аналізу', value: '94%', sub: 'на основі 247 тікетів', valueColor: '#059669' },
];

export const categories: CategoryData[] = [
  { label: 'Технічні проблеми', percentage: 38 },
  { label: 'Оплата / підписка', percentage: 27, color: '#10B981' },
  { label: 'Консультації', percentage: 21, color: '#8B5CF6' },
  { label: 'Скарги', percentage: 14, color: '#EF4444' },
];

export const weekData = [45, 62, 38, 80, 55, 20, 15];
export const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
