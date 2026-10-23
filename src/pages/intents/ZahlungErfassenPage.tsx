/**
 * Zahlung erfassen — 2-Schritt-Wizard mit Prüfen-Schritt.
 * Steps: 1) Buchung wählen → 2) Zahlungsstatus setzen → 3) Prüfen & speichern.
 * Reads: buchungen (bestätigt, noch nicht bezahlt; Gast und Zimmer als Namen). Writes: buchungen (zahlungsstatus, Update).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldDate, fieldLookup } from '@/lib/journey';
import { useZahlungErfassenFlow } from '@/lib/journey/flows/ZahlungErfassen';
import { tx } from '@/i18n';

function shortDate(iso: string | null): string {
  if (!iso) return '?';
  try {
    return format(parseISO(iso), 'dd.MM.yyyy');
  } catch {
    return iso;
  }
}

export default function ZahlungErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useZahlungErfassenFlow({
    steps: { buchungen: 1, zahlungsstatus: 2 },
    items: {
      buchungen: (b, ctx) => ({
        id: b.id,
        title: ctx.ref('gast') ?? tx('Ohne Gast'),
        subtitle: tx`${ctx.ref('zimmer') ?? tx('Ohne Zimmer')} · ${shortDate(fieldDate(b, 'anreise'))} – ${shortDate(fieldDate(b, 'abreise'))}`,
        status: fieldLookup(b, 'zahlungsstatus') ?? undefined,
      }),
    },
  });

  return (
    <IntentWizardShell
      title={tx('Zahlung erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Anzahlung oder vollständige Zahlung zu einer bestätigten Buchung vermerken.'),
        needs: [tx('Name des Gastes oder Zimmer'), tx('Höhe der erhaltenen Zahlung')],
      }}
    >
      <WizardStep label={tx('Buchung')} description={tx('Für welche bestätigte Buchung ist Geld eingegangen?')}>
        <EntitySelectStep
          {...flow.picks.buchungen.select}
          {...flow.pick('buchungen')}
          avatar="initials"
          searchPlaceholder={tx('Buchung suchen …')}
          emptyText={tx('Keine bestätigte Buchung mit offener Zahlung gefunden.')}
        />
      </WizardStep>
      <WizardStep label={tx('Zahlungsstatus')} description={tx('Wähle, wie weit die Buchung bezahlt ist.')}>
        <div className="space-y-4">
          <Bound form={flow.forms.buchungen} name="zahlungsstatus" />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Der neue Zahlungsstatus steht sofort an der Buchung.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          actions={{ copy: false, print: false }}
          next={[
            { label: tx('Weitere Zahlung erfassen'), onClick: () => { flow.reset(); setStep(1); } },
            { label: tx('Aufenthalt abschließen'), href: '#/intents/aufenthalt-abschliessen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
