"use client"

import * as React from "react"

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
}: {
  children: React.ReactNode
  attribute?: "class" | `data-${string}`
  defaultTheme?: "light" | "dark" | "system"
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}) {
  const [theme, setThemeState] = React.useState<"light" | "dark" | "system">(
    defaultTheme
  )

  const applyTheme = React.useCallback(
    (nextTheme: "light" | "dark" | "system") => {
      const resolvedTheme =
        nextTheme === "system" && enableSystem
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : nextTheme

      const root = document.documentElement

      if (attribute === "class") {
        root.classList.remove("light", "dark")
        root.classList.add(resolvedTheme)
      } else {
        root.setAttribute(attribute, resolvedTheme)
      }

      root.style.colorScheme = resolvedTheme
    },
    [attribute, enableSystem]
  )

  const setTheme = React.useCallback(
    (nextTheme: "light" | "dark" | "system") => {
      setThemeState(nextTheme)
      localStorage.setItem("theme", nextTheme)
      applyTheme(nextTheme)
    },
    [applyTheme]
  )

  React.useEffect(() => {
    const savedTheme =
      (localStorage.getItem("theme") as "light" | "dark" | "system" | null) ??
      defaultTheme

    setThemeState(savedTheme)
    applyTheme(savedTheme)
  }, [applyTheme, defaultTheme])

  React.useEffect(() => {
    if (!enableSystem || theme !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => applyTheme("system")

    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [applyTheme, enableSystem, theme])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

const ThemeContext = React.createContext<{
  theme: "light" | "dark" | "system"
  setTheme: (theme: "light" | "dark" | "system") => void
}>({
  theme: "system",
  setTheme: () => {},
})

export function useTheme() {
  return React.useContext(ThemeContext)
}
