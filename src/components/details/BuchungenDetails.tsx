import type { Buchungen, Gaeste, Zimmer, Zusatzleistungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface BuchungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Buchungen;
  /** N:1-Ziel „Gaeste": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  gaesteList: Gaeste[];
  /** Klick auf die Gaeste-Relation → overlay.push auf dessen Detail. */
  onOpenGaeste?: (record: Gaeste) => void;
  /** N:1-Ziel „Zimmer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  zimmerList: Zimmer[];
  /** Klick auf die Zimmer-Relation → overlay.push auf dessen Detail. */
  onOpenZimmer?: (record: Zimmer) => void;
  /** N:1-Ziel „Zusatzleistungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  zusatzleistungenList: Zusatzleistungen[];
  /** Reserviert — Zusatzleistungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenZusatzleistungen?: (record: Zusatzleistungen) => void;
}

export function BuchungenDetails({
  record,
  gaesteList,
  onOpenGaeste,
  zimmerList,
  onOpenZimmer,
  zusatzleistungenList,
}: BuchungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const gastTarget = gaesteList.find(r => r.record_id === extractRecordId(record.fields.gast));
  const zimmerTarget = zimmerList.find(r => r.record_id === extractRecordId(record.fields.zimmer));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('buchungen', 'anreise')} value={record.fields.anreise} format="date" />
        <RecordField label={fieldLabel('buchungen', 'abreise')} value={record.fields.abreise} format="date" />
        <RecordField label={fieldLabel('buchungen', 'anzahl_personen')} value={record.fields.anzahl_personen} format="text" />
        <RecordField label={fieldLabel('buchungen', 'zusatzleistungen')} value={Array.isArray(record.fields.zusatzleistungen) ? record.fields.zusatzleistungen.map((u: unknown) => zusatzleistungenList.find(t => t.record_id === extractRecordId(u))?.fields.leistung_bezeichnung ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('buchungen', 'wuensche')} value={record.fields.wuensche} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('buchungen', 'buchungsstatus')} value={record.fields.buchungsstatus} format="pill" />
        <RecordField label={fieldLabel('buchungen', 'zahlungsstatus')} value={record.fields.zahlungsstatus} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('buchungen', 'gast')}
          name={gastTarget?.fields.gast_vorname ?? '—'}
          meta={[gastTarget?.fields.gast_email, gastTarget?.fields.gast_telefon].filter(Boolean).join(' · ') || undefined}
          onClick={gastTarget && onOpenGaeste ? () => onOpenGaeste!(gastTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('buchungen', 'zimmer')}
          name={zimmerTarget?.fields.zimmernummer ?? '—'}
          meta={[zimmerTarget?.fields.bezeichnung].filter(Boolean).join(' · ') || undefined}
          onClick={zimmerTarget && onOpenZimmer ? () => onOpenZimmer!(zimmerTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.BUCHUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('buchungen')} />
    </>
  );
}
