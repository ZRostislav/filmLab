// Импортируем декоратор @Component и интерфейс OnInit из Angular Core.
// @Component — нужен для создания компонента.
// OnInit — интерфейс, который позволяет использовать метод ngOnInit() при инициализации компонента.
import { Component, OnInit } from '@angular/core';

// Импортируем CommonModule — он содержит базовые директивы Angular (например, *ngIf, *ngFor).
// Если компонент "standalone" (без модуля AppModule), этот импорт обязателен для шаблонов.
import { CommonModule } from '@angular/common';

// Импортируем RouterModule (для использования <router-outlet>, routerLink и т.д.)
// и Router (службу для навигации между страницами программно).
import { RouterModule, Router } from '@angular/router';

// Импортируем сервис аутентификации, который будет обрабатывать вход/выход пользователя.
import { AuthService } from './services/auth';

// Импортируем компонент навигационной панели (верхнее меню приложения).
import { NavbarComponent } from './components/navbar/navbar';

// Импортируем сервис, который, вероятно, отвечает за бонусы, награды и т.п.
import { BonusService } from './services/bonus';

// Импортируем компонент, который отображает список пользователей.
import { UserListComponent } from './components/user-list/user-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: 'app.html',
})
export class App implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    private bonusService: BonusService
  ) {}

  ngOnInit() {
    if (localStorage.getItem('is_admin') === 'true') {
      document.documentElement.style.setProperty('--color-blue-400', 'oklch(0.72 0.22 22.49)');
      document.documentElement.style.setProperty('--color-blue-500', 'oklch(0.68 0.26 25.16)');
      document.documentElement.style.setProperty('--color-blue-600', 'oklch(0.64 0.27 26.81)');
      document.documentElement.style.setProperty('--color-blue-700', 'oklch(0.59 0.25 27.17)');
      document.documentElement.style.setProperty('--color-red-500', 'oklch(0.51 0.25 273.6)');
      document.documentElement.style.setProperty('--color-red-600', 'oklch(0.46 0.25 279.95)');
      console.log('да');
    } else {
      document.documentElement.style.setProperty('--color-blue-400', 'oklch(70.7% 0.165 254.624)');
      document.documentElement.style.setProperty('--color-blue-500', 'oklch(62.3% 0.214 259.815)');
      document.documentElement.style.setProperty('--color-blue-600', 'oklch(54.6% 0.245 262.881)');
      document.documentElement.style.setProperty('--color-blue-700', 'oklch(48.8% 0.243 264.376)');
      document.documentElement.style.setProperty('--color-red-500', 'oklch(63.7% 0.237 25.331)');
      document.documentElement.style.setProperty('--color-red-600', 'oklch(57.7% 0.245 27.325)');
      console.log('неа');
    }
    // при каждом входе проверяем бонусы
    this.bonusService.getBalance().subscribe({
      next: (bonus) => {
        // console.log("Бонус получен:", bonus);
      },
      error: (err) => {
        console.error('Ошибка получения бонуса:', err);
      },
    });

    // если авторизован — сразу переходим
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/list']);
    }
  }
}
