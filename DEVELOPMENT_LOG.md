# DEVELOPMENT LOG — E-OFFICE KPU SIAK

## Roadmap

| Fase | Target | Status |
|------|--------|--------|
| 1 | Analisis project existing & reusable component | ✅ Selesai |
| 2 | Desain database (dengan MASTER_ASSIGNMENT) | ✅ Selesai |
| 3 | Desain UI (Wizard 3 langkah + Dashboard + Detail) | ✅ Selesai |
| 4 | Backend core + CRUD + Assignment | ✅ Selesai |
| 5 | Frontend (agenda.html, style_agenda.html) | ✅ Selesai |
| 6 | Integrasi LKH | ✅ Selesai |
| 7 | Rebranding E-LKH → E-OFFICE + Sidebar Grup | ✅ Selesai |
| 8 | Notulen Rapat (Fase 1: Backend + Form Dasar) | ✅ Selesai |
| 9 | Notulen Rapat (Fase 2: 4-Step Wizard + DB Standalone) | ✅ Selesai |
| 10 | Testing & validasi | ⏳ Pending |

---

## TODO

- [x] Analisis Struktur Project
- [x] Analisis Reusable Component (style, helper, session, modal, card)
- [x] Analisis Database MASTER_PEGAWAI
- [x] Desain Database — 6 sheet: MASTER_AGENDA, WORKFLOW, PROGRESS, EVIDENCE, ASSIGNMENT, ACTIVITY_LOG
- [x] Desain Wizard — Step 1 Informasi, Step 2 Penugasan (dinamis), Step 3 Perencanaan
- [x] Coding Backend — CRUD semua entitas + assignment engine + LKH integration
- [x] Coding CSS — Wizard, Timeline, Assignment chips, Progress bars
- [x] Coding HTML — Wizard multi-step, Dashboard, Detail, Workflow management
- [x] Routing di Code.gs
- [x] Sidebar di index.html
- [x] Simplifikasi form progress (hapus persentase, target, nama, realiasi→hasil)
- [x] Rebranding E-LKH → E-OFFICE (semua HTML + CSS)
- [x] Restruktur sidebar: group e-LKH, Absensi collapsible; Beranda + Notulen prioritas
- [x] Beranda landing page: greeting + 5 quick action cards
- [x] Backend notulen.gs: simpan, list, detail, upload undangan, hapus
- [x] Notulen 4-step wizard: Info → Jalannya Rapat → Poin & TL → Review
- [x] Auto-save draft ke localStorage + resume
- [x] Database Notulen terpisah: NOTULEN + JALANNYA_RAPAT + POIN_RAPAT
- [ ] Testing CRUD end-to-end
- [ ] UAT

---

## Change Log

### v2.4.0 — 2 Jul 2026 (Notulen 4-Step Wizard + DB Standalone)
- **[New] DB Notulen Terpisah**: Spreadsheet `1hC8lzsHoukbQIfv-JNmZzx3u5pBoU7uY7bmktgU2_uA` dengan 3 sheet:
  - `NOTULEN` — ID, TANGGAL, JENIS, JUDUL, PIMPINAN, NOTULIS, JALANNYA_COUNT, POIN_COUNT, CREATED_AT, DRIVE_URL, UNDANGAN_LINK, STATUS
  - `JALANNYA_RAPAT` — ID, NOTULEN_ID, PEMBICARA, POKOK_BAHASAN, URUTAN
  - `POIN_RAPAT` — ID, NOTULEN_ID, ISI, TINDAK_LANJUT, ASSIGN_SUBBAG, AGENDA_ID, URUTAN
- **[New] 4-Step Wizard**: Info Rapat → Jalannya Rapat → Poin & TL → Review
  - Step 1: Tanggal, jenis, judul, pimpinan, notulis, link undangan
  - Step 2: Kronologis pembicara + pokok bahasan (dinamis, tambah/hapus)
  - Step 3: Poin rapat + tindak lanjut (BUAT_AGENDA / UPDATE_PROGRES / CATATAN_SAJA / TANPA_TL)
  - Step 4: Preview review + tombol "Simpan ke Database"
