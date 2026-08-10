import Link from "next/link";
import Image from "next/image";
import  {ThemeToggle} from "@/components/ui/theme-toggle";
import UserButton from "../auth/components/user-button";

export function Header() {
  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white dark:bg-black/5">
      <div className="flex w-full items-center justify-center">
        <div
          className="
            relative flex w-full items-center justify-between gap-4
            rounded-b-[28px] border-x border-b border-[rgba(230,230,230,0.7)]
            bg-gradient-to-b from-white/90 via-gray-50/90 to-white/90
            px-4 py-2.5 shadow-[0_2px_20px_-2px_rgba(0,0,0,0.1)]
            backdrop-blur-md transition-all duration-300 ease-in-out
            dark:border-[rgba(70,70,70,0.7)] dark:from-zinc-900/90
            dark:via-zinc-800/90 dark:to-zinc-900/90 sm:min-w-[800px] sm:max-w-[1200px]
          "
        >
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Logo" height={52} width={52} />
              <span className="hidden truncate text-lg font-extrabold sm:block">
                VibeCode Editor
              </span>
            </Link>

            <span className="hidden text-zinc-300 dark:text-zinc-700 sm:inline">
              |
            </span>

            <nav className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/docs/components/background-paths"
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Docs
              </Link>
              <Link
                href="https://codesnippetui.pro/templates?utm_source=codesnippetui.com&utm_medium=header"
                target="_blank"
                className="flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                API
                <span className="rounded-lg border border-green-500 px-1 py-0.5 text-xs text-green-500 dark:border-green-400 dark:text-green-400">
                  New
                </span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-zinc-300 dark:text-zinc-700 sm:inline">
              |
            </span>
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}
