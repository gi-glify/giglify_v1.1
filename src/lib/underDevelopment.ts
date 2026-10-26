export function isUnderDevelopment(value: string | undefined): boolean {
  return value !== "false";
}

export const UNDER_DEVELOPMENT_MODE = isUnderDevelopment(import.meta.env?.VITE_UNDER_DEVELOPMENT);
