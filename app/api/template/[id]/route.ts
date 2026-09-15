import {
  scanTemplateDirectory,
  type TemplateFolder,
} from "@/modules/playground/lib/path-to-json";

import {
  createStarterPreview,
} from "@/modules/playground/lib/starter-preview";

import { db } from "@/lib/db";
import { templatePaths } from "@/lib/template";

import path from "path";
import { NextRequest } from "next/server";

/*
 * Makes sure the generated template
 * can safely be returned as JSON.
 */
function validateJsonStructure(
  data: unknown,
): boolean {
  try {
    JSON.parse(
      JSON.stringify(data),
    );

    return true;
  } catch (error) {
    console.error(
      "Invalid JSON structure:",
      error,
    );

    return false;
  }
}

/*
 * Finds one file inside our TemplateFolder
 * structure and replaces only its content.
 *
 * Example:
 *
 * src/App.tsx
 * src/index.ts
 * app/page.tsx
 * pages/index.html
 */
function replaceFileContent(
  folder: TemplateFolder,
  targetPath: string,
  newContent: string,
  currentPath = "",
): boolean {
  for (const item of folder.items) {
    /*
     * Folder
     */
    if ("folderName" in item) {
      const folderPath =
        currentPath
          ? `${currentPath}/${item.folderName}`
          : item.folderName;

      const found =
        replaceFileContent(
          item,
          targetPath,
          newContent,
          folderPath,
        );

      if (found) {
        return true;
      }

      continue;
    }

    /*
     * File
     */
    const fileName =
      item.fileExtension
        ? `${item.filename}.${item.fileExtension}`
        : item.filename;

    const filePath =
      currentPath
        ? `${currentPath}/${fileName}`
        : fileName;

    if (filePath === targetPath) {
      item.content =
        newContent;

      return true;
    }
  }

  return false;
}

/*
 * Every framework keeps its own runtime,
 * but they all use ONE VibeCode visual design.
 *
 * Shared design:
 * starter-preview.ts
 *
 * Framework-specific code here is intentionally
 * very small.
 */
