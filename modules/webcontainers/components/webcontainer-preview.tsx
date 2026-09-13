"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  LoaderCircle,
  Monitor,
  Play,
  RotateCw,
  Smartphone,
  Square,
  Tablet,
  Terminal,
  TriangleAlert,
} from "lucide-react";

import type { WebContainer } from "@webcontainer/api";

import type { TemplateFolder } from "@/modules/playground/lib/path-to-json";

import { transformToWebContainerFormat } from "../hooks/transformer";
import {
  getRuntime,
  type RuntimeState,
} from "../lib/runtime";

import type { TerminalRef } from "./terminal";

/*
 * Terminal uses browser-only APIs.
 * Loading it dynamically prevents Next.js SSR from evaluating xterm.
 */
const TerminalComponent = dynamic(
  () => import("./terminal"),
  {
    ssr: false,
  },
);

const idle: RuntimeState = {
  stage: "idle",
  url: "",
  command: "",
  error: null,
  timings: {},
};

const noopSubscribe = () => () => {};
const idleSnapshot = () => idle;

type DeviceMode =
  | "desktop"
  | "tablet"
  | "mobile";

interface Props {
  templateData: TemplateFolder;

  instance: WebContainer | null;

  isLoading: boolean;

  error: string | null;

  serverUrl?: string;

  writeFileSync?: (
    path: string,
    content: string,
  ) => Promise<void>;

  forceResetup?: boolean;
}

