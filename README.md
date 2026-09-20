# OfficeFlow

<p align="center">
  <strong>Integrated Office Management System</strong>
</p>

<p align="center">
  OfficeFlow adalah aplikasi manajemen operasional kantor berbasis web untuk membantu
  pengelolaan customer, supplier, produk, pesanan, pembelian, pengiriman, invoice,
  pembayaran, surat, dokumen, pengguna, serta aktivitas sistem dalam satu aplikasi.
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,ts,tailwind,nestjs,nodejs,postgres,prisma,npm,git" alt="OfficeFlow Technology Stack" />
</p>

---

## Tentang OfficeFlow

OfficeFlow dikembangkan sebagai sistem informasi internal perusahaan untuk menyederhanakan proses administrasi dan operasional kantor.

Aplikasi ini menggunakan arsitektur frontend dan backend yang terpisah. Frontend dibangun menggunakan React dan TypeScript, sedangkan backend menggunakan NestJS dengan PostgreSQL sebagai database utama dan Prisma sebagai ORM.

OfficeFlow tidak hanya menangani data master, tetapi juga menghubungkan proses bisnis mulai dari pesanan customer, pembelian bahan dari supplier, pengiriman menggunakan Surat Jalan, pembuatan invoice, pencatatan pembayaran, sampai pengarsipan dokumen perusahaan.

Sistem juga dilengkapi authentication, role-based access control, soft delete, history data, upload dokumen, activity log, dan berbagai validasi untuk menjaga konsistensi data.

---

## Fitur Utama

OfficeFlow memiliki beberapa kelompok fitur utama.

### Dashboard

Dashboard menyediakan ringkasan informasi penting dari sistem, seperti:

- Total customer
- Total produk
- Total pesanan
- Total invoice
- Aktivitas terbaru
- Pengumuman
- Akses cepat ke proses operasional

### Customer Management

Digunakan untuk mengelola data customer perusahaan.

Fitur yang tersedia:

- Menambahkan customer
- Mengubah data customer
- Melihat daftar customer
- Melihat detail customer
- Menonaktifkan data melalui soft delete
- Memulihkan data dari history

### Supplier Management

Digunakan untuk mengelola supplier bahan baku.

Fitur yang tersedia:

- Menambahkan supplier
- Mengubah data supplier
- Menyimpan alamat dan informasi kontak
- Validasi email supplier
- Mengaktifkan atau menonaktifkan supplier
- Soft delete
- Restore data supplier

### Product Management

Digunakan untuk mengelola produk dan bahan yang digunakan dalam operasional perusahaan.

Setiap produk dapat memiliki informasi seperti:

- Kode produk
- Nama produk
- Jenis
- Satuan
- Stock
- Minimum stock
- Deskripsi
- Status aktif

Kode produk dibuat secara otomatis oleh sistem.

Contoh:

```text
PRD0001
PRD0002
PRD0003
```

### Order Management

Modul Order digunakan untuk mencatat pesanan customer.

Sistem OfficeFlow dirancang untuk mendukung proses produksi berdasarkan pesanan.

Alur sederhananya:

```text
Customer
    |
    v
Order
    |
    v
Production / Preparation
    |
    v
Surat Jalan
    |
    v
Delivery
    |
    v
Invoice
    |
    v
Payment
```

### Purchase Management

Purchase digunakan untuk mencatat pembelian bahan dari supplier.

Modul ini mendukung tahapan proses pembelian seperti:

```text
Purchase Created
       |
       v
     Ordered
       |
       v
    Received
       |
       v
    Completed
```

Purchase juga dapat dibatalkan sesuai kondisi transaksi.

### Driver Management

Digunakan untuk menyimpan informasi driver yang bertugas melakukan pengiriman.

Data driver meliputi:

- Nama
- Nomor telepon
- Nomor SIM
- Alamat
- Status aktif

Driver yang masih digunakan pada proses pengiriman aktif tidak dapat dihapus secara sembarangan.

### Vehicle Management

Digunakan untuk mengelola kendaraan pengiriman.

Informasi kendaraan dapat mencakup:

- Nomor polisi
- Jenis kendaraan
- Merek
- Model
- Warna
- Tahun
- Status kendaraan

Kendaraan yang masih digunakan dalam pengiriman aktif dilindungi dari penghapusan yang dapat mengganggu transaksi.

