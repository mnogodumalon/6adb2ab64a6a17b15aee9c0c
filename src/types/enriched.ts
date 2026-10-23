import type { Buchungen } from './app';

export type EnrichedBuchungen = Buchungen & {
  gastName: string;
  zimmerName: string;
  zusatzleistungenName: string;
};
