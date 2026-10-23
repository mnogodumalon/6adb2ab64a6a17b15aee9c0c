// The orchestrator's plan, as far as the running app needs it
// (docs/orchestrator/SPEC.md). Generated — do not edit; regenerated on every
// build and update from the stored plan. Without a plan every map is empty.
//
//   SYSTEM_ASSIGNED entity → fields a tool fills when a record is CREATED — the
//                   value does not exist before; dialogs hide these on create and
//                   the form-polish sets no default on them. A scheduled or
//                   update-triggered tool owns its field but is NOT in here.
//   PLAN_SENTENCES  slug → the plan in the owner's words (flows' field page)
//
// The runtime write guard (FLOW_WRITES/OWNERSHIP, planGuard.ts) left on
// 23.09.2026: a flow page composes against its generated hook, whose submit
// plan IS the Schreibliste — there is no way to spell a write outside it.

export const SYSTEM_ASSIGNED: Record<string, string[]> = {};

export const PLAN_SENTENCES: Record<string, string[]> = {
  "buchung-anlegen": [
    "Legt an: buchungen, gaeste",
    "Automatisch: buchungsstatus (fester Wert „bestaetigt“), zahlungsstatus (fester Wert „offen“)"
  ],
  "anfrage-bearbeiten": [
    "Ändert: buchungen"
  ],
  "zahlung-erfassen": [
    "Ändert: buchungen"
  ],
  "aufenthalt-abschliessen": [
    "Ändert: buchungen",
    "Automatisch: buchungsstatus (fester Wert „abgeschlossen“)"
  ]
};

export const PLAN_SUMMARY = "Die Anwendung verwaltet eine Pension: Zimmer, Gäste, Zusatzleistungen und Buchungen. Kunden buchen ihre Unterkunft über eine öffentliche Website, das Team bestätigt und verfolgt die Buchungen und Zahlungen.";

/** slug → the lists a flow writes (the plan's Schreibliste). The nav leaves a
 *  flow out for a user who may not write one of them (lib/permissions.ts). */
export const FLOW_ENTITIES: Record<string, string[]> = {
  "buchung-anlegen": [
    "buchungen",
    "gaeste"
  ],
  "anfrage-bearbeiten": [
    "buchungen"
  ],
  "zahlung-erfassen": [
    "buchungen"
  ],
  "aufenthalt-abschliessen": [
    "buchungen"
  ]
};
