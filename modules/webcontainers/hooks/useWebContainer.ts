import { useState, useEffect, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import type { TemplateFolder } from "@/modules/playground/lib/path-to-json";
import { getRuntime } from "../lib/runtime";
import { transformToWebContainerFormat } from "./transformer";

let boot: Promise<WebContainer> | null = null;
let owners = 0;
let releaseTimer: ReturnType<typeof setTimeout> | undefined;

function acquire() {
  clearTimeout(releaseTimer);
  owners++;
  boot ??= WebContainer.boot().catch(error => { boot = null; throw error; });
  return boot;
}
function release() {
  owners = Math.max(0, owners - 1);
  // React's effect replay re-acquires before this timer; actual navigation releases.
  releaseTimer = setTimeout(() => {
    if (owners || !boot) return;
    const previous = boot;
    void previous.then(instance => {
      if (owners || boot !== previous) return;
      getRuntime(instance).dispose();
      instance.teardown();
      boot = null;
    }).catch(() => {});
  }, 100);
}

export const useWebContainer = ({ templateData }: { templateData: TemplateFolder | null }) => {
  const [instance, setInstance] = useState<WebContainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) { setError("Browser runtime initialization timed out. Reload the workspace; check browser isolation and network access."); setIsLoading(false); }
    }, 45000);
    void acquire().then(container => {
      if (active) { setInstance(container); setError(null); setIsLoading(false); }
    }).catch(reason => {
      if (active) { setError(reason instanceof Error ? reason.message : "Browser runtime unavailable."); setIsLoading(false); }
    }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); release(); };
  }, []);

  useEffect(() => {
    if (instance && templateData) void getRuntime(instance).sync(transformToWebContainerFormat(templateData));
  }, [instance, templateData]);

  const writeFileSync = useCallback(async (path: string, content: string) => {
    // Files are still saved to the project while the runtime is booting.
    if (!instance) return;
    if (path.includes("/")) await instance.fs.mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
    await instance.fs.writeFile(path, content);
  }, [instance]);
  const destroy = useCallback(() => { if (instance) getRuntime(instance).stop(); }, [instance]);
  return { serverUrl: null, isLoading, error, instance, writeFileSync, destroy };
};