### Surat Jalan

Modul Surat Jalan digunakan untuk mengelola dokumen pengiriman barang kepada customer.

Surat Jalan terhubung dengan data:

```text
Order
Customer
Driver
Vehicle
User
```

Dengan hubungan tersebut, data pengiriman dapat ditelusuri kembali melalui sistem.

### Invoice

Invoice digunakan untuk mencatat tagihan berdasarkan transaksi perusahaan.

Invoice terhubung dengan pesanan dan dapat digunakan sebagai dasar proses pembayaran.

### Payment

Payment digunakan untuk mencatat pembayaran invoice.

Dengan modul ini, sistem dapat menyimpan riwayat pembayaran dan membantu proses administrasi keuangan.

### Surat Masuk

Digunakan untuk mengarsipkan surat yang diterima perusahaan.

Data yang dapat disimpan antara lain:

- Nomor surat
- Tanggal surat
- Tanggal diterima
- Pengirim
- Perihal
- Jenis surat
- Keterangan
- File surat

File dapat diunggah ke server dan diakses melalui aplikasi sesuai hak akses pengguna.

### Surat Keluar

Digunakan untuk mencatat surat yang diterbitkan perusahaan.

Data yang dikelola antara lain:

- Nomor surat
- Tanggal surat
- Penerima
- Perihal
- Jenis
- Keterangan
- File

### Document Management

Modul Document digunakan untuk menyimpan berbagai dokumen internal perusahaan yang tidak termasuk kategori Surat Masuk atau Surat Keluar.

Dokumen dapat memiliki:

- Nomor dokumen
- Nama
- Kategori
- Tanggal
- Status
- Keterangan
- File

### Announcement

Administrator dapat membuat pengumuman yang akan ditampilkan kepada pengguna OfficeFlow.

Pengumuman dapat digunakan untuk menyampaikan:

- Informasi operasional
- Informasi perusahaan
- Pemberitahuan internal
- Informasi penting lainnya

### User Management

Administrator memiliki akses ke manajemen pengguna.

Fitur yang tersedia:

- Membuat user
- Mengubah user
- Mengubah password
- Mengubah role
- Mengaktifkan user
- Menonaktifkan user
- Soft delete
- Restore user
- Permanent delete dengan validasi relasi

Password tidak disimpan dalam bentuk plaintext.

Password diproses menggunakan bcrypt sebelum disimpan ke database.

### Activity Log

OfficeFlow memiliki Activity Log untuk mencatat aktivitas penting di dalam sistem.

Contoh aktivitas:

```text
CREATE
UPDATE
DELETE
RESTORE
UPLOAD
LOGIN
STATUS CHANGE
```

Informasi log dapat mencakup:

```text
User
Action
Module
Description
Entity
Timestamp
```

Activity Log membantu administrator mengetahui perubahan dan aktivitas yang terjadi di dalam aplikasi.

---

# Technology Stack

## Frontend

| Technology | Kegunaan |
|---|---|
| React | Library utama frontend |
| TypeScript | Static typing |
| Vite | Development server dan build tool |
| Tailwind CSS | Styling antarmuka |
| React Router | Routing halaman |
| Axios | HTTP client |
| Lucide React | Icon library |

## Backend

| Technology | Kegunaan |
|---|---|
| NestJS | Backend framework |
| TypeScript | Bahasa utama backend |
| Node.js | JavaScript runtime |
| Passport | Authentication middleware |
| JWT | Authentication token |
| bcrypt | Password hashing |
| Multer | File upload |
| ClamAV Integration | Pemeriksaan file upload |

## Database

| Technology | Kegunaan |
|---|---|
| PostgreSQL | Relational database |
| Prisma ORM | Database ORM |
| Prisma Migration | Database schema migration |

---

# System Architecture

OfficeFlow menggunakan arsitektur client-server.

```text
+---------------------------+
|           USER            |
+-------------+-------------+
              |
              v
+---------------------------+
|         FRONTEND          |
|                           |
| React                     |
| TypeScript                |
| Tailwind CSS              |
| React Router              |
| Axios                     |
+-------------+-------------+
              |
              |
           REST API
              |
              | JWT
              |
              v
+---------------------------+
|          BACKEND          |
|                           |
| NestJS                    |
| TypeScript                |
| Passport JWT              |
| Role Guard                |
| Validation                |
| Business Logic            |
+-------------+-------------+
              |
              |
            Prisma
              |
              v
+---------------------------+
|         DATABASE          |
|                           |
| PostgreSQL                |
+---------------------------+
```

