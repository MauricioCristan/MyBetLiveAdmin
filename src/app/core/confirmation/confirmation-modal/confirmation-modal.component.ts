import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { I18nPipe } from '../../i18n/i18n.pipe';
import { ConfirmationService } from '../confirmation.service';

@Component({
  standalone: true,
  selector: 'app-confirmation-modal',
  imports: [CommonModule, I18nPipe],
  templateUrl: './confirmation-modal.component.html',
})
export class ConfirmationModalComponent {
  readonly confirmation = inject(ConfirmationService);
}
