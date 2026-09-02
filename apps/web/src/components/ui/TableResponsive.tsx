'use client';

import React from 'react';

interface TableResponsiveProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive table wrapper component.
 *
 * Wraps tables in a horizontal scroll container that:
 * - Scrolls INSIDE the container, not the entire page
 * - Allows touch scrolling on mobile
 * - Preserves readable minimum column widths
 * - Keeps the page width fixed to viewport
 *
 * Usage:
 * <TableResponsive>
 *   <table>...</table>
 * </TableResponsive>
 */
export function TableResponsive({ children, className }: TableResponsiveProps) {
  return (
    <div
      className={`w-full overflow-x-auto overflow-y-hidden ${className || ''}`}
      role="region"
      aria-label="Scrollable table"
    >
      {children}
    </div>
  );
}