Frontend dan backend berjalan sebagai aplikasi terpisah.

Frontend berkomunikasi dengan backend menggunakan REST API melalui Axios.

Backend bertanggung jawab terhadap business logic, authentication, authorization, validasi data, dan komunikasi dengan database.

---

# Authentication Flow

OfficeFlow menggunakan JSON Web Token untuk proses authentication.

```text
User
 |
 | Username + Password
 v
Frontend
 |
 | POST /auth/login
 v
Backend
 |
 | Validate Account
 | Verify Password
 v
JWT Generated
 |
 v
Frontend
 |
 | Store Token
 v
Authenticated Request
 |
 | Authorization: Bearer <token>
 v
Protected API
```

Token pada frontend disimpan menggunakan:

```text
sessionStorage
```

Axios interceptor secara otomatis menambahkan token ke request:

```http
Authorization: Bearer <access_token>
```

---

# Role-Based Access Control

OfficeFlow menggunakan Role-Based Access Control atau RBAC.

Role utama:

| Role | Deskripsi |
|---|---|
| ADMIN | Mengelola sistem dan pengguna |
| STAFF | Menjalankan proses operasional |
| FINANCE | Mengakses proses keuangan |
| MANAGER | Melihat dan memantau informasi operasional |

Endpoint backend dilindungi menggunakan:

```typescript
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
```

Hak akses endpoint dapat ditentukan menggunakan:

```typescript
@Roles('ADMIN', 'STAFF')
```

Dengan mekanisme ini, user tidak hanya harus login tetapi juga harus memiliki role yang sesuai.

---

# Data Protection

OfficeFlow menggunakan mekanisme soft delete pada berbagai data penting.

Ketika data dihapus:

```text
Active Data
    |
    v
Soft Delete
    |
    v
History
```

Data tidak langsung dihapus dari database.

Sistem menyimpan informasi seperti:

```text
deletedAt
deletedById
```

Administrator kemudian dapat melakukan:

```text
Restore
```

atau pada modul tertentu:

```text
Permanent Delete
```

Hal ini membantu menjaga riwayat data perusahaan.

---

# File Upload Security

OfficeFlow memiliki mekanisme upload untuk dokumen seperti:

```text
Surat Masuk
Surat Keluar
Dokumen
```

Proses upload secara umum:

```text
File Selected
     |
     v
Multer Validation
     |
     v
File Signature Validation
     |
     v
Malware Scan
     |
     v
Save File
     |
     v
Store File Path
```

File signature diperiksa untuk membantu mencegah file dengan ekstensi palsu.

Integrasi scanner juga dapat digunakan untuk memeriksa file sebelum file digunakan oleh aplikasi.

---

# Project Structure

Struktur utama repository:

```text
office-management/
|
+-- backend/
|   |
|   +-- prisma/
|   |
|   +-- src/
|   |   |
|   |   +-- activity-log/
|   |   +-- announcements/
|   |   +-- auth/
|   |   +-- common/
|   |   +-- customers/
|   |   +-- document/
|   |   +-- drivers/
|   |   +-- incoming-letter/
|   |   +-- invoice/
|   |   +-- order/
|   |   +-- outgoing-letter/
|   |   +-- payment/
|   |   +-- prisma/
|   |   +-- products/
|   |   +-- purchase/
|   |   +-- suppliers/
|   |   +-- surat-jalan/
|   |   +-- users/
|   |   +-- vehicles/
|   |
|   +-- uploads/
|   +-- package.json
|
+-- frontend/
|   |
|   +-- public/
|   |
|   +-- src/
|   |   |
|   |   +-- api/
|   |   +-- components/
|   |   +-- layouts/
|   |   +-- pages/
|   |
|   +-- index.html
|   +-- package.json
|
+-- README.md
```

---

# Installation

## Requirements

Pastikan komputer sudah memiliki software berikut:

```text
Node.js
npm
PostgreSQL
Git
```

Versi Node.js modern direkomendasikan agar kompatibel dengan dependency terbaru.

