// Импортируем декоратор @NgModule — он нужен для создания модуля (в данном случае — модуля маршрутизации)
import { NgModule } from '@angular/core';

// Импортируем инструменты маршрутизации:
// RouterModule — модуль, который добавляет в приложение возможности маршрутизации,
// Routes — интерфейс, описывающий массив маршрутов.
import { RouterModule, Routes } from '@angular/router';

// Импортируем компонент страницы входа в систему
import { LoginComponent } from './components/login/login';

// Импортируем компонент страницы регистрации
import { RegisterComponent } from './components/register/register';

// Импортируем компонент, который отображает список фотографий
import { PhotoListComponent } from './components/photo-list/photo-list';

// Импортируем компонент для загрузки фотографий
import { PhotoUploadComponent } from './components/photo-upload/photo-upload';

// Импортируем компонент для редактирования фотографий (для авторизованных пользователей)
import { PhotoEditorComponent } from './components/photo-editor/photo-editor';

// Импортируем компонент для редактирования фотографий гостем (без входа)
import { PhotoEditorGuestComponent } from './components/photo-editor-guest/photo-editor-guest';

// Импортируем Guard — защиту маршрута, которая ограничивает доступ только авторизованным пользователям
import { authGuard } from './auth.guard';

// Импортируем Guard для проверки, является ли пользователь администратором
import { adminGuard } from './admin.guard';

// Импортируем компонент, который показывает список пользователей (скорее всего, только для администратора)
import { UserListComponent } from './components/user-list/user-list';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // публичные
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'photo-editor-guest/:id', component: PhotoEditorGuestComponent },
  { path: 'upload', component: PhotoUploadComponent },

  // защищённые
  { path: 'list', component: PhotoListComponent, canActivate: [authGuard] },
  { path: 'photo-editor/:id', component: PhotoEditorComponent, canActivate: [authGuard] },

  // 👇 только для админов
  { path: 'user-list', component: UserListComponent, canActivate: [adminGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
