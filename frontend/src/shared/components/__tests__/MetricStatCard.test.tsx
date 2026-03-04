import { render, screen } from '@testing-library/react';
import { BadgeCheck } from 'lucide-react';

import { MetricStatCard } from '@/shared/components/MetricStatCard';

test('renders metric content and optional children', () => {
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
