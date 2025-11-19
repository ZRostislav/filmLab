import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { BonusService, Bonus } from '../../services/bonus';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  bonusValue = 0;
  blocked = false;

  constructor(
    public auth: AuthService,
    private router: Router,
    private bonusService: BonusService
  ) {}

  ngOnInit() {
    // Подписка на поток бонусов
    this.bonusService.bonus$.subscribe((res: Bonus | null) => {
      if (res) {
        this.bonusValue = res.value;
        this.blocked = !!res.blocked;
      }
    });

    // Получаем текущий баланс бонусов
    setTimeout(() => {
      this.bonusService.getBalance().subscribe((bonus) => {
        // console.log("Бонус получен:", bonus);
      });
    }, 2000);
  }

  logout() {
    const token = localStorage.getItem('auth_token');
    // Удаляем токен и email
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    localStorage.removeItem('is_admin');
    document.documentElement.style.setProperty('--color-blue-400', 'oklch(70.7% 0.165 254.624)');
    document.documentElement.style.setProperty('--color-blue-500', 'oklch(62.3% 0.214 259.815)');
    document.documentElement.style.setProperty('--color-blue-600', 'oklch(54.6% 0.245 262.881)');
    document.documentElement.style.setProperty('--color-blue-700', 'oklch(48.8% 0.243 264.376)');
    document.documentElement.style.setProperty('--color-red-500', 'oklch(63.7% 0.237 25.331)');
    document.documentElement.style.setProperty('--color-red-600', 'oklch(57.7% 0.245 27.325)');
    // Сбрасываем бонус через сервис
    this.bonusService.resetBonus().subscribe({
      next: (res) => console.log('Бонус сброшен:', res),
      error: (err) => console.error('Ошибка сброса бонуса:', err),
    });
    // Перенаправляем на страницу логина
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return localStorage.getItem('is_admin') === 'true';
  }
}
