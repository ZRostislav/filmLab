import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface Bonus {
  id: number;
  user_id: number | null;
  ip: string | null;
  type: 'user' | 'guest';
  value: number;
  created_at: string;
  bonus_date: string;
  blocked?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BonusService {
  private apiUrl = `${window.location.protocol}//${window.location.hostname}:3000/bonus`;

  private bonusSubject = new BehaviorSubject<Bonus | null>(null);
  bonus$ = this.bonusSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /** Получить текущий баланс */
  getBalance(): Observable<Bonus> {
    return this.http
      .get<Bonus>(`${this.apiUrl}/balance`, {
        headers: this.getHeaders(),
        responseType: 'json',
      })
      .pipe(tap((bonus) => this.bonusSubject.next(bonus)));
  }

  /** Списать бонусы */
  spend(amount: number = 1): Observable<Bonus> {
    return this.http
      .post<Bonus>(
        `${this.apiUrl}/spend`,
        { amount },
        {
          headers: this.getHeaders(),
          responseType: 'json',
        }
      )
      .pipe(tap((bonus) => this.bonusSubject.next(bonus)));
  }

  /** Сброс бонуса (например, при logout) */
  resetBonus(): Observable<Bonus> {
    return this.http
      .post<{ success: boolean; value: number }>(
        `${this.apiUrl}/reset`,
        {},
        { headers: this.getHeaders(), responseType: 'json' }
      )
      .pipe(
        tap((res) => {
          // Преобразуем в объект Bonus
          const bonus: Bonus = {
            id: 0, // фиктивный id для гостя
            user_id: null,
            ip: null,
            type: 'guest',
            value: res.value,
            created_at: new Date().toISOString(),
            bonus_date: new Date().toISOString().slice(0, 10),
            blocked: res.value === 0,
          };
          this.bonusSubject.next(bonus);
        }),
        // Чтобы метод возвращал именно Bonus
        // Используем map
        map((res) => ({
          id: 0,
          user_id: null,
          ip: null,
          type: 'guest',
          value: res.value,
          created_at: new Date().toISOString(),
          bonus_date: new Date().toISOString().slice(0, 10),
          blocked: res.value === 0,
        }))
      );
  }
}
