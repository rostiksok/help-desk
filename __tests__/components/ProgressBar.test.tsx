import { render, screen } from '@testing-library/react';
import ProgressBar from '@/components/ProgressBar';

describe('ProgressBar', () => {
  it('renders label', () => {
    render(<ProgressBar label="Технічна проблема" percentage={38} />);
    expect(screen.getByText('Технічна проблема')).toBeInTheDocument();
  });

  it('renders percentage value', () => {
    render(<ProgressBar label="Оплата" percentage={27} />);
    expect(screen.getByText('27%')).toBeInTheDocument();
  });

  it('renders fill with correct width style', () => {
    const { container } = render(<ProgressBar label="Test" percentage={50} />);
    const fill = container.querySelector('[style*="width"]');
    expect(fill).toHaveStyle({ width: '50%' });
  });

  it('applies custom color to fill', () => {
    const { container } = render(
      <ProgressBar label="Test" percentage={30} color="#10B981" />
    );
    const fill = container.querySelector('[style*="width"]');
    expect(fill).toHaveStyle({ background: '#10B981' });
  });

  it('renders without color — no background style', () => {
    const { container } = render(<ProgressBar label="Test" percentage={30} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;
    expect(fill.style.background).toBe('');
  });

  it('renders 100% width correctly', () => {
    const { container } = render(<ProgressBar label="Full" percentage={100} />);
    const fill = container.querySelector('[style*="width"]');
    expect(fill).toHaveStyle({ width: '100%' });
  });

  it('renders 0% width correctly', () => {
    const { container } = render(<ProgressBar label="Zero" percentage={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
