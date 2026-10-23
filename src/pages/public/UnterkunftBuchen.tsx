import { useEffect, useMemo, useState } from 'react';
import { PublicShell } from '@/components/PublicShell';
import { tx } from '@/i18n';
import {
  loadPublicPagesConfig,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import { createPublicPort } from '@/lib/journey/publicPort';
import {
  useStepForm,
  useJourneySubmit,
  useRecordSearch,
  fieldText,
  fieldNumber,
  fieldLookup,
  fieldLookups,
  ENTITIES,
  type JourneyRecord,
} from '@/lib/journey';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Field } from '@/components/blocks/Field';
import { Bound } from '@/components/blocks/Bound';
import { EntitySelectStep, type SelectItem } from '@/components/blocks/EntitySelectStep';
import { AvailabilityRangePicker } from '@/components/blocks/AvailabilityRangePicker';

const SLUG = 'unterkunft-buchen';

function money(n: number | null): string {
  return n == null ? '' : n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function UnterkunftBuchen() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicPagesConfig(SLUG).then(c => {
      setCfg(c);
      setPage(c?.pages[SLUG] ?? null);
      setLoading(false);
    });
  }, []);

  if (loading || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }
  return (
    <PublicShell title={page.title} description={page.description}>
      <Booking cfg={cfg} page={page} />
    </PublicShell>
  );
}

