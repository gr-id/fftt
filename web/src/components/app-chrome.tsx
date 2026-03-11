"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Icon } from "@/components/icon";

type HeaderProps = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  subtitle?: string;
};

type BottomNavProps = {
  current: "home" | "training" | "rank" | "my";
};

export function AppHeader({ title, left, right, subtitle }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-screen app-header__inner">
        <div className="flex w-10 items-center justify-start">{left}</div>
        <div className="min-w-0 flex-1 text-center">
          {subtitle ? (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[var(--primary)]">
              {subtitle}
            </p>
          ) : null}
          <h1 className="truncate text-lg font-extrabold tracking-tight text-[var(--ink)]">
            {title}
          </h1>
        </div>
        <div className="flex w-10 items-center justify-end">{right}</div>
      </div>
    </header>
  );
}

export function HeaderIconButton({
  href,
  icon,
  label,
}: {
  href?: string;
  icon: string;
  label: string;
}) {
  const content = (
    <span className="app-icon-button" aria-label={label} title={label}>
      <Icon name={icon} className="text-[22px]" />
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export function BottomNav({ current }: BottomNavProps) {
  const pathname = usePathname();

  const items = [
    { key: "home", href: "/", icon: "home", label: "홈" },
    { key: "training", href: "/training", icon: "ads_click", label: "훈련" },
    { key: "rank", href: "/rank", icon: "emoji_events", label: "랭킹" },
    { key: "my", href: pathname, icon: "person", label: "내 정보" },
  ] as const;

  return (
    <nav className="app-bottom-nav" aria-label="하단 메뉴">
      <div className="app-screen app-bottom-nav__inner">
        {items.map((item) => {
          const active = item.key === current;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`app-bottom-nav__item ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className={`app-bottom-nav__icon ${active ? "is-active" : ""}`}>
                <Icon name={item.icon} className="text-[24px]" filled={active} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
