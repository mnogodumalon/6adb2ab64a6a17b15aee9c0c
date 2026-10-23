/**
 * Aufenthalt abschließen — 2-Schritt-Wizard.
 * Steps: 1) Buchung mit vergangener Abreise wählen → 2) Prüfen & als abgeschlossen markieren.
 * Reads: buchungen (Gast, Zimmer, Abreise, Zahlungsstatus). Writes: buchungen (buchungsstatus = abgeschlossen, via useAufenthaltAbschliessenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldDate, fieldLookup } from '@/lib/journey';
import { useAufenthaltAbschliessenFlow } from '@/lib/journey/flows/AufenthaltAbschliessen';
import { tx } from '@/i18n';

export default function AufenthaltAbschliessenPage() {
  const [step, setStep] = useState(1);
  const flow = useAufenthaltAbschliessenFlow({
    steps: { buchungen: 1 },
    items: {
      buchungen: (b, ctx) => {
        const abreise = fieldDate(b, 'abreise');
        const zahlung = fieldLookup(b, 'zahlungsstatus');
        return {
          id: b.id,
          title: ctx.ref('gast') ?? tx('Ohne Gast'),
          subtitle: [
            ctx.ref('zimmer'),
            abreise ? tx`Abreise ${format(parseISO(abreise), 'dd.MM.yyyy')}` : undefined,
          ].filter(Boolean).join(' · '),
          status: zahlung ?? undefined,
        };
      },
    },
  });

  const statusLabel = flow.submit.result
    ? fieldLookup(flow.submit.result.primary, 'buchungsstatus')?.label
    : undefined;

  return (
    <IntentWizardShell
      title={tx('Aufenthalt abschließen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{ description: tx('Nach der Abreise die Buchung als abgeschlossen markieren.'), needs: [tx('Die Buchung des Gastes')] }}
    >
      <WizardStep label={tx('Buchung')} description={tx('Welcher Aufenthalt ist beendet? Hier siehst du bestätigte Buchungen mit vergangener Abreise.')}>
        <EntitySelectStep
          {...flow.picks.buchungen.select}
          {...flow.pick('buchungen')}
          avatar="initials"
          searchPlaceholder={tx('Buchung suchen …')}
          emptyText={tx('Zurzeit ist keine bestätigte Buchung mit vergangener Abreise offen.')}
        />
        {flow.picks.buchungen.select.items.length === 0 && (
          <div className="mt-4 flex flex-wrap gap-2" data-field="leer-aktionen">
            <Button type="button" variant="outline" onClick={() => { window.location.hash = '#/intents/anfrage-bearbeiten'; }}>
              {tx('Buchungsanfrage bearbeiten')}
            </Button>
            <Button type="button" variant="outline" onClick={() => { window.location.hash = '#/'; }}>
              {tx('Zum Dashboard')}
            </Button>
          </div>
        )}
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'buchungsstatus', label: tx('Neuer Status'), value: tx('Abgeschlossen') }]}
            whatHappensNext={tx('Die Buchung wird als abgeschlossen markiert.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          facts={statusLabel ? [{ label: tx('Buchungsstatus'), value: statusLabel }] : undefined}
          actions={{ copy: false, print: false }}
          next={[
            { label: tx('Weiteren Aufenthalt abschließen') },
            { label: tx('Zahlung erfassen'), href: '#/intents/zahlung-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
