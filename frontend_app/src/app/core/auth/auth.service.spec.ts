import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiClientService } from '../api/api-client.service';

describe('AuthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        // Provide ApiClientService with its real class; it does not do work in ctor.
        ApiClientService,
      ],
    });
  });

  it('should create', () => {
    const svc = TestBed.inject(AuthService);
    expect(svc).toBeTruthy();
  });

  it('logout should clear token', () => {
    const svc = TestBed.inject(AuthService);

    // Seed internal state via demo login path (no backend needed).
    svc.login$({ email: 'test@example.com', password: '123456' }).subscribe();
    expect(svc.getToken()).toBeTruthy();

    svc.logout();
    expect(svc.getToken()).toBeNull();
  });
});
