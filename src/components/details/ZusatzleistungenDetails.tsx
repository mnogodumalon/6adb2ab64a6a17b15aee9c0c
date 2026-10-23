import type { Zusatzleistungen, Buchungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface ZusatzleistungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Zusatzleistungen;
  /** 1:N „Buchungen" (zusatzleistungen): VOLLE Liste — der Block filtert auf diesen Record. */
  buchungenList: Buchungen[];
  /** Zeilen-Klick → overlay.push auf das Buchungen-Detail (nie der Edit-Dialog). */
  onOpenBuchungen: (record: Buchungen) => void;
  /** Kontextuelles „+": öffnet den Buchungen-Dialog mit diesem Record vorgesetzt. */
  onAddBuchungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Buchungen-Datensatz. */
  onPickBuchungen?: () => void;
}

export function ZusatzleistungenDetails({
  record,
  buchungenList,
  onOpenBuchungen,
  onAddBuchungen,
  onPickBuchungen,
}: ZusatzleistungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('zusatzleistungen', 'leistung_bezeichnung')} value={record.fields.leistung_bezeichnung} format="text" />
        <RecordField label={fieldLabel('zusatzleistungen', 'leistung_beschreibung')} value={record.fields.leistung_beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('zusatzleistungen', 'leistung_preis')} value={record.fields.leistung_preis} format="text" />
        <RecordField label={fieldLabel('zusatzleistungen', 'abrechnungsart')} value={record.fields.abrechnungsart} format="pill" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('buchungen')}
        items={buchungenList.filter(r => Array.isArray(r.fields.zusatzleistungen) && r.fields.zusatzleistungen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: appLabel('buchungen'), meta: r.fields.anreise })}
        onOpen={onOpenBuchungen}
        onAdd={onAddBuchungen}
        onPick={onPickBuchungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ZUSATZLEISTUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('zusatzleistungen')} />
    </>
  );
}
