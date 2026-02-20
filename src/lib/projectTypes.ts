export const DEFAULT_PROJECT_TYPES = ['Planner', 'Branding', 'Campaña'] as const;

const STORAGE_KEY = 'customProjectTypes';

export function getCustomProjectTypes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function setCustomProjectTypes(types: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
}

export function getAllProjectTypes(): string[] {
  return [...DEFAULT_PROJECT_TYPES, ...getCustomProjectTypes()];
}
