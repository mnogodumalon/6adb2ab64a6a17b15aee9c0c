// Auto-generated. Per-entity form-enhancements config for "Buchungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["gast", "zimmer", {"row": ["anreise", "abreise"]}, "anzahl_personen", {"row": ["buchungsstatus", "zahlungsstatus"], "cols": "1fr 1fr"}, "zusatzleistungen", "wuensche"],
  defaults: {
    'anreise': { kind: 'today' },
    'abreise': { kind: 'todayOffset', days: 3 },
    'anzahl_personen': { kind: 'literal', value: 1 },
    'buchungsstatus': { kind: 'lookup', key: 'angefragt', label: 'Angefragt' },
    'zahlungsstatus': { kind: 'lookup', key: 'offen', label: 'Offen' },
  },
  computed: {
    '_buchung_dauer_naechte': { kind: 'dateDiff', from: 'anreise', to: 'abreise', unit: 'days' },
    '_buchung_gesamtpreis': { op: 'mul', left: { kind: 'dateDiff', from: 'anreise', to: 'abreise', unit: 'days' }, right: { kind: 'applookup', ownKey: 'zimmer', lookupKey: 'preis_pro_nacht' } },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
