/**
 * Login state.
 *
 * `localStorage` is an *external store*: it changes without React knowing
 * (another tab logs out, the API layer clears it on a 401). Modelling it with
 * `useSyncExternalStore` — which `useSession` wraps — means components
 * re-render when the session changes and never read `localStorage` during
 * render, which would break hydration.
 */
import { useSyncExternalStore } from 'react';
import type { TeamMember } from './types';

export const TOKEN_KEY = 'taskflow_token';
export const USER_KEY = 'taskflow_user';

/* -------------------------------- writing --------------------------------- */

let cachedUser: TeamMember | null | undefined;

const parseUser = (raw: string | null): TeamMember | null => {
  if (raw === null) return null;

  try {
    return JSON.parse(raw) as TeamMember;
  } catch {
    // Corrupted value: drop it rather than crashing every render.
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
};

/**
 * Persists the user and only notifies subscribers when something changed.
 *
 * Skipping the no-op notification matters: an effect that fetches a profile and
 * writes it back would otherwise re-trigger itself forever.
 */
const writeUser = (user: TeamMember): void => {
  const serialised = JSON.stringify(user);
  const isUnchanged = cachedUser !== undefined && JSON.stringify(cachedUser) === serialised;

  window.localStorage.setItem(USER_KEY, serialised);

  if (isUnchanged) return;

  cachedUser = user;
  notify();
};

/** Call after login or registration. */
export const storeSession = (user: TeamMember, token: string): void => {
  window.localStorage.setItem(TOKEN_KEY, token);
  writeUser(user);
};

/** Call after a profile edit — same user, newer details, token untouched. */
export const updateStoredUser = (user: TeamMember): void => {
  writeUser(user);
};

export const clearSession = (): void => {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);

  cachedUser = null;
  notify();
};

/* ---------------------------- store plumbing ------------------------------ */

const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);

  // A change made in another tab does not fire an event here, so mirror it.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== USER_KEY) return;
    cachedUser = undefined;
    notify();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
};

const getSnapshot = (): TeamMember | null => {
  if (cachedUser === undefined) {
    cachedUser = parseUser(window.localStorage.getItem(USER_KEY));
  }
  return cachedUser;
};

/** The server has no localStorage, so it always renders "signed out". */
const getServerSnapshot = (): TeamMember | null => null;

/* --------------------------------- public --------------------------------- */

/** The signed-in user, or `null`. Safe to call during render. */
export const useSession = (): TeamMember | null =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

/**
 * `false` during server rendering and the hydration render, `true` afterwards.
 *
 * `useSyncExternalStore` deliberately returns the *server* snapshot for the
 * first client render, so `useSession()` is `null` for that one pass even when
 * a session exists. Anything that acts on "no user" (redirecting to /login)
 * must wait for this flag, or a plain page refresh would log people out.
 */
export const useHasHydrated = (): boolean =>
  useSyncExternalStore(subscribe, () => true, () => false);

/** Clears the session and returns the user to the login screen. */
export const logout = (): void => {
  clearSession();

  // A full navigation (not a client-side route change) is deliberate: it drops
  // every in-memory cache belonging to the dead session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign('/login');
};

/** Sends an unauthenticated visitor to /login. */
export const redirectToLogin = logout;