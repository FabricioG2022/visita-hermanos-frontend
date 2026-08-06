# Web Visita Hermanos - Sistema de Gestión

Este proyecto ha sido desarrollado siguiendo la consigna del **Examen Final de Plataformas de Desarrollo**. Se compone de dos aplicaciones independientes: un **Backend API REST** desarrollado en Node.js + Express con seguridad JWT, y un **Frontend** moderno en React + Vite que replica las pantallas diseñadas en Figma.

---

## 🚀 Requisitos Previos

- **Node.js**: v18.0.0 o superior.
- **npm**: v9.0.0 o superior.

---

## 📂 Estructura del Proyecto

```text
WebVisitaHermanos/
├── backend/                  # Servidor API RESTful con JWT
│   ├── src/
│   │   ├── controllers/      # Controladores (Auth, Miembros, Citas, Visitas, Dashboard)
│   │   ├── middleware/       # Autenticación y Autorización por JWT
│   │   ├── routes/           # Endpoints del API
│   │   └── server.js         # Servidor principal de Express
│   └── package.json
│
└── frontend/                 # Aplicación Cliente React + Vite
    ├── src/
    │   ├── components/       # Sidebar, Header, Tabla, Modales (Programar Cita, Nuevo Miembro)
    │   ├── pages/            # Dashboard, Lista de Miembros, Perfil de Miembro, Login
    │   ├── services/         # Cliente API con envío automático de Bearer Token
    │   ├── context/          # Gestión de sesión con JWT
    │   └── styles/           # Paleta visual del Figma
    └── package.json
```

---

## ⚙️ Instrucciones de Ejecución

### 1. Iniciar el Backend (Node.js API REST)
```bash
cd backend
npm run dev
```
El servidor backend se ejecutará en: `http://localhost:5000/api`

### 2. Iniciar el Frontend (React + Vite)
En una nueva consola de comandos:
```bash
cd frontend
npm run dev
```
La aplicación web se ejecutará en: `http://localhost:3000`

---

## 🔑 Credenciales para Pruebas (Demo Users)

| Rol | Email | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador / Coordinador** | `admin@visita.com` | `admin123` | Control total (crear miembros, eliminar, programar citas). |
| **Voluntario / Visitante** | `elBerra26@gmail.com` | `124578**` | Ver dashboard, consultar miembros y registrar citas/visitas. |

---

## 🔒 Seguridad y JWT

Cada petición que realiza el frontend incluye la cabecera HTTP de autenticación:
`Authorization: Bearer <TOKEN_JWT>`

---

## 📲 Conexión con la App Móvil (Firebase)

Tanto el backend de Node.js como la app móvil se conectan a la misma instancia de **Firebase Firestore**. 
- Cuando la **Web** guarda una cita o modifica un miembro mediante `POST /api/appointments`, el backend de Node.js escribe en Firebase Firestore.
- La **App móvil** recibe la actualización instantáneamente a través de las notificaciones de cambio en tiempo real (`onSnapshot`) de Firebase.
