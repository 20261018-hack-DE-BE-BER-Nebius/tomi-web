import { Icon } from "@/components/ui/buttons/Icon/Icon";
import type { RunEvent } from "@/lib/types";
import s from "./TracePanel.module.css";
export function TracePanel({
  events,
  label,
  note,
}: {
  events: RunEvent[];
  label: string;
  note: string;
}) {
  return (
    <details className={s.panel}>
      <summary>
        <Icon name="activity" />
        <span>{label}</span>
        <span className={s.count}>{events.length}</span>
        <Icon name="chevron" />
      </summary>
      <p>{note}</p>
      <ol>
        {events.map((event, index) => (
          <li key={`${event.run_id}-${event.timestamp}-${index}`}>
            <div className={s.event}>
              <span>{event.type}</span>
              <time dateTime={event.timestamp}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </time>
            </div>
            <pre>{JSON.stringify(event.data, null, 2)}</pre>
          </li>
        ))}
      </ol>
    </details>
  );
}
