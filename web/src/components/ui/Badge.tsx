import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children }) => {
  const styles = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
};
