/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'zimmer'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.zimmer.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.zimmer.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.zimmer.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.zimmer              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   zimmer: zimmernummer, bezeichnung, zimmerart, max_personen, preis_pro_nacht, ausstattung, beschreibung, foto, …  ·  ← buchungen (list + contextual +)
 *   zusatzleistungen: leistung_bezeichnung, leistung_beschreibung, leistung_preis, abrechnungsart  ·  ← buchungen (list + contextual + + choose existing)
 *   gaeste: gast_vorname, gast_nachname, gast_email, gast_telefon, strasse, hausnummer, plz, ort, …  ·  ← buchungen (list + contextual +)
 *   buchungen: gast, zimmer, anreise, abreise, anzahl_personen, zusatzleistungen, wuensche, buchungsstatus, …  ·  → gaeste · → zimmer · → zusatzleistungen
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Zimmer, Zusatzleistungen, Gaeste, Buchungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordIds } from '@/services/livingAppsService';
import { enrichBuchungen } from '@/lib/enrich';
import type { EnrichedBuchungen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { ZimmerDialog, type ZimmerDialogDefaults } from '@/components/dialogs/ZimmerDialog';
import { ZimmerDetails } from '@/components/details/ZimmerDetails';
import { ZusatzleistungenDialog, type ZusatzleistungenDialogDefaults } from '@/components/dialogs/ZusatzleistungenDialog';
import { ZusatzleistungenDetails } from '@/components/details/ZusatzleistungenDetails';
import { GaesteDialog, type GaesteDialogDefaults } from '@/components/dialogs/GaesteDialog';
import { GaesteDetails } from '@/components/details/GaesteDetails';
import { BuchungenDialog, type BuchungenDialogDefaults } from '@/components/dialogs/BuchungenDialog';
import { BuchungenDetails } from '@/components/details/BuchungenDetails';
import { PickExistingDialog } from '@/components/PickExistingDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'zimmer'; record: Zimmer }
  | { type: 'zusatzleistungen'; record: Zusatzleistungen }
  | { type: 'gaeste'; record: Gaeste }
  | { type: 'buchungen'; record: EnrichedBuchungen };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  zimmer: EntityCrudApi<Zimmer, ZimmerDialogDefaults>;
  zusatzleistungen: EntityCrudApi<Zusatzleistungen, ZusatzleistungenDialogDefaults>;
  gaeste: EntityCrudApi<Gaeste, GaesteDialogDefaults>;
  buchungen: EntityCrudApi<Buchungen, BuchungenDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { zimmer: Zimmer[]; zusatzleistungen: Zusatzleistungen[]; gaeste: Gaeste[]; buchungen: EnrichedBuchungen[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [zimmerDialog, setZimmerDialog] = useState<{ defaults?: ZimmerDialogDefaults; editing?: Zimmer } | null>(null);
  const [zusatzleistungenDialog, setZusatzleistungenDialog] = useState<{ defaults?: ZusatzleistungenDialogDefaults; editing?: Zusatzleistungen } | null>(null);
  const [gaesteDialog, setGaesteDialog] = useState<{ defaults?: GaesteDialogDefaults; editing?: Gaeste } | null>(null);
  const [buchungenDialog, setBuchungenDialog] = useState<{ defaults?: BuchungenDialogDefaults; editing?: Buchungen } | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug buchungen.zusatzleistungen → zusatzleistungen: hält die Hub-record_id.
  const [pickZusatzleistungenBuchungen, setPickZusatzleistungenBuchungen] = useState<string | null>(null);
  const enrichedBuchungen = useMemo(() => enrichBuchungen(data.buchungen, { gaesteMap: data.gaesteMap, zimmerMap: data.zimmerMap, zusatzleistungenMap: data.zusatzleistungenMap }), [data.buchungen, data.gaesteMap, data.zimmerMap, data.zusatzleistungenMap]);

  function detailZimmer(record: Zimmer, push = false) {
    const item: OverlayItem = { type: 'zimmer', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitZimmer(fields: Zimmer['fields']) {
    const editing = zimmerDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setZimmer(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateZimmerEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('zimmer')} — ${t('crud_updated')}`, async () => {
        data.setZimmer(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateZimmerEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createZimmerEntry(fields);
      undoToast(`${appLabel('zimmer')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailZusatzleistungen(record: Zusatzleistungen, push = false) {
    const item: OverlayItem = { type: 'zusatzleistungen', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitZusatzleistungen(fields: Zusatzleistungen['fields']) {
    const editing = zusatzleistungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setZusatzleistungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateZusatzleistungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('zusatzleistungen')} — ${t('crud_updated')}`, async () => {
        data.setZusatzleistungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateZusatzleistungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createZusatzleistungenEntry(fields);
      undoToast(`${appLabel('zusatzleistungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Buchungen to the Zusatzleistungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkZusatzleistungenBuchungen(sourceId: string) {
    const hub = pickZusatzleistungenBuchungen;
    const src = data.buchungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.zusatzleistungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.ZUSATZLEISTUNGEN, id));
    data.setBuchungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, zusatzleistungen: next } } : r)));
    try {
      await LivingAppsService.updateBuchungenEntry(sourceId, { zusatzleistungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('buchungen')} — ${t('pick_linked')}`, async () => {
      data.setBuchungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateBuchungenEntry(sourceId, { zusatzleistungen: src.fields.zusatzleistungen }); } catch { data.fetchAll(); }
    });
  }

  function detailGaeste(record: Gaeste, push = false) {
    const item: OverlayItem = { type: 'gaeste', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitGaeste(fields: Gaeste['fields']) {
    const editing = gaesteDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setGaeste(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateGaesteEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('gaeste')} — ${t('crud_updated')}`, async () => {
        data.setGaeste(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateGaesteEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createGaesteEntry(fields);
      undoToast(`${appLabel('gaeste')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailBuchungen(record: Buchungen, push = false) {
    const rec = enrichedBuchungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'buchungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBuchungen(fields: Buchungen['fields']) {
    const editing = buchungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBuchungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBuchungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('buchungen')} — ${t('crud_updated')}`, async () => {
        data.setBuchungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBuchungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createBuchungenEntry(fields);
      undoToast(`${appLabel('buchungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <ZimmerDialog
        open={zimmerDialog !== null}
        onClose={() => setZimmerDialog(null)}
        onSubmit={submitZimmer}
        defaultValues={zimmerDialog?.defaults}
        recordId={zimmerDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Zimmer']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Zimmer']}
      />
      <ZusatzleistungenDialog
        open={zusatzleistungenDialog !== null}
        onClose={() => setZusatzleistungenDialog(null)}
        onSubmit={submitZusatzleistungen}
        defaultValues={zusatzleistungenDialog?.defaults}
        recordId={zusatzleistungenDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Zusatzleistungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Zusatzleistungen']}
      />
      <GaesteDialog
        open={gaesteDialog !== null}
        onClose={() => setGaesteDialog(null)}
        onSubmit={submitGaeste}
        defaultValues={gaesteDialog?.defaults}
        recordId={gaesteDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Gaeste']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Gaeste']}
      />
      <BuchungenDialog
        open={buchungenDialog !== null}
        onClose={() => setBuchungenDialog(null)}
        onSubmit={submitBuchungen}
        defaultValues={buchungenDialog?.defaults}
        recordId={buchungenDialog?.editing?.record_id}
        gaesteList={data.gaeste}
        zimmerList={data.zimmer}
        zusatzleistungenList={data.zusatzleistungen}
        enablePhotoScan={AI_PHOTO_SCAN['Buchungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Buchungen']}
      />
      <PickExistingDialog
        open={pickZusatzleistungenBuchungen !== null}
        onClose={() => setPickZusatzleistungenBuchungen(null)}
        title={t('pick_title', { title: appLabel('buchungen') })}
        items={data.buchungen
          .filter(r => !extractRecordIds(r.fields.zusatzleistungen).includes(pickZusatzleistungenBuchungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(appLabel('buchungen')), hint: r.fields.anreise ? String(r.fields.anreise) : undefined }))}
        onPick={linkZusatzleistungenBuchungen}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'zimmer') {
            return (
              <>
                <RecordHeader title={top.record.fields.zimmernummer ?? appLabel('zimmer')} subtitle={undefined} />
                <ZimmerDetails
                  record={top.record}
                  buchungenList={data.buchungen}
                  onOpenBuchungen={(r) => detailBuchungen(r, true)}
                  onAddBuchungen={perms.canWrite('buchungen') ? () => setBuchungenDialog({ defaults: { zimmer: createRecordUrl(APP_IDS.ZIMMER, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'zusatzleistungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.leistung_bezeichnung ?? appLabel('zusatzleistungen')} subtitle={undefined} />
                <ZusatzleistungenDetails
                  record={top.record}
                  buchungenList={data.buchungen}
                  onOpenBuchungen={(r) => detailBuchungen(r, true)}
                  onAddBuchungen={perms.canWrite('buchungen') ? () => setBuchungenDialog({ defaults: { zusatzleistungen: [createRecordUrl(APP_IDS.ZUSATZLEISTUNGEN, top.record.record_id)] } }) : undefined}
                  onPickBuchungen={perms.canWrite('buchungen') ? () => setPickZusatzleistungenBuchungen(top.record.record_id) : undefined}
                />
              </>
            );
          }
          if (top.type === 'gaeste') {
            return (
              <>
                <RecordHeader title={top.record.fields.gast_vorname ?? appLabel('gaeste')} subtitle={undefined} />
                <GaesteDetails
                  record={top.record}
                  buchungenList={data.buchungen}
                  onOpenBuchungen={(r) => detailBuchungen(r, true)}
                  onAddBuchungen={perms.canWrite('buchungen') ? () => setBuchungenDialog({ defaults: { gast: createRecordUrl(APP_IDS.GAESTE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'buchungen') {
            return (
              <>
                <RecordHeader title={appLabel('buchungen')} subtitle={top.record.fields.anreise ? formatDate(top.record.fields.anreise) : undefined} />
                <BuchungenDetails
                  record={top.record}
                  gaesteList={data.gaeste}
                  onOpenGaeste={(r) => detailGaeste(r, true)}
                  zimmerList={data.zimmer}
                  onOpenZimmer={(r) => detailZimmer(r, true)}
                  zusatzleistungenList={data.zusatzleistungen}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'zimmer') return perms.canWrite('zimmer');
          if (top.type === 'zusatzleistungen') return perms.canWrite('zusatzleistungen');
          if (top.type === 'gaeste') return perms.canWrite('gaeste');
          if (top.type === 'buchungen') return perms.canWrite('buchungen');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'zimmer') setZimmerDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'zusatzleistungen') setZusatzleistungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'gaeste') setGaesteDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'buchungen') setBuchungenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    zimmer: {
      openCreate: (defaults?: ZimmerDialogDefaults) => (perms.canWrite('zimmer') ? setZimmerDialog({ defaults }) : refuse()),
      openEdit: (record: Zimmer) => (perms.canWrite('zimmer') ? setZimmerDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Zimmer) => detailZimmer(record, false),
      canWrite: perms.canWrite('zimmer'),
    },
    zusatzleistungen: {
      openCreate: (defaults?: ZusatzleistungenDialogDefaults) => (perms.canWrite('zusatzleistungen') ? setZusatzleistungenDialog({ defaults }) : refuse()),
      openEdit: (record: Zusatzleistungen) => (perms.canWrite('zusatzleistungen') ? setZusatzleistungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Zusatzleistungen) => detailZusatzleistungen(record, false),
      canWrite: perms.canWrite('zusatzleistungen'),
    },
    gaeste: {
      openCreate: (defaults?: GaesteDialogDefaults) => (perms.canWrite('gaeste') ? setGaesteDialog({ defaults }) : refuse()),
      openEdit: (record: Gaeste) => (perms.canWrite('gaeste') ? setGaesteDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Gaeste) => detailGaeste(record, false),
      canWrite: perms.canWrite('gaeste'),
    },
    buchungen: {
      openCreate: (defaults?: BuchungenDialogDefaults) => (perms.canWrite('buchungen') ? setBuchungenDialog({ defaults }) : refuse()),
      openEdit: (record: Buchungen) => (perms.canWrite('buchungen') ? setBuchungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Buchungen) => detailBuchungen(record, false),
      canWrite: perms.canWrite('buchungen'),
    },
    enriched: { zimmer: data.zimmer, zusatzleistungen: data.zusatzleistungen, gaeste: data.gaeste, buchungen: enrichedBuchungen },
  };
}
