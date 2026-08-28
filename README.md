# Basic CRM - Authentication & Security Module

A modern, production-grade Customer Relationship Management (CRM) application built with **React + TypeScript + Tailwind CSS** on the frontend and **Spring Boot 3 + Spring Security + JWT + PostgreSQL** on the backend.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Type-safe, modular CRM user interface |
| **UI & Styling** | [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Modern dark-mode aesthetics, responsive components |
| **API Client** | [Axios](https://axios-http.com/) | Centralized HTTP requests with JWT request/response interceptors |
| **Backend** | [Java 21](https://www.oracle.com/java/) + [Spring Boot 3.3](https://spring.io/projects/spring-boot) | REST API backend and business logic |
| **Security** | [Spring Security 6](https://spring.io/projects/spring-security) + [JJWT 0.12](https://github.com/jwtk/jjwt) | Stateless JWT authentication, password hashing with BCrypt |
| **Authorization** | **RBAC (Role-Based Access Control)** | Roles: `ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_EMPLOYEE` |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) + [Spring Data JPA](https://spring.io/projects/spring-data-jpa) / Hibernate | Persistent storage & relational ORM mapping |
| **API Documentation** | [Swagger / OpenAPI 3.0](https://swagger.io/) | Interactive API docs with BearerAuth support |
| **Build Tools** | [Maven](https://maven.apache.org/) & [Vite](https://vitejs.dev/) | High-speed Java and Frontend build tooling |
| **Containerization** | [Docker Compose](https://docs.docker.com/compose/) | One-click PostgreSQL and pgAdmin provisioning |

---

## 🚀 Getting Started

### 1. Run the Backend (`Spring Boot`)

```bash
cd backend
mvn spring-boot:run
```
- Backend starts at: `http://localhost:8080`
- Interactive Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI Specification: `http://localhost:8080/v3/api-docs`

### 2. Run the Frontend (`React + Vite`)

```bash
cd frontend
npm install
npm run dev
```
- Frontend starts at: `http://localhost:5173`

---

## 👥 Seeded Demo Accounts

On initial startup, the backend automatically seeds the following user accounts for immediate testing:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@crm.com` | `admin123` | Full access: View all users, assign/change user roles, toggle account status |
| **Manager** | `manager@crm.com` | `manager123` | Manager access: View users and team members |
| **Employee** | `employee@crm.com` | `employee123` | Employee access: Dashboard, self profile (`/auth/me`) |

---

## 🔒 Security & RBAC Endpoints

### Authentication APIs (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Create a new user account
- `POST /api/v1/auth/login` - Authenticate credentials and obtain JWT Bearer token
- `GET /api/v1/auth/me` - Retrieve current authenticated user details

### User Management & Access Control APIs (`/api/v1/users`)
- `GET /api/v1/users` - Fetch list of all registered CRM users (*Admin & Manager*)
- `GET /api/v1/users/{id}` - Fetch single user details (*Admin & Manager*)
- `PATCH /api/v1/users/{id}/role` - Promote or demote user role (*Admin only*)
- `PATCH /api/v1/users/{id}/toggle-status` - Enable / disable account (*Admin only*)
