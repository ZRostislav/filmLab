import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const isAdmin = localStorage.getItem('is_admin') === 'true';
  if (isAdmin) {
    return true;
  } else {
    router.navigate(['/list']); // если не админ → в photo-list
    return false;
  }
};
