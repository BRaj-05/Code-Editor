"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowLeft, CheckCircle2, Loader2, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  defaultIdeSettings,
  type EditorSettings,
} from "@/modules/playground/components/ide-command-center";

const settingsKey = "vibecode-editor-settings";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<EditorSettings>(defaultIdeSettings);
  const [connection, setConnection] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(settingsKey);
    if (!stored) return;
    try {
      setSettings({ ...defaultIdeSettings, ...JSON.parse(stored) });
    } catch {
      setSettings(defaultIdeSettings);
    }
  }, []);

  const updateSettings = (next: EditorSettings) => {
    setSettings(next);
    window.localStorage.setItem(settingsKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("vibecode:editor-settings-change", { detail: next }));
  };

  const testConnection = async () => {
    setConnection("loading");
    setConnectionMessage("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Reply with connection ok.", history: [], mode: "chat" }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Connection failed.");
      setConnection("success");
      setConnectionMessage("Gemini connection is working.");
    } catch (error) {
      setConnection("error");
      setConnectionMessage(error instanceof Error ? error.message : "Connection failed.");
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Editor preferences are stored in this browser.</p>
        </div>
        <Button asChild variant="outline" size="sm"><Link href="/dashboard"><ArrowLeft />Dashboard</Link></Button>
      </div>

      <section className="border-b py-6">
        <h2 className="mb-4 text-base font-semibold">Appearance</h2>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="theme">Theme</Label>
          <Button id="theme" variant="outline" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><SunMoon />{theme === "dark" ? "Dark" : "Light"}</Button>
        </div>
      </section>

      <section className="border-b py-6">
        <h2 className="mb-4 text-base font-semibold">Editor</h2>
        <div className="grid gap-5">
          <div className="grid grid-cols-2 items-center gap-4"><Label htmlFor="font-size">Font size</Label><Input id="font-size" min={10} max={24} type="number" value={settings.fontSize} onChange={(event) => updateSettings({ ...settings, fontSize: Number(event.target.value) || defaultIdeSettings.fontSize })} /></div>
          <div className="grid grid-cols-2 items-center gap-4"><Label htmlFor="tab-size">Tab size</Label><Input id="tab-size" min={2} max={8} type="number" value={settings.tabSize} onChange={(event) => updateSettings({ ...settings, tabSize: Number(event.target.value) || defaultIdeSettings.tabSize })} /></div>
          <SettingSwitch label="Word wrap" checked={settings.wordWrap === "on"} onCheckedChange={(checked) => updateSettings({ ...settings, wordWrap: checked ? "on" : "off" })} />
          <SettingSwitch label="Minimap" checked={settings.minimap} onCheckedChange={(minimap) => updateSettings({ ...settings, minimap })} />
          <SettingSwitch label="Auto save" checked={settings.autoSave} onCheckedChange={(autoSave) => updateSettings({ ...settings, autoSave })} />
        </div>
      </section>

      <section className="py-6">
        <h2 className="mb-2 text-base font-semibold">AI connection</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={testConnection} disabled={connection === "loading"}>{connection === "loading" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Test AI connection</Button>
          {connectionMessage && <p className={connection === "success" ? "text-sm text-emerald-600" : "text-sm text-destructive"}>{connectionMessage}</p>}
        </div>
      </section>
    </main>
  );
}

function SettingSwitch({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return <div className="flex items-center justify-between gap-4"><Label htmlFor={id}>{label}</Label><Switch id={id} checked={checked} onCheckedChange={onCheckedChange} /></div>;
}
