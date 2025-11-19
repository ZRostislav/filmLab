// src/app/services/report.service.ts

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor() {}

  // Форматирование даты dd.mm.yyyy, HH:mm
  private formatDate(value: any): string {
    if (!value) return '-'; // если нет значения — ставим тире

    const date = this.parseDate(value);
    if (!date) return '-';

    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private parseDate(value: any): Date | null {
    if (!value && value !== 0) return null;

    // Если уже Date
    if (value instanceof Date) {
      if (!isNaN(value.getTime())) return value;
      return null;
    }

    // Если число (timestamp)
    if (typeof value === 'number') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
      return null;
    }

    if (typeof value !== 'string') return null;

    const s = value.trim();

    // Числовая строка (unix seconds или ms)
    if (/^\d+$/.test(s)) {
      // 10 цифр — секунды
      if (s.length === 10) {
        const d = new Date(Number(s) * 1000);
        if (!isNaN(d.getTime())) return d;
      }
      // иначе предполагаем ms
      const dMs = new Date(Number(s));
      if (!isNaN(dMs.getTime())) return dMs;
    }

    // ISO-like: 2025-10-03T11:28:57 or with zone
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)) {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d;
    }

    // MySQL default: "YYYY-MM-DD HH:MM:SS" -> попробуем заменить пробел на 'T' и добавить 'Z'
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
      const maybeIso = s.replace(' ', 'T') + 'Z';
      const d = new Date(maybeIso);
      if (!isNaN(d.getTime())) return d;
    }

    // Попробуем Date.parse как последний шанс
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) return parsed;

    return null;
  }

  async generateUsersReport(users: any[]) {
    // @ts-ignore
    const pdfMake = (window as any).pdfMake || (await import('pdfmake/build/pdfmake')).default;

    // @ts-ignore
    const pdfFonts = await import('pdfmake/build/vfs_fonts');

    // ✅ Жёстко подцепляем шрифты
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).default?.vfs;

    // Загружаем логотип
    const logoBase64 = await this.loadBase64Image('photo.png');

    const tableBody = [
      [
        { text: '№', bold: true },
        { text: 'ID', bold: true },
        { text: 'Email', bold: true },
        { text: 'Дата регистрации', bold: true },
      ],
    ];

    users.forEach((user, index) => {
      tableBody.push([index + 1, user.id, user.email, this.formatDate(user.created_at)]);
    });

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 100, 40, 40],
      header: {
        margin: [0, 0, 0, 0],
        stack: [
          {
            canvas: [{ type: 'rect', x: 0, y: 0, w: 600, h: 60, color: '#2563EB' }],
            absolutePosition: { x: 0, y: 0 },
          },
          {
            columns: [
              { image: logoBase64, width: 50, margin: [20, 10, 0, 0] },
              {
                text: 'FilmLab — Отчёт о пользователях',
                alignment: 'left',
                margin: [25, 23, 0, 0],
                fontSize: 16,
                bold: true,
                color: 'white',
              },
            ],
          },
        ],
      },
      content: [
        {
          text: `Дата создание отчёта: ${this.formatDate(new Date().toISOString())}`,
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', 'auto'],
            body: tableBody,
          },
        },
      ],
    };

    pdfMake.createPdf(docDefinition).open();
  }

  private loadBase64Image(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx: any = canvas.getContext('2d');
        canvas.height = img.naturalHeight;
        canvas.width = img.naturalWidth;
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = (error) => reject(error);
    });
  }

  async generateAllPhotosReport(photos: any[]) {
    // @ts-ignore
    const pdfMake = (window as any).pdfMake || (await import('pdfmake/build/pdfmake')).default;
    // @ts-ignore
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).default?.vfs;

    // Загружаем логотип
    const logoBase64 = await this.loadBase64Image('photo.png');

    // Загружаем все изображения параллельно
    const imagePromises = photos.map((p) => {
      const url =
        p.url ??
        `${window.location.protocol}//${window.location.hostname}:3000/uploads/${p.filename}`;
      return this.loadBase64Image(url);
    });
    const imagesBase64 = await Promise.all(imagePromises);

    // Формируем тело таблицы
    const tableBody: any[] = [
      [
        { text: '№', bold: true },
        { text: 'Фото', bold: true },
        { text: 'Email', bold: true },
        { text: 'Имя файла', bold: true },
        { text: 'Дата загрузки', bold: true },
      ],
    ];

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      tableBody.push([
        i + 1,
        {
          image: imagesBase64[i],
          width: 60,
          height: 60,
          fit: [60, 60],
        },
        { text: p.user_email ?? '-', margin: [0, 2, 0, 2], width: 80 }, // прижимаем email
        p.filename,
        this.formatDate(p.created_at),
      ]);
    }

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 100, 40, 40],
      header: {
        stack: [
          {
            canvas: [{ type: 'rect', x: 0, y: 0, w: 595, h: 60, color: '#2563EB' }],
            absolutePosition: { x: 0, y: 0 },
          },
          {
            columns: [
              { image: logoBase64, width: 50, margin: [20, 10, 0, 0] },
              {
                text: 'FilmLab — Отчёт по всем фотографиям',
                alignment: 'left',
                margin: [25, 23, 0, 0],
                fontSize: 16,
                bold: true,
                color: 'white',
              },
            ],
          },
        ],
      },
      content: [
        {
          text: `Дата создание отчёта: ${this.formatDate(new Date().toISOString())}`,
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 60, 120, '*', 'auto'], // Email сузили до 120
            body: tableBody,
          },
        },
      ],
    };

    pdfMake.createPdf(docDefinition).open();
  }

  async generatePhotosGroupedByUserReport(data: { user: any; photos: any[] }[]) {
    // @ts-ignore
    const pdfMake = (window as any).pdfMake || (await import('pdfmake/build/pdfmake')).default;
    // @ts-ignore
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).default?.vfs;

    const logoBase64 = await this.loadBase64Image('photo.png');

    const content: any[] = [];

    // 🕓 Добавляем дату генерации
    content.push({
      text: `Дата создание отчёта: ${this.formatDate(new Date().toISOString())}`,
      margin: [0, 0, 0, 20],
    });

    // 🔵 Основной цикл по пользователям
    for (const entry of data) {
      const user = entry.user;
      const photos = entry.photos;

      // --- Заголовок пользователя ---
      content.push({
        text: `Пользователь: ${user.email} (ID: ${user.id}) — ${photos.length} фото`,
        style: 'userHeader',
        margin: [0, 10, 0, 5],
      });

      if (!photos || photos.length === 0) {
        content.push({
          text: 'Фотографии отсутствуют',
          italics: true,
          margin: [0, 0, 0, 10],
        });
        continue;
      }

      // --- Таблица с фото ---
      const tableBody: any[] = [
        [
          { text: '№', bold: true },
          { text: 'Фото', bold: true },
          { text: 'Имя файла', bold: true },
          { text: 'Дата загрузки', bold: true },
        ],
      ];

      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        try {
          const base64 = await this.loadBase64Image(
            p.url ?? `${window.location.origin}/uploads/${p.filename}`
          );
          tableBody.push([
            i + 1,
            { image: base64, width: 60, height: 60, fit: [60, 60] },
            p.filename,
            this.formatDate(p.created_at),
          ]);
        } catch {
          tableBody.push([
            i + 1,
            { text: '[Ошибка загрузки]', italics: true },
            p.filename,
            this.formatDate(p.created_at),
          ]);
        }
      }

      content.push({
        table: {
          headerRows: 1,
          widths: ['auto', 60, '*', 'auto'],
          body: tableBody,
        },
        margin: [0, 0, 0, 15],
        // 🧩 Ключевой момент:
        // Если таблица не помещается, pdfmake автоматически начнёт её с новой страницы
        pageBreak: 'auto',
        dontBreakRows: true,
      });
    }

    // --- Формирование PDF ---
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 100, 40, 40],
      header: {
        stack: [
          {
            canvas: [{ type: 'rect', x: 0, y: 0, w: 595, h: 60, color: '#2563EB' }],
            absolutePosition: { x: 0, y: 0 },
          },
          {
            columns: [
              { image: logoBase64, width: 50, margin: [20, 10, 0, 0] },
              {
                text: 'FilmLab — Фото по пользователям',
                alignment: 'left',
                margin: [25, 23, 0, 0],
                fontSize: 16,
                bold: true,
                color: 'white',
              },
            ],
          },
        ],
      },
      content,
      styles: {
        userHeader: {
          fontSize: 14,
          bold: true,
          color: '#2563EB',
        },
      },
    };

    pdfMake.createPdf(docDefinition).open();
  }

  private createPlaceholderBase64(size = 60, color = '#cccccc'): string {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    // можно нарисовать иконку или текст, но пока простой фон
    return canvas.toDataURL('image/png');
  }

  // Вспомогательная: загружает и центрированно обрезает изображение до квадрата size x size
  private loadThumbnail(url: string, size = 60): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d')!;

          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const minSide = Math.min(w, h);
          const sx = Math.floor((w - minSide) / 2);
          const sy = Math.floor((h - minSide) / 2);

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Image load error: ' + url));
    });
  }

  // Безопасная версия: пытается загрузить миниатюру, при ошибке возвращает плейсхолдер
  private async loadThumbnailSafe(url: string, size = 60): Promise<string> {
    try {
      return await this.loadThumbnail(url, size);
    } catch (e) {
      // Вернём плейсхолдер если не удалось загрузить/обработать изображение
      return this.createPlaceholderBase64(size);
    }
  }

  async generateMonthlyPhotosReport(photos: any[], range?: { from: string; to: string }) {
    const pdfMake = (window as any).pdfMake || (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).default?.vfs;
    const logoBase64 = await this.loadBase64Image('photo.png');

    // === 🗓️ Определяем диапазон ===
    let dateFrom: Date;
    let dateTo: Date;

    if (range?.from && range?.to) {
      dateFrom = new Date(range.from);
      dateTo = new Date(range.to);
    } else {
      // если диапазон не указан — используем текущий месяц
      const now = new Date();
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // === 🔎 Фильтруем фото по диапазону ===
    const filteredPhotos = (photos || []).filter((p) => {
      if (!p) return false;
      const d = p.created_at ? new Date(p.created_at) : null;
      if (!d || isNaN(d.getTime())) return false;
      return d >= dateFrom && d <= dateTo;
    });

    // === 🧾 Если фото нет ===
    if (!filteredPhotos.length) {
      const emptyDoc: any = {
        pageSize: 'A4',
        pageMargins: [40, 100, 40, 40],
        header: {
          stack: [
            {
              canvas: [{ type: 'rect', x: 0, y: 0, w: 595, h: 60, color: '#2563EB' }],
              absolutePosition: { x: 0, y: 0 },
            },
            {
              columns: [
                { image: logoBase64, width: 50, margin: [20, 10, 0, 0] },
                {
                  text: `FilmLab — Отчёт по загрузке фотографий`,
                  alignment: 'left',
                  margin: [25, 23, 0, 0],
                  fontSize: 16,
                  bold: true,
                  color: 'white',
                },
              ],
            },
          ],
        },
        content: [
          {
            text: `Отчётный период: ${dateFrom.toLocaleDateString()} — ${dateTo.toLocaleDateString()}`,
            margin: [0, 0, 0, 15],
          },
          { text: 'За выбранный период фотографии отсутствуют.', italics: true, fontSize: 12 },
        ],
      };
      pdfMake.createPdf(emptyDoc).open();
      return;
    }

    // === 🖼️ Подготавливаем миниатюры ===
    const imagePromises = filteredPhotos.map((p) => {
      const url =
        p.url ??
        `${window.location.protocol}//${window.location.hostname}:3000/uploads/${p.filename}`;
      return this.loadThumbnailSafe(url, 60);
    });

    const imagesBase64 = await Promise.all(imagePromises);

    // === 📋 Таблица ===
    const tableBody: any[] = [
      [
        { text: '№', bold: true },
        { text: 'Фото', bold: true },
        { text: 'Имя файла', bold: true },
        { text: 'Email пользователя', bold: true },
        { text: 'Дата загрузки', bold: true },
      ],
    ];

    for (let i = 0; i < filteredPhotos.length; i++) {
      const p = filteredPhotos[i];
      tableBody.push([
        i + 1,
        { image: imagesBase64[i], width: 60, height: 60, fit: [60, 60] },
        p.filename ?? '-',
        p.user_email ?? '-',
        this.formatDate(p.created_at),
      ]);
    }

    // === 📄 Документ ===
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 100, 40, 40],
      header: {
        stack: [
          {
            canvas: [{ type: 'rect', x: 0, y: 0, w: 595, h: 60, color: '#2563EB' }],
            absolutePosition: { x: 0, y: 0 },
          },
          {
            columns: [
              { image: logoBase64, width: 50, margin: [20, 10, 0, 0] },
              {
                text: 'FilmLab — Отчёт по загрузке фотографий',
                alignment: 'left',
                margin: [25, 23, 0, 0],
                fontSize: 16,
                bold: true,
                color: 'white',
              },
            ],
          },
        ],
      },
      content: [
        {
          text: `Отчётный период: ${dateFrom.toLocaleDateString()} — ${dateTo.toLocaleDateString()}`,
          margin: [0, 0, 0, 15],
        },
        {
          table: { headerRows: 1, widths: ['auto', 60, '*', 140, 'auto'], body: tableBody },
          layout: 'lightHorizontalLines',
        },
      ],
    };

    pdfMake.createPdf(docDefinition).open();
  }

  async generatePhotoHistoryReport(photo: any, history: any[]) {
    // @ts-ignore
    const pdfMake = (window as any).pdfMake || (await import('pdfmake/build/pdfmake')).default;
    // @ts-ignore
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).default?.vfs;

    const logoBase64 = await this.loadBase64Image('photo.png');
    const photoBase64 = await this.loadBase64Image(
      photo.url ?? `${window.location.origin}/uploads/${photo.filename}`
    );

    // ✅ Берём дату из фото или из истории — первая доступная
    const photoDate = this.formatDate(
      photo.created_at ??
        photo.createdAt ??
        history[0]?.change_time ??
        history[0]?.created_at ??
        history[0]?.createdAt
    );

    console.log('DATE RAW:', photo.created_at, 'PARSED:', this.parseDate(photo.created_at));
    console.log('PHOTO OBJECT:', photo);
    console.log('HISTORY FIRST ROW:', history[0]);

    const tableBody: any[] = [
      [
        { text: 'ID', bold: true },
        { text: 'Email', bold: true },
        { text: 'Действие', bold: true },
        { text: 'Дата', bold: true },
      ],
    ];

    history.forEach((h) => {
      tableBody.push([
        h.change_id,
        h.user_email,
        h.action,
        this.formatDate(h.change_time ?? h.created_at ?? h.createdAt),
      ]);
    });

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 100, 40, 40],
      header: {
        stack: [
          {
            canvas: [{ type: 'rect', x: 0, y: 0, w: 595, h: 60, color: '#2563EB' }],
            absolutePosition: { x: 0, y: 0 },
          },
          {
            columns: [
              { image: logoBase64, width: 50, margin: [20, 10, 0, 0] },
              {
                text: 'FilmLab — История изменений фото',
                alignment: 'left',
                margin: [25, 23, 0, 0],
                fontSize: 16,
                bold: true,
                color: 'white',
              },
            ],
          },
        ],
      },
      content: [
        {
          columns: [
            { image: photoBase64, width: 150 },
            [
              {
                text: `Автор: ${photo.user_email ?? history[0]?.user_email ?? '-'}`,
                margin: [10, 0, 0, 5],
              },
              { text: `Имя файла: ${photo.filename}`, margin: [10, 0, 0, 5] },
              { text: `Дата загрузки: ${photoDate}`, margin: [10, 0, 0, 5] },
            ],
          ],
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 150, '*', 'auto'],
            body: tableBody,
          },
        },
      ],
    };

    pdfMake.createPdf(docDefinition).open();
  }
}
