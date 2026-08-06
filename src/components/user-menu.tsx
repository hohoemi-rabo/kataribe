"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/auth/actions";

type UserMenuProps = {
  email: string;
  avatarUrl: string | null;
};

export function UserMenu({ email, avatarUrl }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="アカウントメニュー"
        aria-expanded={isOpen}
        className="block h-8 w-8 overflow-hidden rounded-full transition hover:ring-2 hover:ring-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={32} height={32} />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-surface-hover text-caption-sm text-on-dark">
            {email.charAt(0).toUpperCase()}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-xs w-64 rounded-md border border-hairline-dark bg-surface-elevated p-md">
          <p className="truncate text-caption-md text-mute-dark">{email}</p>
          <form action={signOut} className="mt-sm">
            <button
              type="submit"
              className="h-12 w-full rounded-full border border-hairline-dark text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              ログアウト
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
