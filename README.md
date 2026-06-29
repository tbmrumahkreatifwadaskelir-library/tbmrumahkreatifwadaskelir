# 🚀 My Next.js Project

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

> Bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) menggunakan **Next.js App Router**, **TypeScript**, dan **Tailwind CSS**.

---

## 📦 Tech Stack

| Teknologi | Versi | Keterangan |
|---|---|---|
| [Next.js](https://nextjs.org) | 15 | React framework dengan App Router |
| [TypeScript](https://www.typescriptlang.org) | 5 | Type-safe JavaScript |
| [Tailwind CSS](https://tailwindcss.com) | v4 | Utility-first CSS framework |
| [Geist Font](https://vercel.com/font) | - | Font resmi dari Vercel |

---

## 🛠️ Getting Started

### 1. Clone & Install Dependencies

Pastikan **Node.js ≥ 18** sudah terinstall, lalu jalankan:

```bash
npm install
# atau
yarn install
# atau
pnpm install
# atau
bun install
```

### 2. Jalankan Development Server

```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
# atau
bun dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat hasilnya. ✅

### 3. Edit Halaman Utama

Mulai edit project dengan membuka file berikut:

```
📁 app/
└── page.tsx   ← edit di sini
```

Halaman akan **otomatis refresh** setiap kali kamu menyimpan perubahan (Hot Reload).

> 💡 Project ini menggunakan [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) untuk mengoptimalkan dan memuat font [Geist](https://vercel.com/font) secara otomatis.

### 4. Build untuk Production

Setelah selesai development, buat production build yang dioptimasi:

```bash
npm run build
```

Lalu jalankan server production:

```bash
npm run start
```

---

## 📁 Struktur Project

```
.
├── app/
│   ├── layout.tsx      # Root layout (font, metadata global)
│   ├── page.tsx        # Halaman utama (/)
│   └── globals.css     # Global styles + Tailwind directives
├── public/             # Static assets (gambar, ikon, dll)
├── components/         # Reusable UI components (opsional)
├── next.config.ts      # Konfigurasi Next.js
├── tailwind.config.ts  # Konfigurasi Tailwind CSS
└── tsconfig.json       # Konfigurasi TypeScript
```

---

## 📚 Pelajari Lebih Lanjut

- 📄 [Next.js Documentation](https://nextjs.org/docs) — Fitur lengkap dan referensi API Next.js
- 🎓 [Learn Next.js](https://nextjs.org/learn) — Tutorial interaktif untuk pemula
- 🐙 [Next.js GitHub Repository](https://github.com/vercel/next.js) — Kontribusi dan feedback welcome!
- 🔷 [TypeScript Documentation](https://www.typescriptlang.org/docs/) — Panduan penggunaan TypeScript
- 🎨 [Tailwind CSS Documentation](https://tailwindcss.com/docs) — Utility classes dan konfigurasi

---

## ☁️ Deploy ke Vercel

Cara termudah untuk deploy aplikasi Next.js adalah menggunakan **[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)** — platform resmi dari pembuat Next.js.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new?utm_medium=default-template&filter=next.js)

Fitur Vercel:
- ✅ Zero-config deployment
- ✅ HTTPS otomatis
- ✅ Global edge network
- ✅ Preview deployments untuk setiap PR

Lihat [dokumentasi deployment Next.js](https://nextjs.org/docs/app/building-your-application/deploying) untuk detail lebih lanjut.