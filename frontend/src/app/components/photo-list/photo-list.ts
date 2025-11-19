import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PhotoService } from '../../services/photo';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-photo-list',
  templateUrl: './photo-list.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./photo-list.scss']
})
export class PhotoListComponent implements OnInit {
  photos: any[] = [];

  constructor(private photoService: PhotoService, private router: Router) {}

  get token(): string | null {
    // ищем токен сначала в 'auth_token', если нет — в 'token'
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  }

  

  async ngOnInit() {
    if (!this.token) {
      console.error('Нет токена, пользователь не авторизован');
      return;
    }

    try {
      this.photos = await this.photoService.getPhotos(this.token);
      // добавим путь к фото для отображения
      this.photos = this.photos.map(p => ({
        ...p,
        url: `${window.location.protocol}//${window.location.hostname}:3000/uploads/${p.filename}`
      }));
    } catch (err) {
      console.error('Ошибка загрузки фото', err);
    }
  }

  async deletePhoto(id: number) {
    if (!this.token) return;

    try {
      await this.photoService.deletePhoto(id, this.token);
      this.photos = this.photos.filter(p => p.id !== id);
    } catch (err) {
      console.error(err);
    }
  }

  async downloadPhoto(photo: any) {
    try {
      const token = this.token;
      if (!token) return;

      // Запрос к серверу для получения файла
      const response = await fetch(photo.url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Не удалось скачать фото');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = photo.filename || 'photo.jpg';
      link.click();

      // Освобождаем память
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка скачивания фото', err);
    }
  }


  editPhoto(photo: any) {
    this.router.navigate(['/photo-editor', photo.id]);
  }
}
