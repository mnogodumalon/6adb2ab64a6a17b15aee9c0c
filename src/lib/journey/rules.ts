/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'zimmer' | 'zusatzleistungen' | 'gaeste' | 'buchungen';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "zimmer": "zimmernummer" | "bezeichnung" | "beschreibung";
  "zusatzleistungen": "leistung_bezeichnung" | "leistung_beschreibung";
  "gaeste": "gast_vorname" | "gast_nachname" | "gast_email" | "gast_telefon" | "strasse" | "hausnummer" | "plz" | "ort" | "land";
  "buchungen": "wuensche";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "zimmer": never;
  "zusatzleistungen": never;
  "gaeste": never;
  "buchungen": "gast" | "zimmer" | "zusatzleistungen";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it as a value. `file` is false: a file is UPLOADED
   *  (`form.file(key)` → FileField; the chosen file travels in the create as a data URL). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "zimmer": {
    "key": "zimmer",
    "appId": "6adb2aa33b6cfc4b5fb3b891",
    "label": "Zimmer",
    "pascal": "Zimmer",
    "single": "ZimmerEntry"
  },
  "zusatzleistungen": {
    "key": "zusatzleistungen",
    "appId": "6adb2aa57a6fce90fc774854",
    "label": "Zusatzleistungen",
    "pascal": "Zusatzleistungen",
    "single": "ZusatzleistungenEntry"
  },
  "gaeste": {
    "key": "gaeste",
    "appId": "6adb2aa696471bbae6d3797c",
    "label": "Gäste",
    "pascal": "Gaeste",
    "single": "GaesteEntry"
  },
  "buchungen": {
    "key": "buchungen",
    "appId": "6adb2aa7ef7308bf6353452c",
    "label": "Buchungen",
    "pascal": "Buchungen",
    "single": "BuchungenEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "zimmer": {
    "zimmernummer": {
      "key": "zimmernummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Zimmernummer",
      "writable": true,
      "maxLength": 4000
    },
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "zimmerart": {
      "key": "zimmerart",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Zimmerart",
      "writable": true,
      "options": [
        "doppelzimmer",
        "familienzimmer",
        "apartment",
        "einzelzimmer"
      ]
    },
    "max_personen": {
      "key": "max_personen",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Maximale Personenzahl",
      "writable": true
    },
    "preis_pro_nacht": {
      "key": "preis_pro_nacht",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Preis pro Nacht (€)",
      "writable": true,
      "format": "currency"
    },
    "ausstattung": {
      "key": "ausstattung",
      "fulltype": "multiplelookup/checkbox",
      "kind": "multilookup",
      "required": false,
      "label": "Ausstattung",
      "writable": true,
      "options": [
        "wlan",
        "eigenes_bad",
        "balkon",
        "fernseher",
        "kochnische",
        "haustiere_erlaubt"
      ]
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "foto": {
      "key": "foto",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "Foto",
      "writable": false
    },
    "verfuegbar": {
      "key": "verfuegbar",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Zur Buchung verfügbar",
      "writable": true
    }
  },
  "zusatzleistungen": {
    "leistung_bezeichnung": {
      "key": "leistung_bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "leistung_beschreibung": {
      "key": "leistung_beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "leistung_preis": {
      "key": "leistung_preis",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Preis (€)",
      "writable": true,
      "format": "currency"
    },
    "abrechnungsart": {
      "key": "abrechnungsart",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Abrechnungsart",
      "writable": true,
      "options": [
        "pro_nacht",
        "pro_person_nacht",
        "einmalig"
      ]
    }
  },
  "gaeste": {
    "gast_vorname": {
      "key": "gast_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "gast_nachname": {
      "key": "gast_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "gast_email": {
      "key": "gast_email",
      "fulltype": "string/email",
      "kind": "email",
      "required": true,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "gast_telefon": {
      "key": "gast_telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "plz": {
      "key": "plz",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Postleitzahl",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "land": {
      "key": "land",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Land",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "country-name"
    }
  },
  "buchungen": {
    "gast": {
      "key": "gast",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Gast",
      "writable": true,
      "targetAppId": "6adb2aa696471bbae6d3797c",
      "targetEntity": "gaeste"
    },
    "zimmer": {
      "key": "zimmer",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Zimmer",
      "writable": true,
      "targetAppId": "6adb2aa33b6cfc4b5fb3b891",
      "targetEntity": "zimmer"
    },
    "anreise": {
      "key": "anreise",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Anreisedatum",
      "writable": true
    },
    "abreise": {
      "key": "abreise",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Abreisedatum",
      "writable": true
    },
    "anzahl_personen": {
      "key": "anzahl_personen",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Anzahl Personen",
      "writable": true
    },
    "zusatzleistungen": {
      "key": "zusatzleistungen",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Zusatzleistungen",
      "writable": true,
      "targetAppId": "6adb2aa57a6fce90fc774854",
      "targetEntity": "zusatzleistungen"
    },
    "wuensche": {
      "key": "wuensche",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Wünsche und Bemerkungen",
      "writable": true
    },
    "buchungsstatus": {
      "key": "buchungsstatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Buchungsstatus",
      "writable": true,
      "options": [
        "angefragt",
        "bestaetigt",
        "storniert",
        "abgeschlossen"
      ]
    },
    "zahlungsstatus": {
      "key": "zahlungsstatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Zahlungsstatus",
      "writable": true,
      "options": [
        "offen",
        "anzahlung_erhalten",
        "bezahlt"
      ]
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "zimmer": [
    {
      "kind": "choice",
      "field": "zimmerart",
      "count": 4
    }
  ],
  "zusatzleistungen": [
    {
      "kind": "choice",
      "field": "abrechnungsart",
      "count": 3
    }
  ],
  "gaeste": [],
  "buchungen": [
    {
      "kind": "range",
      "from": "anreise",
      "to": "abreise"
    },
    {
      "kind": "choice",
      "field": "buchungsstatus",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "zahlungsstatus",
      "count": 3
    },
    {
      "kind": "record",
      "field": "gast",
      "targetEntity": "gaeste"
    },
    {
      "kind": "record",
      "field": "zimmer",
      "targetEntity": "zimmer"
    },
    {
      "kind": "record",
      "field": "zusatzleistungen",
      "targetEntity": "zusatzleistungen"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "zimmer": [
    "zimmernummer"
  ],
  "zusatzleistungen": [
    "leistung_bezeichnung"
  ],
  "gaeste": [
    "gast_vorname"
  ],
  "buchungen": [
    "wuensche"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
function displayPart(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
