import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmationModalComponent } from './core/confirmation/confirmation-modal/confirmation-modal.component';
import { NotificationContainerComponent } from './core/notifications/notification-container/notification-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationContainerComponent, ConfirmationModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
