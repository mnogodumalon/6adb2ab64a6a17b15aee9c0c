/**
 * Anfrage bearbeiten — Buchungsanfrage bestätigen oder ablehnen.
 * Steps: 1) Offene Anfrage wählen → 2) Zimmerverfügbarkeit prüfen, bestätigen oder stornieren → 3) Prüfen & speichern.
 * Reads: buchungen (eligible: buchungsstatus = angefragt; Belegung per Zimmer). Writes: buchungen (buchungsstatus, update).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldDate, fieldNumber, fieldRef, fieldText, useOccupancy } from '@/lib/journey';
import { useAnfrageBearbeitenFlow } from '@/lib/journey/flows/AnfrageBearbeiten';
import { tx } from '@/i18n';

function shortDate(iso: string | null): string {
  return iso ? format(parseISO(iso), 'dd.MM.yyyy') : '—';
}

export default function AnfrageBearbeitenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnfrageBearbeitenFlow({
    steps: { buchungen: 1, buchungsstatus: 2 },
    items: {
      buchungen: (b, ctx) => ({
        id: b.id,
        title: ctx.ref('gast') ?? tx('Ohne Gast'),
        subtitle: tx`${ctx.ref('zimmer') ?? '—'} · ${shortDate(fieldDate(b, 'anreise'))} – ${shortDate(fieldDate(b, 'abreise'))} · ${fieldNumber(b, 'anzahl_personen') ?? '?'} Pers.`,
      }),
    },
  });

  const pickedId = flow.pick('buchungen').selectedId as string | null | undefined;
  const picked = pickedId ? flow.picks.buchungen.recordOf(pickedId) : undefined;
  const zimmerId = picked ? fieldRef(picked, 'zimmer') : null;
  const anreise = picked ? fieldDate(picked, 'anreise') : null;
  const abreise = picked ? fieldDate(picked, 'abreise') : null;
  const belegung = useOccupancy(flow.port, 'buchungen', { resource: zimmerId });

  // The request itself occupies the room too (status "angefragt"), so one overlap is always itself.
  const overlaps =
    anreise && abreise
      ? belegung.blocked.filter(r => {
          const end = r.end ?? format(addDays(parseISO(r.start), 1), 'yyyy-MM-dd');
          return r.start < abreise && end > anreise;
        }).length
      : 0;
  const conflicts = Math.max(0, overlaps - 1);
  const zimmerName = picked ? flow.picks.buchungen.refLabel(picked, 'zimmer') : undefined;
  const gastName = picked ? flow.picks.buchungen.refLabel(picked, 'gast') : undefined;

  const statusKey = flow.forms.buchungen.get('buchungsstatus');

  return (
    <IntentWizardShell
      title={tx('Anfrage bearbeiten')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Offene Buchungsanfragen prüfen und bestätigen oder stornieren.'),
        needs: [tx('Eine offene Anfrage von der Website')],
      }}
    >
      <WizardStep label={tx('Anfrage')} description={tx('Welche offene Anfrage möchtest du bearbeiten?')}>
        <EntitySelectStep
          {...flow.picks.buchungen.select}
          {...flow.pick('buchungen')}
          avatar="initials"
          searchPlaceholder={tx('Wünsche oder Bemerkung suchen …')}
          emptyText={tx('Aktuell gibt es keine offenen Anfragen.')}
        />
      </WizardStep>

      <WizardStep
        label={tx('Verfügbarkeit & Entscheidung')}
        description={tx('Prüfe, ob das Zimmer frei ist, und bestätige oder storniere die Anfrage.')}
        needs={['buchungen']}
      >
        <div className="space-y-4">
          {picked && (
            <div className="rounded-2xl border bg-card p-4 space-y-1 overflow-hidden">
              <p className="font-medium truncate">{gastName ?? tx('Ohne Gast')}</p>
              <p className="text-sm text-muted-foreground">
                {tx`${zimmerName ?? '—'} · ${shortDate(anreise)} – ${shortDate(abreise)} · ${fieldNumber(picked, 'anzahl_personen') ?? '?'} Personen`}
              </p>
              {fieldText(picked, 'wuensche') && (
                <p className="text-sm break-words">{fieldText(picked, 'wuensche')}</p>
              )}
            </div>
          )}
          {belegung.loading ? (
            <p className="text-sm text-muted-foreground">{tx('Belegung wird geprüft …')}</p>
          ) : conflicts > 0 ? (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
              <IconAlertTriangle size={20} className="shrink-0 text-destructive mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-destructive">{tx('Zimmer nicht frei')}</p>
                <p className="text-sm">
                  {tx`${zimmerName ?? tx('Das Zimmer')} ist im gewählten Zeitraum bereits belegt. Du kannst die Anfrage nur stornieren.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <IconCircleCheck size={20} className="shrink-0 text-emerald-600 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium">{tx('Zimmer ist frei')}</p>
                <p className="text-sm text-muted-foreground">
                  {tx('Im gewählten Zeitraum gibt es keine weitere Buchung für dieses Zimmer.')}
                </p>
              </div>
            </div>
          )}
          <Bound form={flow.forms.buchungen} name="buchungsstatus" />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => {
              if (!flow.validateStep(2)) return false;
              if (conflicts > 0 && statusKey === 'bestaetigt') {
                return tx('Das Zimmer ist im gewählten Zeitraum bereits belegt.');
              }
              return true;
            }}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Der Buchungsstatus wird sofort aktualisiert.')}
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
            { label: tx('Zahlung erfassen'), href: '#/intents/zahlung-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
