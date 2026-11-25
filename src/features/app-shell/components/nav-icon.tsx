import {
  BookOpenCheck,
  ChartNoAxesCombined,
  GraduationCap,
  type LucideIcon,
  NotebookPen,
  School,
  Sparkles,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';

import type { NavIconName } from '../model/nav-config';

const ICONS: Record<NavIconName, LucideIcon> = {
  learn: GraduationCap,
  room: School,
  notes: NotebookPen,
  review: BookOpenCheck,
  growth: ChartNoAxesCombined,
  program: Sparkles,
  students: Users,
  lesson: NotebookPen,
  best: Trophy,
  my: UserRound,
  more: Sparkles,
};

export const NavIcon = ({
  name,
  className,
}: {
  name: NavIconName;
  className?: string;
}) => {
  const Icon = ICONS[name];
  return (
    <Icon
      aria-hidden
      className={className}
    />
  );
};