- **[New] Auto-Save Draft**: Semua input tersimpan ke localStorage key `notulen_draft`; bisa dilanjutkan meskipun halaman di-refresh
- **[New] Draft Banner**: List view menampilkan draft aktif dengan tombol Lanjutkan / Hapus
- **[New] Detail Modal**: Menampilkan info rapat + jalannya rapat (kronologis) + poin rapat
- **[New] Backend `notulen.gs`**: 7 endpoint — `getListNotulen`, `getDetailNotulen`, `simpanNotulen`, `uploadUndanganNotulen`, `hapusNotulen`, `updateProgressFromNotulen`, `getListAgendaForNotulen`
- **[Hapus] Export PDF**: Dihapus total dari frontend & backend (user akan buat auto-generate PDF nanti)
- **[Move] Sheet**: Notulen dipindah dari spreadsheet E-LKH (`1JivPdetUS5...`) ke spreadsheet terpisah agar mudah dikelola

### v2.3.0 — 1 Jul 2026 (Rebrand & Sidebar Restruktur)
- **[Ubah] Rebranding**: E-LKH → E-OFFICE di semua file (index.html, agenda.html, presensi.html, absensi.html, verify.html, style.html)
- **[Ubah] Sidebar**: Beranda + Notulen di atas sendiri; e-LKH & Absensi jadi collapsible group (nav-group/nav-sub); Profil, Agenda, Logout tetap single item
- **[New] Beranda**: Landing page dengan greeting user + 5 quick action cards (LKH, Notulen, Agenda, Laporan, Profil)
- **[New] Section Notulen**: Menu + form notulen dengan poin dinamis + tindak lanjut (BUAT_AGENDA, UPDATE_PROGRES, CATATAN_SAJA, TANPA_TL)
- **[New] Backend notulen.gs**: Simpan ke sheet NOTULEN + backup .txt ke Drive + generate Agenda dari poin BUAT_AGENDA
- **[Fix] Mobile sidebar toggle**: Tombol hamburger fixed dengan gradient merah

### v2.2.0 — 1 Jul 2026 (Menu Structure Analysis)
- **[Analisis]**: Mempelajari struktur index.html SPA yang menggunakan sistem section + switchMenu()
- **[Analisis]**: Sidebar existing: Dashboard, e-LKH, Presensi, Absensi, Agenda, Profil, Logout
- **[Keputusan]**: Notulen ditempatkan di sidebar utama karena paling sering dipakai
- **[Keputusan]**: e-LKH dikelompokkan (Dashboard, Laporan, Verifikasi, Monitoring) di bawah group "e-LKH"
- **[Keputusan]**: Absensi dikelompokkan (Presensi, Absensi) di bawah group "Absensi"
- **[Keputusan]**: Hybrid model notulen → agenda: notulis input poin, sistem generate agenda otomatis untuk BUAT_AGENDA
- **[Keputusan]**: Evidence fleksibel: upload file ATAU link

### v2.1.1 — 30 Jun 2026 (Simplifikasi Form Progress)
- **[Hapus] Persentase (%)**: Dihitung otomatis dari Status (Belum Mulai=0%, Sedang Dikerjakan=50%, Selesai=100%)
- **[Hapus] Target**: Informasi sudah ada di Workflow, tidak perlu diulang di Progress
- **[Hapus] Nama Progress**: Digantikan display Workflow name — progress adalah aktivitas dalam workflow, tidak perlu nama terpisah
- **[Hapus] Evidence dari form**: Evidence diakses via tombol 📎 pada baris progress setelah disimpan
- **[Ubah] Realisasi → Hasil Pekerjaan**: Label lebih mudah dipahami ASN
- **[Auto] PIC**: Default ke user login, dropdown tetap tersedia jika ingin mengubah
- **[Status] Simplifikasi**: Hanya 3 opsi — Belum Mulai, Sedang Dikerjakan, Selesai (backward compatible: kode RENCANA/BERJALAN/SELESAI tidak berubah)
- **[Validasi]**: Hasil Pekerjaan WAJIB jika status = Selesai; opsional jika belum selesai
- **[UX] Form progress selesai dalam 30 detik**: User cukup isi Status + Hasil Pekerjaan (opsional jika belum selesai) + Catatan (opsional)
- **[UI] Display Workflow**: Banner workflow name di modal progress, tanpa input manual

