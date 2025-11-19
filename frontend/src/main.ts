// Импорт функции для запуска (bootstrap) основного Angular-приложения
import { bootstrapApplication } from '@angular/platform-browser';

// Импорт функции для настройки маршрутизации (роутов)
import { provideRouter } from '@angular/router';

// Импорт функции для подключения HttpClient (для запросов к серверу)
import { provideHttpClient } from '@angular/common/http';

// Импорт главного компонента приложения (точка входа)
import { App } from './app/app';

// Импорт файла, где определены маршруты приложения
import { routes } from './app/app-routing.module';

// Импорт типа Plugin из Vite (если ты планируешь использовать плагины для сборки)
import { Plugin } from 'vite';

// Запуск (инициализация) Angular-приложения с заданными провайдерами
bootstrapApplication(App, {
  // Подключаем маршрутизацию и возможность выполнять HTTP-запросы
  providers: [provideRouter(routes), provideHttpClient()],
})
  // Если при запуске произойдёт ошибка — выводим её в консоль
  .catch((err) => console.error(err));

// Заглушка для функции defineConfig (используется в Vite для конфигурации проекта)
// Здесь она просто выбрасывает ошибку, потому что не реализована
function defineConfig(arg0: { plugins: Plugin<any>[][] }) {
  throw new Error('Function not implemented.');
}
