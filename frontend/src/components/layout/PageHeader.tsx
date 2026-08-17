import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Right-aligned slot for status pills and action buttons. */
  actions?: React.ReactNode;
  /** Tailwind classes for the icon tile background, e.g. "bg-blue-50 text-blue-600". */
  iconTone?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  actions,
  iconTone = 'bg-blue-50 text-blue-600',
}) => {
  return (
    <div className="page-header">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconTone}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
};

export default PageHeader;
