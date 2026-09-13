"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ExternalLink, Monitor, Play, RotateCw, Smartphone, Square, Tablet, Terminal, ChevronDown } from "lucide-react";
import type { WebContainer } from "@webcontainer/api";
import type { TemplateFolder } from "@/modules/playground/lib/path-to-json";
import { transformToWebContainerFormat } from "../hooks/transformer";
import { getRuntime, type RuntimeState } from "../lib/runtime";
import TerminalComponent, { type TerminalRef } from "./terminal";

const idle: RuntimeState = { stage: "idle", url: "", command: "", error: null, timings: {} };
const noopSubscribe = () => () => {};
const idleSnapshot = () => idle;
interface Props {
  templateData: TemplateFolder;
  instance: WebContainer | null;
  isLoading: boolean;
  error: string | null;
  serverUrl?: string;
  writeFileSync?: (path: string, content: string) => Promise<void>;
  forceResetup?: boolean;
}

export default function WebContainerPreview({ templateData, instance, isLoading, error }: Props) {
  const runtime = instance ? getRuntime(instance) : null;
  const state = useSyncExternalStore(runtime?.subscribe ?? noopSubscribe, runtime?.getSnapshot ?? idleSnapshot, idleSnapshot);
  const terminal = useRef<TerminalRef>(null);
  const [device, setDevice] = useState("desktop");
  const [revision, setRevision] = useState(0);
  const [panel, setPanel] = useState<"terminal" | "output">("terminal");
  const [expanded, setExpanded] = useState(true);
  const [output, setOutput] = useState("");
  const failed = error || state.error;
  const stage = failed ? "error" : isLoading ? "booting" : state.stage;
  const busy = ["booting", "mounting", "installing", "starting"].includes(stage);
  useEffect(() => runtime?.subscribeOutput(chunk => {
    terminal.current?.writeToTerminal(chunk);
    setOutput(previous => (previous + chunk).slice(-100000));
  }), [runtime]);
  useEffect(() => {
    const toggle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "j") { event.preventDefault(); setExpanded(value => !value); }
    };
    window.addEventListener("keydown", toggle);
    return () => window.removeEventListener("keydown", toggle);
  }, []);
  const run = () => { if (runtime) void runtime.sync(transformToWebContainerFormat(templateData), true); };

  return <section className="flex h-full min-h-0 min-w-0 flex-col bg-background" aria-label="Live preview">
    <div className="flex min-h-10 flex-wrap items-center gap-1 border-b px-2 text-xs">
      <span className="mr-auto flex items-center gap-2 font-medium"><span className={`h-2 w-2 rounded-full ${stage === "ready" ? "bg-emerald-500" : stage === "error" ? "bg-red-500" : busy ? "animate-pulse bg-amber-400" : "bg-zinc-500"}`} />{stage.toUpperCase()}</span>
      <button className="ide-icon" title="Run or restart server" aria-label="Run or restart server" disabled={!runtime || busy} onClick={run}><Play size={14} /></button>
      <button className="ide-icon" title="Stop server" aria-label="Stop server" disabled={!runtime || !busy && stage !== "ready"} onClick={() => runtime?.stop()}><Square size={13} /></button>
      <button className="ide-icon" title="Refresh preview" aria-label="Refresh preview" disabled={!state.url} onClick={() => setRevision(value => value + 1)}><RotateCw size={14} /></button>
      {([ ["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone] ] as const).map(([name, Icon]) => <button key={name} className="ide-icon" title={`${name} preview`} aria-label={`${name} preview`} aria-pressed={device === name} onClick={() => setDevice(name)}><Icon size={14} /></button>)}
      <button className="ide-icon" title="Open preview in new tab" aria-label="Open preview in new tab" disabled={!state.url} onClick={() => window.open(state.url, "_blank", "noopener,noreferrer")}><ExternalLink size={14} /></button>
    </div>
    <div className="truncate border-b px-3 py-1.5 font-mono text-[11px] text-muted-foreground">{state.url || state.command || "Browser runtime"}</div>
    <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-muted/20">
      {state.url && !failed ? <iframe key={revision} src={state.url} title="Project preview" className="h-full max-w-full border-0 bg-white transition-[width] duration-200" style={{ width: device === "desktop" ? "100%" : device === "tablet" ? 768 : 390 }} /> :
        <div className="w-full max-w-md self-center p-5 text-sm" aria-live="polite">
          <h2 className="mb-3 font-semibold">{failed ? "Environment needs attention" : stage === "stopped" ? "Server stopped" : "Environment"}</h2>
          {failed ? <><p className="break-words text-red-500">{failed}</p><button className="mt-4 flex items-center gap-2 rounded border px-3 py-2" onClick={runtime ? run : () => window.location.reload()}><RotateCw size={14} />Retry</button></> :
            ["booting", "mounting", "installing", "starting"].map(name => <div key={name} className="flex justify-between border-b py-2 text-xs text-muted-foreground"><span className={name === stage ? "text-foreground" : ""}>{name === "booting" ? "Initializing runtime" : name === "mounting" ? "Mounting files" : name === "installing" ? "Installing dependencies" : "Starting server"}</span><span>{state.timings[name] !== undefined ? `${(state.timings[name] / 1000).toFixed(1)}s` : name === stage ? "Running" : "-"}</span></div>)}
        </div>}
    </div>
    <div className="flex h-9 shrink-0 items-center gap-4 border-t px-3 text-[11px]">
      <button className={panel === "terminal" ? "border-b-2 border-red-500 py-2" : "text-muted-foreground"} onClick={() => { setPanel("terminal"); setExpanded(true); }}><Terminal size={12} className="mr-1 inline" />TERMINAL</button>
      <button className={panel === "output" ? "border-b-2 border-red-500 py-2" : "text-muted-foreground"} onClick={() => { setPanel("output"); setExpanded(true); }}>OUTPUT</button>
      <span className="ml-auto truncate text-muted-foreground">{state.command}</span>
      <button className="ide-icon" title="Toggle terminal panel" aria-label="Toggle terminal panel" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><ChevronDown size={14} /></button>
    </div>
    <div className={expanded ? "h-56 min-h-24 shrink-0 overflow-hidden" : "hidden"}>
      <div className={panel === "terminal" ? "h-full" : "hidden"}><TerminalComponent ref={terminal} webContainerInstance={instance} theme="dark" className="h-full" /></div>
      {panel === "output" && <pre className="h-full overflow-auto whitespace-pre-wrap break-all p-3 text-xs">{output.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "") || "No runtime output yet."}</pre>}
    </div>
  </section>;
}
