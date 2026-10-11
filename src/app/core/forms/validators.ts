import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function trimmedRequired(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null) return { required: true };
    if (typeof value !== 'string') return null;
    return value.trim().length > 0 ? null : { required: true };
  };
}
