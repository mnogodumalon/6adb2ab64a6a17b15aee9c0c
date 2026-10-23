// Auto-generated. Per-entity form-enhancements config for "Zusatzleistungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["leistung_bezeichnung", {"row": ["leistung_preis", "abrechnungsart"], "cols": "1fr 2fr"}, "leistung_beschreibung"],
  defaults: {},
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
