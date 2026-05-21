export const DEFAULT_LANGUAGE = "en";
export const READY_LANGUAGES = ["en", "ar", "tr"] as const;

export type SupportedLanguage = (typeof READY_LANGUAGES)[number];
