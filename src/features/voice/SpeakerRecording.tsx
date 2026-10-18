"use client";
import { useRef } from "react";
import { Icon } from "@/components/ui/buttons/Icon/Icon";
import type { Language } from "@/lib/types";
import labels from "./labels.json";
import s from "./SpeakerRecording.module.css";
import type { useSpeakerRecording } from "./useSpeakerRecording";

export function SpeakerRecording({
  recording,
  language,
}: {
  recording: ReturnType<typeof useSpeakerRecording>;
  language: Language;
}) {
  const t = labels[language];
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = ["recording", "requesting", "processing"].includes(
    recording.status,
  );
  return (
    <details className={s.panel}>
      <summary>
        <Icon name="activity" />
        <span>{t.title}</span>
        {busy && <i aria-hidden="true" />}
      </summary>
      <div className={s.body}>
        <p>{t.privacy}</p>
        <p>{t.fileNote}</p>
        <input
          ref={fileInput}
          type="file"
          hidden
          accept="audio/webm,audio/mp4,audio/ogg,audio/mpeg,audio/wav,audio/x-wav,.mp3,.wav,.webm,.ogg,.m4a"
          aria-label={t.upload}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) recording.upload(file);
            event.currentTarget.value = "";
          }}
        />
        <div className={s.actions}>
          {recording.status === "recording" ? (
            <>
              <button
                type="button"
                className={s.primary}
                onClick={recording.finish}
              >
                {t.finish}
              </button>
              <button type="button" onClick={recording.discard}>
                {t.discard}
              </button>
              <time>{recording.seconds}s / 60s</time>
            </>
          ) : busy ? (
            <button type="button" onClick={recording.discard}>
              {recording.status === "processing" ? t.cancel : t.discard}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={s.primary}
                onClick={recording.start}
              >
                <Icon name="mic" />
                {t.record}
              </button>
              <button type="button" onClick={() => fileInput.current?.click()}>
                {t.upload}
              </button>
              {recording.result && (
                <button type="button" onClick={recording.discard}>
                  {t.clear}
                </button>
              )}
            </>
          )}
        </div>
        {busy && (
          <output className={s.status}>
            {t[recording.status as "recording" | "requesting" | "processing"]}
          </output>
        )}
        {recording.error && (
          <p role="alert" className={s.error}>
            {recording.error}
          </p>
        )}
        {recording.result && (
          <div className={s.result}>
            <output className={s.complete}>
              {t.complete} · {recording.result.duration_seconds.toFixed(1)}s
            </output>
            <p>{t.note}</p>
            {recording.result.segments.length ? (
              <div className={s.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>{t.speaker}</th>
                      <th>{t.interval}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recording.result.segments.map((segment, index) => (
                      <tr key={`${segment.speaker}-${segment.start}-${index}`}>
                        <td>
                          {t.speaker} {segment.speaker.slice(8)}
                        </td>
                        <td>
                          {segment.start.toFixed(2)}s – {segment.end.toFixed(2)}
                          s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>{t.noSpeech}</p>
            )}
            <small>
              {recording.result.model} · {recording.result.model_revision}
            </small>
          </div>
        )}
      </div>
    </details>
  );
}
