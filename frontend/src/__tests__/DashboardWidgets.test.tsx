import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AnimatedNumber, KPICard, PeriodPill } from '../features/dashboard/components/DashboardWidgets';

describe('AnimatedNumber', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('renders 0 when value is 0', () => {
        render(<AnimatedNumber value={0} />);
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('animates to the target value', () => {
        render(<AnimatedNumber value={100} />);

        // Fast-forward timers to complete the animation
        act(() => {
            vi.advanceTimersByTime(700);
        });

        expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        render(<AnimatedNumber value={0} className="text-3xl" />);
        const span = screen.getByText('0');
        expect(span.className).toContain('text-3xl');
    });
});

describe('KPICard', () => {
    const defaultProps = {
        title: 'Test Title',
        value: 42,
        subtitle: 'Test Subtitle',
        icon: <span data-testid="test-icon">🔥</span>,
    };

    it('renders title, subtitle, and icon', () => {
        render(<KPICard {...defaultProps} />);

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('renders as a neutral enterprise card', () => {
        const { container } = render(<KPICard {...defaultProps} />);
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('bg-white');
        expect(card.className).toContain('border-slate-200');
    });

    it('accepts delay without changing the card layout', () => {
        const { container } = render(<KPICard {...defaultProps} delay="0.2s" />);
        const card = container.firstChild as HTMLElement;
        expect(card).toHaveTextContent('Test Title');
    });
});

describe('PeriodPill', () => {
    it('renders label text', () => {
        render(<PeriodPill label="Today" active={false} onClick={() => { }} />);
        expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('applies active styles when active', () => {
        render(<PeriodPill label="Today" active={true} onClick={() => { }} />);
        const button = screen.getByText('Today');
        expect(button.className).toContain('bg-primary');
    });

    it('applies inactive styles when not active', () => {
        render(<PeriodPill label="Today" active={false} onClick={() => { }} />);
        const button = screen.getByText('Today');
        expect(button.className).toContain('bg-slate-50');
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<PeriodPill label="Today" active={false} onClick={handleClick} />);
        screen.getByText('Today').click();
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
