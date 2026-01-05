import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../core/auth/auth.service';

type LoginForm = {
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
  template: `
    <div class="mx-auto max-w-xl" data-testid="login-page">
      <div class="mb-5">
        <h1 class="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p class="mt-1 text-sm text-gray-600">
          Demo-friendly authentication. If the backend endpoint is not available yet, we’ll fall back to a local demo session.
        </p>
      </div>

      <p-card>
        <ng-template pTemplate="content">
          <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700" for="email">Email</label>
              <input
                id="email"
                type="email"
                pInputText
                class="w-full"
                formControlName="email"
                placeholder="you@company.com"
                autocomplete="email"
                data-testid="login-email"
              />
              <p-message
                *ngIf="form.controls.email.touched && form.controls.email.invalid"
                severity="error"
                text="Please enter a valid email."
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700" for="password">Password</label>
              <p-password
                inputId="password"
                formControlName="password"
                [toggleMask]="true"
                [feedback]="false"
                placeholder="••••••••"
                styleClass="w-full"
                inputStyleClass="w-full"
                autocomplete="current-password"
                data-testid="login-password"
              ></p-password>
              <p-message
                *ngIf="form.controls.password.touched && form.controls.password.invalid"
                severity="error"
                text="Password must be at least 6 characters."
              />
            </div>

            <div *ngIf="errorMessage" class="pt-1" data-testid="login-error">
              <p-message severity="error" [text]="errorMessage"></p-message>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
              <a routerLink="/" class="text-sm text-gray-600 hover:text-gray-900 underline" data-testid="login-back-home">
                Back to dashboard
              </a>

              <button
                pButton
                type="submit"
                label="Login"
                icon="pi pi-sign-in"
                class="p-button"
                [disabled]="form.invalid || loading"
                [loading]="loading"
                [style.background]="'var(--ocean-primary)'"
                [style.borderColor]="'var(--ocean-primary)'"
                data-testid="login-submit"
              ></button>
            </div>

            <div class="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600" data-testid="login-tip">
              Backend endpoint (optional): <span class="font-mono">POST /auth/login</span> relative to
              <span class="font-mono">NG_APP_API_BASE</span> / <span class="font-mono">NG_APP_BACKEND_URL</span>.
            </div>
          </form>
        </ng-template>
      </p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected loading = false;
  protected errorMessage = '';

  protected readonly form: FormGroup<LoginForm> = this.fb.nonNullable.group({
    email: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.email] }),
    password: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(6)] }),
  });

  protected submit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email, password } = this.form.getRawValue();

    this.auth.login$({ email, password }).subscribe({
      next: () => {
        this.loading = false;
        const returnUrl = (this.route.snapshot.queryParamMap.get('returnUrl') ?? '/').toString();
        void this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        // login$ already falls back; error here is very unlikely.
        this.loading = false;
        this.errorMessage = 'Login failed. Please check your configuration and try again.';
      },
    });
  }
}
