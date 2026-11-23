import {
  Award,
  CalendarDays,
  Camera,
  History,
  House,
  ListChecks,
  NotebookPen,
  PersonStanding,
  Play,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: House },
  { href: '/today', label: 'Today', icon: ListChecks },
  { href: '/track', label: 'Track', icon: Play },
  { href: '/activities', label: 'Activities', icon: History },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/exercises', label: 'Exercises', icon: PersonStanding },
  { href: '/badges', label: 'Badges', icon: Award },
  { href: '/notes', label: 'Notes', icon: NotebookPen },
  { href: '/photos', label: 'Photos', icon: Camera },
  { href: '/settings', label: 'Settings', icon: Settings },
];

/** Items shown in the mobile "More" sheet. */
export const MORE_ITEMS = NAV_ITEMS.filter((i) =>
  ['/activities', '/badges', '/exercises', '/notes', '/photos', '/settings'].includes(i.href),
);

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function pageTitle(pathname: string) {
  if (pathname.startsWith('/activities/')) return 'Activity';
  if (pathname === '/onboarding') return 'Welcome';
  return NAV_ITEMS.find((i) => isActive(pathname, i.href))?.label ?? 'StrideLog';
}