Periksa instalasi:

```bash
node --version
npm --version
psql --version
git --version
```

---

# Clone Repository

Clone repository OfficeFlow:

```bash
git clone <repository-url>
```

Masuk ke folder project:

```bash
cd office-management
```

Struktur project terdiri dari:

```text
backend
frontend
```

Keduanya harus dijalankan secara terpisah.

---

# Database Setup

Masuk ke PostgreSQL:

```bash
psql -U postgres
```

Buat database:

```sql
CREATE DATABASE office_management;
```

Keluar dari PostgreSQL:

```sql
\q
```

Database OfficeFlow sekarang tersedia:

```text
office_management
```

---

# Backend Installation

Masuk ke backend:

```bash
cd backend
```

Install dependency:

```bash
npm install
```

Buat file:

```text
.env
```

Contoh konfigurasi:

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/office_management"

JWT_SECRET="replace_with_your_secret_key"
```

Ganti:

```text
PASSWORD
```

dengan password PostgreSQL milik Anda.

Jangan menggunakan JWT secret contoh pada environment production.

---

# Prisma Setup

Setelah `.env` selesai dibuat, jalankan Prisma.

Generate Prisma Client:

```bash
npx prisma generate
```

Jalankan migration:

```bash
npx prisma migrate dev
```

Apabila repository sudah memiliki migration yang siap digunakan, migration tersebut akan membangun struktur database sesuai schema project.

Untuk melihat database melalui Prisma Studio:

```bash
npx prisma studio
```

---

# Running Backend

Periksa script yang tersedia:

```bash
npm run
```

Untuk project NestJS biasanya development server dijalankan dengan:

```bash
npm run start:dev
```

Setelah berhasil, backend tersedia pada:

```text
http://localhost:3000
```

Jangan menggunakan:

```bash
npm run dev
```

apabila script `dev` tidak tersedia pada `backend/package.json`.

---

# Frontend Installation

Buka terminal baru.

Masuk ke frontend:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Vite akan menampilkan alamat frontend, umumnya:

```text
http://localhost:5173
```

Buka alamat tersebut melalui browser.

---

# Frontend API Configuration

Konfigurasi Axios berada pada:

```text
frontend/src/api/axios.ts
```

Contoh:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});

export default api;
```

Apabila backend berjalan pada host atau port berbeda, ubah:

```typescript
baseURL: 'http://localhost:3000'
```

---

# Running OfficeFlow

Untuk development, gunakan dua terminal.

Terminal pertama:

```bash
cd backend
npm run start:dev
```

Terminal kedua:

```bash
cd frontend
npm run dev
```

Arsitektur runtime:

```text
Browser
   |
   v
Frontend
localhost:5173
   |
   v
Backend API
localhost:3000
   |
   v
PostgreSQL
office_management
```

---

# API Overview

Beberapa endpoint utama OfficeFlow:

```text
/auth
/users

/customers
/suppliers
/products

/orders
/purchases

/drivers
/vehicles

/surat-jalan

/invoices
/payments

/incoming-letters
/outgoing-letters
/documents

/announcements
/activity-logs
```

Sebagian besar endpoint dilindungi menggunakan JWT authentication.

---

# Authentication API

Login:

```http
POST /auth/login
```

Request:

```json
{
  "username": "your_username",
  "password": "your_password"
}
```

Backend akan mengembalikan access token dan informasi user apabila authentication berhasil.

Informasi user yang sedang login:

```http
GET /auth/me
```

Header:

```http
Authorization: Bearer <access_token>
```

---

# History System

Beberapa module menyediakan endpoint history.

Contoh:

```http
GET /customers/history
GET /suppliers/history
GET /products/history
GET /drivers/history
GET /vehicles/history
```

Restore data umumnya menggunakan:

```http
PATCH /resource/:id/restore
```

Contoh:

```http
PATCH /drivers/5/restore
```

Pada resource tertentu administrator juga dapat melakukan permanent delete.

```http
DELETE /resource/:id/permanent
```

Permanent delete harus digunakan dengan hati-hati karena data dapat benar-benar dihapus dari database.

---

# Activity Log API

Melihat aktivitas terbaru:

```http
GET /activity-logs/latest
```

Dengan limit:

```http
GET /activity-logs/latest?limit=10
```

