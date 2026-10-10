export type Theme = 'light' | 'dark'

const KEY = 'theme'

export function storedTheme(): Theme {
  const v = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
  return v === 'dark' ? 'dark' : 'light'
}

export function setTheme(t: Theme): void {
  document.documentElement.setAttribute('data-theme', t)
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, t)
}
