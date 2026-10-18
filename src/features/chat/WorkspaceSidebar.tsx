import Link from "next/link";
import { Icon } from "@/components/ui/buttons/Icon/Icon";
import { useApp } from "@/features/shell/AppProvider";
import { Brand } from "@/features/shell/Header";
import s from "./Chat.module.css";
export function WorkspaceSidebar({
  tab,
  onTab,
  onClear,
  onLogout,
  sourceCount,
}: {
  tab: string;
  onTab: (value: string) => void;
  onClear: () => void;
  onLogout: () => void;
  sourceCount: number;
}) {
  const { t } = useApp();
  return (
    <aside className={s.sidebar}>
      <Brand />
      <button type="button" className={s.newChat} onClick={onClear}>
        <Icon name="plus" />
        {t.newChat}
      </button>
      <div className={s.navLabel}>{t.overview}</div>
      <nav>
        {[
          { key: "chat", label: t.workspace, icon: "spark" },
          { key: "sources", label: t.sources, icon: "book" },
          { key: "graph", label: t.graph, icon: "grid" },
          { key: "status", label: t.status, icon: "activity" },
        ].map((item) => (
          <button
            type="button"
            key={item.key}
            className={tab === item.key ? s.selected : undefined}
            onClick={() => onTab(item.key)}
          >
            <Icon name={item.icon} />
            {item.label}
            {item.key === "sources" && <span>{sourceCount}</span>}
          </button>
        ))}
        <Link href="/canvas">
          <Icon name="grid" />
          {t.canvas}
        </Link>
        <Link href="/archive/">
          <Icon name="book" />
          {t.archive}
        </Link>
        <Link href="/deck/202610181800">
          <Icon name="grid" />
          {t.presentation}
        </Link>
      </nav>
      <div className={s.sidebarBottom}>
        <div className={s.engine}>
          <Icon name="spark" />
          <div>
            Nemotron<span>{t.powered}</span>
          </div>
        </div>
        <button
          type="button"
          className={s.user}
          onClick={onLogout}
          title={t.signout}
        >
          <span className={s.avatar}>T</span>
          <span>
            {t.profile}
            <small>{t.signout}</small>
          </span>
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}
