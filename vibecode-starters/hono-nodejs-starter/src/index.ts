import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>Hono • VibeCode</title>

        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html,
          body {
            min-height: 100%;
          }

          body {
            min-height: 100vh;
            font-family:
              Inter,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;

            color: #f4f4f5;
            overflow: hidden;

            background:
              radial-gradient(
                circle at 20% 20%,
                rgba(244, 63, 94, 0.15),
                transparent 35%
              ),
              radial-gradient(
                circle at 80% 80%,
                rgba(168, 85, 247, 0.13),
                transparent 35%
              ),
              #08090c;
          }

          body::before {
            content: "";
            position: fixed;
            inset: 0;

            background-image:
              linear-gradient(
                rgba(255, 255, 255, 0.035) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.035) 1px,
                transparent 1px
              );

            background-size: 42px 42px;

            mask-image:
              linear-gradient(
                to bottom,
                black,
                transparent 95%
              );

            pointer-events: none;
          }

          .orb {
            position: fixed;
            width: 260px;
            height: 260px;
            border-radius: 999px;
            filter: blur(75px);
            opacity: 0.24;
            pointer-events: none;
          }

          .orb-one {
            background: #f43f5e;
            top: -90px;
            left: -70px;
            animation: float-one 8s ease-in-out infinite alternate;
          }

          .orb-two {
            background: #8b5cf6;
            right: -80px;
            bottom: -100px;
            animation: float-two 10s ease-in-out infinite alternate;
          }

          .page {
            position: relative;
            z-index: 2;

            min-height: 100vh;

            display: flex;
            justify-content: center;
            align-items: center;

            padding: 32px;
          }

          .container {
            width: min(900px, 100%);

            animation: enter 700ms
              cubic-bezier(0.16, 1, 0.3, 1)
              both;
          }

          .badge {
            width: fit-content;

            display: flex;
            align-items: center;
            gap: 8px;

            margin: 0 auto 22px;

            padding: 7px 12px;

            color: #d4d4d8;
            font-size: 12px;
            font-weight: 600;

            border: 1px solid rgba(255, 255, 255, 0.09);
            border-radius: 999px;

            background: rgba(255, 255, 255, 0.035);
            backdrop-filter: blur(12px);
          }

          .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #22c55e;

            box-shadow:
              0 0 0 4px rgba(34, 197, 94, 0.08),
              0 0 18px rgba(34, 197, 94, 0.7);

            animation: pulse 1.8s ease-in-out infinite;
          }

          h1 {
            max-width: 720px;
            margin: auto;

            text-align: center;
            font-size: clamp(42px, 7vw, 76px);
            line-height: 0.98;
            letter-spacing: -0.055em;
          }

          .gradient {
            color: transparent;

            background:
              linear-gradient(
                90deg,
                #fb7185,
                #f43f5e,
                #c084fc
              );

            background-clip: text;
            -webkit-background-clip: text;
          }

          .subtitle {
            max-width: 620px;

            margin:
              24px auto 0;

            text-align: center;

            color: #a1a1aa;

            line-height: 1.8;
            font-size: 15px;
          }

          .workspace {
            position: relative;

            margin-top: 42px;

            overflow: hidden;

            border:
              1px solid
              rgba(255, 255, 255, 0.08);

            border-radius: 14px;

            background:
              rgba(15, 16, 20, 0.86);

            box-shadow:
              0 30px 90px rgba(0, 0, 0, 0.45),
              0 0 80px rgba(244, 63, 94, 0.04);

            backdrop-filter: blur(20px);
          }

          .window-bar {
            height: 40px;

            display: flex;
            align-items: center;

            padding:
              0 14px;

            border-bottom:
              1px solid
              rgba(255, 255, 255, 0.07);
          }

          .circles {
            display: flex;
            gap: 6px;
          }

          .circle {
            width: 9px;
            height: 9px;
            border-radius: 50%;
          }

          .red {
            background: #ef4444;
          }

          .yellow {
            background: #eab308;
          }

          .green {
            background: #22c55e;
          }

          .window-title {
            margin: auto;

            transform:
              translateX(-22px);

            color: #71717a;

            font-size: 11px;
          }

          .content {
            display: grid;
            grid-template-columns:
              1.15fr 0.85fr;

            min-height: 220px;
          }

          .code {
            padding: 24px;

            border-right:
              1px solid
              rgba(255, 255, 255, 0.07);

            font-family:
              "Cascadia Code",
              Consolas,
              monospace;

            font-size: 13px;
            line-height: 2;
          }

          .line {
            display: flex;
            gap: 16px;

            animation:
              code-in 500ms
              both;
          }

          .line:nth-child(2) {
            animation-delay: 100ms;
          }

          .line:nth-child(3) {
            animation-delay: 180ms;
          }

          .line:nth-child(4) {
            animation-delay: 260ms;
          }

          .number {
            width: 18px;
            color: #52525b;
            text-align: right;
          }

          .purple {
            color: #c084fc;
          }

          .orange {
            color: #fb923c;
          }

          .blue {
            color: #67e8f9;
          }

          .white {
            color: #e4e4e7;
          }

          .terminal {
            padding: 24px;

            font-family:
              "Cascadia Code",
              Consolas,
              monospace;

            font-size: 12px;

            background:
              rgba(0, 0, 0, 0.22);
          }

          .terminal-title {
            margin-bottom: 18px;

            color: #71717a;

            font-size: 10px;
            letter-spacing: 0.14em;
          }

          .terminal-line {
            margin-bottom: 12px;

            color: #a1a1aa;
          }

          .prompt {
            color: #f43f5e;
          }

          .success {
            color: #4ade80;
          }

          .cursor {
            display: inline-block;

            width: 7px;
            height: 14px;

            margin-left: 4px;

            vertical-align: -2px;

            background: #d4d4d8;

            animation:
              blink 1s step-end infinite;
          }

          @keyframes enter {
            from {
              opacity: 0;
              transform:
                translateY(24px)
                scale(0.985);
            }

            to {
              opacity: 1;
              transform:
                translateY(0)
                scale(1);
            }
          }

          @keyframes code-in {
            from {
              opacity: 0;
              transform:
                translateX(-8px);
            }

            to {
              opacity: 1;
              transform:
                translateX(0);
            }
          }

          @keyframes blink {
            50% {
              opacity: 0;
            }
          }

          @keyframes pulse {
            50% {
              opacity: 0.45;
            }
          }

          @keyframes float-one {
            to {
              transform:
                translate(90px, 80px);
            }
          }

          @keyframes float-two {
            to {
              transform:
                translate(-90px, -60px);
            }
          }

          @media (max-width: 700px) {
            .content {
              grid-template-columns:
                1fr;
            }

            .code {
              border-right: 0;

              border-bottom:
                1px solid
                rgba(255, 255, 255, 0.07);
            }

            .page {
              padding: 20px;
            }
          }

          @media (
            prefers-reduced-motion:
            reduce
          ) {
            *,
            *::before,
            *::after {
              animation:
                none !important;
            }
          }
        </style>
      </head>

      <body>
        <div class="orb orb-one"></div>
        <div class="orb orb-two"></div>

        <main class="page">
          <div class="container">

            <div class="badge">
              <span class="dot"></span>
              Hono server is running
            </div>

            <h1>
              Build fast with
              <span class="gradient">
                VibeCode.
              </span>
            </h1>

            <p class="subtitle">
              Your Hono application is running
              successfully inside a browser-powered
              WebContainer. Edit the source, save it,
              and watch the preview update.
            </p>

            <section class="workspace">

              <div class="window-bar">
                <div class="circles">
                  <span class="circle red"></span>
                  <span class="circle yellow"></span>
                  <span class="circle green"></span>
                </div>

                <span class="window-title">
                  VibeCode Runtime
                </span>
              </div>

              <div class="content">

                <div class="code">

                  <div class="line">
                    <span class="number">1</span>
                    <span>
                      <span class="purple">const</span>
                      <span class="white">
                        app =
                      </span>
                      <span class="orange">
                        new Hono()
                      </span>
                    </span>
                  </div>

                  <div class="line">
                    <span class="number">2</span>
                    <span>
                      <span class="blue">
                        app.get
                      </span>
                      <span class="white">
                        ("/", ...)
                      </span>
                    </span>
                  </div>

                  <div class="line">
                    <span class="number">3</span>
                    <span>
                      <span class="purple">
                        return
                      </span>
                      <span class="orange">
                        c.html(...)
                      </span>
                    </span>
                  </div>

                  <div class="line">
                    <span class="number">4</span>
                    <span class="white">
                      server.listen()
                    </span>
                  </div>

                </div>

                <div class="terminal">

                  <div class="terminal-title">
                    TERMINAL
                  </div>

                  <div class="terminal-line">
                    <span class="prompt">$</span>
                    npm run dev
                  </div>

                  <div class="terminal-line success">
                    ✓ Dependencies ready
                  </div>

                  <div class="terminal-line success">
                    ✓ Server listening
                  </div>

                  <div class="terminal-line">
                    Ready for changes
                    <span class="cursor"></span>
                  </div>

                </div>

              </div>

            </section>

          </div>
        </main>
      </body>
    </html>
  `);
});

const port = 3005;

console.log(
  `Server is running on http://localhost:\${port}`
);

serve({
  fetch: app.fetch,
  port,
});