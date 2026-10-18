"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/buttons/Icon/Icon";
import { ComparisonCard } from "@/components/ui/cards/ComparisonCard/ComparisonCard";
import { TracePanel } from "@/components/ui/data-display/TracePanel/TracePanel";
import { useApp } from "@/features/shell/AppProvider";
import { Preferences } from "@/features/shell/Header";
import { SpeakerRecording } from "@/features/voice/SpeakerRecording";
import { useVoice } from "@/features/voice/useVoice";
import { api } from "@/lib/api/client";
import s from "./Chat.module.css";
import { Composer } from "./Composer";
import { LiveGraph } from "./LiveGraph";
import { useChat } from "./useChat";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
export function ChatWorkspace() {
  const { t, language } = useApp();
  const chat = useChat(language);
  const voice = useVoice(language, chat.send);
  const [tab, setTab] = useState("chat");
  const [images, setImages] = useState<string[]>([]);
  const [imageBusy, setImageBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chat.onEvent.current = voice.deliver;
    return () => {
      chat.onEvent.current = null;
    };
  }, [chat.onEvent, voice.deliver]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll after a new turn or streamed text
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [chat.turns.length, chat.turns.at(-1)?.text]);
  async function generateImage(prompt: string) {
    setImageBusy(true);
    chat.setError("");
    try {
      const value = await api<{ data: { b64_json?: string }[] }>(
        "images/generations",
        {
          prompt,
          model: chat.models.find((m) => m.capabilities.includes("image"))?.id,
        },
      );
      const image = value.data?.find(
        (item) => typeof item.b64_json === "string",
      )?.b64_json;
      if (!image)
        throw new Error("The image service returned no embedded image.");
      setImages((current) => [...current, `data:image/png;base64,${image}`]);
    } catch (e) {
      chat.setError(e instanceof Error ? e.message : t.error);
    } finally {
      setImageBusy(false);
    }
  }
  async function logout() {
    voice.reset();
    await api("auth/logout", {});
    chat.forget();
    location.assign("/login");
  }
  const running = chat.turns.some((turn) => turn.status === "running");
  const sources = chat.turns.flatMap((turn) => turn.answer?.evidence || []);
  return (
    <div className={s.workspace}>
      <WorkspaceSidebar
        tab={tab}
        onTab={setTab}
        onClear={chat.clear}
        onLogout={logout}
        sourceCount={sources.length}
      />
      <div className={s.main}>
        <header className={s.header}>
          <div>
            <span className={s.breadcrumb}>
              Tomi <span>/</span> {t.workspace}
            </span>
            <span
              className={s.connection}
              data-connected={chat.status === "online"}
            >
              <i />
              {t[chat.status as "online" | "offline" | "connecting"]}
            </span>
          </div>
          <div className={s.headerActions}>
            <button
              type="button"
              title={t.download}
              aria-label={t.download}
              onClick={chat.download}
            >
              <Icon name="download" />
            </button>
            <Preferences />
          </div>
        </header>
        <div className={s.mobileNav}>
          <button
            type="button"
            onClick={chat.clear}
            title={t.newChat}
            aria-label={t.newChat}
          >
            <Icon name="plus" />
          </button>
          {["chat", "sources", "status"].map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setTab(value)}
              aria-pressed={tab === value}
            >
              {value === "chat"
                ? "TimeLens"
                : value === "sources"
                  ? t.sources
                  : t.status}
            </button>
          ))}
        </div>
        <main className={s.chatMain}>
          <div className={s.scroll}>
            {tab === "graph" ? (
              <LiveGraph evidence={sources} />
            ) : tab === "status" ? (
              <section className={s.statusPanel}>
                <h1>{t.status}</h1>
                <p>{t.statusNote}</p>
                {chat.models.map((model) => (
                  <article key={model.id}>
                    <div>
                      <strong>{model.name}</strong>
                      <small>
                        {model.provider} · {model.capabilities.join(" / ")}
                      </small>
                    </div>
                    <span data-available={model.available}>
                      {model.available ? t.ready : t.providerUnavailable}
                    </span>
                    {model.availability_reason && (
                      <p>{model.availability_reason}</p>
                    )}
                  </article>
                ))}
              </section>
            ) : tab === "sources" ? (
              <section className={s.statusPanel}>
                <h1>{t.sources}</h1>
                {chat.turns
                  .filter((turn) => turn.answer)
                  .map((turn) => (
                    <ComparisonCard
                      key={turn.id}
                      answer={turn.answer as NonNullable<typeof turn.answer>}
                      labels={t}
                    />
                  ))}
                {!sources.length && <p>{t.noSources}</p>}
              </section>
            ) : (
              <div className={s.conversation}>
                {!chat.turns.length && (
                  <section className={s.empty}>
                    <div className={s.heroMark}>
                      <Icon name="spark" />
                    </div>
                    <div className={s.kicker}>{t.live}</div>
                    <h1>{t.title}</h1>
                    <p>{t.subtitle}</p>
                    <div className={s.suggestions}>
                      {(
                        ["suggestion1", "suggestion2", "suggestion3"] as const
                      ).map((key, index) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => chat.send(t[key])}
                          disabled={chat.status !== "online"}
                        >
                          <Icon
                            name={
                              index === 0
                                ? "activity"
                                : index === 1
                                  ? "spark"
                                  : "book"
                            }
                          />
                          <span>{t[key]}</span>
                          <Icon name="arrow" />
                        </button>
                      ))}
                    </div>
                    <p className={s.emptyNote}>{t.disclaimer}</p>
                  </section>
                )}
                {chat.turns.map((turn) => (
                  <article key={turn.id} className={s.turn}>
                    <div className={s.question}>{turn.question}</div>
                    <div className={s.answerHead}>
                      <span className={s.smallMark}>t.</span>
                      <strong>Tomi</strong>
                      <span>{t[turn.status]}</span>
                    </div>
                    {turn.answer ? (
                      <ComparisonCard answer={turn.answer} labels={t} />
                    ) : turn.text ? (
                      <p className={s.streaming}>{turn.text}</p>
                    ) : turn.status === "running" ? (
                      <div className={s.progress}>
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : null}
                    {turn.error && (
                      <p className={s.error} role="alert">
                        {turn.error}
                      </p>
                    )}
                    <TracePanel
                      events={turn.events}
                      label={t.traces}
                      note={t.traceNote}
                    />
                  </article>
                ))}
                {images.map((src) => (
                  <figure className={s.generated} key={src.slice(-100)}>
                    <Image
                      src={src}
                      width={1024}
                      height={1024}
                      alt={t.imageLabel}
                      unoptimized
                    />
                    <figcaption>{t.imageLabel}</figcaption>
                  </figure>
                ))}
                {imageBusy && <p className={s.notice}>{t.imageBusy}</p>}
                <div ref={bottom} />
              </div>
            )}
          </div>
          {(chat.error || voice.error) && (
            <div className={s.errorBanner} role="alert">
              {chat.error || voice.error}
              {chat.status === "offline" && (
                <button type="button" onClick={chat.reconnect}>
                  {t.retry}
                </button>
              )}
            </div>
          )}
          {(voice.active || voice.connecting) && (
            <div className={s.voiceBar}>
              <Icon name={voice.muted ? "mute" : "mic"} />
              <div>
                <strong>
                  {voice.connecting ? t.voiceConnecting : t.voiceActive}
                </strong>
                <span>{voice.transcript || t.voiceNote}</span>
              </div>
              <button
                type="button"
                onClick={voice.stop}
                title={t.endVoice}
                aria-label={t.endVoice}
              >
                <Icon name="close" />
              </button>
            </div>
          )}
          <div className={s.composerArea}>
            <SpeakerRecording recording={voice.recording} language={language} />
            <Composer
              onSend={chat.send}
              onStop={chat.stop}
              running={running}
              connected={chat.status === "online"}
              models={chat.models}
              model={chat.model}
              onModel={chat.setModel}
              onVoice={voice.active ? voice.stop : voice.start}
              voiceActive={voice.active}
              voiceConnecting={voice.connecting}
              muted={voice.muted}
              onMute={voice.toggleMute}
              onExport={chat.download}
              onClear={chat.clear}
              onImage={generateImage}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
