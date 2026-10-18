"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/buttons/Icon/Icon";
import { useApp } from "./AppProvider";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function InstallButton() {
  const { t } = useApp();
  const [event, setEvent] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const capture = (value: Event) => {
      value.preventDefault();
      setEvent(value as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  if (!event) return null;
  return (
    <button
      type="button"
      title={t.install}
      aria-label={t.install}
      onClick={async () => {
        await event.prompt();
        await event.userChoice;
        setEvent(null);
      }}
    >
      <Icon name="download" />
    </button>
  );
}
