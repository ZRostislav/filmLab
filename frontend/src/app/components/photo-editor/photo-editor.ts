import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PhotoService } from '../../services/photo';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BonusService, Bonus } from '../../services/bonus';

/**
 * PhotoEditorComponent
 * ---------------------
 * Основной компонент для редактирования фотографий:
 *  - фильтры и цветокоррекция
 *  - кадрирование, вращение, отражение
 *  - undo/redo история
 *  - скачивание в разные форматы
 */
@Component({
  selector: 'app-photo-editor',
  standalone: true,
  templateUrl: './photo-editor.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./photo-editor.scss'],
})
export class PhotoEditorComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  ctx!: CanvasRenderingContext2D | null;
  photo: any;

  // --- Кадрирование ---
  isCropping = false;
  cropStart = { x: 0, y: 0 };
  cropEnd = { x: 0, y: 0 };

  // --- История изменений (как снимки canvas) ---
  history: string[] = [];
  historyIndex = -1;

  constructor(
    private route: ActivatedRoute,
    private photoService: PhotoService,
    private bonusService: BonusService
  ) {}

  // Получение токена
  get token(): string | null {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  }

  // Загружаем фото по ID
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const token = this.token;
    if (!token) return alert('Нет токена!');

    if (id) {
      try {
        this.photo = await this.photoService.getPhotoById(+id, token);
        this.loadImage(
          `${window.location.protocol}//${window.location.hostname}:3000/uploads/${this.photo.filename}`
        );
      } catch (err) {
        console.error(err);
        alert('Не удалось загрузить фото');
      }
    }
  }

  // Загружаем картинку в canvas
  loadImage(url: string) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      this.drawImageOnCanvas(img);
      this.saveState();
    };
    img.onerror = () => alert('Фото не найдено на сервере');
  }

  // Отрисовка изображения на canvas
  drawImageOnCanvas(img: HTMLImageElement) {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!this.ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.drawImage(img, 0, 0);
  }

  // --- История изменений ---
  saveState() {
    if (!this.canvasRef?.nativeElement) return;
    const dataUrl = this.canvasRef.nativeElement.toDataURL();

    // очищаем будущее (если делали undo и потом новые действия)
    this.history = this.history.slice(0, this.historyIndex + 1);

    this.history.push(dataUrl);
    this.historyIndex++;
  }

  restoreState(index: number) {
    if (index < 0 || index >= this.history.length) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = this.history[index];
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreState(this.historyIndex);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreState(this.historyIndex);
    }
  }

  confirmChanges() {
    this.saveState();
    alert('Изменения подтверждены ✅');
  }

  cancelChanges() {
    if (this.historyIndex > 0) {
      this.undo();
    }
    alert('Изменения отменены ❌');
  }

  // --- Универсальный фильтр для пикселей ---
  private applyPixelFilter(cb: (r: number, g: number, b: number) => [number, number, number]) {
    if (!this.ctx || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const [nr, ng, nb] = cb(data[i], data[i + 1], data[i + 2]);
      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;
    }

    this.ctx.putImageData(imageData, 0, 0);
    this.saveState();
  }

  // --- Фильтры ---
  applyFilmToNormal() {
    this.applyPixelFilter((r, g, b) => [
      Math.min(255, (255 - r) * 1.1),
      Math.min(255, (255 - g) * 1.1),
      Math.min(255, (255 - b) * 1.1),
    ]);
  }

  enhancePhoto() {
    this.applyPixelFilter((r, g, b) => [
      Math.min(255, (r - 128) * 1.2 + 128 + 10),
      Math.min(255, (g - 128) * 1.2 + 128 + 10),
      Math.min(255, (b - 128) * 1.2 + 128 + 10),
    ]);
  }

  autoColorCorrection() {
    if (!this.ctx || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let rMin = 255,
      gMin = 255,
      bMin = 255;
    let rMax = 0,
      gMax = 0,
      bMax = 0;

    for (let i = 0; i < data.length; i += 4) {
      rMin = Math.min(rMin, data[i]);
      gMin = Math.min(gMin, data[i + 1]);
      bMin = Math.min(bMin, data[i + 2]);

      rMax = Math.max(rMax, data[i]);
      gMax = Math.max(gMax, data[i + 1]);
      bMax = Math.max(bMax, data[i + 2]);
    }

    for (let i = 0; i < data.length; i += 4) {
      data[i] = ((data[i] - rMin) * 255) / (rMax - rMin);
      data[i + 1] = ((data[i + 1] - gMin) * 255) / (gMax - gMin);
      data[i + 2] = ((data[i + 2] - bMin) * 255) / (bMax - bMin);
    }

    this.ctx.putImageData(imageData, 0, 0);
    this.saveState();
  }

  adjustSaturation(factor: number = 1.3) {
    this.applyPixelFilter((r, g, b) => {
      const avg = (r + g + b) / 3;
      return [avg + (r - avg) * factor, avg + (g - avg) * factor, avg + (b - avg) * factor];
    });
  }

  whiteBalance() {
    if (!this.ctx || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let avgR = 0,
      avgG = 0,
      avgB = 0;
    const count = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      avgR += data[i];
      avgG += data[i + 1];
      avgB += data[i + 2];
    }

    avgR /= count;
    avgG /= count;
    avgB /= count;
    const gray = (avgR + avgG + avgB) / 3;

    const scaleR = gray / avgR;
    const scaleG = gray / avgG;
    const scaleB = gray / avgB;

    for (let i = 0; i < data.length; i += 4) {
      data[i] *= scaleR;
      data[i + 1] *= scaleG;
      data[i + 2] *= scaleB;
    }

    this.ctx.putImageData(imageData, 0, 0);
    this.saveState();
  }

  applyCinematicLook() {
    this.applyPixelFilter((r, g, b) => [
      Math.min(255, r * 1.05),
      Math.min(255, g * 1.02),
      Math.min(255, b * 0.95),
    ]);
  }

  beautifyFilmPhoto() {
    this.applyFilmToNormal();
    this.autoColorCorrection();
    this.whiteBalance();
    this.adjustSaturation(1.4);
    this.enhancePhoto();
    this.applyCinematicLook();
  }

  applyGrayscale() {
    this.applyPixelFilter((r, g, b) => {
      const avg = (r + g + b) / 3;
      return [avg, avg, avg];
    });
  }

  applySepia() {
    this.applyPixelFilter((r, g, b) => [
      Math.min(255, r * 0.393 + g * 0.769 + b * 0.189),
      Math.min(255, r * 0.349 + g * 0.686 + b * 0.168),
      Math.min(255, r * 0.272 + g * 0.534 + b * 0.131),
    ]);
  }

  applyBlur() {
    if (!this.ctx || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.filter = 'blur(3px)';
    this.ctx.drawImage(canvas, 0, 0);
    this.ctx.filter = 'none';
    this.saveState();
  }

  private getCanvasCoords(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();

    // учитываем масштаб canvas относительно его реального размера
    const scaleX = this.canvasRef.nativeElement.width / rect.width;
    const scaleY = this.canvasRef.nativeElement.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  // --- Кадрирование ---
  startCrop(event: MouseEvent) {
    this.isCropping = true;
    this.cropStart = this.getCanvasCoords(event);
    this.cropEnd = { ...this.cropStart };
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isCropping) return;
    this.cropEnd = this.getCanvasCoords(event);

    this.restoreState(this.historyIndex);
    if (this.ctx) {
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([6]);
      this.ctx.strokeRect(
        this.cropStart.x,
        this.cropStart.y,
        this.cropEnd.x - this.cropStart.x,
        this.cropEnd.y - this.cropStart.y
      );
      this.ctx.setLineDash([]);
    }
  }

  endCrop(event: MouseEvent) {
    if (!this.isCropping) return;
    this.isCropping = false;
    this.cropEnd = this.getCanvasCoords(event);

    const x = Math.min(this.cropStart.x, this.cropEnd.x);
    const y = Math.min(this.cropStart.y, this.cropEnd.y);
    const width = Math.abs(this.cropEnd.x - this.cropStart.x);
    const height = Math.abs(this.cropEnd.y - this.cropStart.y);

    this.cropImage(x, y, width, height);
  }

  cropImage(x: number, y: number, width: number, height: number) {
    if (!this.ctx || !this.canvasRef?.nativeElement || width <= 0 || height <= 0) return;
    const canvas = this.canvasRef.nativeElement;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

    canvas.width = width;
    canvas.height = height;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(tempCanvas, 0, 0);
    this.saveState();
  }

  cropBorders(pixels: number = 10) {
    if (!this.ctx || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    this.cropImage(pixels, pixels, canvas.width - pixels * 2, canvas.height - pixels * 2);
  }

  // --- Трансформации ---
  rotate(deg: number = 90) {
    if (!this.ctx || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    if (deg % 180 === 0) {
      canvas.width = tempCanvas.width;
      canvas.height = tempCanvas.height;
    } else {
      canvas.width = tempCanvas.height;
      canvas.height = tempCanvas.width;
    }

    this.ctx.save();
    this.ctx.translate(canvas.width / 2, canvas.height / 2);
    this.ctx.rotate((deg * Math.PI) / 180);
    this.ctx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
    this.ctx.restore();
    this.saveState();
  }

  flip(horizontal: boolean = true) {
    if (!this.ctx || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    this.ctx.save();
    this.ctx.translate(horizontal ? canvas.width : 0, horizontal ? 0 : canvas.height);
    this.ctx.scale(horizontal ? -1 : 1, horizontal ? 1 : -1);
    this.ctx.drawImage(tempCanvas, 0, 0);
    this.ctx.restore();
    this.saveState();
  }

  // --- Скачивание ---
  download(format: string) {
    if (!this.canvasRef?.nativeElement) return;
    const link = document.createElement('a');
    link.href = this.canvasRef.nativeElement.toDataURL(format);
    let ext = 'png';
    if (format === 'image/jpeg') ext = 'jpg';
    else if (format === 'image/webp') ext = 'webp';
    else if (format === 'image/tiff') ext = 'tiff';
    link.download = `edited.${ext}`;
    link.click();
  }

  async saveFinal() {
    if (!this.canvasRef?.nativeElement) return;
    if (!this.photo || !this.photo.id) return alert('Фото не найдено в базе');

    const token = this.token;
    if (!token) return alert('Нет токена');

    // 👉 Сначала проверяем бонусы
    this.bonusService.getBalance().subscribe({
      next: async (bonus) => {
        if (bonus.blocked || bonus.value <= 0) {
          alert('Недостаточно бонусов для сохранения 😢');
          return;
        }

        // ✅ Если бонус есть → сохраняем фото
        const canvas = this.canvasRef.nativeElement;
        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png')
        );
        const file = new File([blob], 'edited.png', { type: 'image/png' });

        const formData = new FormData();
        formData.append('photo', file);

        try {
          await this.photoService.updatePhoto(this.photo.id, formData, token);
          alert('Фото обновлено ✅');

          this.bonusService.spend(1).subscribe({
            next: (updated) => {
              // console.log("✅ Бонус списан. Остаток:", updated.value);
            },
            error: (err) => {
              console.error('❌ Ошибка при списании бонуса:', err);
              alert('❌ Ошибка при списании бонуса: ' + (err.message || err));
            },
          });
        } catch (err) {
          console.error(err);
          alert('Ошибка сохранения ❌');
        }
      },
      error: (err) => {
        console.error('❌ Ошибка при получении баланса:', err);
      },
    });
  }
}
