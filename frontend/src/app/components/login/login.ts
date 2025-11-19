import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { BonusService } from '../../services/bonus';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [CommonModule, FormsModule],
  standalone: true,
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  loginError = '';

  constructor(
    private auth: AuthService,
    private bonusService: BonusService,
    private router: Router
  ) {}

  async onLogin(form: NgForm) {
    if (form.invalid) {
      Object.values(form.controls).forEach(control => control.markAsTouched());
      return;
    }

    this.loginError = '';

    try {
      await this.auth.login(this.email, this.password);

      // ✅ токен уже сохранён → можно тянуть бонусы
      this.bonusService.getBalance().subscribe({
        next: (bonus) => {
          // console.log('💰 Бонус после логина:', bonus);
        },
        error: (err) => {
          // console.error('Ошибка получения бонуса:', err);
        }
      });

      this.router.navigate(['/list']);
    } catch (err: any) {
      if (err.error?.message) {
        const msg = err.error.message;
        if (msg.includes('User not found')) {
          this.loginError = 'Аккаунт не существует';
        } else if (msg.includes('Wrong password')) {
          this.loginError = 'Пароль неверный';
        } else {
          this.loginError = msg;
        }
      } else {
        this.loginError = 'Произошла ошибка входа';
      }
    }
  }
}
