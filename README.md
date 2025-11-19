# FilmLab — Инструкция по запуску проекта

Этот README поможет вам быстро развернуть проект **FilmLab**, содержащий backend на Node.js и frontend на Angular.

## 📌 Предварительные требования

Перед установкой убедитесь, что у вас есть:

* **Node.js** (версии 18+)
* **npm** или **yarn**
* **Angular CLI** (рекомендуется последняя версия)

  ```bash
  npm install -g @angular/cli
  ```
* **MySQL Server** (версии 5.7+ / 8+)
* Git

---

## ⚙️ 1. Установка MySQL базы данных

1. Создайте пустую базу данных в MySQL:

   ```sql
   CREATE DATABASE photo_app;
   ```
2. Выполните импорт `schema.sql`:

   ```bash
   mysql -u root -p photo_app < schema.sql
   ```

---

## 📁 2. Установка зависимостей backend и frontend

### Backend

Перейдите в каталог:

```bash
cd filmLab/backend
```

Установите зависимости:

```bash
npm install
```

---

## 🔧 3. Настройка переменных окружения

1. В каталоге `/filmLab/backend` переименуйте файл:

   ```bash
   mv .env.example .env
   ```
2. Отредактируйте `.env`:

   ```dotenv
   DB_HOST=0.0.0.0
   DB_USER=root
   DB_PASSWORD=PASS
   DB_NAME=photo_app
   JWT_SECRET=supersecret
   PORT=3000
   ```

---

## ▶️ 4. Запуск backend

Выполните:

```bash
cd filmLab/backend
node src/app.js
```

Backend запустится на **[http://0.0.0.0:3000](http://0.0.0.0:3000)** или на порту, указанном в `.env`.

---

## 🎨 5. Установка frontend

Перейдите:

```bash
cd filmLab/frontend
```

Установите зависимости:

```bash
npm install
```

---

## 🚀 6. Запуск frontend

Запуск Angular приложения:

```bash
ng serve --host 0.0.0.0 --port 4200
```

или стандартно:

```bash
ng serve
```

Проект будет доступен по адресу:

```
http://localhost:4200
```

---

## 📄 Структура проекта

```
filmLab/
│
├── backend/        # Node.js сервер, REST API
│   ├── src/
│   ├── .env
│   └── package.json
│
├── frontend/       # Angular SPA интерфейс
│   ├── src/
│   └── package.json
│
└── schema.sql      # Структура базы данных
```

---

## 🧪 Полезные команды

### Проверить статус MySQL:

```bash
systemctl status mysql
```

### Создать новый Angular компонент:

```bash
ng g c components/MyComponent
```

### Перезапустить backend с nodemon (если установлен):

```bash
nodemon src/app.js
```

---

## 🛠 Что нужно для успешного запуска проекта

* Открытые порты **3000** (backend) и **4200** (frontend)
* MySQL сервер работает и доступен
* Правильный `.env` файл
* Установленная версия Angular CLI совпадает с проектной
* Файлы проекта находятся в правильных каталогах (`backend`, `frontend`)
* Node.js версии 18+ для корректной работы всех зависимостей

---

## 📬 Поддержка

Если возникнут вопросы — смело обращайтесь!

**Удачи с запуском проекта 🎬🔥**

---

# FilmLab — Project Launch Guide (English Version)

This README will help you quickly set up and run the **FilmLab** project, which includes a Node.js backend and an Angular frontend.

## 📌 Requirements

Before starting, make sure you have:

* **Node.js** (v18+)
* **npm** or **yarn**
* **Angular CLI** (latest recommended)

  ```bash
  npm install -g @angular/cli
  ```
* **MySQL Server** (5.7+ / 8+)
* Git

---

## ⚙️ 1. Install MySQL Database

1. Create an empty database:

   ```sql
   CREATE DATABASE photo_app;
   ```
2. Import `schema.sql`:

   ```bash
   mysql -u root -p photo_app < schema.sql
   ```

---

## 📁 2. Install Backend Dependencies

Navigate to:

```bash
cd filmLab/backend
```

Install dependencies:

```bash
npm install
```

---

## 🔧 3. Configure Environment Variables

1. Rename the file:

   ```bash
   mv .env.example .env
   ```
2. Edit `.env`:

   ```dotenv
   DB_HOST=0.0.0.0
   DB_USER=root
   DB_PASSWORD=PASS
   DB_NAME=photo_app
   JWT_SECRET=supersecret
   PORT=3000
   ```

---

## ▶️ 4. Start Backend

Run:

```bash
cd filmLab/backend
node src/app.js
```

The backend will run on **[http://0.0.0.0:3000](http://0.0.0.0:3000)** or the port specified in `.env`.

---

## 🎨 5. Install Frontend Dependencies

Navigate to:

```bash
cd filmLab/frontend
```

Install dependencies:

```bash
npm install
```

---

## 🚀 6. Run Frontend

Start Angular app:

```bash
ng serve --host 0.0.0.0 --port 4200
```

or simply:

```bash
ng serve
```

Your project will be available at:

```
http://localhost:4200
```

---

## 📄 Project Structure

```
filmLab/
│
├── backend/        # Node.js server, REST API
│   ├── src/
│   ├── .env
│   └── package.json
│
├── frontend/       # Angular SPA interface
│   ├── src/
│   └── package.json
│
└── schema.sql      # Database structure
```

---

## 🧪 Useful Commands

### Check MySQL status:

```bash
systemctl status mysql
```

### Create a new Angular component:

```bash
ng g c components/MyComponent
```

### Restart backend with nodemon (if installed):

```bash
nodemon src/app.js
```

---

## 🛠 Requirements for Successful Startup

* Open ports **3000** (backend) and **4200** (frontend)
* Running MySQL server
* Correct `.env` configuration
* Matching Angular CLI version
* Proper project folder structure (`backend`, `frontend`)
* Node.js v18+ for full compatibility

---

## 📬 Support

If you have questions or issues — feel free to ask!

**Good luck launching your project 🎬🔥**