function applyStarterPreview(
  template:
    TemplateFolder,
  templateKey:
    keyof typeof templatePaths,
) {
  /*
   * Framework-specific text only.
   *
   * The UI itself remains inside:
   *
   * modules/playground/lib/starter-preview.ts
   */
  const config = {
    REACT: {
      framework: "React",
      description:
        "Build interactive user interfaces with React and TypeScript directly inside your browser.",
      command:
        "npm run dev",
    },

    NEXTJS: {
      framework:
        "Next.js",
      description:
        "Build production-ready full-stack React applications directly inside VibeCode.",
      command:
        "npm run dev",
    },

    EXPRESS: {
      framework:
        "Express",
      description:
        "Build fast Node.js APIs and backend services directly inside your browser.",
      command:
        "npm start",
      port: 3010,
    },

    VUE: {
      framework: "Vue",
      description:
        "Create fast and elegant Vue applications with an instant browser development environment.",
      command:
        "npm run dev",
    },

    HONO: {
      framework: "Hono",
      description:
        "Build lightweight and fast APIs using Hono inside a browser-powered development environment.",
      command:
        "npm run dev",
      port: 3005,
    },

    ANGULAR: {
      framework:
        "Angular",
      description:
        "Build structured and scalable Angular applications directly inside VibeCode.",
      command:
        "npm start",
    },
  } as const;

  const currentConfig =
    config[templateKey];

  /*
   * Generate the SAME beautiful page
   * for whichever framework was selected.
   */
  const previewHtml =
    createStarterPreview(
      currentConfig,
    );

  /*
   * JSON.stringify is important.
   *
   * It safely converts our large HTML string
   * into a JavaScript string.
   */
  const safeHtml =
    JSON.stringify(
      previewHtml,
    );

  /*
   * ================================
   * REACT
   * ================================
   */

  if (
    templateKey ===
    "REACT"
  ) {
    replaceFileContent(
      template,
      "src/App.tsx",
      `
import { FC } from "react";

const previewHtml = ${safeHtml};

export const App: FC<{
  name: string;
}> = () => {
  return (
    <iframe
      title="React VibeCode Starter"
      srcDoc={previewHtml}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
      }}
    />
  );
};
      `.trim(),
    );

    return;
  }

  /*
   * ================================
   * NEXT.JS
   * ================================
   */

  if (
    templateKey ===
    "NEXTJS"
  ) {
    replaceFileContent(
      template,
      "app/page.tsx",
      `
const previewHtml = ${safeHtml};

export default function Home() {
  return (
    <iframe
      title="Next.js VibeCode Starter"
      srcDoc={previewHtml}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
      }}
    />
  );
}
      `.trim(),
    );

    return;
  }

  /*
   * ================================
   * VUE
   * ================================
   */

  if (
    templateKey ===
    "VUE"
  ) {
    replaceFileContent(
      template,
      "src/App.vue",
      `
<template>
  <iframe
    title="Vue VibeCode Starter"
    :srcdoc="previewHtml"
    class="vibecode-preview"
  />
</template>

<script>
const previewHtml = ${safeHtml};

export default {
  name: "App",

  data() {
    return {
      previewHtml,
    };
  },
};
</script>

<style>
html,
body,
#app {
  margin: 0;
  width: 100%;
  height: 100%;
}

.vibecode-preview {
  position: fixed;
  inset: 0;

  width: 100%;
  height: 100%;

  border: none;

  display: block;
}
</style>
      `.trim(),
    );

    return;
  }

  /*
   * ================================
   * EXPRESS
   * ================================
   *
   * Your Express starter already serves:
   *
   * pages/index.html
   *
   * So we only replace that HTML file.
   *
   * index.js remains untouched.
   */

  if (
    templateKey ===
    "EXPRESS"
  ) {
    replaceFileContent(
      template,
      "pages/index.html",
      previewHtml,
    );

    return;
  }

  /*
   * ================================
   * HONO
   * ================================
   *
   * Hono remains a small server.
   *
   * No more 600 lines of CSS manually
   * stored inside the Hono starter.
   */

  if (
    templateKey ===
    "HONO"
  ) {
    replaceFileContent(
      template,
      "src/index.ts",
      `
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

const previewHtml = ${safeHtml};

app.get("/", (c) => {
  return c.html(previewHtml);
});

const port = 3005;

console.log(
  \`Server is running on http://localhost:\${port}\`
);

serve({
  fetch: app.fetch,
  port,
});
      `.trim(),
    );

    return;
  }

  /*
   * ================================
   * ANGULAR
   * ================================
   *
   * Your Angular starter uses:
   *
   * src/main.ts
   *
   * and bootstrapApplication().
   */

  if (
    templateKey ===
    "ANGULAR"
  ) {
    replaceFileContent(
      template,
      "src/main.ts",
      `
import {
  Component,
} from "@angular/core";

import {
  bootstrapApplication,
} from "@angular/platform-browser";

const previewHtml = ${safeHtml};

@Component({
  selector: "app-root",

  template: \`
    <iframe
      title="Angular VibeCode Starter"
      [srcdoc]="previewHtml"
      style="
        position: fixed;
        inset: 0;

        width: 100%;
        height: 100%;

        border: none;

        display: block;
      "
    ></iframe>
  \`,
})
export class App {
  previewHtml =
    previewHtml;
}

bootstrapApplication(App);
      `.trim(),
    );
  }
}

export async function GET(
  request: NextRequest,

  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id } =
    await params;

  if (!id) {
    return Response.json(
      {
        error:
          "Missing playground ID",
      },
      {
        status: 400,
      },
    );
  }

  /*
   * Find which template the
   * playground was created with.
   */
  const playground =
    await db.playground.findUnique(
      {
        where: {
          id,
        },
      },
    );

  if (!playground) {
    return Response.json(
      {
        error:
          "Playground not found",
      },
      {
        status: 404,
      },
    );
  }

  const templateKey =
    playground.template as keyof typeof templatePaths;

  const templatePath =
    templatePaths[
      templateKey
    ];

  if (!templatePath) {
    return Response.json(
      {
        error:
          "Invalid template",
      },
      {
        status: 404,
      },
    );
  }

  try {
    /*
     * Read the ORIGINAL starter
     * from vibecode-starters/.
     */
    const inputPath =
      path.join(
        process.cwd(),
        templatePath,
      );

    const result =
      await scanTemplateDirectory(
        inputPath,
      );

    /*
     * ==================================
     * IMPORTANT NEW PART
     * ==================================
     *
     * We take the normal starter
     * and apply our shared VibeCode
     * welcome design.
     *
     * Physical starter files remain
     * small and framework-specific.
     */
    applyStarterPreview(
      result,
      templateKey,
    );

    /*
     * Make sure resulting structure
     * can safely be sent to browser.
     */
    if (
      !validateJsonStructure(
        result.items,
      )
    ) {
      return Response.json(
        {
          error:
            "Invalid JSON structure",
        },
        {
          status: 500,
        },
      );
    }

    return Response.json(
      {
        success: true,

        templateJson:
          result,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Error generating template JSON:",
      error,
    );

    return Response.json(
      {
        error:
          "Failed to generate template",
      },
      {
        status: 500,
      },
    );
  }
}