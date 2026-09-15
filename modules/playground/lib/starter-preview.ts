export type StarterPreviewConfig = {
  framework: string;
  description: string;
  command: string;
  port?: number;
};

export function createStarterPreview({
  framework,
  description,
  command,
  port,
}: StarterPreviewConfig) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>${framework} • VibeCode</title>

        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            min-height: 100vh;

            display: flex;
            align-items: center;
            justify-content: center;

            overflow: hidden;

            font-family:
              Inter,
              system-ui,
              sans-serif;

            color: #f4f4f5;

            background:
              radial-gradient(
                circle at 20% 20%,
                rgba(244, 63, 94, 0.18),
                transparent 35%
              ),
              radial-gradient(
                circle at 80% 80%,
                rgba(168, 85, 247, 0.15),
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
                rgba(255,255,255,.035) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255,255,255,.035) 1px,
                transparent 1px
              );

            background-size: 40px 40px;

            pointer-events: none;
          }

          .orb {
            position: fixed;

            width: 250px;
            height: 250px;

            border-radius: 50%;

            filter: blur(80px);

            opacity: 0.25;

            pointer-events: none;
          }

          .orb-one {
            top: -80px;
            left: -70px;

            background: #f43f5e;

            animation:
              floatOne 8s
              ease-in-out
              infinite alternate;
          }

          .orb-two {
            right: -80px;
            bottom: -90px;

            background: #8b5cf6;

            animation:
              floatTwo 9s
              ease-in-out
              infinite alternate;
          }

          .container {
            position: relative;
            z-index: 2;

            width: min(850px, 90%);

            text-align: center;

            animation:
              enter .7s
              cubic-bezier(.16, 1, .3, 1)
              both;
          }

          .badge {
            width: fit-content;

            display: flex;
            align-items: center;
            gap: 8px;

            margin:
              0 auto 24px;

            padding:
              8px 13px;

            border:
              1px solid
              rgba(255,255,255,.09);

            border-radius: 999px;

            background:
              rgba(255,255,255,.04);

            color: #d4d4d8;

            font-size: 12px;
            font-weight: 600;
          }

          .dot {
            width: 7px;
            height: 7px;

            border-radius: 50%;

            background: #22c55e;

            box-shadow:
              0 0 16px
              rgba(34,197,94,.8);

            animation:
              pulse 1.6s infinite;
          }

          h1 {
            font-size:
              clamp(42px, 7vw, 76px);

            line-height: 1;

            letter-spacing: -.055em;
          }

          .framework {
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

          .description {
            max-width: 600px;

            margin:
              24px auto 0;

            color: #a1a1aa;

            font-size: 15px;

            line-height: 1.7;
          }

          .runtime {
            max-width: 620px;

            margin:
              40px auto 0;

            overflow: hidden;

            border:
              1px solid
              rgba(255,255,255,.08);

            border-radius: 14px;

            background:
              rgba(15,16,20,.88);

            box-shadow:
              0 25px 80px
              rgba(0,0,0,.45);

            text-align: left;

            backdrop-filter:
              blur(18px);
          }

          .runtime-header {
            height: 40px;

            display: flex;
            align-items: center;
            gap: 6px;

            padding:
              0 14px;

            border-bottom:
              1px solid
              rgba(255,255,255,.06);
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

          .runtime-body {
            padding: 22px;

            font-family:
              Consolas,
              monospace;

            font-size: 13px;

            line-height: 2;
          }

          .prompt {
            color: #f43f5e;
          }

          .success {
            color: #4ade80;
          }

          .muted {
            color: #71717a;
          }

          @keyframes enter {
            from {
              opacity: 0;

              transform:
                translateY(22px)
                scale(.985);
            }

            to {
              opacity: 1;

              transform:
                translateY(0)
                scale(1);
            }
          }

          @keyframes pulse {
            50% {
              opacity: .4;
            }
          }

          @keyframes floatOne {
            to {
              transform:
                translate(80px, 60px);
            }
          }

          @keyframes floatTwo {
            to {
              transform:
                translate(-80px, -50px);
            }
          }

          @media (
            prefers-reduced-motion:
            reduce
          ) {
            * {
              animation:
                none !important;
            }
          }
        </style>
      </head>

      <body>

        <div class="orb orb-one"></div>
        <div class="orb orb-two"></div>

        <main class="container">

          <div class="badge">
            <span class="dot"></span>

            ${framework}
            running in VibeCode
          </div>

          <h1>
            Build faster with

            <span class="framework">
              ${framework}
            </span>
          </h1>

          <p class="description">
            ${description}
          </p>

          <section class="runtime">

            <div class="runtime-header">
              <span class="circle red"></span>
              <span class="circle yellow"></span>
              <span class="circle green"></span>
            </div>

            <div class="runtime-body">

              <div>
                <span class="prompt">
                  $
                </span>

                ${command}
              </div>

              <div class="success">
                ✓ Dependencies ready
              </div>

              <div class="success">
                ✓ Development server running
              </div>

              ${
                port
                  ? `
                    <div class="muted">
                      Listening on port ${port}
                    </div>
                  `
                  : ""
              }

            </div>

          </section>

        </main>

      </body>
    </html>
  `;
}