import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-role',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class RoleComponent {}
