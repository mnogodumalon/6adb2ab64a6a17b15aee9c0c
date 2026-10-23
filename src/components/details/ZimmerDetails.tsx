import type { Zimmer, Buchungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface ZimmerDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Zimmer;
  /** 1:N „Buchungen" (zimmer): VOLLE Liste — der Block filtert auf diesen Record. */
  buchungenList: Buchungen[];
  /** Zeilen-Klick → overlay.push auf das Buchungen-Detail (nie der Edit-Dialog). */
  onOpenBuchungen: (record: Buchungen) => void;
  /** Kontextuelles „+": öffnet den Buchungen-Dialog mit diesem Record vorgesetzt. */
  onAddBuchungen?: () => void;
}

export function ZimmerDetails({
  record,
  buchungenList,
  onOpenBuchungen,
  onAddBuchungen,
}: ZimmerDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('zimmer', 'zimmernummer')} value={record.fields.zimmernummer} format="text" />
        <RecordField label={fieldLabel('zimmer', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('zimmer', 'zimmerart')} value={record.fields.zimmerart} format="pill" />
        <RecordField label={fieldLabel('zimmer', 'max_personen')} value={record.fields.max_personen} format="text" />
        <RecordField label={fieldLabel('zimmer', 'preis_pro_nacht')} value={record.fields.preis_pro_nacht} format="text" />
        <RecordField label={fieldLabel('zimmer', 'ausstattung')} value={Array.isArray(record.fields.ausstattung) ? record.fields.ausstattung.map((v: unknown) => (v && typeof v === 'object' && 'label' in v) ? (v as {label: unknown}).label : v).join(', ') : null} format="text" />
        <RecordField label={fieldLabel('zimmer', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('zimmer', 'foto')} className="md:col-span-2">
          {record.fields.foto ? (
            <MediaThumbnail src={record.fields.foto as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('zimmer', 'verfuegbar')} value={record.fields.verfuegbar} format="bool" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('buchungen')}
        items={buchungenList.filter(r => extractRecordId(r.fields.zimmer) === record.record_id)}
        map={r => ({ name: appLabel('buchungen'), meta: r.fields.anreise })}
        onOpen={onOpenBuchungen}
        onAdd={onAddBuchungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ZIMMER} recordId={record.record_id} readOnly={!perms.canWrite('zimmer')} />
    </>
  );
}
