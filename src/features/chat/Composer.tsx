"use client";
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/buttons/Icon/Icon";
import { useApp } from "@/features/shell/AppProvider";
import type { Model } from "@/lib/types";
import s from "./Chat.module.css";

interface Props {
  onSend: (text: string) => boolean;
  onStop: () => void;
  running: boolean;
  connected: boolean;
  models: Model[];
  model: string;
  onModel: (id: string) => void;
  onVoice: () => void;
  voiceActive: boolean;
  voiceConnecting: boolean;
  muted: boolean;
  onMute: () => void;
  onExport: () => void;
  onClear: () => void;
  onImage: (prompt: string) => void;
}
export function Composer(props: Props) {
  const { t } = useApp();
  const [input, setInput] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  const menu =
    input.startsWith("/") && !input.includes(" ")
      ? "command"
      : input.endsWith("@")
        ? "mention"
        : null;
  function send() {
    if (!input.trim()) return;
    if (input === "/export") {
      props.onExport();
      setInput("");
      return;
    }
    if (input === "/clear") {
      props.onClear();
      setInput("");
      return;
    }
    if (input.startsWith("/image ")) {
      props.onImage(input.slice(7));
      setInput("");
      return;
    }
    if (props.onSend(input.replace(/^\/compare\s*/, ""))) setInput("");
  }
  function pick(value: string) {
    setInput(
      menu === "mention" ? `${input.slice(0, -1)}${value} ` : `${value} `,
    );
    field.current?.focus();
  }
  return (
    <div className={s.composerWrap}>
      {menu && (
        <div className={s.commandMenu}>
          <strong>{menu === "command" ? t.command : t.mention}</strong>
          {(menu === "command"
            ? ["/compare", "/image", "/export", "/clear"]
            : ["@britannica", "@wikipedia"]
          ).map((item) => (
            <button type="button" key={item} onClick={() => pick(item)}>
              {item}
              <Icon name="arrow" />
            </button>
          ))}
        </div>
      )}
      <div className={s.composer}>
        <textarea
          ref={field}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={t.placeholder}
          aria-label={t.placeholder}
          maxLength={16000}
          rows={2}
        />
        <div className={s.toolbar}>
          <button
            type="button"
            title={t.mention}
            aria-label={t.mention}
            onClick={() => {
              setInput(`${input}@`);
              field.current?.focus();
            }}
          >
            <span>@</span>
          </button>
          <button
            type="button"
            title={t.image}
            aria-label={t.image}
            onClick={() => {
              setInput("/image ");
              field.current?.focus();
            }}
          >
            <Icon name="image" />
          </button>
          <select
            value={props.model}
            aria-label={t.model}
            onChange={(e) => props.onModel(e.target.value)}
          >
            {props.models
              .filter((model) => model.capabilities.includes("chat"))
              .map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                  {!model.available ? ` · ${t.providerUnavailable}` : ""}
                </option>
              ))}
            {!props.models.length && <option value="">{t.loading}</option>}
          </select>
          <div className={s.toolbarRight}>
            {props.voiceActive && (
              <button
                type="button"
                onClick={props.onMute}
                title={props.muted ? t.unmute : t.mute}
                aria-label={props.muted ? t.unmute : t.mute}
                aria-pressed={props.muted}
              >
                <Icon name={props.muted ? "mute" : "mic"} />
              </button>
            )}
            <button
              type="button"
              onClick={props.onVoice}
              disabled={props.voiceConnecting || !props.connected}
              title={props.voiceActive ? t.endVoice : t.voice}
              aria-label={props.voiceActive ? t.endVoice : t.voice}
              className={props.voiceActive ? s.voiceOn : undefined}
            >
              <Icon name={props.voiceActive ? "close" : "mic"} />
            </button>
            {props.running && (
              <button
                type="button"
                onClick={props.onStop}
                title={t.stop}
                aria-label={t.stop}
              >
                <Icon name="stop" />
              </button>
            )}
            <button
              type="button"
              className={s.send}
              onClick={send}
              disabled={!input.trim() || !props.connected}
              title={props.running ? t.steer : t.send}
              aria-label={props.running ? t.steer : t.send}
            >
              <Icon name="send" />
            </button>
          </div>
        </div>
      </div>
      <p className={s.composerHint}>{props.running ? t.steer : t.help}</p>
    </div>
  );
}
