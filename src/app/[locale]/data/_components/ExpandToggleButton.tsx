import { Maximize2, Minimize2 } from 'lucide-react';

type Props = {
  isExpanded: boolean;
  onToggle: () => void;
  label: string;
};

export default function ExpandToggleButton({ isExpanded, onToggle, label }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={label}
      aria-label={label}
      className="bg-panel hover:bg-panel-active text-background-contrary/60 hover:text-background-contrary flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
    >
      {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
    </button>
  );
}
