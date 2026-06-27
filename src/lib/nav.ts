import type { LabelKey } from './types';

export type NavKey =
  | 'dashboard'
  | 'shift'
  | 'reservation'
  | 'customer'
  | 'inventory'
  | 'access'
  | 'settings';

export type NavItem = {
  key: NavKey;
  href: string;
  labelKey: LabelKey;
  pro?: boolean;
};

export const NAV: NavItem[] = [
  { key: 'dashboard', href: '/', labelKey: 'navDashboard' },
  { key: 'shift', href: '/shifts', labelKey: 'navShift' },
  { key: 'reservation', href: '/bookings', labelKey: 'navReservation' },
  { key: 'customer', href: '/customers', labelKey: 'navCustomer' },
  { key: 'inventory', href: '/inventory', labelKey: 'navInventory' },
  { key: 'access', href: '/access', labelKey: 'navAccess', pro: true },
  { key: 'settings', href: '/settings', labelKey: 'navSettings' },
];

/** Returns the matching nav item for a pathname (longest-prefix, '/' exact). */
export function navItemForPath(pathname: string): NavItem {
  if (pathname === '/') return NAV[0];
  const match = NAV.slice(1).find((n) => pathname.startsWith(n.href));
  return match ?? NAV[0];
}
