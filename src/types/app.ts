import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Zimmer {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    zimmernummer?: string;
    bezeichnung?: string;
    zimmerart?: LookupValue;
    max_personen?: number;
    preis_pro_nacht?: number;
    ausstattung?: LookupValue[];
    beschreibung?: string;
    foto?: string;
    verfuegbar?: boolean;
  };
}

export interface Zusatzleistungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    leistung_bezeichnung?: string;
    leistung_beschreibung?: string;
    leistung_preis?: number;
    abrechnungsart?: LookupValue;
  };
}

export interface Gaeste {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    gast_vorname?: string;
    gast_nachname?: string;
    gast_email?: string;
    gast_telefon?: string;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    land?: string;
  };
}

export interface Buchungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    gast?: RecordUrl; // applookup -> URL zu 'Gaeste' Record
    zimmer?: RecordUrl; // applookup -> URL zu 'Zimmer' Record
    anreise?: string; // Format: YYYY-MM-DD oder ISO String
    abreise?: string; // Format: YYYY-MM-DD oder ISO String
    anzahl_personen?: number;
    zusatzleistungen?: RecordUrl[];
    wuensche?: string;
    buchungsstatus?: LookupValue;
    zahlungsstatus?: LookupValue;
  };
}

export const APP_IDS = {
  ZIMMER: '6adb2aa33b6cfc4b5fb3b891',
  ZUSATZLEISTUNGEN: '6adb2aa57a6fce90fc774854',
  GAESTE: '6adb2aa696471bbae6d3797c',
  BUCHUNGEN: '6adb2aa7ef7308bf6353452c',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'zimmer': {
    zimmerart: [{ key: "doppelzimmer", get label() { return lookupLabel('zimmer', 'zimmerart', "doppelzimmer") ?? "Doppelzimmer"; } }, { key: "familienzimmer", get label() { return lookupLabel('zimmer', 'zimmerart', "familienzimmer") ?? "Familienzimmer"; } }, { key: "apartment", get label() { return lookupLabel('zimmer', 'zimmerart', "apartment") ?? "Apartment"; } }, { key: "einzelzimmer", get label() { return lookupLabel('zimmer', 'zimmerart', "einzelzimmer") ?? "Einzelzimmer"; } }],
    ausstattung: [{ key: "wlan", get label() { return lookupLabel('zimmer', 'ausstattung', "wlan") ?? "WLAN"; } }, { key: "eigenes_bad", get label() { return lookupLabel('zimmer', 'ausstattung', "eigenes_bad") ?? "Eigenes Bad"; } }, { key: "balkon", get label() { return lookupLabel('zimmer', 'ausstattung', "balkon") ?? "Balkon"; } }, { key: "fernseher", get label() { return lookupLabel('zimmer', 'ausstattung', "fernseher") ?? "Fernseher"; } }, { key: "kochnische", get label() { return lookupLabel('zimmer', 'ausstattung', "kochnische") ?? "Kochnische"; } }, { key: "haustiere_erlaubt", get label() { return lookupLabel('zimmer', 'ausstattung', "haustiere_erlaubt") ?? "Haustiere erlaubt"; } }],
  },
  'zusatzleistungen': {
    abrechnungsart: [{ key: "pro_nacht", get label() { return lookupLabel('zusatzleistungen', 'abrechnungsart', "pro_nacht") ?? "Pro Nacht"; } }, { key: "pro_person_nacht", get label() { return lookupLabel('zusatzleistungen', 'abrechnungsart', "pro_person_nacht") ?? "Pro Person und Nacht"; } }, { key: "einmalig", get label() { return lookupLabel('zusatzleistungen', 'abrechnungsart', "einmalig") ?? "Einmalig"; } }],
  },
  'buchungen': {
    buchungsstatus: [{ key: "angefragt", get label() { return lookupLabel('buchungen', 'buchungsstatus', "angefragt") ?? "Angefragt"; } }, { key: "bestaetigt", get label() { return lookupLabel('buchungen', 'buchungsstatus', "bestaetigt") ?? "Bestätigt"; } }, { key: "storniert", get label() { return lookupLabel('buchungen', 'buchungsstatus', "storniert") ?? "Storniert"; } }, { key: "abgeschlossen", get label() { return lookupLabel('buchungen', 'buchungsstatus', "abgeschlossen") ?? "Abgeschlossen"; } }],
    zahlungsstatus: [{ key: "offen", get label() { return lookupLabel('buchungen', 'zahlungsstatus', "offen") ?? "Offen"; } }, { key: "anzahlung_erhalten", get label() { return lookupLabel('buchungen', 'zahlungsstatus', "anzahlung_erhalten") ?? "Anzahlung erhalten"; } }, { key: "bezahlt", get label() { return lookupLabel('buchungen', 'zahlungsstatus', "bezahlt") ?? "Bezahlt"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'zimmer': {
    'zimmernummer': 'string/text',
    'bezeichnung': 'string/text',
    'zimmerart': 'lookup/select',
    'max_personen': 'number',
    'preis_pro_nacht': 'number',
    'ausstattung': 'multiplelookup/checkbox',
    'beschreibung': 'string/textarea',
    'foto': 'file',
    'verfuegbar': 'bool',
  },
  'zusatzleistungen': {
    'leistung_bezeichnung': 'string/text',
    'leistung_beschreibung': 'string/textarea',
    'leistung_preis': 'number',
    'abrechnungsart': 'lookup/radio',
  },
  'gaeste': {
    'gast_vorname': 'string/text',
    'gast_nachname': 'string/text',
    'gast_email': 'string/email',
    'gast_telefon': 'string/tel',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'land': 'string/text',
  },
  'buchungen': {
    'gast': 'applookup/select',
    'zimmer': 'applookup/select',
    'anreise': 'date/date',
    'abreise': 'date/date',
    'anzahl_personen': 'number',
    'zusatzleistungen': 'multipleapplookup/select',
    'wuensche': 'string/textarea',
    'buchungsstatus': 'lookup/select',
    'zahlungsstatus': 'lookup/select',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateZimmer = StripLookup<Zimmer['fields']>;
export type CreateZusatzleistungen = StripLookup<Zusatzleistungen['fields']>;
export type CreateGaeste = StripLookup<Gaeste['fields']>;
export type CreateBuchungen = StripLookup<Buchungen['fields']>;