import { render, screen } from '@testing-library/react';
import Badge from '@/components/Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge variant="new">Новий</Badge>);
    expect(screen.getByText('Новий')).toBeInTheDocument();
  });

  it('renders as a span element', () => {
    render(<Badge variant="high">Високий</Badge>);
    expect(screen.getByText('Високий').tagName).toBe('SPAN');
  });

  it('renders with "done" variant', () => {
    render(<Badge variant="done">Виконано</Badge>);
    expect(screen.getByText('Виконано')).toBeInTheDocument();
  });

  it('renders with "progress" variant', () => {
    render(<Badge variant="progress">В роботі</Badge>);
    expect(screen.getByText('В роботі')).toBeInTheDocument();
  });

  it('renders with "closed" variant', () => {
    render(<Badge variant="closed">Закрито</Badge>);
    expect(screen.getByText('Закрито')).toBeInTheDocument();
  });

  it('renders with "low" priority variant', () => {
    render(<Badge variant="low">Низький</Badge>);
    expect(screen.getByText('Низький')).toBeInTheDocument();
  });

  it('renders with "medium" priority variant', () => {
    render(<Badge variant="medium">Середній</Badge>);
    expect(screen.getByText('Середній')).toBeInTheDocument();
  });

  it('renders with "ai" variant', () => {
    render(<Badge variant="ai">AI</Badge>);
    expect(screen.getByText('AI')).toBeInTheDocument();
  });
});
