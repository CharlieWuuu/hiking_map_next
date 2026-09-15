import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { Link } from '../../i18n/navigation';

type Props = {
  href: string;
  children: ReactNode;
};

export default function BackLink({ href, children }: Props) {
  return (
    <Link
      href={href}
      className="bg-panel hover:bg-panel-active-lighten/50 flex w-fit items-center gap-1 rounded-full py-1.5 pr-3 pl-2 text-sm transition-colors"
    >
      <ChevronLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}
