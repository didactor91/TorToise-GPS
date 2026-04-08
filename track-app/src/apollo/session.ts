'use strict'

let _onSessionExpired: (() => void) | null = null

export function onSessionExpired(cb: () => void): void {
  _onSessionExpired = cb
}

export function notifySessionExpired(): void {
  if (_onSessionExpired) { _onSessionExpired(); _onSessionExpired = null }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now() + 30_000
  } catch { return true }
}
