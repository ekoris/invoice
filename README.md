# Lingkara Invoice - Sistem CRUD Faktur & Penagihan

Aplikasi manajemen invoice (faktur penagihan) lengkap berbasis **Next.js (App Router)**, **Tailwind CSS**, dan **Prisma ORM (SQLite)** yang dirancang dengan layout visual sesuai template Lingkara Labs.

---

## ✨ Fitur Utama

1. **CRUD Invoice Lengkap**:
   - **Create**: Formulir pembuatan invoice dengan penomoran otomatis (`INV/00001`, `INV/00002`, dst.), pilihan klien tersimpan, penambahan baris produk dinamis, perhitungan otomatis (Subtotal, Diskon, Pajak, Total), dan live preview dokumen.
   - **Read / Detail**: Tampilan faktur resmi dengan desain identik seperti pada screenshot (Logo Lingkara Labs, Header Navy `#242b47`, rincian produk, nomor rekening bank, dan tanda tangan digital).
   - **Update / Edit**: Edit seluruh data faktur yang sudah diterbitkan sewaktu-waktu.
   - **Delete**: Hapus faktur dengan dialog konfirmasi aman.
   - **Cepat Ubah Status**: Ganti status langsung dari daftar maupun halaman detail (*Draft*, *Terkirim*, *Lunas*, *Jatuh Tempo*, *Batal*).

2. **Cetak & Ekspor ke PDF**:
   - Terintegrasi tombol **Cetak / PDF** (`window.print()`).
   - CSS Print khusus (`@media print`): otomatis menyembunyikan tombol navigasi, navbar, dan ikon edit saat dicetak atau disimpan sebagai PDF kertas A4.

3. **Manajemen Klien / Pelanggan Reusable (`/clients`)**:
   - Simpan data perusahaan klien (Nama, Alamat, No. Telp, Email).
   - Saat membuat invoice baru, cukup pilih klien dari dropdown dan seluruh field alamat langsung terisi otomatis.

4. **Pengaturan Bisnis & Rekening Bank (`/settings`)**:
   - Atur profil default perusahaan pengirim (*Lingkara Labs*).
   - Unggah atau ganti logo perusahaan dan tanda tangan digital.
   - Kelola daftar nomor rekening bank (BCA, Mandiri, BNI, dll.) yang dapat dimasukkan ke instruksi pembayaran invoice hanya dengan 1 klik.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite (file `dev.db`)
- **ORM**: Prisma ORM 7 (`@prisma/client` + `@prisma/adapter-better-sqlite3`)
- **Icons**: Lucide React
- **Asset Processing**: Sharp

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Menjalankan Mode Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 2. Membangun & Menjalankan Mode Produksi
```bash
npm run build
npm run start
```

### 3. Reset atau Re-seed Database Awal
Jika ingin mengembalikan database ke data contoh default:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

---

## 📂 Struktur Proyek

```text
├── prisma/
│   ├── schema.prisma      # Definisi model database (Invoice, InvoiceItem, Client, CompanyProfile, BankAccount)
│   └── seed.ts            # Script pengisian data awal (INV/00001, PPA-VHS, Rekening BCA)
├── public/
│   ├── assets/            # Logo Lingkara Labs dan Tanda Tangan digital awal
│   └── uploads/           # Direktori upload file logo / tanda tangan baru
└── src/
    ├── app/
    │   ├── api/upload/    # Endpoint upload berkas logo dan tanda tangan
    │   ├── clients/       # Halaman manajemen pelanggan (CRUD Pelanggan)
    │   ├── invoices/
    │   │   ├── [id]/      # Halaman detail & cetak invoice
    │   │   │   └── edit/  # Halaman edit invoice
    │   │   └── new/       # Halaman buat invoice baru
    │   ├── settings/      # Halaman pengaturan perusahaan & rekening bank
    │   ├── layout.tsx     # Layout utama + Navbar navigasi
    │   └── page.tsx       # Dashboard daftar invoice + metrics ringkasan
    ├── components/
    │   ├── InvoiceForm.tsx    # Komponen formulir interaktif invoice + live preview
    │   ├── InvoiceList.tsx    # Komponen tabel daftar invoice + filter status & pencarian
    │   ├── InvoiceView.tsx    # Komponen visualisasi faktur sesuai template screenshot
    │   ├── Navbar.tsx         # Navigasi utama
    │   └── StatusBadge.tsx    # Komponen badge status invoice
    └── lib/
        ├── actions.ts     # Next.js Server Actions untuk CRUD & database queries
        ├── formatters.ts  # Utility formatting Rupiah (Rp 4.800.000,00) & tanggal Indo
        ├── prisma.ts      # Koneksi database Prisma Client singleton
        └── types.ts       # Definisi TypeScript interface
```
