import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  messageKey: 'home' | 'search' | 'data' | 'upload' | 'profile' | 'settings';
  href: string;
  Icon: LucideIcon;
};
