import { useMemo } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { IconAlertTriangle, IconPlus } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import type { EnrichedBuchungen } from '@/types/enriched';
import { LOOKUP_OPTIONS, lookupOption } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { formatDate, lookupKey } from '@/lib/formatters';
import { dateFnsLocale, tx } from '@/i18n';
import { gruss, namen, undoToast, useClock } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { HeroBanner } from '@/components/HeroBanner';
import { WorkList } from '@/components/WorkList';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { KanbanWidget, type KanbanCard, type KanbanTone } from '@/components/widgets/KanbanWidget';

// Hub of the pension: Buchungen carry the whole workflow (Anfrage → Bestätigt → Abgeschlossen),
// so a status board is the primary surface; arrivals/departures and open payments are time/money slices.
const ACTIVE = ['angefragt', 'bestaetigt'];

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { zimmer, gaesteMap, setBuchungen, fetchAll } = data;
  const clock = useClock();
  const todayKey = format(clock, 'yyyy-MM-dd');

  const guestName = (b: EnrichedBuchungen) => {
    const g = gaesteMap.get(extractRecordId(b.fields.gast) ?? '');
    const full = g ? `${g.fields.gast_vorname ?? ''} ${g.fields.gast_nachname ?? ''}`.trim() : '';
    return full || b.gastName || tx('Ohne Gast');
  };

  const setField = (b: EnrichedBuchungen, field: 'buchungsstatus' | 'zahlungsstatus', key: string) => {
    const app = 'buchungen';
    const prev = b.fields[field];
    const prevKey = lookupKey(prev);
    setBuchungen(list => list.map(x => x.record_id === b.record_id
      ? { ...x, fields: { ...x.fields, [field]: lookupOption(app, field, key) } }
      : x));
    const write = (k: string | undefined) =>
      LivingAppsService.updateBuchungenEntry(b.record_id, { [field]: k }).catch(() => { void fetchAll(); });
    void write(key);
    return () => {
      setBuchungen(list => list.map(x => x.record_id === b.record_id
        ? { ...x, fields: { ...x.fields, [field]: prev } }
        : x));
      void write(prevKey);
    };
  };

  // ONE advance helper: hero, work list and overlay footer share it.
  const nextStep = (b: EnrichedBuchungen): { key: string; label: string } | undefined => {
    const s = lookupKey(b.fields.buchungsstatus);
    if (s === 'angefragt') return { key: 'bestaetigt', label: tx('Bestätigen') };
    if (s === 'bestaetigt') return { key: 'abgeschlossen', label: tx('Abschließen') };
    return undefined;
  };
  const advance = (b: EnrichedBuchungen) => {
    const step = nextStep(b);
    if (!step) return;
    const undo = setField(b, 'buchungsstatus', step.key);
    undoToast(tx`${guestName(b)} — ${lookupOption('buchungen', 'buchungsstatus', step.key).label}`, undo);
  };
  const markPaid = (b: EnrichedBuchungen) => {
    const undo = setField(b, 'zahlungsstatus', 'bezahlt');
    undoToast(tx`${guestName(b)} — Zahlung erfasst`, undo);
  };

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type !== 'buchungen') return undefined;
      const step = nextStep(top.record);
      return step ? { label: step.label, onClick: () => advance(top.record) } : undefined;
    },
  });
  const buchungen = crud.enriched.buchungen;

  const dayDiff = (s?: string) => (s ? differenceInCalendarDays(parseISO(s.slice(0, 10)), parseISO(todayKey)) : null);
  const dayLabel = (s?: string) => {
    const d = dayDiff(s);
    if (d === 0) return tx('heute');
    if (d === 1) return tx('morgen');
    return s ? format(parseISO(s.slice(0, 10)), 'EEE, dd.MM.', { locale: dateFnsLocale() }) : '—';
  };

  const angefragt = useMemo(
    () => buchungen.filter(b => lookupKey(b.fields.buchungsstatus) === 'angefragt')
      .sort((a, b) => (a.fields.anreise ?? '').localeCompare(b.fields.anreise ?? '')),
    [buchungen],
  );

  const arrivals = buchungen.filter(b => {
    const d = dayDiff(b.fields.anreise);
    return ACTIVE.includes(lookupKey(b.fields.buchungsstatus) ?? '') && d !== null && d >= 0 && d <= 7;
  }).sort((a, b) => (a.fields.anreise ?? '').localeCompare(b.fields.anreise ?? ''));

  const departures = buchungen.filter(b => {
    const d = dayDiff(b.fields.abreise);
    return lookupKey(b.fields.buchungsstatus) === 'bestaetigt' && d !== null && d >= 0 && d <= 7;
  }).sort((a, b) => (a.fields.abreise ?? '').localeCompare(b.fields.abreise ?? ''));

  const occupied = buchungen.filter(b => {
    const a = b.fields.anreise?.slice(0, 10), d = b.fields.abreise?.slice(0, 10);
    return lookupKey(b.fields.buchungsstatus) === 'bestaetigt' && a && d && a <= todayKey && todayKey < d;
  });
  const occupiedRooms = new Set(occupied.map(b => b.fields.zimmer)).size;
  const roomCount = zimmer.filter(z => z.fields.verfuegbar !== false).length;

  const unpaid = buchungen.filter(b =>
    lookupKey(b.fields.zahlungsstatus) !== 'bezahlt'
    && ['bestaetigt', 'abgeschlossen', 'angefragt'].includes(lookupKey(b.fields.buchungsstatus) ?? ''),
  ).sort((a, b) => (a.fields.anreise ?? '').localeCompare(b.fields.anreise ?? ''));

  const columns = (LOOKUP_OPTIONS['buchungen']?.['buchungsstatus'] ?? []).map(o => ({ key: o.key, label: o.label }));
  const toneFor = (s: string): KanbanTone =>
    s === 'angefragt' ? 'warning' : s === 'bestaetigt' ? 'primary' : s === 'abgeschlossen' ? 'success' : 'default';
  const cards: KanbanCard[] = [...buchungen]
    .sort((a, b) => (a.fields.anreise ?? '').localeCompare(b.fields.anreise ?? ''))
    .map(b => {
      const s = lookupKey(b.fields.buchungsstatus) ?? columns[0]?.key ?? '';
      return {
        id: `buchung:${b.record_id}`,
        column: s,
        title: guestName(b),
        subtitle: `${formatDate(b.fields.anreise)} – ${formatDate(b.fields.abreise)}${b.zimmerName ? ` · ${b.zimmerName}` : ''}`,
        tone: toneFor(s),
      };
    });

  const moveCard = (cardId: string, newColumn: string) => {
    const rid = cardId.split(':')[1];
    const b = buchungen.find(x => x.record_id === rid);
    if (!b) return;
    const undo = setField(b, 'buchungsstatus', newColumn);
    undoToast(tx`${guestName(b)} — ${lookupOption('buchungen', 'buchungsstatus', newColumn).label}`, undo);
  };

  const openBuchung = (id: string) => {
    const rec = data.buchungen.find(b => b.record_id === id);
    if (rec) crud.buchungen.openDetail(rec);
  };

  // Context line — names in every branch
  let context: string;
  if (angefragt.length > 0) {
    context = tx`${namen(angefragt.map(guestName))} warten auf deine Bestätigung.`;
  } else if (arrivals.length > 0) {
    context = tx`Als Nächstes reist ${namen(arrivals.map(guestName))} an (${dayLabel(arrivals[0].fields.anreise)}).`;
  } else if (departures.length > 0) {
    context = tx`${namen(departures.map(guestName))} reist als Nächstes ab (${dayLabel(departures[0].fields.abreise)}).`;
  } else if (unpaid.length > 0) {
    context = tx`Offene Zahlung: ${namen(unpaid.map(guestName))}.`;
  } else {
    context = tx`Gerade ist alles ruhig — keine Anreisen oder offenen Anfragen.`;
  }

  const hero = angefragt.length > 0 ? (
    <HeroBanner
      icon={<IconAlertTriangle size={18} />}
      action={{ label: tx`${guestName(angefragt[0])} bestätigen`, onClick: () => advance(angefragt[0]) }}
    >
      {angefragt.length === 1
        ? tx`Neue Buchungsanfrage von ${guestName(angefragt[0])} — Anreise ${dayLabel(angefragt[0].fields.anreise)}.`
        : tx`${angefragt.length} offene Buchungsanfragen, zuerst ${guestName(angefragt[0])} (Anreise ${dayLabel(angefragt[0].fields.anreise)}).`}
    </HeroBanner>
  ) : undefined;

  const weekEnd = format(addDays(parseISO(todayKey), 7), 'dd.MM.');

  const stripe = (
    <StatStrip>
      <StatStripItem
        title={tx('Belegte Zimmer')}
        value={`${occupiedRooms} / ${roomCount}`}
        tone={occupiedRooms > 0 ? 'primary' : 'default'}
      />
      <StatStripItem title={tx('Anreisen (7 Tage)')} value={arrivals.length} />
      <StatStripItem title={tx('Abreisen (7 Tage)')} value={departures.length} />
      <StatStripItem
        title={tx('Offene Zahlungen')}
        value={unpaid.length}
        tone={unpaid.length > 0 ? 'warning' : 'default'}
      />
    </StatStrip>
  );

  const arrivalItems = [
    ...arrivals.map(b => ({ b, kind: 'an' as const })),
    ...departures.map(b => ({ b, kind: 'ab' as const })),
  ].sort((x, y) =>
    (x.kind === 'an' ? x.b.fields.anreise ?? '' : x.b.fields.abreise ?? '')
      .localeCompare(y.kind === 'an' ? y.b.fields.anreise ?? '' : y.b.fields.abreise ?? ''));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
        </div>
        {crud.buchungen.canWrite && (
          <Button onClick={() => crud.buchungen.openCreate({ buchungsstatus: 'angefragt', zahlungsstatus: 'offen' })}>
            <IconPlus size={16} className="shrink-0" />
            {tx('Neue Buchung')}
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={hero}
        kpis={stripe}
        primary={
          <KanbanWidget
            cards={cards}
            columns={columns}
            defaultCollapsed={['storniert', 'abgeschlossen']}
            onCardClick={card => openBuchung(card.id.split(':')[1] ?? '')}
            onCardMove={moveCard}
            onAddCard={crud.buchungen.canWrite ? (column => crud.buchungen.openCreate({ buchungsstatus: column })) : undefined}
          />
        }
        aside={
          <>
            <WorkList
              title={tx`An- & Abreisen bis ${weekEnd}`}
              items={arrivalItems.map(({ b, kind }) => {
                const day = kind === 'an' ? b.fields.anreise : b.fields.abreise;
                const step = nextStep(b);
                return {
                  id: b.record_id + kind,
                  title: guestName(b),
                  secondLine: (
                    <>
                      <span className={kind === 'an' ? 'font-medium text-primary' : 'font-medium text-amber-600'}>
                        {kind === 'an' ? tx('Anreise') : tx('Abreise')}
                      </span>
                      <span className="text-muted-foreground"> · {dayLabel(day)}{b.zimmerName ? ` · ${b.zimmerName}` : ''}</span>
                    </>
                  ),
                  action: step ? { label: step.label, onClick: () => advance(b) } : undefined,
                };
              })}
              onItemClick={id => openBuchung(id.replace(/(an|ab)$/, ''))}
              empty={{ text: tx('Keine An- oder Abreisen in den nächsten 7 Tagen.') }}
            />
            <WorkList
              title={tx('Offene Zahlungen')}
              items={unpaid.map(b => ({
                id: b.record_id,
                title: guestName(b),
                secondLine: (
                  <>
                    <span className="font-medium text-amber-600">{b.fields.zahlungsstatus?.label ?? tx('Offen')}</span>
                    <span className="text-muted-foreground"> · {formatDate(b.fields.anreise)}</span>
                  </>
                ),
                action: { label: tx('Bezahlt'), onClick: () => markPaid(b) },
              }))}
              onItemClick={openBuchung}
              empty={{ text: tx('Alle Zahlungen sind beglichen.') }}
            />
          </>
        }
      />
      {crud.surfaces}
    </div>
  );
}
