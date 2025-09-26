# 🗣️ Logicare Speech Therapy Web App

[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)  
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)  
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)  
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)  

A **full-stack web application** for managing and delivering speech therapy exercises.  
Fully containerized with **Docker**, powered by a **PostgreSQL database**, **Node.js backend**, and **React (Vite) frontend**.

---

## 🚀 Features
- ✅ PostgreSQL database with schema + initial data (`db/dump1.sql`)
- ✅ RESTful API backend (Node.js + Express)
- ✅ React (Vite) frontend with API proxy
- ✅ Fully containerized with Docker Compose
- ✅ Easy local development & database reset

---

## 📦 Prerequisites
Make sure you have installed:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## ⚙️ Setup & Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/ntua-el19120/Logicare-Speech-Therapy-Web-app.git
   cd Logicare-Speech-Therapy-Web-app
   ```

2. **Start the services**
   ```bash
   docker compose up --build
   ```
   This will build and run:
   - `db` → PostgreSQL (schema + data from `db/dump1.sql`)
   - `backend` → Node.js server (Express API)
   - `frontend` → React app (served by Vite)

3. **Access the app**
   - 🌐 Frontend: [http://localhost:4173](http://localhost:4173)  
   - 🔌 Backend API: [http://localhost:4000](http://localhost:4000)  
   - 🗄️ Database: `localhost:5432`  
     - user: `postgres`  
     - password: `postgres`  
     - db: `speech_therapy`  

---

## 🗄️ Database Notes
* Database initialized with `db/dump1.sql`.
* Reset/reload database:
  ```bash
  docker compose down -v
  docker compose up --build
  ```

---

## 🛠 Development

**Frontend** (`/frontend`)  
```bash
cd frontend
npm install
npm run dev
```

**Backend** (`/backend`)  
```bash
cd backend
npm install
npm run start
```

---

## 📖 License
This project is for academic/demo purposes.  
All rights reserved by **NTUA Logicare Team**.
