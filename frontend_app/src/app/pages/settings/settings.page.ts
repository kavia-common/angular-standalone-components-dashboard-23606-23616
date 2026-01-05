import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

import { getAppEnvironment } from '../../core/environment';

type SettingsForm = {
  apiBase: FormControl<string>;
  wsUrl: FormControl<string>;
  experimentsEnabled: FormControl<boolean>;
};

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ToggleButtonModule,
    ButtonModule,
    MessageModule,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-xl font-semibold">Settings</h1>
        <p class="mt-1 text-sm text-gray-600">Reactive Forms example. Values are local-only (demo).</p>
      </div>

      <p-card>
        <ng-template pTemplate="content">
          <form class="grid grid-cols-1 gap-4 md:grid-cols-2" [formGroup]="form" (ngSubmit)="save()">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700" for="apiBase">API Base</label>
              <input
                id="apiBase"
                type="text"
                pInputText
                class="w-full"
                formControlName="apiBase"
                placeholder="https://example.com"
              />
              <p-message
                *ngIf="form.controls['apiBase'].touched && form.controls['apiBase'].invalid"
                severity="error"
                text="API Base is required."
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700" for="wsUrl">WebSocket URL</label>
              <input id="wsUrl" type="text" pInputText class="w-full" formControlName="wsUrl" placeholder="ws://..." />
            </div>

            <div class="flex items-center gap-3 md:col-span-2">
              <p-toggleButton
                formControlName="experimentsEnabled"
                onLabel="Experiments: On"
                offLabel="Experiments: Off"
              />
              <span class="text-sm text-gray-600">Mirrors NG_APP_EXPERIMENTS_ENABLED on load</span>
            </div>

            <div class="md:col-span-2 flex items-center justify-end gap-2">
              <button pButton type="button" class="p-button-outlined" label="Reset" (click)="reset()"></button>
              <button
                pButton
                type="submit"
                label="Save"
                [disabled]="form.invalid"
                class="p-button"
                [style.background]="'var(--ocean-primary)'"
                [style.borderColor]="'var(--ocean-primary)'"
              ></button>
            </div>

            <div *ngIf="saved" class="md:col-span-2">
              <p-message severity="success" text="Saved locally (demo)."></p-message>
            </div>
          </form>
        </ng-template>
      </p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  protected saved = false;
  private readonly env = getAppEnvironment();

  protected readonly form: FormGroup<SettingsForm>;

  constructor(private readonly fb: FormBuilder) {
    // Use nonNullable typed controls so templates can strongly type-check.
    this.form = this.fb.nonNullable.group({
      apiBase: this.fb.nonNullable.control(this.env.apiBase || this.env.backendUrl, {
        validators: [Validators.required],
      }),
      wsUrl: this.fb.nonNullable.control(this.env.wsUrl ?? ''),
      experimentsEnabled: this.fb.nonNullable.control(!!this.env.experimentsEnabled),
    });
  }

  protected save(): void {
    this.saved = true;
    // Intentionally no persistence — demo only.
  }

  protected reset(): void {
    this.saved = false;
    this.form.reset({
      apiBase: this.env.apiBase || this.env.backendUrl,
      wsUrl: this.env.wsUrl ?? '',
      experimentsEnabled: !!this.env.experimentsEnabled,
    });
  }
}
