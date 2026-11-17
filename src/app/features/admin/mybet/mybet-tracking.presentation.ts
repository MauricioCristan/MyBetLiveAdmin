import { clientDisplayName } from './mybet.service';
import type { AdminTracker, TrackingEvent, TrackingSport } from './mybet-tracking.models';

export const sportLabels: Record<TrackingSport, string> = {
  SOCCER: 'Fútbol',
  NBA: 'Baloncesto',
  MLB: 'Béisbol',
  NFL: 'Fútbol americano',
  NHL: 'Hockey',
};

const totalLabels: Record<TrackingSport, string> = {
  SOCCER: 'Total de goles',
  NBA: 'Total de puntos',
  MLB: 'Total de carreras',
  NFL: 'Total de puntos',
  NHL: 'Total de goles',
};

const marketLabels: Readonly<Record<string, string>> = {
  MONEYLINE: 'Ganador',
  SPREAD: 'Hándicap',
  TEAM_TOTAL: 'Total de equipo',
  TOTAL_CORNERS: 'Total de córners',
  TOTAL_CARDS: 'Total de tarjetas',
  TOTAL_SHOTS: 'Total de tiros',
  TOTAL_SHOTS_ON_TARGET: 'Total de tiros a puerta',
  RESULT_3WAY: 'Resultado 1X2',
  DOUBLE_CHANCE: 'Doble oportunidad',
  BOTH_TEAMS_SCORE: 'Ambos equipos anotan',
  CORRECT_SCORE: 'Marcador exacto',
  OVERTIME: 'Prórroga',
  PLAYER_RUSHING_YARDS: 'Yardas por tierra',
  PLAYER_RECEIVING_YARDS: 'Yardas por recepción',
  PLAYER_RECEPTIONS: 'Recepciones de jugador',
  PLAYER_PASSING_YARDS: 'Yardas por pase',
  PLAYER_PASSING_TOUCHDOWNS: 'Touchdowns por pase',
  PLAYER_GOALS: 'Goles de jugador',
  PLAYER_ASSISTS: 'Asistencias de jugador',
  PLAYER_SHOTS: 'Tiros de jugador',
  PLAYER_SHOTS_ON_TARGET: 'Tiros a puerta de jugador',
  PLAYER_SAVES: 'Atajadas de jugador',
  PLAYER_POINTS: 'Puntos de jugador',
  PLAYER_REBOUNDS: 'Rebotes de jugador',
  PLAYER_THREE_POINTERS_MADE: 'Triples de jugador',
  PLAYER_POINTS_REBOUNDS_ASSISTS: 'Puntos, rebotes y asistencias',
  TEAM_CORNERS: 'Córners de equipo',
  CORNERS_1X2: 'Córners 1X2',
  CORNERS_HANDICAP: 'Hándicap de córners',
  CORNERS_ODD_EVEN: 'Córners par o impar',
  TEAM_CARDS: 'Tarjetas de equipo',
  CARDS_1X2: 'Tarjetas 1X2',
  CARDS_HANDICAP: 'Hándicap de tarjetas',
  TEAM_SHOTS: 'Tiros de equipo',
  SHOTS_1X2: 'Tiros 1X2',
  SHOTS_HANDICAP: 'Hándicap de tiros',
  TEAM_SHOTS_ON_TARGET: 'Tiros a puerta de equipo',
  SHOTS_ON_TARGET_1X2: 'Tiros a puerta 1X2',
  SHOTS_ON_TARGET_HANDICAP: 'Hándicap de tiros a puerta',
  TOTAL_FOULS: 'Total de faltas',
  TEAM_FOULS: 'Faltas de equipo',
  FOULS_1X2: 'Faltas 1X2',
  FOULS_HANDICAP: 'Hándicap de faltas',
  TOTAL_OFFSIDES: 'Total de fueras de juego',
  TEAM_OFFSIDES: 'Fueras de juego de equipo',
  OFFSIDES_1X2: 'Fueras de juego 1X2',
  OFFSIDES_HANDICAP: 'Hándicap de fueras de juego',
  TEAM_WIN_ANY_HALF: 'Gana cualquier mitad',
  TEAM_WIN_BOTH_HALVES: 'Gana ambas mitades',
  TEAM_SCORE_BOTH_HALVES: 'Anota en ambas mitades',
  BOTH_HALVES_TOTAL: 'Total en ambas mitades',
  HIGHEST_SCORING_HALF: 'Mitad con más goles',
  TEAM_HIGHEST_SCORING_HALF: 'Mitad con más goles del equipo',
  PLAYER_CARD_RECEIVED: 'Jugador recibe tarjeta',
};

