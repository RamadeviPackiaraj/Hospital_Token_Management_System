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
          <h1 className="ui-page-title">{title}</h1>
          <p className="ui-page-subtitle">{description}</p>
        </div>
        {meta ? <p className="ui-meta">{meta}</p> : null}
      </div>
    </header>
  );
}
