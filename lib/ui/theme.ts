export const THEME_COOKIE = 'vui-theme';

export type ThemeChoice = 'light' | 'dark';

/** Light is the default: a person who has never chosen gets the designed default. */
export function parseThemeChoice(value: string | null | undefined): ThemeChoice {
  return value === 'dark' ? 'dark' : 'light';
}

/** A year, so the choice outlives the session it was made in. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
