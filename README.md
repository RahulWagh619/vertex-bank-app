# 🏦 Vertex Bank

Vertex Bank is a secure, full-stack, state-driven Single Page Application (SPA) designed to simulate modern retail banking features. The application features independent frontend and backend architectures securely cross-communicating across distinct cloud hosting environments.

🌐 **Live Demo:** [View Live Frontend on Vercel](https://vertex-bank-frontend.vercel.app) 
<img width="1918" height="967" alt="Screenshot 2026-05-17 002620" src="https://github.com/user-attachments/assets/88435bf9-b846-4446-97f6-e270c791b6cd" />

<img width="1893" height="987" alt="Screenshot 2026-05-17 002643" src="https://github.com/user-attachments/assets/e3cbbf7a-6779-43e4-a8b1-0cb5d065fc8f" />

<img width="1893" height="982" alt="Screenshot 2026-05-17 002703" src="https://github.com/user-attachments/assets/cdafabcd-44c8-4912-8330-2a269bef2025" />

<img width="1907" height="987" alt="image" src="https://github.com/user-attachments/assets/63ff12e5-d11d-464b-b028-4453c88ff19f" />


## 🚀 Key Features

- **State-Driven Multi-View Gateway:** A fluid, framework-free Single Page Application (SPA) layout that utilizes a state-switching engine to transition between Home, Login, and Signup menus cleanly.
- **Secure Authentication Pipeline:** State-aware user onboarding via a custom registration pipeline and secure login utilizing JSON Web Tokens (JWT) for persistent state management (`localStorage`).
- **Real-Time Core Banking Ledger:** Complete transaction engine running calculations for client balances, active money transfers, dynamic loan processing, and dynamic sorting of account statements.
- **Account Termination Lifecycle:** Standardized `DELETE` endpoint functionality allowing authenticated users to permanently close accounts, handling client-side session purges automatically.


## 🛠️ Tech Stack

**Frontend:**
- HTML5 & CSS3 (Advanced Grid, Flexbox layouts, responsive design)
- Vanilla JavaScript (Asynchronous ES6+ Fetch API, DOM manipulation, state routing)
- Hosted on: **Vercel**

**Backend:**
- Node.js & Express.js (RESTful API design, specialized router controllers)
- MongoDB Atlas & Mongoose (Document-based data validation and modeling)
- Hosted on: **Render**


## 🛡️ Production Security & Architecture

One of the major milestones of this project was engineering a secure cross-origin ecosystem across cloud servers:

1. **Origin-Aware CORS Middleware:** Configured the Node.js backend to reject generic wildcards and explicitly whitelist the production Vercel DOM client, handling complex preflight `OPTIONS` requests gracefully.
2. **Bearer Token Authorization:** Standardized network protocol headers by injecting JWT keys (`Authorization: Bearer <token>`) to protect administrative and account-destructive (`DELETE`) API routes.
3. **Decoupled Architecture:** Client data manifests are transmitted solely via encrypted JSON payloads, insulating the core infrastructure from direct database access vulnerabilities.


 📖 API Documentation & Endpoints

All request and response payloads communicate via standardized JSON. Protected routes require a valid JWT passed in the request header: `Authorization: Bearer <TOKEN>`.

 Authentication Endpoints

🔐 Register a New User
* **Endpoint:** `POST /api/users/signup`
* **Headers:** `Content-Type: application/json`
* **Body Payload:**
  ```json
  {
    "name": "Alex Mercer",
    "username": "alexm",
    "pin": 1111
  }
