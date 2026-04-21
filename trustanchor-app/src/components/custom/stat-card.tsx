import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
}

export function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <Card className="p-4 transition-all hover:shadow-md hover:scale-[1.02]">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${accent}`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-foreground tabular-nums">{value}</p>
        </div>
      </div>
    </Card>
  );
}