const selectionLabels: Readonly<Record<string, string>> = {
  DRAW: 'Empate', OVER: 'Over', UNDER: 'Under', YES: 'Sí', NO: 'No',
  HOME_DRAW: 'Local o empate', AWAY_DRAW: 'Visitante o empate',
  HOME_AWAY: 'Local o visitante', ODD: 'Impar', EVEN: 'Par',
  H1: 'Primera mitad', H2: 'Segunda mitad',
};

const scopeLabels: Readonly<Record<string, string>> = {
  REGULATION: 'Tiempo reglamentario', P1: 'Periodo 1', P2: 'Periodo 2', P3: 'Periodo 3',
  H1: 'Primera mitad', H2: 'Segunda mitad',
};

type Tone = 'neutral' | 'success' | 'danger' | 'warning';
const statuses: Readonly<Record<string, { text: string; tone: Tone }>> = {
  PENDING: { text: 'Por comenzar', tone: 'neutral' },
  LIVE_WINNING: { text: 'Va ganando', tone: 'success' },
  LIVE_LOSING: { text: 'Va perdiendo', tone: 'danger' },
  LIVE_PUSH: { text: 'En la línea', tone: 'neutral' },
  THRESHOLD_REACHED: { text: 'Meta alcanzada', tone: 'success' },
  AWAITING_DATA: { text: 'Esperando datos', tone: 'warning' },
};

const dateFormat = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit', month: 'short', year: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function trackingDate(value: string | Date) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return { iso: date.toISOString(), day: dateFormat.format(date), time: timeFormat.format(date) };
}

function selectionLabel(selection: string, event: TrackingEvent) {
  if (selection === 'HOME') return event.home.name || 'Local';
  if (selection === 'AWAY') return event.away.name || 'Visitante';
  return selectionLabels[selection] ?? '';
}

function pick(bet: AdminTracker['bet']) {
  if (bet.builderSelections?.length) {
    return { market: 'Creador', selection: `${bet.builderSelections.length} selecciones` };
  }
  const market = bet.market === 'TOTAL' ? totalLabels[bet.event.sport] : marketLabels[bet.market];
  const line = bet.line == null ? '' : String(bet.line);
  const handicap = bet.market === 'SPREAD' || bet.market.endsWith('_HANDICAP');
  const points = handicap && bet.line != null && bet.line > 0 ? '+' + line : line;
  const side = [selectionLabel(bet.selection, bet.event), points].filter(Boolean).join(' ');
  const team = bet.team ? selectionLabel(bet.team, bet.event) : '';
  const player = bet.market.startsWith('PLAYER_') ? bet.playerName || 'Jugador' : '';

  return {
    market: market || 'Selección',
    selection: [
      player,
      team !== side ? team : '',
      bet.targetScore || side,
      scopeLabels[bet.scope],
    ].filter(Boolean).join(' · '),
  };
}

function gameProgress(event: TrackingEvent) {
  switch (event.status) {
    case 'FINAL': return 'Final';
    case 'POSTPONED': return 'Pospuesto';
    case 'CANCELLED': return 'Cancelado';
    case 'LIVE': {
      const period = event.period?.trim() || '';
      const clock = event.clock?.trim() || '';
      if (period === 'HT') return 'Medio tiempo';
      const segment = /^IN\d+$/.test(period) ? 'Entrada ' + period.slice(2)
        : /^(Q[1-4]|P[1-3]|OT\d*|SO)$/.test(period) ? period : '';
      return [...new Set([segment, clock].filter(Boolean))].join(' · ') || 'En juego';
    }
    default: return '';
  }
}

export function trackingRow(tracker: AdminTracker) {
  const { bet } = tracker;
  const event = bet.event;
  const client = clientDisplayName(tracker);
  const google = client !== tracker.username;
  const hasScore = event.status !== 'SCHEDULED' && (event.homeScore != null || event.awayScore != null);
  return {
    id: bet.id,
    client,
    google,
    email: tracker.email,
    match: [event.home.name, event.away.name].filter(Boolean).join(' vs. ') || 'Partido sin nombre',
    competition: [sportLabels[event.sport], event.leagueName].filter(Boolean).join(' · '),
    score: hasScore ? `${event.homeScore ?? '—'} – ${event.awayScore ?? '—'}` : '—',
    hasScore,
    progress: gameProgress(event),
    stale: bet.stale && event.status !== 'SCHEDULED',
    pick: pick(bet),
    status: statuses[bet.status] ?? { text: 'Estado pendiente', tone: 'neutral' },
    updated: trackingDate(bet.updatedAt),
  };
}

export type TrackingRow = ReturnType<typeof trackingRow>;
