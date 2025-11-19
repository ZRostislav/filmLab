import { Component } from '@angular/core';
import { PhotoService } from '../../services/photo';
import { Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-photo-upload',
  templateUrl: './photo-upload.html',
  standalone: true,
  styleUrls: ['./photo-upload.scss'],
  imports: [CommonModule, NgIf],
})
export class PhotoUploadComponent {
  selectedFile: File | null = null;
  uploadError: string = '';
  uploadSuccess: string = '';
  isUploading = false;

  constructor(private photoService: PhotoService, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  }

onFileChange(event: any) {
  this.selectedFile = null;
  this.uploadError = '';
  this.uploadSuccess = '';

  const file: File = event.target.files[0];
  if (!file) return;

  // ✅ Разрешенные типы файлов
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    alert('Можно загружать только изображения (PNG, JPEG, JPG, WEBP)');
    return;
  }

  // ✅ Проверка на поврежденность (пустой файл)
  if (file.size === 0) {
    alert('Файл поврежден или пустой');
    return;
  }

  // ✅ Проверяем что это реально картинка (а не фейковый .jpg)
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // если успешно загрузилась → сохраняем
      this.selectedFile = file;
    };
    img.onerror = () => {
      alert('Файл не является корректным изображением');
    };
    img.src = e.target?.result as string;
  };
  reader.onerror = () => {
    alert('Файл не удалось прочитать. Возможно, он поврежден.');
  };
  reader.readAsDataURL(file);
}


  async onUpload() {
    if (!this.selectedFile) return;

    const token = this.token;

    // 📌 Если токена нет — работаем только локально (без alert)
    if (!token) {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;

          // Генерируем локальный id
          const localId = 'local_' + Date.now();

          // Сохраняем в localStorage
          localStorage.setItem(localId, base64);

          // 👉 сразу переходим в редактор
          this.router.navigate(['/photo-editor-guest', localId]);
        };
        reader.readAsDataURL(this.selectedFile);
      } catch (err) {
        console.error(err);
        this.uploadError = 'Ошибка при сохранении фото локально';
      }
      return; // 🚫 на сервер не уходим
    }

    // 📌 Если токен есть — грузим на сервер
    this.uploadError = '';
    this.isUploading = true;

    try {
      const res: any = await this.photoService.uploadPhoto(this.selectedFile, token);

      // 👉 сразу редиректим в редактор
      this.router.navigate(['/photo-editor', res.id]);
    } catch (err: any) {
      if (err.error?.message) {
        this.uploadError = err.error.message;
      } else {
        this.uploadError = 'Ошибка загрузки файла';
      }
      console.error(err);
    } finally {
      this.isUploading = false;
    }
  }
}