### v2.1.0 — 29 Jun 2026 (Integrasi LKH)
- **Arsitektur**: LKH tetap modul utama, Agenda sebagai sumber data otomatis — dua sumber aktivitas: Agenda (otomatis) + Manual (input pengguna)
- **Kolom baru**: `SUMBER_DATA` (AGENDA/MANUAL) pada sheet AGENDA di spreadsheet E-LKH untuk membedakan asal aktivitas
- **`autoSaveLKH()`**: Ditulis ulang dengan mekanisme:
  - **Insert**: Progress SELESAI + realiasi → append row ke sheet AGENDA + simpan `LKH_REFERENCE_ID` ke MASTER_PROGRESS
  - **Update**: Progress yang sudah tersinkron berubah → update baris LKH yang sama (HASIL, KETERANGAN, TANGGAL)
  - **Dedup**: Menggunakan `LKH_REFERENCE_ID` di MASTER_PROGRESS (kolom 13) — bukan parsing string
- **Mapping sesuai spek**: KEGIATAN=NamaProgress, HASIL=Realisasi, KETERANGAN=NamaAgenda + NamaWorkflow, TANGGAL=tanggal selesai
- **`tambahAgenda()` di Code.gs**: Ditambahkan `SUMBER_DATA="MANUAL"` untuk aktivitas input manual LKH
- **MASTER_PROGRESS**: Ditambahkan kolom `LKH_REFERENCE_ID` untuk referensi dua arah

### v2.0.1 — 29 Jun 2026 (Bug Fixes)
- **Fix**: Renamed `updateAgenda` → `agendaUpdateAgenda` in `backend_agenda.gs` to avoid function name conflict with existing `updateAgenda` in `Code.gs` (GAS merges all .gs files into one namespace — duplicate function names cause one to silently overwrite the other)
- **Fix**: Added `window._currentWorkflows = r.workflows` in `renderDetail()` — `openEditWorkflow` and `openEditProgress` were querying `window._currentWorkflows` which was never populated, causing edit modals to fail
- **Fix**: Added `evt` parameter to `selectAssignment(type, evt)` with fallback — implicit `event` object reliance caused errors when calling programmatically (e.g. from `openWizard()`/`openEditAgenda()`)
- **Fix**: Updated `onclick` handlers in assignment options to pass `event` explicitly
- **Fix**: Label "PIC" di detail info grid diganti "Pembuat" — karena nilai yang ditampilkan adalah `createdByNama`, bukan PIC sesungguhnya
- **Fix**: `index.html` — ditambahkan semantic landmarks `<main>`, `<aside>`, perbaikan tag HTML

### v2.0 — 29 Jun 2026 (Redesign)
- **Database**: Tambah MASTER_ASSIGNMENT, hapus ANGGOTA_EMAIL dari MASTER_AGENDA
- **Wizard**: Implementasi 3-step wizard (Informasi → Penugasan → Perencanaan)
- **Penugasan Dinamis**: 4 opsi (Saya Sendiri, Pegawai Tertentu, Seluruh Subbag, Seluruh KPU)
- **Workflow**: Drag-free reordering via tombol naik/turun, status otomatis
- **Progress**: Dinamis per workflow, target & realisasi, evidence opsional
- **Dashboard**: 4 stat card + progress chart + filter
- **Detail**: Info agenda + timeline workflow + progress + evidence + assignment + activity log
- **Integrasi LKH**: Backend endpoint getProgressSelesaiForLKH() + frontend selector untuk jadikan LKH

### v1.0 — 29 Jun 2026
- Initial module structure

### v2.1.2 — 30 Jun 2026 (Infra & Dokumentasi)
- **Git**: Inisialisasi repo, push ke `github.com/arwahyu01/e-office-kpu.git`
- **README.md**: Dokumentasi proyek (fitur, struktur, teknologi, deployment)
- **`.gitignore`**: File ignores untuk OS dan log

