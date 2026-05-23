import {
  apiListTickets,
  apiMyTickets,
  apiLogin,
  apiRegister,
  apiMe,
  apiCreateTicket,
  apiGetTicket,
  apiUpdateStatus,
  apiReply,
  apiAssignTicket,
  apiListOperators,
  apiDashboard,
} from '@/lib/api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockErr(status: number, detail: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve({ detail }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

const BASE = 'http://localhost:8000';

describe('apiListTickets', () => {
  it('calls correct URL without params', async () => {
    mockOk({ items: [], total: 0, page: 1, pages: 1 });
    await apiListTickets();
    expect(mockFetch.mock.calls[0][0]).toBe(`${BASE}/api/tickets`);
  });

  it('appends status query param', async () => {
    mockOk({ items: [], total: 0, page: 1, pages: 1 });
    await apiListTickets({ status: 'new' });
    expect(mockFetch.mock.calls[0][0]).toContain('status=new');
  });

  it('appends search query param', async () => {
    mockOk({ items: [], total: 0, page: 1, pages: 1 });
    await apiListTickets({ search: 'hello' });
    expect(mockFetch.mock.calls[0][0]).toContain('search=hello');
  });

  it('appends page and limit params', async () => {
    mockOk({ items: [], total: 0, page: 2, pages: 3 });
    await apiListTickets({ page: 2, limit: 5 });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('limit=5');
  });
});

describe('apiMyTickets', () => {
  it('calls correct base URL', async () => {
    mockOk({ items: [], total: 0, page: 1, pages: 1 });
    await apiMyTickets();
    expect(mockFetch.mock.calls[0][0]).toBe(`${BASE}/api/tickets/my`);
  });

  it('appends page param', async () => {
    mockOk({ items: [], total: 0, page: 1, pages: 1 });
    await apiMyTickets({ page: 3 });
    expect(mockFetch.mock.calls[0][0]).toContain('page=3');
  });
});

describe('auth API', () => {
  it('apiLogin sends POST to /api/auth/login', async () => {
    mockOk({ access_token: 'tok', token_type: 'bearer' });
    await apiLogin({ email: 'a@b.com', password: 'pass' });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/auth/login`);
    expect(init.method).toBe('POST');
  });

  it('apiRegister sends POST to /api/auth/register', async () => {
    mockOk({ id: '1', email: 'a@b.com', name: 'Alice', role: 'user' });
    await apiRegister({ email: 'a@b.com', name: 'Alice', password: 'pass' });
    expect(mockFetch.mock.calls[0][0]).toBe(`${BASE}/api/auth/register`);
  });

  it('apiMe sends GET to /api/auth/me', async () => {
    mockOk({ id: '1', email: 'a@b.com', name: 'Alice', role: 'user' });
    await apiMe();
    expect(mockFetch.mock.calls[0][0]).toBe(`${BASE}/api/auth/me`);
  });
});

describe('tickets API', () => {
  it('apiCreateTicket sends POST', async () => {
    mockOk({ id: 'TK-1', title: 'T', status: 'new' });
    await apiCreateTicket({ title: 'T', description: 'D', request_type: 'technical', priority: 'auto' });
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('apiGetTicket sends GET to correct URL', async () => {
    mockOk({ id: 'TK-1' });
    await apiGetTicket('TK-1');
    expect(mockFetch.mock.calls[0][0]).toBe(`${BASE}/api/tickets/TK-1`);
  });

  it('apiUpdateStatus sends PATCH', async () => {
    mockOk({ id: 'TK-1', status: 'done' });
    await apiUpdateStatus('TK-1', 'done');
    expect(mockFetch.mock.calls[0][1].method).toBe('PATCH');
  });

  it('apiReply sends POST to reply endpoint', async () => {
    mockOk({ id: 'r1', content: 'hi' });
    await apiReply('TK-1', 'hi');
    expect(mockFetch.mock.calls[0][0]).toContain('/api/tickets/TK-1/reply');
  });

  it('apiAssignTicket sends PATCH to assign endpoint', async () => {
    mockOk({ id: 'TK-1', operator_id: 'op1' });
    await apiAssignTicket('TK-1', 'op1');
    expect(mockFetch.mock.calls[0][0]).toContain('/api/tickets/TK-1/assign');
  });
});

describe('other API', () => {
  it('apiListOperators calls /api/operators', async () => {
    mockOk([]);
    await apiListOperators();
    expect(mockFetch.mock.calls[0][0]).toBe(`${BASE}/api/operators`);
  });

  it('apiDashboard calls /api/dashboard', async () => {
    mockOk({ stats: [], categories: [], week_data: [], week_days: [], operators: [] });
    await apiDashboard();
    expect(mockFetch.mock.calls[0][0]).toBe(`${BASE}/api/dashboard`);
  });
});

describe('Authorization header', () => {
  it('includes Bearer token from localStorage', async () => {
    localStorage.setItem('token', 'my-token-123');
    mockOk({});
    await apiMe();
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe('Bearer my-token-123');
  });

  it('does not include Authorization when no token', async () => {
    mockOk({});
    await apiMe();
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBeUndefined();
  });
});

describe('error handling', () => {
  it('throws with detail from error response', async () => {
    mockErr(401, 'Not authenticated');
    await expect(apiMe()).rejects.toThrow('Not authenticated');
  });
});
