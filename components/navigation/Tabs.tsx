"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  label: string;
  value: string;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
}

export function Tabs({ items, defaultValue, className }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue ?? items[0]?.value);
  const activeItem = items.find((item) => item.value === activeTab) ?? items[0];
  const activeIndex = items.findIndex((item) => item.value === activeTab);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();

    if (event.key === "Home") {
      setActiveTab(items[0]?.value);
      return;
    }

    if (event.key === "End") {
      setActiveTab(items[items.length - 1]?.value);
      return;
    }

    const nextIndex =
      event.key === "ArrowRight"
        ? (index + 1) % items.length
        : (index - 1 + items.length) % items.length;

    setActiveTab(items[nextIndex]?.value);
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Content tabs"
        className="flex flex-wrap gap-2 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-panel"
      >
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={activeTab === item.value}
            tabIndex={activeTab === item.value ? 0 : -1}
            className={cn(
              "focus-ring rounded-xl px-4 py-2 text-sm font-medium transition",
              activeTab === item.value
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
            onClick={() => setActiveTab(item.value)}
            onKeyDown={(event) => handleKeyDown(event, items.findIndex((entry) => entry.value === item.value))}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-4" aria-label={items[activeIndex]?.label}>
        {activeItem?.content}
      </div>
    </div>
  );
}
