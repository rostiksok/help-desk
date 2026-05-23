export type Screen = 'submit' | 'operator' | 'dashboard' | 'my-tickets';

export type Status = 'new' | 'progress' | 'done' | 'closed';
export type Priority = 'high' | 'medium' | 'low';
export type BadgeVariant = Status | Priority | 'ai';

export interface Ticket {
  id: string;
  title: string;
  category: string;
  status: Status;
  priority: Priority;
  time: string;
  hasDetail?: boolean;
}

export interface Operator {
  initials: string;
  name: string;
  activeTickets: number;
  avatarBg?: string;
  avatarColor?: string;
}

export interface StatData {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  subColor?: string;
}

export interface CategoryData {
  label: string;
  percentage: number;
  color?: string;
}
