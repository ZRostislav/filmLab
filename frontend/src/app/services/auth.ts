import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${window.location.protocol}//${window.location.hostname}:3000/auth`;
  private tokenKey = 'auth_token';
  private emailKey = 'auth_email';  // сохраняем email

  constructor(private http: HttpClient) {}

  async login(email: string, password: string) {
    const res: any = await this.http
      .post(`${this.apiUrl}/login`, { email, password })
      .toPromise();

    // Сохраняем токен и email
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.emailKey, email);

    // ✅ Проверяем админа
    this.http
      .get(`${this.apiUrl}/is-admin`, {
        headers: { Authorization: `Bearer ${res.token}` }
      })
      .subscribe((response: any) => {
        if (response?.isAdmin) {
          localStorage.setItem('is_admin', 'true');  // ✅ сохраняем флаг
          // ✅ перекрашиваем тему
          document.documentElement.style.setProperty('--color-blue-400', 'oklch(0.72 0.22 22.49)');
          document.documentElement.style.setProperty('--color-blue-500', 'oklch(0.68 0.26 25.16)');
          document.documentElement.style.setProperty('--color-blue-600', 'oklch(0.64 0.27 26.81)');
          document.documentElement.style.setProperty('--color-blue-700', 'oklch(0.59 0.25 27.17)');
          document.documentElement.style.setProperty('--color-red-500', 'oklch(0.51 0.25 273.6)');
          document.documentElement.style.setProperty('--color-red-600', 'oklch(0.46 0.25 279.95)');
        }
        else {
          localStorage.setItem('is_admin', 'false');
        }
      });

    return res;
  }


  async register(email: string, password: string) {
    return this.http.post(`${this.apiUrl}/register`, { email, password }).toPromise();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getEmail(): string | null {
    return localStorage.getItem(this.emailKey);
  }

  isAdmin(): boolean {
    return localStorage.getItem('is_admin') === 'true';
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');

    // 👇 можно дёрнуть на бэк запрос, чтобы бонус обнулился
    fetch(`${window.location.protocol}//${window.location.hostname}:3000/bonus/reset`, {
      method: 'POST'
    });
    localStorage.removeItem('token');
  }

}
