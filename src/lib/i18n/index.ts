import type { Language } from "../types";
import de from "./de.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
export const dictionaries: Record<Language, typeof en> = { en, es, de, fr };
export const languages: Language[] = ["en", "es", "de", "fr"];