### Planned
- v2.5 — Auto-generate PDF Notulen
- v2.5 — Notifikasi email assignment
- v2.6 — Template Coktas/Pelno/Rakor/Bimtek/Sosialisasi/Pleno
- v3.0 — Approval workflow
- v3.1 — Komentar

---

## Notulen Data Model

### Spreadsheet: `1hC8lzsHoukbQIfv-JNmZzx3u5pBoU7uY7bmktgU2_uA`

**NOTULEN**
| ID | TANGGAL | JENIS | JUDUL | PIMPINAN | NOTULIS | JALANNYA_COUNT | POIN_COUNT | CREATED_AT | DRIVE_URL | UNDANGAN_LINK | STATUS |

**JALANNYA_RAPAT**
| ID | NOTULEN_ID | PEMBICARA | POKOK_BAHASAN | URUTAN |

**POIN_RAPAT**
| ID | NOTULEN_ID | ISI | TINDAK_LANJUT | ASSIGN_SUBBAG | AGENDA_ID | URUTAN |

### Tindak Lanjut Options
- `TANPA_TL` — tanpa tindak lanjut
- `BUAT_AGENDA` — generate agenda baru otomatis via `createAgenda()` di `backend_agenda.gs`
- `UPDATE_PROGRES` — update catatan progres agenda existing
- `CATATAN_SAJA` — hanya catatan, tanpa aksi sistem

### Automatisasi
- Poin dengan `BUAT_AGENDA` → `createAgenda()` di spreadsheet `1-xohP9CXPUIOL8Ar8L_L3xTOfs_S6fMkUj098nmyE10`
- Poin dengan `UPDATE_PROGRES` → append catatan ke `MASTER_PROGRESS`
- Backup .txt ke Drive: `E-OFFICE/NOTULEN/{TAHUN}/{BULAN}/`

---

## Key Architecture Decisions
- **Notulen DB terpisah** dari spreadsheet E-LKH dan Agenda → easier management, independent scaling
- **Hybrid notulen → agenda**: notulis input poin + pilih tindak lanjut → sistem generate/update otomatis
- **4-step wizard** dengan auto-save localStorage: user bisa mulai, simpan draft, lanjut kapan saja
- **Jalannya Rapat sebagai array bebas**: tidak ada struktur fixed — notulis bebas input kronologis
- **Tidak ada upload/export PDF**: akan diganti auto-generate PDF di fase berikutnya
- **Folder Drive**: `E-OFFICE/NOTULEN/{TAHUN}/{BULAN}/` untuk backup .txt notulen

---

## Known Issues
- `AGENDA_MASTER_SHEET_ID` variable name in `backend_agenda.gs` is misleading (points to E-LKH spreadsheet, not an agenda master sheet) — cosmetic only
- Hardcoded deployment URL in `agenda.html` sidebar E-LKH link — must be updated on redeploy
- `notulen_draft` localStorage key tidak dibedakan per user — jika multi-user di device sama, draft bisa tertimpa

---

## Critical Context for Next Session
- **Notulen spreadsheet**: `1hC8lzsHoukbQIfv-JNmZzx3u5pBoU7uY7bmktgU2_uA`
- **Agenda tindak lanjut spreadsheet**: `1-xohP9CXPUIOL8Ar8L_L3xTOfs_S6fMkUj098nmyE10`
- **Master pegawai spreadsheet**: `1JivPdetUS5lu5ZjJveqwhpKhwU5r0QiRb4GtJGXxDtA`
- **URL base external**: `https://script.google.com/macros/s/AKfycbxejATwEFa6KmgBqjxFGiA2L_mEJGG0-CaHGsaIyxedRz5_vGA-QiAIhSE-mYwXFY_E/exec`
- **All notulen JS functions** are in `index.html` (lines ~1452-1950 area)
- **All notulen backend** is in `notulen.gs` (standalone, self-contained)
- **CSS for step wizard & notulen badges** is in `style.html`
- **Menu navigation** uses `switchMenu()` SPA pattern in `index.html`