Melihat seluruh activity log:

```http
GET /activity-logs
```

Akses seluruh log dapat dibatasi hanya untuk administrator.

---

# Announcement API

Melihat pengumuman aktif:

```http
GET /announcements/active
```

Administrator dapat mengelola pengumuman melalui endpoint:

```text
GET    /announcements
POST   /announcements
GET    /announcements/:id
PATCH  /announcements/:id
DELETE /announcements/:id
```

---

# Development Workflow

Workflow pengembangan yang direkomendasikan:

```text
Create Branch
     |
     v
Develop Feature
     |
     v
Test Frontend
     |
     v
Test Backend
     |
     v
Check Database
     |
     v
Commit Changes
     |
     v
Push Branch
     |
     v
Pull Request
```

Contoh membuat branch:

```bash
git checkout -b feature/new-feature
```

Setelah perubahan selesai:

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

---

# Commit Convention

Agar riwayat repository lebih mudah dibaca, gunakan commit message yang konsisten.

Contoh:

```text
feat: add announcement management
fix: resolve invoice calculation issue
refactor: simplify customer service
docs: update installation guide
style: improve dashboard layout
chore: update dependencies
```

Format sederhana:

```text
type: description
```

Beberapa type yang dapat digunakan:

| Type | Kegunaan |
|---|---|
| feat | Menambahkan fitur |
| fix | Memperbaiki bug |
| docs | Dokumentasi |
| style | Perubahan tampilan atau formatting |
| refactor | Refactoring kode |
| test | Penambahan atau perubahan test |
| chore | Maintenance project |

---

# Production Build

## Frontend

Masuk ke frontend:

```bash
cd frontend
```

Build:

```bash
npm run build
```

Hasil build biasanya berada pada:

```text
frontend/dist
```

## Backend

Masuk ke backend:

```bash
cd backend
```

Build:

```bash
npm run build
```

Jalankan production build sesuai script yang tersedia pada `package.json`.

---

# Security Notes

Beberapa aturan penting sebelum OfficeFlow digunakan pada environment production:

1. Jangan commit file `.env` ke repository.
2. Gunakan JWT secret yang kuat dan berbeda untuk production.
3. Jangan menyimpan password dalam plaintext.
4. Batasi CORS hanya untuk frontend yang diizinkan.
5. Gunakan HTTPS pada production.
6. Validasi semua data dari client.
7. Batasi ukuran file upload.
8. Periksa tipe dan signature file.
9. Jangan memberikan hak ADMIN kepada user yang tidak membutuhkan.
10. Lakukan backup PostgreSQL secara berkala.
11. Gunakan environment variable untuk konfigurasi sensitif.
12. Perbarui dependency secara berkala setelah melakukan compatibility testing.

---

# Environment Files

File berikut sebaiknya tidak dimasukkan ke Git:

```text
.env
node_modules/
dist/
uploads/
```

Contoh `.gitignore`:

```gitignore
node_modules/
dist/
.env
.env.*
uploads/
*.log
```

Apabila developer lain membutuhkan contoh environment variable, gunakan:

```text
.env.example
```

