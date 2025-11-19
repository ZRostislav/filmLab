import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  imports: [CommonModule, FormsModule],
  standalone: true,
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  email = '';
  password = '';
  registerError = ''; // <-- сюда записываем ошибку

  constructor(private auth: AuthService, private router: Router) {}

  async onRegister(form: NgForm) {
    if (form.invalid) {
      Object.values(form.controls).forEach(control => control.markAsTouched());
      return;
    }

    this.registerError = ''; // сбрасываем предыдущую ошибку

    try {
      await this.auth.register(this.email, this.password);
      this.router.navigate(['/login']);
    } catch (err: any) {
      // Если сервер возвращает res.status 400 с текстом ошибки
      if (err.error?.message) {
        const msg = err.error.message;
        if (msg.includes('User already exists')) {
          this.registerError = 'Аккаунт с таким email уже существует';
        } else if (msg.includes('Invalid email')) {
          this.registerError = 'Неверный email';
        } else {
          this.registerError = msg; // любая другая ошибка
        }
      } else {
        this.registerError = 'Произошла ошибка регистрации';
      }
    }
  }
}
