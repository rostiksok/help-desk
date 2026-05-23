import { render, screen } from '@testing-library/react';
import StatCard from '@/components/StatCard';

describe('StatCard', () => {
  const defaultProps = {
    label: 'Всього звернень',
    value: '42',
    sub: 'за 30 днів',
  };

  it('renders label', () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText('Всього звернень')).toBeInTheDocument();
  });

  it('renders value', () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders sub text', () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText('за 30 днів')).toBeInTheDocument();
  });

  it('applies valueColor style when provided', () => {
    render(<StatCard {...defaultProps} valueColor="#DC2626" />);
    const valueEl = screen.getByText('42');
    expect(valueEl).toHaveStyle({ color: '#DC2626' });
  });

  it('does not apply valueColor style when not provided', () => {
    render(<StatCard {...defaultProps} />);
    const valueEl = screen.getByText('42');
    expect(valueEl).not.toHaveAttribute('style');
  });

  it('applies subColor style when provided', () => {
    render(<StatCard {...defaultProps} subColor="#059669" />);
    const subEl = screen.getByText('за 30 днів');
    expect(subEl).toHaveStyle({ color: '#059669' });
  });

  it('does not apply subColor style when not provided', () => {
    render(<StatCard {...defaultProps} />);
    const subEl = screen.getByText('за 30 днів');
    expect(subEl).not.toHaveAttribute('style');
  });
});
