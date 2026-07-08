# 🏦 Vertex Bank

Vertex Bank is a secure, full-stack **Single Page Application (SPA)** that simulates core retail banking operations. It features a decoupled frontend and backend architecture, with the client and server deployed independently and communicating securely through REST APIs.

🌐 **Live Demo:** https://vertex-bank-frontend.vercel.app

---

## 📸 Screenshots

<img width="1900" height="987" alt="Homepage" src="https://github.com/user-attachments/assets/7eb066b8-d891-4dd5-b513-6ddd21ba8784" />

<img width="1893" height="987" alt="Dashboard" src="https://github.com/user-attachments/assets/e3cbbf7a-6779-43e4-a8b1-0cb5d065fc8f" />

<img width="1893" height="982" alt="Transactions" src="https://github.com/user-attachments/assets/cdafabcd-44c8-4912-8330-2a269bef2025" />

<img width="1907" height="987" alt="Authentication" src="https://github.com/user-attachments/assets/63ff12e5-d11d-464b-b028-4453c88ff19f" />

---

# 🚀 Features

- **Single Page Application (SPA):** Framework-free SPA with seamless navigation between Home, Login, Signup, and Dashboard views using client-side state management.
- **JWT Authentication:** Secure user registration and login with JSON Web Tokens (JWT) for authenticated API access and persistent user sessions.
- **Banking Operations:** Deposit, withdraw, transfer funds, request loans, sort transactions, and view real-time account balances.
- **Account Management:** Authenticated users can permanently delete their accounts through protected API endpoints.
- **Responsive UI:** Clean and responsive interface built with modern HTML, CSS, and JavaScript.

---

# 🛠️ Tech Stack

## Frontend

- HTML5
- CSS3 (Grid & Flexbox)
- Vanilla JavaScript (ES6+, Fetch API, DOM Manipulation)
- Hosted on **Vercel**

## Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Hosted on **Render**

---

# 🛡️ Security & Architecture

The application follows a decoupled frontend-backend architecture with secure communication between independently hosted services.

### Secure CORS Configuration

- Backend explicitly whitelists the production frontend origin.
- Handles CORS preflight (`OPTIONS`) requests correctly.
- Prevents unauthorized cross-origin requests.

### JWT-Based Authorization

Protected routes require a valid JWT in the request header.

```http
Authorization: Bearer <TOKEN>
```

### REST API

- Stateless API design
- JSON request/response format
- Secure communication between client and server

---

# 📖 API Endpoints

All requests and responses use JSON.

---

## Authentication

### Register

```http
POST /api/users/signup
```

Headers

```http
Content-Type: application/json
```

Request Body

```json
{
  "name": "Alex Mercer",
  "username": "alexm",
  "pin": 1111
}
```

---

### Login

```http
POST /api/users/login
```

Request Body

```json
{
  "username": "alexm",
  "pin": 1111
}
```

---

## Protected Routes

These endpoints require:

```http
Authorization: Bearer <TOKEN>
```

Examples include:

- View account details
- Transfer money
- Request loans
- Delete account

---

# 🌐 Deployment

**Frontend**

- Vercel

**Backend**

- Render

**Database**

- MongoDB Atlas

---

# 👨‍💻 Author

**Rahul Wagh**

Vertex Bank was built to explore secure authentication, REST API development, state management, and full-stack web application architecture using the MERN ecosystem.
