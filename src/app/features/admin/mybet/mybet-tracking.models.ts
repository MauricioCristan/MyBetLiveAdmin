export type TrackingSport = 'SOCCER' | 'NBA' | 'MLB' | 'NFL' | 'NHL';

export interface TrackingFilters {
  search: string;
  sport: TrackingSport | '';
}

export interface TrackingEvent {
  sport: TrackingSport;
  leagueName: string | null;
  home: { name: string };
  away: { name: string };
  homeScore: number | null;
  awayScore: number | null;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED' | 'UNKNOWN';
  period: string | null;
  clock: string | null;
}

export interface AdminTracker {
  userId: string;
  username: string;
  email: string | null;
  bet: {
    id: string;
    event: TrackingEvent;
    market: string;
    selection: string;
    line: number | null;
    team: string | null;
    playerName: string | null;
    targetScore: string | null;
    scope: string;
    builderSelections: readonly unknown[];
    status: string;
    updatedAt: string;
    stale: boolean;
  };
}
