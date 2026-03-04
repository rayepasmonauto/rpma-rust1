import { render, screen } from '@testing-library/react';
import { BadgeCheck } from 'lucide-react';

import { MetricStatCard } from '@/shared/components/MetricStatCard';

test('should render metric card with all props including optional children', () => {
  render(
    <MetricStatCard
      label="Synchronisation"
      value="En ligne"
      subtitle="100% du total"
      icon={BadgeCheck}
      color="text-green-600"
      bgColor="bg-green-100"
    >
      <span>OK</span>
    </MetricStatCard>
  );

  expect(screen.getByText('Synchronisation')).toBeInTheDocument();
  expect(screen.getByText('En ligne')).toBeInTheDocument();
  expect(screen.getByText('100% du total')).toBeInTheDocument();
  expect(screen.getByText('OK')).toBeInTheDocument();
});

test('should render without optional subtitle and children and apply custom value class', () => {
  const { container } = render(
    <MetricStatCard
      label="Opérations"
      value={42}
      icon={BadgeCheck}
      color="text-blue-600"
      bgColor="bg-blue-100"
      valueClassName="text-3xl font-extrabold"
    />
  );

  expect(screen.getByText('Opérations')).toBeInTheDocument();
  expect(screen.getByText('42')).toBeInTheDocument();
  expect(screen.queryByText('100% du total')).not.toBeInTheDocument();
  expect(screen.getByText('42')).toHaveClass('text-3xl', 'font-extrabold');
  expect(container.querySelector('svg')).toHaveClass('h-4', 'w-4', 'text-blue-600');
});
