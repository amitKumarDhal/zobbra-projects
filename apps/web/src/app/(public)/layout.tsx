import React from 'react';
import { PublicChrome } from '@/components/shared/PublicChrome';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicChrome>{children}</PublicChrome>;
}
