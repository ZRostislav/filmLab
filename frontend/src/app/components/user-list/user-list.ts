import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../services/report';
import { firstValueFrom } from 'rxjs';
import { PhotoService } from '../../services/photo';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  email: string;
  created_at: string;
  selected?: boolean;
}

interface Photo {
  id: number;
  filename: string;
  // опциональные, если когда-нибудь понадобятся
  title?: string;
  url?: string;
}

interface HistoryEvent {
  change_id: number;
  photo_id: number;
  photo_filename: string;
  user_id: number;
  user_email: string;
  action: string;
  change_time: string; // ISO / MySQL timestamp — pipe date в шаблоне умеет его парсить
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss'],
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  photos: Photo[] = [];
  history: HistoryEvent[] = [];

  selectedUser: User | null = null;
  selectedPhoto: Photo | null = null;

  dateFrom: string = '';
  dateTo: string = '';

  loading = false;
  error: string | null = null;

  private base = `${window.location.protocol}//${window.location.hostname}:3000`;

  constructor(
    private http: HttpClient,
    private reportService: ReportService,
    private photoService: PhotoService
  ) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return { Authorization: token ? `Bearer ${token}` : '' };
  }

  // --- загрузка пользователей ---
  fetchUsers() {
    this.loading = true;
    this.error = null;

    this.http.get<User[]>(`${this.base}/user/all`, { headers: this.getAuthHeaders() }).subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
        this.resetSelections();
      },
      error: (err) => {
        console.error('fetchUsers error', err);
        this.error = err.error?.message || 'Ошибка загрузки пользователей';
        this.loading = false;
      },
    });
  }

  // --- загрузка фото пользователя ---
  fetchPhotos(user: User) {
    this.error = null;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.error = 'Нет токена. Авторизуйтесь заново.';
      return;
    }

    this.loading = true;
    this.selectedUser = user;
    this.selectedPhoto = null;
    this.photos = [];

    this.http
      .get<Photo[]>(`${this.base}/photo/user/${user.id}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          // возможно БД возвращает filename и/или url — приводим к ожидаемому виду
          this.photos = data.map((p) => ({
            id: p.id,
            filename: p.filename,
            title: (p as any).title ?? p.filename,
            url: (p as any).url ?? `${this.base}/uploads/${p.filename}`,
          }));
          this.loading = false;
        },
        error: (err) => {
          console.error('fetchPhotos error', err);
          this.error = err.error?.message || 'Ошибка загрузки фото';
          this.loading = false;
        },
      });
  }

  // --- загрузка истории фото ---
  fetchHistory(photo: Photo) {
    this.error = null;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.error = 'Нет токена. Авторизуйтесь заново.';
      return;
    }

    this.loading = true;
    this.selectedPhoto = photo;
    this.history = [];

    // На бэке мы сделали запрос SELECT ... WHERE pc.photo_id = ? ORDER BY pc.created_at DESC
    this.http
      .get<HistoryEvent[]>(`${this.base}/photo/${photo.id}/history`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (data) => {
          // если backend возвращает поля в snake_case — они уже соответствуют интерфейсу
          this.history = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('fetchHistory error', err);
          this.error = err.error?.message || 'Ошибка загрузки истории';
          this.loading = false;
        },
      });
  }

  // --- возвраты назад ---
  backToUsers() {
    this.resetSelections();
  }

  backToPhotos() {
    this.selectedPhoto = null;
    this.history = [];
  }

  private resetSelections() {
    this.selectedUser = null;
    this.selectedPhoto = null;
    this.photos = [];
    this.history = [];
  }

  async downloadUsersReport() {
    if (!this.users || this.users.length === 0) {
      this.error = 'Нет данных для отчёта. Сначала загрузите пользователей.';
      return;
    }

    this.reportService.generateUsersReport(this.users);
  }

  async downloadAllPhotosReport() {
    this.loading = true;
    this.error = null;

    const token = localStorage.getItem('auth_token') || '';

    try {
      const photos = await this.photoService.getAllPhotos(token);

      if (!photos || !photos.length) {
        throw new Error('Нет данных для отчёта.');
      }

      const photosForReport = photos.map((p) => ({
        ...p,
        url: `http://localhost:3000/uploads/${p.filename}`,
      }));

      await this.reportService.generateAllPhotosReport(photosForReport);
    } catch (err: any) {
      this.error = err.message || 'Ошибка формирования отчёта.';
      console.error('Ошибка при загрузке фото:', err);
    } finally {
      this.loading = false;
    }
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    this.users.forEach((u) => ((u as any).selected = checked));
  }

  async downloadSelectedUsersReport() {
    const selected = this.users.filter((u: any) => u.selected);
    if (selected.length === 0) {
      this.error = 'Не выбрано ни одного пользователя.';
      return;
    }

    this.loading = true;
    this.error = null;
    const token = localStorage.getItem('auth_token') || '';

    try {
      // получаем все фото
      const photosRaw: any[] = (await this.photoService.getAllPhotos(token)) || [];

      // нормализуем
      const normalizedPhotos = photosRaw.map((p: any) => {
        const filename = p.filename ?? p.fileName ?? p.name ?? '';
        const user_id = p.user_id ?? p.userId ?? p.user?.id ?? p.userId ?? null;
        const user_email = p.user_email ?? p.userEmail ?? p.user?.email ?? null;
        const created_at = p.created_at ?? p.createdAt ?? p.uploaded_at ?? null;
        return {
          ...p,
          filename,
          user_id,
          user_email,
          created_at,
          url: p.url ?? `${this.base}/uploads/${filename}`,
        };
      });

      // группируем только выбранных пользователей
      const groupedData = selected.map((user) => ({
        user,
        photos: normalizedPhotos.filter(
          (p) =>
            (p.user_id != null && +p.user_id === +user.id) ||
            (p.user_email && user.email && p.user_email === user.email)
        ),
      }));

      await this.reportService.generatePhotosGroupedByUserReport(groupedData);
    } catch (err: any) {
      console.error('Ошибка формирования отчёта:', err);
      this.error = err.message || 'Ошибка формирования отчёта.';
    } finally {
      this.loading = false;
    }
  }

  async downloadMonthlyPhotosReport() {
    const token = localStorage.getItem('auth_token') || '';
    if (!token) {
      this.error = 'Нет токена авторизации.';
      return;
    }

    if (!this.dateFrom || !this.dateTo) {
      this.error = 'Выберите обе даты: "От" и "До".';
      return;
    }

    const from = new Date(this.dateFrom);
    const to = new Date(this.dateTo);

    if (from > to) {
      this.error = 'Дата "От" не может быть позже даты "До".';
      return;
    }

    try {
      this.loading = true;
      this.error = null;

      const allPhotos: any[] = await this.photoService.getAllPhotos(token);

      // фильтруем по диапазону дат
      const filteredPhotos = allPhotos.filter((photo: any) => {
        const createdAt = new Date(photo.created_at || photo.uploaded_at);
        return createdAt >= from && createdAt <= to;
      });

      if (filteredPhotos.length === 0) {
        this.error = 'За выбранный период нет фотографий.';
        return;
      }

      // ✅ передаём диапазон дат вторым аргументом
      await this.reportService.generateMonthlyPhotosReport(filteredPhotos, {
        from: this.dateFrom,
        to: this.dateTo,
      });
    } catch (err: any) {
      console.error(err);
      this.error = err.message || 'Ошибка при формировании отчёта.';
    } finally {
      this.loading = false;
    }
  }

  async downloadPhotoHistoryReport() {
    if (!this.selectedPhoto) return;
    if (!this.history || this.history.length === 0) {
      this.error = 'Нет данных для отчёта.';
      return;
    }

    await this.reportService.generatePhotoHistoryReport(this.selectedPhoto, this.history);
  }
}
