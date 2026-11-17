import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../enviroment/environment';
import type { AdminTracker } from './mybet-tracking.models';
import { MyBetTrackingPage } from './mybet-tracking.page';
import type { Page } from './mybet.service';

const endpoint = environment.apiBaseUrl + '/admin/mybet/bets';
const sample: AdminTracker = {
  userId: 'customer',
  username: 'google_a_customer',
  email: 'nombre.apellidolargo@example.com',
  bet: {
    id: 'prop',
    event: {
      sport: 'NBA', leagueName: 'LNBP', home: { name: 'Fuerza Regia de Monterrey' },
      away: { name: 'Los Soles de Mexicali' }, homeScore: 81, awayScore: 79,
      status: 'FINAL', period: 'Q4', clock: null,
    },
    market: 'PLAYER_REBOUNDS', selection: 'OVER', line: 7.5, team: null,
    playerName: 'Mateo Rivera', targetScore: null, scope: 'MATCH',
    builderSelections: [], status: 'AWAITING_DATA', updatedAt: '2026-11-16T23:10:00Z', stale: false,
  },
};

function pageOf(content: AdminTracker[], page = 0, totalElements = content.length): Page<AdminTracker> {
  return { content, page, totalPages: Math.ceil(totalElements / 20), totalElements };
}

describe('Seguimientos activos', () => {
  let fixture: ComponentFixture<MyBetTrackingPage>;
  let http: HttpTestingController;
  let root: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    fixture = TestBed.createComponent(MyBetTrackingPage);
    http = TestBed.inject(HttpTestingController);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  function request(page = 0, search = '', sport = '') {
    return http.expectOne(req => req.method === 'GET'
      && req.url === endpoint
      && req.params.get('activeOnly') === 'true'
      && req.params.get('size') === '20'
      && req.params.get('page') === String(page)
      && (req.params.get('search') ?? '') === search
      && (req.params.get('sport') ?? '') === sport);
  }
  function click(label: string) {
    const button = Array.from(root.querySelectorAll('button')).find(b => b.textContent?.trim() === label);
    expect(button, label).toBeDefined();
    button!.click();
  }
  async function render() {
    await fixture.whenStable();
    fixture.detectChanges();
  }
  function setFilter(search: string, sport: string) {
    const field = root.querySelector<HTMLInputElement>('#tracking-search')!;
    field.value = search;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    const select = root.querySelector<HTMLSelectElement>('#tracking-sport')!;
    select.value = sport;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    click('Buscar');
  }

  it('renders loading, a player prop after the final score, and a builder as one row', async () => {
    expect(root.textContent).toContain('Cargando seguimientos');
    const builder: AdminTracker = {
      ...sample, username: 'maria', email: null,
      bet: { ...sample.bet, id: 'builder', builderSelections: [{}, {}, {}], status: 'LIVE_WINNING' },
    };
    request().flush(pageOf([sample, builder]));
    await render();
    const rows = root.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('nombre.apellidolargo@example.com');
    expect(rows[0].textContent).toContain('Mateo Rivera · Over 7.5');
    expect(rows[0].textContent).toContain('Final');
    expect(rows[0].querySelector('.tracker-badge')?.textContent).toBe('Esperando datos');
    expect(rows[1].textContent).toContain('Creador');
    expect(rows[1].textContent).toContain('3 selecciones');
  });

  it('keeps the successful result after an unsuccessful refresh and reconciles a page that disappears', async () => {
    request().flush(pageOf([sample], 0, 21));
    await render();
    click('Siguiente');
    request(1).flush(pageOf([sample], 1, 21));
    await render();
    expect(root.textContent).toContain('Página 2 de 2');
    click('Actualizar');
    request(1).flush({}, { status: 503, statusText: 'Unavailable' });
    await render();
    expect(root.textContent).toContain('Se muestran los últimos datos');
    expect(root.textContent).toContain('Página 2 de 2');
    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
    click('Reintentar');
    request(1).flush(pageOf([], 1, 20));
    await Promise.resolve();
    request().flush(pageOf([sample], 0, 20));
    await render();
    expect(root.textContent).toContain('Página 1 de 1');
    expect(root.textContent).not.toContain('Reintentar');
  });

  it('retries an initial error and clears a combined filter with no matches', async () => {
    request().flush({}, { status: 503, statusText: 'Unavailable' });
    await render();
    expect(root.textContent).toContain('No se pudieron cargar los seguimientos');
    click('Reintentar');
    request().flush(pageOf([]));
    await render();
    expect(root.textContent).toContain('No hay seguimientos activos');
    setFilter('  demo@example.com ', 'NHL');
    request(0, 'demo@example.com', 'NHL').flush(pageOf([]));
    await render();
    expect(root.textContent).toContain('Sin coincidencias');
    click('Limpiar filtros');
    request().flush(pageOf([]));
    await render();
    expect(root.textContent).toContain('No hay seguimientos activos');
    expect(root.querySelector<HTMLInputElement>('#tracking-search')?.value).toBe('');
    expect(root.querySelector<HTMLSelectElement>('#tracking-sport')?.value).toBe('');
  });
});
