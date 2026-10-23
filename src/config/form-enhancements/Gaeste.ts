// Auto-generated. Per-entity form-enhancements config for "Gäste".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["gast_vorname", "gast_nachname"], "cols": "1fr 1fr"}, "gast_email", "gast_telefon", {"row": ["strasse", "hausnummer"], "cols": "2fr 1fr"}, {"row": ["plz", "ort"], "cols": "1fr 2fr"}, "land"],
  defaults: {},
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
