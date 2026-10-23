import type { Gaeste, Buchungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface GaesteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Gaeste;
  /** 1:N „Buchungen" (gast): VOLLE Liste — der Block filtert auf diesen Record. */
  buchungenList: Buchungen[];
  /** Zeilen-Klick → overlay.push auf das Buchungen-Detail (nie der Edit-Dialog). */
  onOpenBuchungen: (record: Buchungen) => void;
  /** Kontextuelles „+": öffnet den Buchungen-Dialog mit diesem Record vorgesetzt. */
  onAddBuchungen?: () => void;
}

export function GaesteDetails({
  record,
  buchungenList,
  onOpenBuchungen,
  onAddBuchungen,
}: GaesteDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('gaeste', 'gast_vorname')} value={record.fields.gast_vorname} format="text" />
        <RecordField label={fieldLabel('gaeste', 'gast_nachname')} value={record.fields.gast_nachname} format="text" />
        <RecordField label={fieldLabel('gaeste', 'gast_email')} value={record.fields.gast_email} format="email" />
        <RecordField label={fieldLabel('gaeste', 'gast_telefon')} value={record.fields.gast_telefon} format="text" />
        <RecordField label={fieldLabel('gaeste', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('gaeste', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('gaeste', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('gaeste', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('gaeste', 'land')} value={record.fields.land} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('buchungen')}
        items={buchungenList.filter(r => extractRecordId(r.fields.gast) === record.record_id)}
        map={r => ({ name: appLabel('buchungen'), meta: r.fields.anreise })}
        onOpen={onOpenBuchungen}
        onAdd={onAddBuchungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.GAESTE} recordId={record.record_id} readOnly={!perms.canWrite('gaeste')} />
    </>
  );
}
