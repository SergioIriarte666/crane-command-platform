import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ColoredSectionCardProps {
  title: string;
  icon?: React.ReactNode;
  color: 'violet' | 'blue' | 'green' | 'orange' | 'red' | 'gray';
  children: React.ReactNode;
  className?: string;
}

const colorStyles = {
  violet: 'border-l-4 border-l-violet-500 bg-violet-50/30 dark:bg-violet-950/10',
  blue: 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10',
  green: 'border-l-4 border-l-green-500 bg-green-50/30 dark:bg-green-950/10',
  orange: 'border-l-4 border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/10',
  red: 'border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10',
  gray: 'border-l-4 border-l-gray-500 bg-gray-50/30 dark:bg-gray-950/10',
};

export function ColoredSectionCard({ 
  title, 
  icon, 
  color, 
  children, 
  className 
}: ColoredSectionCardProps) {
  return (
    <Card className={cn(colorStyles[color], className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
