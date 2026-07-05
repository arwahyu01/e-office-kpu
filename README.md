# E-Office KPU Siak

Sistem Informasi E-Office berbasis **Google Apps Script (GAS)** untuk lingkungan **KPU Kabupaten Siak**. Menggunakan Spreadsheet sebagai database dengan antarmuka web app.

## Fitur

| Modul | Deskripsi |
|-------|-----------|
| **E-Office** | Dashboard utama & manajemen Laporan Kinerja Harian (LKH) |
| **Agenda & Tindak Lanjut** | Manajemen agenda, workflow, progress, dan penugasan |
| **Presensi** | Pencatatan kehadiran pegawai |
| **Absensi** | Rekapitulasi dan monitoring kehadiran |

## Struktur Proyek

| File | Fungsi |
|------|--------|
| `Code.gs` | Routing, helper, sesi, CRUD LKH & pegawai |
| `backend_agenda.gs` | Backend modul Agenda (CRUD, assignment, LKH auto-save) |
| `backend_presensi.gs` | Backend modul Presensi |
| `backend_absensi.gs` | Backend modul Absensi |
| `LHK.gs` | Logika LKH (legacy) |
| `agenda.html` | Frontend modul Agenda & Tindak Lanjut |
| `presensi.html` | Frontend modul Presensi |
| `absensi.html` | Frontend modul Absensi |
| `index.html` | Halaman utama / dashboard umum |
| `style.html` | Design system CSS (variabel, komponen global) |
| `style_agenda.html` | CSS spesifik modul Agenda |
| `style_presensi.html` | CSS spesifik modul Presensi |
| `email_template.gs` | Template notifikasi email |
| `notification.gs` | Engine notifikasi |
| `scheduler.gs` | Trigger time-based |
| `appscript.json` | Konfigurasi GAS project |

## Teknologi

- **Runtime**: Google Apps Script (V8)
- **Database**: Google Spreadsheet
- **Frontend**: HTML + CSS + JavaScript (GAS HTML Service)
- **Library**: SweetAlert2, Font Awesome 6, Tailwind CSS (CDN)
- **OAuth**: Spreadsheets, Drive, Docs, Gmail, Script External Request

## Deployment

Project ini dijalankan sebagai **Google Apps Script Web App**.

```bash
# Clone
git clone https://github.com/arwahyu01/e-office-kpu.git

# Edit & deploy via clasp atau dashboard GAS
```

## Lisensi

Hak cipta KPU Kabupaten Siak.
