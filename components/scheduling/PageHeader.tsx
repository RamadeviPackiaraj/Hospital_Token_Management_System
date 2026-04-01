"use client";

interface PageHeaderProps {
  title: string;
  description: string;
  meta?: string;
}

export function PageHeader({ title, description, meta }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-medium text-[#0F172A]">{title}</h1>
          <p className="text-sm text-[#64748B]">{description}</p>
        </div>
        {meta ? <p className="text-xs text-gray-500">{meta}</p> : null}
      </div>
    </header>
  );
}
