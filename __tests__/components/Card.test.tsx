import { render, screen } from '@testing-library/react';
import Card from '@/components/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Test Content</p></Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders as a div', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('applies extra className', () => {
    const { container } = render(<Card className="extra">Content</Card>);
    expect(container.firstChild).toHaveClass('extra');
  });

  it('renders without optional props', () => {
    render(<Card>Simple</Card>);
    expect(screen.getByText('Simple')).toBeInTheDocument();
  });

  it('renders with noPadding prop', () => {
    render(<Card noPadding>No padding</Card>);
    expect(screen.getByText('No padding')).toBeInTheDocument();
  });

  it('renders with accentTop prop', () => {
    render(<Card accentTop>Accent</Card>);
    expect(screen.getByText('Accent')).toBeInTheDocument();
  });
});
