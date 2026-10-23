/**
 * Buchung anlegen — 5-Schritt-Wizard für die Rezeption.
 * Steps: 1) Gast wählen oder neu anlegen → 2) Anreise, Abreise, Personenzahl → 3) Freies Zimmer wählen →
 *        4) Zusatzleistungen wählen → 5) Prüfen & speichern.
 * Reads: gaeste, zimmer, zusatzleistungen, buchungen (Belegung). Writes: gaeste (nur bei neuem Gast), buchungen.
 * Composes: IntentWizardShell, EntitySelectStep, Bound, AvailabilityRangePicker, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { AvailabilityRangePicker } from '@/components/blocks/AvailabilityRangePicker';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldNumber, fieldLookup, useOccupancy } from '@/lib/journey';
import { useBuchungAnlegenFlow } from '@/lib/journey/flows/BuchungAnlegen';
import { tx } from '@/i18n';

const euro = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

export default function BuchungAnlegenPage() {
  const [step, setStep] = useState(1);
  const [neuerGast, setNeuerGast] = useState(false);
  const [zimmerFehler, setZimmerFehler] = useState<string | null>(null);

  const flow = useBuchungAnlegenFlow({
    steps: {
      gast: 1, gast_vorname: 1, gast_nachname: 1, gast_email: 1, gast_telefon: 1,
      anreise: 2, abreise: 2, anzahl_personen: 2, wuensche: 2,
      zimmer: 3, zusatzleistungen: 4,
    },
    items: {
      gast: g => ({
        id: g.id,
        title: `${fieldText(g, 'gast_vorname')} ${fieldText(g, 'gast_nachname')}`.trim(),
        subtitle: fieldText(g, 'gast_email'),
      }),
      zimmer: z => ({
        id: z.id,
        title: fieldText(z, 'bezeichnung'),
        subtitle: tx`${fieldLookup(z, 'zimmerart')?.label ?? ''} · bis ${fieldNumber(z, 'max_personen') ?? '?'} Personen · ${euro(fieldNumber(z, 'preis_pro_nacht') ?? 0)} / Nacht`,
      }),
      zusatzleistungen: l => ({
        id: l.id,
        title: fieldText(l, 'leistung_bezeichnung'),
        subtitle: `${euro(fieldNumber(l, 'leistung_preis') ?? 0)} · ${fieldLookup(l, 'abrechnungsart')?.label ?? ''}`,
      }),
    },
  });

  const buchung = flow.forms.buchungen;
  const gast = flow.forms.gaeste;
  const belegung = useOccupancy(flow.port, 'buchungen');

  const anreise = (buchung.get('anreise') as string | undefined) ?? null;
  const abreise = (buchung.get('abreise') as string | undefined) ?? null;
  const personen = Number(buchung.get('anzahl_personen') ?? 0);
  const zimmerId = (buchung.get('zimmer') as string | undefined) ?? null;
  const extraIds = (buchung.get('zusatzleistungen') as string[] | undefined) ?? [];

  const naechte = anreise && abreise ? Math.max(0, differenceInCalendarDays(parseISO(abreise), parseISO(anreise))) : 0;
  const zimmerRec = zimmerId ? flow.picks.zimmer.recordOf(zimmerId) : undefined;
  const zimmerSumme = zimmerRec ? (fieldNumber(zimmerRec, 'preis_pro_nacht') ?? 0) * naechte : 0;
  const extrasSumme = extraIds.reduce((sum, id) => {
    const r = flow.picks.zusatzleistungen.recordOf(id);
    if (!r) return sum;
    const preis = fieldNumber(r, 'leistung_preis') ?? 0;
    const art = fieldLookup(r, 'abrechnungsart')?.key;
    if (art === 'pro_nacht') return sum + preis * naechte;
    if (art === 'pro_person_nacht') return sum + preis * naechte * Math.max(personen, 1);
    return sum + preis;
  }, 0);
  const gesamt = zimmerSumme + extrasSumme;

  const pickZimmer = flow.pick('zimmer');
  const selectZimmer = (id: string) => {
    const rec = flow.picks.zimmer.recordOf(id);
    const max = rec ? fieldNumber(rec, 'max_personen') : null;
    if (max !== null && personen > max) {
      setZimmerFehler(tx`Dieses Zimmer bietet nur Platz für ${max} Personen.`);
      return;
    }
    if (!belegung.isFree(anreise, abreise, id)) {
      setZimmerFehler(tx('Das Zimmer ist im gewählten Zeitraum bereits belegt.'));
      return;
    }
    setZimmerFehler(null);
    pickZimmer.onSelect(id);
  };

  return (
    <IntentWizardShell
      title={tx('Buchung anlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Buchung für einen Gast mit Zimmer und Zusatzleistungen anlegen.'),
        needs: [tx('Name des Gastes'), tx('Reisezeitraum'), tx('Personenzahl')],
      }}
    >
      <WizardStep label={tx('Gast')} heading={tx('Gast auswählen')} description={tx('Bestehenden Gast suchen oder einen neuen Gast erfassen.')}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={neuerGast ? 'outline' : 'default'} onClick={() => setNeuerGast(false)}>
              {tx('Bestehender Gast')}
            </Button>
            <Button type="button" variant={neuerGast ? 'default' : 'outline'} onClick={() => setNeuerGast(true)}>
              {tx('Neuer Gast')}
            </Button>
          </div>
          {neuerGast ? (
            <div className="space-y-4">
              <Bound form={gast} name="gast_vorname" />
              <Bound form={gast} name="gast_nachname" />
              <Bound form={gast} name="gast_email" />
              <Bound form={gast} name="gast_telefon" />
            </div>
          ) : (
            <EntitySelectStep
              {...flow.picks.gast.select}
              {...flow.pick('gast')}
              create={false}
              avatar="initials"
              searchPlaceholder={tx('Name oder E-Mail …')}
            />
          )}
          <StepNav
            hideBack
            nextStepLabel={tx('Zeitraum')}
            onNext={() =>
              neuerGast
                ? gast.validate(['gast_vorname', 'gast_nachname', 'gast_email'])
                : buchung.validate(['gast'])
            }
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Zeitraum')} description={tx('An- und Abreise wählen und die Personenzahl angeben.')}>
        <div className="space-y-4">
          <Field form={buchung} name="anreise" label={tx('Anreise und Abreise')}>
            <AvailabilityRangePicker {...buchung.range('anreise', 'abreise', { blocked: [] })} />
          </Field>
          <Bound form={buchung} name="anzahl_personen" />
          <Bound form={buchung} name="wuensche" />
          <StepNav
            onBack={() => setStep(1)}
            nextStepLabel={tx('Zimmer')}
            onNext={() => buchung.validate(['anreise', 'abreise', 'anzahl_personen'])}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Zimmer')}
        heading={tx('Zimmer wählen')}
        description={tx('Nur ein Zimmer, das für die Personenzahl passt und im Zeitraum frei ist.')}
        needs={['anreise', 'abreise', 'anzahl_personen']}
      >
        <div className="space-y-4">
          <EntitySelectStep
            {...flow.picks.zimmer.select}
            selectedId={pickZimmer.selectedId}
            onSelect={selectZimmer}
            create={false}
            avatar="none"
            searchPlaceholder={tx('Zimmer suchen …')}
            emptyText={tx('Kein passendes Zimmer vorhanden.')}
          />
          {zimmerFehler && <p className="text-sm text-destructive">{zimmerFehler}</p>}
          <StepNav
            onBack={() => setStep(2)}
            nextStepLabel={tx('Zusatzleistungen')}
            onNext={() => buchung.validate(['zimmer'])}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Zusatzleistungen')}
        description={tx('Optional: Frühstück, Parkplatz & Co. dazubuchen.')}
        needs={['zimmer']}
      >
        <div className="space-y-4">
          <Field form={buchung} name="zusatzleistungen">
            <EntitySelectStep
              {...flow.picks.zusatzleistungen.select}
              {...flow.pickMany('zusatzleistungen')}
              create={false}
              avatar="none"
            />
          </Field>
          {naechte > 0 && (
            <div className="rounded-2xl bg-secondary p-4 text-sm space-y-1">
              <div className="flex justify-between gap-2"><span>{tx`Zimmer (${naechte} Nächte)`}</span><span>{euro(zimmerSumme)}</span></div>
              <div className="flex justify-between gap-2"><span>{tx('Zusatzleistungen')}</span><span>{euro(extrasSumme)}</span></div>
              <div className="flex justify-between gap-2 font-semibold border-t pt-1"><span>{tx('Geschätzter Gesamtpreis')}</span><span>{euro(gesamt)}</span></div>
            </div>
          )}
          <StepNav onBack={() => setStep(3)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')} heading={tx('Buchung speichern')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'buchungsstatus', label: tx('Buchungsstatus'), value: tx('Bestätigt') },
              { key: 'zahlungsstatus', label: tx('Zahlungsstatus'), value: tx('Offen') },
              ...(naechte > 0 ? [{ key: 'gesamt', label: tx('Geschätzter Gesamtpreis'), value: euro(gesamt) }] : []),
            ]}
            whatHappensNext={tx('Die Buchung wird bestätigt angelegt, die Zahlung bleibt offen.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Buchungsanfrage bearbeiten'), href: '#/intents/anfrage-bearbeiten' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
