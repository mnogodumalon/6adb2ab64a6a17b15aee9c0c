// Auto-generated. Per-entity form-enhancements config for "Zimmer".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["zimmernummer", "bezeichnung"], "cols": "1fr 2fr"}, "zimmerart", {"row": ["max_personen", "preis_pro_nacht"], "cols": "1fr 1fr"}, "verfuegbar", "ausstattung", "beschreibung"],
  defaults: {
    'max_personen': { kind: 'literal', value: 2 },
    'verfuegbar': { kind: 'literal', value: true },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
