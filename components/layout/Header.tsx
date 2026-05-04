"use client";

import { LogOut, Menu } from "lucide-react";
import { Avatar } from "@/components/data-display/Avatar";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface HeaderAction {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
  user: {
    name: string;
    role?: string;
    imageSrc?: string;
  };
  onMenuClick?: () => void;
  onLogout?: () => void;
  className?: string;
}

export function Header({
  title,
  subtitle,
  user,
  onMenuClick,
  onLogout,
  className
}: HeaderProps) {
  const { t } = useI18n();

  return (
    <header className={cn("sticky top-0 z-30 h-14 border-b border-[#0d9488] bg-[#0EA5A4]", className)}>
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            className="px-3 text-white hover:bg-[#0d9488] hover:text-white lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            leftIcon={<Menu className="size-4" />}
          />
          <div className="min-w-0">
            <h1 className="ui-page-title truncate text-white">{title}</h1>
            {subtitle ? <p className="ui-meta truncate text-white/80">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden min-w-0 items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-3 py-2 sm:flex">
            <Avatar name={user.name} src={user.imageSrc} size="sm" />
            <div className="min-w-0">
              <p className="ui-body truncate font-medium text-white">{user.name}</p>
              {user.role ? <p className="ui-meta truncate text-white/80">{user.role}</p> : null}
            </div>
          </div>

          {onLogout ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-10 rounded-md border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              leftIcon={<LogOut className="size-4" />}
              onClick={onLogout}
            >
              {t("common.actions.logout")}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
