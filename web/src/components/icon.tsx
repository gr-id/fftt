"use client";

import type { ReactNode } from "react";

type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

function SvgBase({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`inline-block shrink-0 align-middle ${className}`.trim()}
      style={{ width: "1em", height: "1em" }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

function iconNode(name: string, filled: boolean) {
  switch (name) {
    case "notes":
      return <path d="M5 7h14M5 12h14M5 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />;
    case "account_circle":
      return (
        <>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M6.5 18a6.2 6.2 0 0 1 11 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case "home":
      return filled ? (
        <path d="M12 3.2 3.5 10v10.5a.5.5 0 0 0 .5.5h5.2v-6h5.6v6H20a.5.5 0 0 0 .5-.5V10L12 3.2Z" fill="currentColor" />
      ) : (
        <>
          <path d="M4 10.5 12 4l8 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 9.8V20h4.8v-5h2.4v5H18V9.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "ads_click":
      return (
        <>
          <path d="m7 4 10 8-4 .8L14 20l-3.5-5.2L7 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M16.5 4.5v3M18.9 6h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case "emoji_events":
      return (
        <>
          <path d="M8 4h8v2a4 4 0 0 0 3 3.9V10a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-.1A4 4 0 0 0 8 6V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 19h6M10 15v4M14 15v4M7 6H5a3 3 0 0 0 3 3M17 6h2a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "person":
      return filled ? (
        <>
          <circle cx="12" cy="8" r="3.2" fill="currentColor" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case "forum":
      return (
        <>
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H14a2.5 2.5 0 0 1 2.5 2.5v4A2.5 2.5 0 0 1 14 13H9l-3.5 3v-3H6.5A2.5 2.5 0 0 1 4 10.5v-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 8h8.5A2.5 2.5 0 0 1 20 10.5v4a2.5 2.5 0 0 1-2.5 2.5H16v3l-3.5-3H11" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </>
      );
    case "work":
      return (
        <>
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 6V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M4 11h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "favorite":
      return <path d="M12 20s-6.8-4.4-8.7-8A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 8.7 6c-1.9 3.6-8.7 8-8.7 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />;
    case "psychology":
      return (
        <>
          <path d="M12 4a7 7 0 0 0-4.5 12.4V20h9v-3.6A7 7 0 0 0 12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10 10a1.8 1.8 0 1 1 3.2 1.1c-.7.9-1.7 1.3-1.7 2.4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case "chat_bubble":
      return <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H10L6 19v-4H7.5A2.5 2.5 0 0 1 5 12.5v-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />;
    case "bolt":
      return <path d="M13.5 2 6 13h4l-1.5 9L18 10h-4l-.5-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />;
    case "check_circle":
      return (
        <>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="m8.5 12.2 2.2 2.3 4.8-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "lock":
      return (
        <>
          <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.5 11V8.5a3.5 3.5 0 1 1 7 0V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case "arrow_back":
      return <path d="M19 12H6m0 0 5-5m-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;
    case "search":
      return (
        <>
          <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="m16 16 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case "info":
      return (
        <>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 10v5M12 7.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case "local_fire_department":
      return <path d="M13.8 3.5c.4 2.2-.2 3.7-1.8 5.3C10.7 10 10 11.3 10 13a3 3 0 1 0 6 0c0-1.4-.5-2.8-1.6-4.2-.8 1.1-2 1.5-3 .9 1.5-1.6 2.4-3.5 2.4-6.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />;
    case "send":
      return <path d="M3 20 21 12 3 4l2.8 6.2L14 12l-8.2 1.8L3 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />;
    case "auto_awesome":
      return <path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3ZM18.5 13l.7 2 .8.3-.8.3-.7 2-.7-2-.8-.3.8-.3.7-2ZM6 13.5l.9 2.6 2.6.9-2.6.9L6 20.5l-.9-2.6-2.6-.9 2.6-.9.9-2.6Z" fill="currentColor" />;
    case "checklist":
      return <path d="M10 7h9M10 12h9M10 17h9M5.5 7.5l1 1 2-2M5.5 12.5l1 1 2-2M5.5 17.5l1 1 2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;
    case "radio_button_unchecked":
      return <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />;
    case "menu_book":
      return (
        <>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19M8.5 7h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case "format_quote":
      return <path d="M7 11a3 3 0 0 1 3-3V5a6 6 0 0 0-6 6v8h6v-8H7Zm10 0a3 3 0 0 1 3-3V5a6 6 0 0 0-6 6v8h6v-8h-3Z" fill="currentColor" />;
    default:
      return (
        <>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
  }
}

export function Icon({ name, className = "", filled = false }: IconProps) {
  return <SvgBase className={className}>{iconNode(name, filled)}</SvgBase>;
}