Contoh:

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/office_management"
JWT_SECRET="CHANGE_ME"
```

File `.env.example` boleh dimasukkan ke repository selama tidak mengandung credential asli.

---

# Troubleshooting

## npm run dev tidak tersedia di backend

Jika muncul:

```text
npm error Missing script: "dev"
```

Periksa script:

```bash
npm run
```

Untuk NestJS development server gunakan script yang tersedia pada project, misalnya:

```bash
npm run start:dev
```

---

## PostgreSQL tidak dikenali

Jika:

```text
psql is not recognized
```

pastikan folder PostgreSQL `bin` sudah masuk ke PATH Windows.

Contoh:

```text
C:\Program Files\PostgreSQL\<version>\bin
```

Setelah mengubah PATH, tutup dan buka kembali PowerShell.

---

## Prisma Client Error

Generate ulang Prisma Client:

```bash
npx prisma generate
```

Kemudian restart backend:

```bash
npm run start:dev
```

---

## Database belum memiliki tabel

Jalankan migration:

```bash
npx prisma migrate dev
```

Kemudian:

```bash
npx prisma generate
```

---

## Frontend tidak dapat mengakses backend

Pastikan backend berjalan:

```text
http://localhost:3000
```

Periksa konfigurasi:

```text
frontend/src/api/axios.ts
```

Pastikan `baseURL` mengarah ke backend yang benar.

Periksa juga konfigurasi CORS pada backend.

---

## Request menghasilkan 401 Unauthorized

Pastikan user sudah login dan token tersimpan di:

```text
sessionStorage
```

Request ke protected endpoint harus memiliki:

```http
Authorization: Bearer <token>
```

---

## Request menghasilkan 403 Forbidden

Status `403` biasanya berarti user berhasil login tetapi role user tidak memiliki izin untuk endpoint tersebut.

Periksa konfigurasi:

```typescript
@Roles(...)
```

pada controller backend.

---

# Future Development

OfficeFlow masih dapat dikembangkan lebih lanjut dengan fitur seperti:

```text
Reporting Dashboard
Advanced Search
Export Excel
Export PDF
Email Notification
Automatic Invoice Generation
Stock Movement History
Purchase Report
Sales Report
Financial Report
Document Approval
Notification Center
Database Backup Management
Automated Testing
Docker Deployment
CI/CD Pipeline
```

---

# Development Principles

OfficeFlow dikembangkan dengan beberapa prinsip utama:

```text
Separation of Concerns
Modular Architecture
Role-Based Authorization
Data Validation
Secure Authentication
Soft Delete
Auditability
Maintainable Code
Consistent API Structure
```

Setiap module backend dipisahkan berdasarkan domain sehingga pengembangan fitur baru dapat dilakukan tanpa mengubah keseluruhan aplikasi.

---

# Application Flow

Secara umum, alur utama OfficeFlow adalah:

```text
                       OFFICEFLOW
                           |
          +----------------+----------------+
          |                                 |
          v                                 v
     MASTER DATA                      ADMINISTRATION
          |                                 |
    +-----+------+                  +-------+-------+
    |     |      |                  |       |       |
Customer Product Supplier       Incoming Outgoing Document
    |            |               Letter   Letter
    |            |
    v            v
  Order       Purchase
    |            |
    |            v
    |        Raw Material
    |
    v
Production / Preparation
    |
    v
Surat Jalan
    |
    +------> Driver
    |
    +------> Vehicle
    |
    v
Delivery
    |
    v
Invoice
    |
    v
Payment
```

---

# Repository Guidelines

Sebelum melakukan commit:

```bash
git status
```

Pastikan file berikut tidak ikut ter-commit:

```text
.env
node_modules
temporary files
database credentials
secret keys
production credentials
```

Kemudian lakukan commit:

```bash
git add .
git commit -m "feat: complete OfficeFlow management system"
git push
```

Jika menggunakan GitHub Desktop, periksa seluruh file pada tab **Changes**, isi Summary dan Description, kemudian lakukan commit dan push ke repository.

---

# Documentation

Dokumentasi OfficeFlow dibagi menjadi beberapa bagian utama:

```text
README.md
    |
    +-- Project Overview
    +-- Features
    +-- Architecture
    +-- Technology Stack
    +-- Installation
    +-- Database Setup
    +-- Authentication
    +-- Authorization
    +-- API Overview
    +-- Security
    +-- Development Workflow
    +-- Troubleshooting
```

README ini ditujukan sebagai titik awal bagi developer baru untuk memahami struktur dan menjalankan OfficeFlow.

Dokumentasi API yang lebih lengkap dapat ditambahkan menggunakan Swagger/OpenAPI pada pengembangan selanjutnya.

---

# Contributing

Untuk melakukan kontribusi:

```bash
git clone <repository-url>
cd office-management
git checkout -b feature/your-feature
```

Lakukan perubahan kemudian:

```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

Setelah itu buat Pull Request melalui GitHub.

Pastikan perubahan tidak menyertakan credential, `.env`, atau file sensitif lainnya.

---

# License

Project ini dikembangkan sebagai aplikasi Office Management internal.

Penggunaan, distribusi, dan modifikasi mengikuti kebijakan pemilik repository.

---

<p align="center">
  <strong>OfficeFlow</strong>
</p>

<p align="center">
  Integrated Office Management System
</p>

<p align="center">
  Built with React, NestJS, Prisma and PostgreSQL
</p>
