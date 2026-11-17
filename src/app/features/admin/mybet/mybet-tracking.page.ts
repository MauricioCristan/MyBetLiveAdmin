import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import type { TrackingFilters, TrackingSport } from './mybet-tracking.models';
import { sportLabels, trackingDate, trackingRow, type TrackingRow } from './mybet-tracking.presentation';
import { MyBetService, type Page } from './mybet.service';

type TrackingQuery = TrackingFilters & { page: number };
type Snapshot = Page<TrackingRow> & {
  consultedAt: ReturnType<typeof trackingDate>;
  filtered: boolean;
};

@Component({
  selector: 'app-mybet-tracking',
  imports: [ReactiveFormsModule],
  templateUrl: './mybet-tracking.page.html',
  styleUrl: './mybet-tracking.page.scss',
})
export class MyBetTrackingPage {
  private readonly api = inject(MyBetService);
  private readonly destroyRef = inject(DestroyRef);
  private query: TrackingQuery = { page: 0, search: '', sport: '' };

  protected readonly snapshot = signal<Snapshot | null>(null);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly pageSize = 20;
  protected readonly sports = Object.entries(sportLabels);
  protected readonly columns = ['Cliente', 'Partido', 'Marcador', 'Selección', 'Estado', 'Actualizado'];
  protected readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    sport: new FormControl<TrackingSport | ''>('', { nonNullable: true }),
  });

  constructor() {
    void this.load(this.query);
  }

  protected refresh() {
    void this.load(this.query, true);
  }

  protected applyFilters() {
    const { search, sport } = this.filters.getRawValue();
    void this.load({ page: 0, search: search.trim(), sport });
  }

  protected clearFilters() {
    this.filters.reset();
    this.applyFilters();
  }

  protected changePage(page: number) {
    if (page < 0 || page >= (this.snapshot()?.totalPages ?? 0)) return;
    void this.load({ ...this.query, page });
  }

  private async load(query: TrackingQuery, keepSnapshot = false) {
    if (this.loading()) return;
    this.query = query;
    this.loading.set(true);
    this.failed.set(false);
    if (!keepSnapshot) this.snapshot.set(null);

    try {
      while (!this.destroyRef.destroyed) {
        const response = await firstValueFrom(
          this.api.activeTrackers(query.page, this.pageSize, query).pipe(takeUntilDestroyed(this.destroyRef)),
        );
        const lastPage = Math.max(0, response.totalPages - 1);
        if (query.page > lastPage) {
          query = { ...query, page: lastPage };
          continue;
        }
        this.query = query;
        this.snapshot.set({
          ...response,
          content: response.content.map(trackingRow),
          consultedAt: trackingDate(new Date()),
          filtered: Boolean(query.search || query.sport),
        });
        break;
      }
    } catch {
      if (!this.destroyRef.destroyed) this.failed.set(true);
    } finally {
      if (!this.destroyRef.destroyed) this.loading.set(false);
    }
  }
}