function Booking({ cfg, page }: { cfg: PublicPagesConfig; page: PublicPageConfig }) {
  const port = useMemo(() => createPublicPort(cfg, page), [cfg, page]);
  const [step, setStep] = useState(1);

  const gast = useStepForm('gaeste', {
    fields: ['gast_vorname', 'gast_nachname', 'gast_email', 'gast_telefon', 'strasse', 'hausnummer', 'plz', 'ort', 'land'],
    autoComplete: true,
    steps: { gast_vorname: 4, gast_nachname: 4, gast_email: 4, gast_telefon: 4, strasse: 4, hausnummer: 4, plz: 4, ort: 4, land: 4 },
  });
  const buchung = useStepForm('buchungen', {
    fields: ['zimmer', 'anreise', 'abreise', 'anzahl_personen', 'zusatzleistungen', 'wuensche'],
    autoComplete: true,
    steps: { zimmer: 1, anreise: 2, abreise: 2, anzahl_personen: 2, zusatzleistungen: 3, wuensche: 4 },
  });

  const roomId = (buchung.get('zimmer') as string | null) ?? null;

  const rooms = useRecordSearch(port, 'zimmer', {
    searchFields: ['bezeichnung', 'beschreibung'],
    toItem: (r: JourneyRecord): SelectItem => {
      const art = fieldLookup(r, 'zimmerart')?.label;
      const max = fieldNumber(r, 'max_personen');
      const ausstattung = fieldLookups(r, 'ausstattung').map(a => a.label).join(', ');
      const foto = fieldText(r, 'foto');
      return {
        id: r.id,
        title: fieldText(r, 'bezeichnung'),
        subtitle: [art, max != null ? tx`bis ${max} Personen` : '', ausstattung].filter(Boolean).join(' · '),
        stats: [{ label: tx('pro Nacht'), value: `${money(fieldNumber(r, 'preis_pro_nacht'))} €` }],
        icon: foto ? <img src={foto} alt="" className="h-12 w-12 rounded-md object-cover" /> : undefined,
      };
    },
    avatar: 'none',
  } as Parameters<typeof useRecordSearch<'zimmer', SelectItem>>[2]);

  const extras = useRecordSearch(port, 'zusatzleistungen', {
    searchFields: ['leistung_bezeichnung', 'leistung_beschreibung'],
    toItem: (r: JourneyRecord): SelectItem => ({
      id: r.id,
      title: fieldText(r, 'leistung_bezeichnung'),
      subtitle: [fieldText(r, 'leistung_beschreibung'), fieldLookup(r, 'abrechnungsart')?.label].filter(Boolean).join(' · '),
      stats: [{ label: tx('Preis'), value: `${money(fieldNumber(r, 'leistung_preis'))} €` }],
    }),
  });

  const submit = useJourneySubmit(
    port,
    [
      { key: 'gast', entity: 'gaeste', form: gast },
      { key: 'buchung', entity: 'buchungen', form: buchung, primary: true, needs: ['gast'], values: ({ done }) => ({ gast: done.gast ? port.ref(ENTITIES.gaeste.appId, done.gast.id) : undefined }) },
    ],
    { draftKey: 'unterkunft-buchen' },
  );

  const steps = [
    { label: tx('Zimmer') },
    { label: tx('Reisedaten') },
    { label: tx('Extras') },
    { label: tx('Kontakt') },
    { label: tx('Prüfen') },
  ];

  const checkStay = (): boolean | string => {
    if (!buchung.validate(['anreise', 'abreise', 'anzahl_personen'])) return false;
    const room = roomId ? rooms.recordOf(roomId) : undefined;
    const max = room ? fieldNumber(room, 'max_personen') : null;
    const n = Number(buchung.get('anzahl_personen'));
    if (max != null && n > max) return tx`Dieses Zimmer bietet Platz für ${max} Personen.`;
    return true;
  };

  return (
    <IntentWizardShell
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      back={false}
      forms={[gast, buchung]}
      draftKey="unterkunft-buchen"
    >
      {step === 1 && (
        <>
          <EntitySelectStep
            {...rooms.select}
            id={buchung.fieldId('zimmer')}
            selectedId={roomId}
            onSelect={id => buchung.set('zimmer', id, rooms.labelOf(id) ?? '')}
            avatar="none"
            columns={1}
            create={false}
          />
          <StepNav hideBack onNext={() => buchung.validate(['zimmer'])} nextStepLabel={tx('Reisedaten')} />
        </>
      )}
      {step === 2 && (
        <>
          <AvailabilityRangePicker {...buchung.range('anreise', 'abreise')} />
          <div className="mt-4">
            <Bound form={buchung} name="anzahl_personen" />
          </div>
          <StepNav onBack={() => setStep(1)} onNext={checkStay} nextStepLabel={tx('Extras')} />
        </>
      )}
      {step === 3 && (
        <>
          <p className="text-sm text-muted-foreground mb-3">{tx('Optional: wähle Zusatzleistungen für deinen Aufenthalt.')}</p>
          <Field form={buchung} name="zusatzleistungen">
            <EntitySelectStep
              {...extras.select}
              {...buchung.records('zusatzleistungen', extras.labelOf)}
              avatar="none"
              columns={1}
              create={false}
            />
          </Field>
          <StepNav onBack={() => setStep(2)} nextStepLabel={tx('Kontakt')} />
        </>
      )}
      {step === 4 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Bound form={gast} name="gast_vorname" />
            <Bound form={gast} name="gast_nachname" />
            <Bound form={gast} name="gast_email" />
            <Bound form={gast} name="gast_telefon" />
            <Bound form={gast} name="strasse" />
            <Bound form={gast} name="hausnummer" />
            <Bound form={gast} name="plz" />
            <Bound form={gast} name="ort" />
            <Bound form={gast} name="land" />
          </div>
          <div className="mt-4">
            <Bound form={buchung} name="wuensche" />
          </div>
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => gast.validate(['gast_vorname', 'gast_nachname', 'gast_email'])}
            nextStepLabel={tx('Prüfen')}
          />
        </>
      )}
      {step === 5 && !submit.done && (
        <SummaryStep
          forms={[gast, buchung]}
          submit={submit}
          whatHappensNext={tx('Wir prüfen deine Anfrage und melden uns per E-Mail bei dir.')}
        />
      )}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[gast, buchung]}
          submit={submit}
          whatHappensNext={tx('Deine Buchungsanfrage ist eingegangen. Wir melden uns bei dir.')}
        />
      )}
    </IntentWizardShell>
  );
}
