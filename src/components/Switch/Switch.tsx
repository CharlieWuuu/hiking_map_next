'use client';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function Switch({ checked, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative block h-7 w-12 shrink-0 cursor-pointer rounded-full p-0 transition-colors ${checked ? 'bg-accent-darken' : 'bg-panel-active'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}
