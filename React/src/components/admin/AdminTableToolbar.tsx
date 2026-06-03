import type { ReactNode } from 'react';

type AdminTableToolbarProps = {
  children: ReactNode;
};

export default function AdminTableToolbar({ children }: AdminTableToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
    </div>
  );
}
