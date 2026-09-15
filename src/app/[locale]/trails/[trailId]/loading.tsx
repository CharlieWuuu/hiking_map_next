import { LoaderCircle } from 'lucide-react';

export default function TrailDetailLoading() {
  return (
    <div className="flex min-h-125 w-full items-center justify-center">
      <LoaderCircle className="text-background-contrary/40 h-12 w-12 animate-spin" />
    </div>
  );
}
