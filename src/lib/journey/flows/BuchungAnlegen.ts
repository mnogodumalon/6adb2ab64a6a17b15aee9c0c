/**
 * useBuchungAnlegenFlow — the plumbing of the flow « Buchung anlegen », generated from the plan.
 *
 * Writes `gaeste` (only when the person fills it): asks `gast_vorname`, `gast_nachname`, `gast_email`, `gast_telefon`.
Writes `buchungen`: asks `gast`, `zimmer`, `anreise`, `abreise`, `anzahl_personen`, `zusatzleistungen`, `wuensche`; sets `buchungsstatus`, `zahlungsstatus` itself; links `gast` ← the created `gaeste`.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 5)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useBuchungAnlegenFlow({
 *     steps: { gast: 1, zimmer: 2, zusatzleistungen: 3, gast_vorname: 4, gast_nachname: 4, gast_email: 4, gast_telefon: 4, anreise: 4, abreise: 4, anzahl_personen: 4, wuensche: 4 },
 *     items: { gast: r => ({ id: r.id, title: fieldText(r, 'gast_nachname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.gast.select} {...flow.pick('gast')} />
 *     <EntitySelectStep {...flow.picks.zimmer.select} {...flow.pick('zimmer')} />
 *     <EntitySelectStep {...flow.picks.zusatzleistungen.select} {...flow.pickMany('zusatzleistungen')} />
 *     <Bound form={flow.forms.gaeste} name="gast_vorname" />
 *     <Bound form={flow.forms.gaeste} name="gast_nachname" />
 *     <Bound form={flow.forms.gaeste} name="gast_email" />
 *     <Bound form={flow.forms.gaeste} name="gast_telefon" />
 *     <Bound form={flow.forms.buchungen} name="anreise" />
 *     <Bound form={flow.forms.buchungen} name="abreise" />
 *     <Bound form={flow.forms.buchungen} name="anzahl_personen" />
 *     <Bound form={flow.forms.buchungen} name="wuensche" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
export type BuchungAnlegenFieldKey = 'abreise' | 'anreise' | 'anzahl_personen' | 'gast' | 'gast_email' | 'gast_nachname' | 'gast_telefon' | 'gast_vorname' | 'wuensche' | 'zimmer' | 'zusatzleistungen';

export interface BuchungAnlegenForms {
  gaeste: StepForm<'gaeste'>;
  buchungen: StepForm<'buchungen'>;
}

// Alias so the option generics stay readable.
type Key = BuchungAnlegenFieldKey;

export interface BuchungAnlegenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    gast?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    zimmer?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    zusatzleistungen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"abreise": 4, "anreise": 4, "anzahl_personen": 4, "gast": 1, "gast_email": 4, "gast_nachname": 4, "gast_telefon": 4, "gast_vorname": 4, "wuensche": 4, "zimmer": 2, "zusatzleistungen": 3};
export const BUCHUNGANLEGEN_REVIEW_STEP = 5;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useBuchungAnlegenFlow(options: BuchungAnlegenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const gaeste = useStepForm('gaeste', {
    fields: ["gast_vorname", "gast_nachname", "gast_email", "gast_telefon"],
    steps: only(steps, ["gast_vorname", "gast_nachname", "gast_email", "gast_telefon"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["gast_vorname", "gast_nachname", "gast_email", "gast_telefon"]),
    messages: only(options.messages as Record<string, string> | undefined, ["gast_vorname", "gast_nachname", "gast_email", "gast_telefon"]),
  });
  const buchungen = useStepForm('buchungen', {
    fields: ["gast", "zimmer", "anreise", "abreise", "anzahl_personen", "zusatzleistungen", "wuensche"],
    steps: only(steps, ["gast", "zimmer", "anreise", "abreise", "anzahl_personen", "zusatzleistungen", "wuensche"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["gast", "zimmer", "anreise", "abreise", "anzahl_personen", "zusatzleistungen", "wuensche"]),
    messages: only(options.messages as Record<string, string> | undefined, ["gast", "zimmer", "anreise", "abreise", "anzahl_personen", "zusatzleistungen", "wuensche"]),
  });
  const forms: BuchungAnlegenForms = { gaeste, buchungen };
  const formList: StepForm[] = [gaeste, buchungen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    gast: useRecordSearch(servicePort, 'gaeste', withPickPolicy('gast', {
      searchFields: ["gast_nachname", "gast_vorname", "gast_email"] as never,
      toItem: options.items?.gast as never,
    })),
    zimmer: useRecordSearch(servicePort, 'zimmer', withPickPolicy('zimmer', {
      searchFields: ["bezeichnung"] as never,
      filter: "r.v_verfuegbar == True",
      where: (r: JourneyRecord) => r.fields["verfuegbar"] === true,
      toItem: options.items?.zimmer as never,
    })),
    zusatzleistungen: useRecordSearch(servicePort, 'zusatzleistungen', withPickPolicy('zusatzleistungen', {
      searchFields: ["leistung_bezeichnung"] as never,
      toItem: options.items?.zusatzleistungen as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:buchung-anlegen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:buchung-anlegen:write:${entity}.${field}`,
  });
  const picks = {
    gast: { ...searches.gast, select: { ...searches.gast.select, create: false as boolean, hint: hintFor('gast', 'gaeste', null as PickWhere | null) } },
    zimmer: { ...searches.zimmer, select: { ...searches.zimmer.select, create: false as boolean, hint: hintFor('zimmer', 'zimmer', {"conditions": [{"field": "verfuegbar", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
    zusatzleistungen: { ...searches.zusatzleistungen, select: { ...searches.zusatzleistungen.select, create: false as boolean, hint: hintFor('zusatzleistungen', 'zusatzleistungen', null as PickWhere | null) } },
  };

  const gaesteFilled = hasValues(gaeste);
  const plan: PlanStep[] = [
    ...(gaesteFilled ? [{
      key: 'gaeste', entity: 'gaeste', form: gaeste,    } as PlanStep] : []),
    {
      key: 'buchungen', entity: 'buchungen', form: buchungen, primary: true,      needs: [gaesteFilled ? 'gaeste' : null].filter((x): x is string => !!x),
      link: { ...(gaesteFilled ? { gast: 'gaeste' } : {}) },

      values: (): FormValues => ({
        buchungsstatus: policyFixedValue('buchungen', 'buchungsstatus') ?? "bestaetigt",
        zahlungsstatus: policyFixedValue('buchungen', 'zahlungsstatus') ?? "offen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('buchungen', 'buchungsstatus', policyFixedValue('buchungen', 'buchungsstatus') ?? "bestaetigt"), setting('buchungen', 'zahlungsstatus', policyFixedValue('buchungen', 'zahlungsstatus') ?? "offen")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'buchung-anlegen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: BuchungAnlegenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id)),
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: BuchungAnlegenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'buchung-anlegen' as const,
    draftKey: 'buchung-anlegen' as const,
    entity: 'buchungen' as const,
    form: buchungen,
    forms, formList, picks, submit, steps,    reviewStep: BUCHUNGANLEGEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type BuchungAnlegenFlow = ReturnType<typeof useBuchungAnlegenFlow>;
