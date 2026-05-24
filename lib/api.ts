const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  return res.json();
}

export interface TicketCreate {
  title: string;
  description: string;
  request_type: 'technical' | 'payment' | 'consultation' | 'complaint';
  priority: 'high' | 'medium' | 'low' | 'auto';
}

export interface TicketOut {
  id: string;
  title: string;
  description: string;
  request_type: string;
  category: string | null;
  status: string;
  priority: string;
  operator_id: string | null;
  operator_name: string | null;
  user_id: string | null;
  ai_analyzed: boolean;
  ai_category: string | null;
  ai_priority: string | null;
  ai_summary: string | null;
  ai_recommendation: string | null;
  created_at: string;
  updated_at: string;
  replies: ReplyOut[];
  attachments: AttachmentOut[];
}

export interface AttachmentOut {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
}

export interface TicketListItem {
  id: string;
  title: string;
  category: string | null;
  status: string;
  priority: string;
  request_type: string;
  operator_name: string | null;
  created_at: string;
}

export interface ReplyOut {
  id: string;
  content: string;
  is_operator: boolean;
  author_name: string | null;
  created_at: string;
}

export interface DashboardResponse {
  stats: { label: string; value: string; sub: string; value_color?: string; sub_color?: string }[];
  categories: { label: string; percentage: number; color?: string }[];
  week_data: number[];
  week_days: string[];
  operators: { id: string; initials: string; name: string; active_tickets: number; avatar_bg?: string; avatar_color?: string }[];
}

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; name: string; password: string; role?: string }
export interface TokenResponse { access_token: string; token_type: string }
export interface UserOut { id: string; email: string; name: string; role: string }

// Auth
export const apiLogin = (body: LoginRequest) =>
  request<TokenResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });

export const apiRegister = (body: RegisterRequest) =>
  request<UserOut>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const apiMe = () => request<UserOut>('/api/auth/me');

// Tickets
export const apiCreateTicket = (body: TicketCreate) =>
  request<TicketOut>('/api/tickets', { method: 'POST', body: JSON.stringify(body) });

export interface TicketListPage {
  items: TicketListItem[];
  total: number;
  page: number;
  pages: number;
}

export const apiListTickets = (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
  const filtered: Record<string, string> = {};
  if (params?.status) filtered.status = params.status;
  if (params?.search) filtered.search = params.search;
  if (params?.page) filtered.page = String(params.page);
  if (params?.limit) filtered.limit = String(params.limit);
  const qs = new URLSearchParams(filtered).toString();
  return request<TicketListPage>(`/api/tickets${qs ? `?${qs}` : ''}`);
};

export const apiGetTicket = (id: string) => request<TicketOut>(`/api/tickets/${id}`);

export const apiUpdateStatus = (id: string, status: string) =>
  request<TicketOut>(`/api/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const apiReply = (id: string, content: string) =>
  request<ReplyOut>(`/api/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ content }) });

export const apiAssignTicket = (id: string, operator_id: string) =>
  request<TicketOut>(`/api/tickets/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ operator_id }) });

export const apiListOperators = () => request<{ id: string; name: string; initials: string; active_tickets: number }[]>('/api/operators');

// My tickets (for regular users)
export interface TicketListPageWithCounts extends TicketListPage {
  status_counts?: Record<string, number>;
}

export const apiMyTickets = (params?: { page?: number; limit?: number }) => {
  const filtered: Record<string, string> = {};
  if (params?.page) filtered.page = String(params.page);
  if (params?.limit) filtered.limit = String(params.limit);
  const qs = new URLSearchParams(filtered).toString();
  return request<TicketListPageWithCounts>(`/api/tickets/my${qs ? `?${qs}` : ''}`);
};

// Dashboard
export const apiDashboard = () => request<DashboardResponse>('/api/dashboard');