export default function WebContainerPreview({
  templateData,
  instance,
  isLoading,
  error,
}: Props) {
  const runtime = instance
    ? getRuntime(instance)
    : null;

  const state = useSyncExternalStore(
    runtime?.subscribe ?? noopSubscribe,
    runtime?.getSnapshot ?? idleSnapshot,
    idleSnapshot,
  );

  const terminal =
    useRef<TerminalRef>(null);

  const [device, setDevice] =
    useState<DeviceMode>("desktop");

  const [revision, setRevision] =
    useState(0);

  const [panel, setPanel] =
    useState<"terminal" | "output">(
      "terminal",
    );

  /*
   * Keep the bottom panel collapsed initially.
   * This gives more space to Live Preview.
   */
  const [expanded, setExpanded] =
    useState(false);

  const [output, setOutput] =
    useState("");

  const [
    previewLoading,
    setPreviewLoading,
  ] = useState(false);

  const [
    previewError,
    setPreviewError,
  ] = useState(false);

  const failed =
    error || state.error;

  const stage = failed
    ? "error"
    : isLoading
      ? "booting"
      : state.stage;

  const busy = [
    "booting",
    "mounting",
    "installing",
    "starting",
  ].includes(stage);

  /*
   * Add a small revision query whenever
   * the user manually refreshes Preview.
   */
  const previewSrc = state.url
    ? `${state.url}${
        state.url.includes("?")
          ? "&"
          : "?"
      }v=${revision}`
    : "";

  /*
   * Pipe runtime output into both:
   * 1. XTerm
   * 2. Output tab
   */
  useEffect(() => {
    if (!runtime) return;

    const unsubscribe =
      runtime.subscribeOutput(
        (chunk) => {
          terminal.current?.writeToTerminal(
            chunk,
          );

          setOutput((previous) =>
            (
              previous + chunk
            ).slice(-100000),
          );
        },
      );

    return unsubscribe;
  }, [runtime]);

  /*
   * Ctrl/Cmd + J toggles bottom panel.
   */
  useEffect(() => {
    const toggle = (
      event: KeyboardEvent,
    ) => {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "j"
      ) {
        event.preventDefault();

        setExpanded(
          (value) => !value,
        );
      }
    };

    window.addEventListener(
      "keydown",
      toggle,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        toggle,
      );
  }, []);

  /*
   * Whenever a new server URL appears,
   * show the Preview loading overlay
   * until the iframe finishes loading.
   */
  useEffect(() => {
    if (!state.url) return;

    setPreviewLoading(true);
    setPreviewError(false);
  }, [state.url]);

  const run = () => {
    if (!runtime) return;

    setPreviewError(false);
    setPreviewLoading(true);

    void runtime.sync(
      transformToWebContainerFormat(
        templateData,
      ),
      true,
    );
  };

  const refreshPreview = () => {
    if (!state.url) return;

    setPreviewError(false);
    setPreviewLoading(true);

    setRevision(
      (value) => value + 1,
    );
  };

  const getDeviceWidth = () => {
    if (device === "tablet") {
      return "768px";
    }

    if (device === "mobile") {
      return "390px";
    }

    return "100%";
  };

  const getStatusColor = () => {
    if (stage === "ready") {
      return "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]";
    }

    if (stage === "error") {
      return "bg-red-500";
    }

    if (busy) {
      return "bg-amber-400 animate-pulse";
    }

    return "bg-zinc-500";
  };

  const runtimeSteps = [
    {
      id: "booting",
      label:
        "Initializing runtime",
    },
    {
      id: "mounting",
      label: "Mounting files",
    },
    {
      id: "installing",
      label:
        "Installing dependencies",
    },
    {
      id: "starting",
      label:
        "Starting development server",
    },
  ];

  return (
    <section
      className="
        flex
        h-full
        min-h-0
        min-w-0
        flex-col
        overflow-hidden
        bg-[#090a0d]
        text-zinc-200
      "
      aria-label="Live preview"
    >
      {/* ==============================
          PREVIEW TOOLBAR
      ============================== */}

      <div
        className="
          flex
          min-h-10
          shrink-0
          flex-wrap
          items-center
          gap-1
          border-b
          border-white/[0.06]
          bg-[#0d0f13]/95
          px-2
          text-xs
          backdrop-blur
        "
      >
        <span
          className="
            mr-auto
            flex
            items-center
            gap-2
            font-medium
          "
        >
          <span
            className={`
              h-2
              w-2
              rounded-full
              ${getStatusColor()}
            `}
          />

          <span
            className={
              stage === "ready"
                ? "text-zinc-200"
                : "text-zinc-400"
            }
          >
            {stage.toUpperCase()}
          </span>
        </span>

        {/* Run */}

        <button
          className="
            group
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-md
            text-zinc-500
            transition-all
            duration-150
            hover:bg-white/[0.06]
            hover:text-zinc-100
            active:scale-95
            disabled:pointer-events-none
            disabled:opacity-30
          "
          title="Run or restart server"
          aria-label="Run or restart server"
          disabled={
            !runtime || busy
          }
          onClick={run}
        >
          <Play size={14} />
        </button>

        {/* Stop */}

        <button
          className="
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-md
            text-zinc-500
            transition-all
            duration-150
            hover:bg-white/[0.06]
            hover:text-zinc-100
            active:scale-95
            disabled:pointer-events-none
            disabled:opacity-30
          "
          title="Stop server"
          aria-label="Stop server"
          disabled={
            !runtime ||
            (!busy &&
              stage !== "ready")
          }
          onClick={() =>
            runtime?.stop()
          }
        >
          <Square size={13} />
        </button>

        {/* Refresh */}

        <button
          className="
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-md
            text-zinc-500
            transition-all
            duration-150
            hover:bg-white/[0.06]
            hover:text-zinc-100
            active:rotate-45
            active:scale-95
            disabled:pointer-events-none
            disabled:opacity-30
          "
          title="Refresh preview"
          aria-label="Refresh preview"
          disabled={!state.url}
          onClick={
            refreshPreview
          }
        >
          <RotateCw size={14} />
        </button>

        <div
          className="
            mx-1
            h-4
            w-px
            bg-white/[0.08]
          "
        />

        {/* Device buttons */}

        {(
          [
            [
              "desktop",
              Monitor,
            ],
            [
              "tablet",
              Tablet,
            ],
            [
              "mobile",
              Smartphone,
            ],
          ] as const
        ).map(
          ([name, Icon]) => (
            <button
              key={name}
              className={`
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-md
                border
                transition-all
                duration-200
                active:scale-95

                ${
                  device === name
                    ? `
                      border-rose-500/30
                      bg-rose-500/10
                      text-rose-400
                      shadow-[0_0_16px_rgba(244,63,94,0.08)]
                    `
                    : `
                      border-transparent
                      text-zinc-500
                      hover:bg-white/[0.06]
                      hover:text-zinc-200
                    `
                }
              `}
              title={`${name} preview`}
              aria-label={`${name} preview`}
              aria-pressed={
                device === name
              }
              onClick={() =>
                setDevice(name)
              }
            >
              <Icon size={14} />
            </button>
          ),
        )}

        <div
          className="
            mx-1
            h-4
            w-px
            bg-white/[0.08]
          "
        />

        {/* Open new tab */}

        <button
          className="
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-md
            text-zinc-500
            transition-all
            duration-150
            hover:bg-white/[0.06]
            hover:text-zinc-100
            active:scale-95
            disabled:pointer-events-none
            disabled:opacity-30
          "
          title="Open preview in new tab"
          aria-label="Open preview in new tab"
          disabled={!state.url}
          onClick={() =>
            window.open(
              state.url,
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          <ExternalLink
            size={14}
          />
        </button>
      </div>

      {/* ==============================
          URL BAR
      ============================== */}

      <div
        className="
          flex
          h-8
          shrink-0
          items-center
          gap-2
          border-b
          border-white/[0.06]
          bg-[#090a0d]
          px-3
          font-mono
          text-[10px]
          text-zinc-500
        "
      >
        <span
          className={`
            h-1.5
            w-1.5
            shrink-0
            rounded-full

            ${
              state.url
                ? "bg-emerald-400"
                : "bg-zinc-700"
            }
          `}
        />

        <span className="truncate">
          {state.url ||
            state.command ||
            "Browser runtime"}
        </span>
      </div>

      {/* ==============================
          PREVIEW AREA
      ============================== */}

      <div
        className="
          relative
          flex
          min-h-0
          flex-1
          items-stretch
          justify-center
          overflow-hidden
          bg-[#08090c]
          p-2
        "
      >
        {/* Background grid */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-[0.22]
            [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)]
            [background-size:32px_32px]
          "
        />

        {/* Background glow */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[-180px]
            h-[320px]
            w-[520px]
            -translate-x-1/2
            rounded-full
            bg-rose-500/[0.07]
            blur-[100px]
          "
        />

        {state.url &&
        !failed ? (
          <div
            className="
              relative
              z-10
              flex
              h-full
              w-full
              justify-center
            "
          >
            {/* DEVICE FRAME */}

            <div
              className={`
                relative
                h-full
                max-w-full
                overflow-hidden
                border
                border-white/[0.09]
                bg-white

                shadow-[
                  0_20px_80px_rgba(0,0,0,0.45)
                ]

                transition-all
                duration-500
                ease-out

                ${
                  device ===
                  "desktop"
                    ? "rounded-md"
                    : device ===
                        "tablet"
                      ? "rounded-xl"
                      : "rounded-[22px]"
                }
              `}
              style={{
                width:
                  getDeviceWidth(),
              }}
            >
              {/* subtle top device line */}

              {device !==
                "desktop" && (
                <div
                  className="
                    pointer-events-none
                    absolute
                    left-1/2
                    top-1.5
                    z-20
                    h-1
                    w-12
                    -translate-x-1/2
                    rounded-full
                    bg-black/20
                  "
                />
              )}

              {/* Loading overlay */}

              {previewLoading && (
                <div
                  className="
                    absolute
                    inset-0
                    z-30
                    flex
                    items-center
                    justify-center
                    bg-[#090a0d]/85
                    text-zinc-300
                    backdrop-blur-sm
                  "
                >
                  <div
                    className="
                      absolute
                      h-48
                      w-48
                      animate-pulse
                      rounded-full
                      bg-rose-500/10
                      blur-[60px]
                    "
                  />

                  <div
                    className="
                      relative
                      flex
                      items-center
                      gap-3
                      rounded-lg
                      border
                      border-white/[0.08]
                      bg-white/[0.04]
                      px-4
                      py-3
                      text-xs
                      shadow-xl
                    "
                  >
                    <LoaderCircle
                      size={16}
                      className="
                        animate-spin
                        text-rose-400
                      "
                    />

                    Loading preview...
                  </div>
                </div>
              )}

              {/* Preview error */}

              {previewError && (
                <div
                  className="
                    absolute
                    inset-0
                    z-40
                    flex
                    flex-col
                    items-center
                    justify-center
                    bg-[#090a0d]
                    p-8
                    text-center
                  "
                >
                  <div
                    className="
                      mb-4
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-red-500/20
                      bg-red-500/10
                      text-red-400
                    "
                  >
                    <TriangleAlert
                      size={18}
                    />
                  </div>

                  <h3
                    className="
                      text-sm
                      font-semibold
                      text-zinc-200
                    "
                  >
                    Preview could
                    not be loaded
                  </h3>

                  <p
                    className="
                      mt-2
                      max-w-xs
                      text-xs
                      leading-5
                      text-zinc-500
                    "
                  >
                    The development
                    server is running,
                    but the preview
                    failed to render.
                  </p>

                  <button
                    onClick={
                      refreshPreview
                    }
                    className="
                      mt-5
                      flex
                      items-center
                      gap-2
                      rounded-md
                      border
                      border-white/[0.08]
                      bg-white/[0.04]
                      px-3
                      py-2
                      text-xs
                      text-zinc-300
                      transition-all
                      duration-150
                      hover:border-rose-500/30
                      hover:bg-rose-500/10
                      hover:text-white
                      active:scale-95
                    "
                  >
                    <RotateCw
                      size={13}
                    />

                    Try again
                  </button>
                </div>
              )}

              <iframe
                key={`${state.url}-${revision}`}
                src={previewSrc}
                title="Project preview"
                onLoad={() => {
                  setPreviewLoading(
                    false,
                  );

                  setPreviewError(
                    false,
                  );
                }}
                onError={() => {
                  setPreviewLoading(
                    false,
                  );

                  setPreviewError(
                    true,
                  );
                }}
                className="
                  block
                  h-full
                  w-full
                  border-0
                  bg-white
                  transition-opacity
                  duration-300
                "
              />
            </div>
          </div>
        ) : (
          /* ==============================
             RUNTIME INITIALIZATION
          ============================== */

          <div
            className="
              relative
              z-10
              w-full
              max-w-md
              self-center
              rounded-xl
              border
              border-white/[0.08]
              bg-[#101217]/90
              p-5
              text-sm
              shadow-2xl
              backdrop-blur-xl
            "
            aria-live="polite"
          >
            {failed ? (
              <>
                <div
                  className="
                    mb-4
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-red-500/20
                    bg-red-500/10
                    text-red-400
                  "
                >
                  <TriangleAlert
                    size={17}
                  />
                </div>

                <h2
                  className="
                    font-semibold
                    text-zinc-100
                  "
                >
                  Environment needs
                  attention
                </h2>

                <p
                  className="
                    mt-2
                    break-words
                    text-xs
                    leading-5
                    text-red-400
                  "
                >
                  {failed}
                </p>

                <button
                  className="
                    mt-5
                    flex
                    items-center
                    gap-2
                    rounded-md
                    border
                    border-white/[0.08]
                    bg-white/[0.04]
                    px-3
                    py-2
                    text-xs
                    text-zinc-300
                    transition-all
                    hover:border-rose-500/30
                    hover:bg-rose-500/10
                    hover:text-white
                    active:scale-95
                  "
                  onClick={
                    runtime
                      ? run
                      : () =>
                          window.location.reload()
                  }
                >
                  <RotateCw
                    size={14}
                  />

                  Retry
                </button>
              </>
            ) : (
              <>
                <div
                  className="
                    mb-5
                    flex
                    items-center
                    justify-between
                  "
                >
                  <div>
                    <h2
                      className="
                        font-semibold
                        text-zinc-100
                      "
                    >
                      Environment
                    </h2>

                    <p
                      className="
                        mt-1
                        text-[11px]
                        text-zinc-500
                      "
                    >
                      Preparing your
                      browser runtime
                    </p>
                  </div>

                  {stage !==
                    "stopped" && (
                    <LoaderCircle
                      size={17}
                      className="
                        animate-spin
                        text-rose-400
                      "
                    />
                  )}
                </div>

                <div className="space-y-1">
                  {runtimeSteps.map(
                    (step) => {
                      const timing =
                        state
                          .timings[
                          step.id
                        ];

                      const isCurrent =
                        step.id ===
                        stage;

                      const stageOrder =
                        runtimeSteps.findIndex(
                          (item) =>
                            item.id ===
                            stage,
                        );

                      const itemOrder =
                        runtimeSteps.findIndex(
                          (item) =>
                            item.id ===
                            step.id,
                        );

                      const completed =
                        stage ===
                          "ready" ||
                        (stageOrder >
                          itemOrder &&
                          stageOrder !==
                            -1);

                      return (
                        <div
                          key={
                            step.id
                          }
                          className="
                            flex
                            min-h-10
                            items-center
                            gap-3
                            rounded-md
                            px-2
                            transition-colors
                            duration-200
                          "
                        >
                          <div
                            className="
                              flex
                              h-5
                              w-5
                              items-center
                              justify-center
                            "
                          >
                            {completed ? (
                              <CheckCircle2
                                size={
                                  15
                                }
                                className="text-emerald-400"
                              />
                            ) : isCurrent ? (
                              <LoaderCircle
                                size={
                                  15
                                }
                                className="
                                  animate-spin
                                  text-rose-400
                                "
                              />
                            ) : (
                              <span
                                className="
                                  h-1.5
                                  w-1.5
                                  rounded-full
                                  bg-zinc-700
                                "
                              />
                            )}
                          </div>

                          <span
                            className={`
                              flex-1
                              text-xs

                              ${
                                completed
                                  ? "text-zinc-400"
                                  : isCurrent
                                    ? "text-zinc-100"
                                    : "text-zinc-600"
                              }
                            `}
                          >
                            {
                              step.label
                            }
                          </span>

                          <span
                            className="
                              font-mono
                              text-[10px]
                              text-zinc-600
                            "
                          >
                            {timing !==
                            undefined
                              ? `${(
                                  timing /
                                  1000
                                ).toFixed(
                                  1,
                                )}s`
                              : isCurrent
                                ? "Running"
                                : ""}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>

                {stage ===
                  "stopped" && (
                  <button
                    className="
                      mt-4
                      flex
                      items-center
                      gap-2
                      rounded-md
                      border
                      border-white/[0.08]
                      bg-white/[0.04]
                      px-3
                      py-2
                      text-xs
                      text-zinc-300
                      transition-all
                      hover:bg-white/[0.07]
                    "
                    onClick={run}
                  >
                    <Play
                      size={13}
                    />

                    Start server
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ==============================
          BOTTOM PANEL TABS
      ============================== */}

      <div
        className="
          flex
          h-9
          shrink-0
          items-center
          gap-4
          border-t
          border-white/[0.06]
          bg-[#0d0f13]
          px-3
          text-[10px]
        "
      >
        <button
          className={`
            flex
            h-full
            items-center
            gap-1.5
            border-b-2
            transition-colors
            duration-150

            ${
              panel ===
              "terminal"
                ? `
                  border-rose-500
                  text-zinc-200
                `
                : `
                  border-transparent
                  text-zinc-500
                  hover:text-zinc-300
                `
            }
          `}
          onClick={() => {
            setPanel("terminal");
            setExpanded(true);
          }}
        >
          <Terminal size={12} />

          TERMINAL
        </button>

        <button
          className={`
            h-full
            border-b-2
            transition-colors
            duration-150

            ${
              panel === "output"
                ? `
                  border-rose-500
                  text-zinc-200
                `
                : `
                  border-transparent
                  text-zinc-500
                  hover:text-zinc-300
                `
            }
          `}
          onClick={() => {
            setPanel("output");
            setExpanded(true);
          }}
        >
          OUTPUT
        </button>

        <span
          className="
            ml-auto
            max-w-[45%]
            truncate
            font-mono
            text-[9px]
            text-zinc-600
          "
        >
          {state.command}
        </span>

        <button
          className="
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-md
            text-zinc-500
            transition-all
            hover:bg-white/[0.06]
            hover:text-zinc-200
          "
          title="Toggle terminal panel (Ctrl+J)"
          aria-label="Toggle terminal panel"
          aria-expanded={
            expanded
          }
          onClick={() =>
            setExpanded(
              (value) => !value,
            )
          }
        >
          <ChevronDown
            size={14}
            className={`
              transition-transform
              duration-200

              ${
                expanded
                  ? "rotate-180"
                  : ""
              }
            `}
          />
        </button>
      </div>

      {/* ==============================
          TERMINAL / OUTPUT
      ============================== */}

      <div
        className={`
          shrink-0
          overflow-hidden
          border-t
          border-white/[0.04]
          bg-[#090a0d]

          transition-[height]
          duration-300
          ease-out

          ${
            expanded
              ? "h-56 min-h-24"
              : "h-0"
          }
        `}
      >
        <div
          className={
            panel ===
            "terminal"
              ? "h-full"
              : "hidden"
          }
        >
          <TerminalComponent
            ref={terminal}
            webContainerInstance={
              instance
            }
            theme="dark"
            className="h-full"
          />
        </div>

        {panel ===
          "output" && (
          <pre
            className="
              h-full
              overflow-auto
              whitespace-pre-wrap
              break-all
              p-3
              font-mono
              text-[11px]
              leading-5
              text-zinc-400
            "
          >
            {output.replace(
              /\x1b\[[0-9;]*[a-zA-Z]/g,
              "",
            ) ||
              "No runtime output yet."}
          </pre>
        )}
      </div>
    </section>
  );
}