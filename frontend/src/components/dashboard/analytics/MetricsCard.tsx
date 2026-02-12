import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: number | string;
  change: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function MetricsCard({ title, value, change }: MetricsCardProps) {
  const isPositive = change.includes('+');
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center mt-1 text-sm">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}