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
| 10 | Notulen Rapat (Fase 3: Edit + File Upload + Folder per Tanggal) | ✅ Selesai |
| 11 | Agenda: enrich jenis + smart dasar agenda + auto LKH cerdas | ✅ Selesai |
| 12 | AI Notula + PDF Export | ✅ Selesai |
| 13 | Peserta Rapat (dropdown MASTER_PEGAWAI + chips) | ✅ Selesai |
| 14 | Refactor AI Notula: arsitektur sederhana + dynamic atasan | ✅ Selesai |
| 15 | AI Notula: template filler engine + kualitas narasi profesional | ✅ Selesai |
| 16 | Upload Notulen TTD (Signed PDF) | ✅ Selesai |
| 17 | Testing & validasi | ⏳ Pending |

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
- [x] Update notulen folder structure: `E-OFFICE/NOTULEN/{tahun}/{bulan}/{tanggal}/`
- [x] Backend updateNotulen: edit notulen + re-generate file Drive + TL actions
- [x] Backend uploadUndanganFile: upload file asli ke folder tanggal
- [x] Frontend Edit Notulen: tombol edit di detail modal, pre-fill form wizard
- [x] Frontend Upload File Undangan: ganti input link jadi file upload + fallback link
- [x] Simplify wizard: hapus field SUMBER, gabung ke DASAR_AGENDA
- [x] Enrich JENIS kegiatan: 6 kategori dengan 20+ opsi (Tahapan Pemilu, Rapat, Pembinaan, Administrasi, Layanan, Lainnya)
- [x] Enrich DASAR_AGENDA: 8 opsi dengan conditional fields (pilih notulen existing / link dokumen)
- [x] Smart autoSaveLKH: HASIL otomatis Dokumen/Laporan, KEGIATAN format `[Jenis] Judul — Workflow — Progress`, KETERANGAN auto-generate
- [x] DASAR_FILE_URL column baru di MASTER_AGENDA untuk menyimpan link dokumen pendukung
- [x] AI Notula + PDF Export: generate notula via Ollama, template Google Docs, export PDF
- [x] Peserta Rapat: dropdown dari MASTER_PEGAWAI, chips nama+jabatan, simpan di PESERTA_JSON
- [ ] Testing CRUD end-to-end
- [ ] UAT

---

## Change Log

### v2.6.0 — 3 Jul 2026 (Agenda: Enrich Jenis + Smart Dasar + Auto-LKH Cerdas)
- **[Ubah] Sumber dihapus dari wizard**: Field `SUMBER` tidak lagi dipilih manual — di-generate otomatis dari `DASAR_AGENDA` via `deriveSumberFromDasar()` (RAPAT / SURAT_TUGAS / PIMPINAN / RUTIN / LAINNYA)
- **[New] Jenis kegiatan diperkaya**: Dari 7 opsi jadi 20+ opsi dalam 6 kategori (`<optgroup>`): Tahapan Pemilu, Rapat & Koordinasi, Pembinaan & Diseminasi, Administrasi & Pelaporan, Layanan & Protokol, Lainnya
- **[New] Dasar Agenda 8 opsi**: Hasil Rapat Pleno, Hasil Rapat Internal Sekretariat, Rapat Internal Subbagian, Surat Perintah/Tugas, Disposisi Pimpinan, Instruksi Langsung, Kegiatan Rutin, Lainnya
- **[New] Conditional fields Dasar Agenda**: Rapat → dropdown pilih notulen existing + link alternatif; Surat/Disposisi/Lainnya → link dokumen pendukung
- **[New] `DASAR_FILE_URL` column**: Kolom baru di MASTER_AGENDA (col 17) untuk menyimpan link dokumen dasar (notulen/surat/instruksi)
- **[New] Smart autoSaveLKH**: `jenisToHasilType()` menentukan HASIL = Dokumen/Laporan; `generateKeteranganLKH()` auto-generate deskripsi; `autoSaveLKH()` menulis `[Jenis] Judul — Workflow — Progress` sebagai KEGIATAN
- **[Fix] Validasi tambahan**: Jenis kegiatan + Dasar Agenda wajib diisi saat simpan agenda
- **[Fix] Manual submitLKH**: Update format KEGIATAN/HASIL/KETERANGAN mengikuti pola smart autoSaveLKH
- **[Fix] Notulen → BUAT_AGENDA**: PIC agenda otomatis diisi Kepala Subbag (berdasarkan ASSIGN_SUBBAG) via `getKepalaSubbagEmail()`, fallback ke user notulen jika tidak ditemukan

### v2.7.0 — 3 Jul 2026 (AI Notula + PDF Export via Google Docs Template)
- **[New] `generateNotulaAI(notulenId)`**: Orchestrator — ambil detail notulen, panggil AI Ollama, parse JSON, buat Google Doc, export PDF, simpan log
- **[New] `buildNotulaPrompt(notulenData)`**: Bangun prompt konteks dari data notulen (judul, tanggal, jenis, pimpinan, notulis, jalannya rapat, poin rapat) + system prompt notula KPU
- **[New] `_createNotulaDocument()`**: Copy template Google Docs (`NOTULA_KPU_SIAK`, ID `1tYuwrnIv2eroTqMhaK61XfvXH5ZcfXUWB673tSv6mm8`), replace placeholders `{{JUDUL}}`, `{{HARI}}`, `{{TANGGAL}}`, `{{TEMPAT}}`, `{{PESERTA}}`, `{{PEMBUKA}}`, `{{AGENDA}}`, `{{ISI_RAPAT}}`, `{{PENUTUP_RAPAT}}`, `{{JAM_SELESAI}}`, `{{KESIMPULAN}}`, `{{ATASAN_LANGSUNG}}`, `{{NOTULA}}`
- **[New] `_exportNotulaPDF()`**: Konversi Google Doc → PDF via `getAs('application/pdf')`, simpan di folder Drive notulen dengan prefix `notula_`
- **[New] `_saveNotulaLog()`**: Simpan hasil AI (JSON lengkap) + URL Doc + URL PDF ke sheet `NOTULA_LOG` (ID, NOTULEN_ID, AI_JSON, DOC_URL, PDF_URL, STATUS, CREATED_AT)
- **[New] Sheet `NOTULA_LOG`**: Kolom: ID, NOTULEN_ID, AI_JSON, DOC_URL, PDF_URL, STATUS, CREATED_AT
- **[New] Template Notula**: Google Docs template `NOTULA_KPU_SIAK` dengan 13 placeholder — template tidak pernah diedit langsung, selalu `makeCopy()` terlebih dahulu
- **[New] AI System Prompt**: Bahasa Indonesia baku, gaya pemerintahan, output JSON only — 13 keys (judul, hari, tanggal, tempat, peserta, pembuka, agenda, isi_rapat, penutup_rapat, jam_selesai, kesimpulan, atasan_langsung, notula)
- **[New] Tombol "Generate Notula AI" di Detail Modal**: Button ungu dengan ikon robot di modal detail notulen — konfirmasi via SweetAlert2, loading state, hasil tampilkan 2 link (Google Docs + PDF)
- **[Fix] `initAllSheets()`**: Inisialisasi sheet NOTULA_LOG jika belum ada
- **[New] Pengecekan JSON AI dengan `start/end indexOf('{}')`**: Sama seperti pattern di Code.gs — tangani markdown ```json cleanup

### v2.8.0 — 3 Jul 2026 (Peserta Rapat via MASTER_PEGAWAI)
- **[New] Kolom `PESERTA_JSON`**: Kolom baru di NOTULEN (col 13) — menyimpan JSON array peserta `[{nama, jabatan, email}]`
- **[New] `getDataPegawai()`**: Backend helper — ambil semua pegawai aktif dari MASTER_PEGAWAI, return `{nama, jabatan, email}` sorted
- **[New] Frontend Peserta Rapat di Step 1**: Search input + dropdown hasil filter + chips (nama+jabatan) dengan tombol X untuk hapus — data dari MASTER_PEGAWAI
- **[New] Integrasi AI**: Daftar peserta disertakan dalam konteks prompt AI notula — AI tahu siapa saja yang hadir
- **[Ubah] NOTULEN → 13 kolom**: ID, TANGGAL, JENIS, JUDUL, PIMPINAN, NOTULIS, JALANNYA_COUNT, POIN_COUNT, CREATED_AT, DRIVE_URL, UNDANGAN_LINK, STATUS, **PESERTA_JSON**
- **[Fix] `simpanNotulen` / `updateNotulen`**: Simpan PESERTA_JSON ke sheet
- **[Fix] `getListNotulen` / `getDetailNotulen`**: Parse PESERTA_JSON, kirim `pesertaList` ke frontend
- **[Fix] Edit Notulen**: Pre-fill pesertaList dari data existing
- **[Fix] Review & Detail Modal**: Tampilkan peserta sebagai chips warna ungu

### v2.9.0 — 3 Jul 2026 (Refactor AI Notula: Arsitektur Sederhana + Dynamic Atasan)
- **[Ubah] Arsitektur AI Notula**: Dari 13 field AI (judul, hari, tanggal, tempat, peserta, pembuka, agenda, isi_rapat, penutup_rapat, jam_selesai, kesimpulan, atasan_langsung, notula) menjadi **6 field** (judul, hari, tanggal, tempat, peserta, isi_notula)
- **[Ubah] Template Google Docs**: Placeholder dipangkas dari 13 menjadi 8 — `{{JUDUL}}`, `{{HARI}}`, `{{TANGGAL}}`, `{{TEMPAT}}`, `{{PESERTA}}`, `{{ISI_NOTULA}}`, `{{ATASAN_LANGSUNG}}`, `{{NOTULIS}}`. Hanya `{{ISI_NOTULA}}` sebagai placeholder besar untuk narasi lengkap
- **[Ubah] `NOTULA_SYSTEM_PROMPT`**: Prompt baru lebih spesifik — AI sebagai Notulis Resmi Sekretariat KPU Kabupaten Siak, output hanya JSON dengan 6 field. `isi_notula` berisi narasi lengkap (pembukaan, agenda, pendapat, penutup, kesimpulan)
- **[Ubah] `buildNotulaPrompt()`**: User prompt disederhanakan — hanya kirim konteks rapat mentah (judul, tanggal, jenis, pimpinan, notulis, peserta, jalannya, poin) tanpa contoh output atau instruksi format
- **[New] `_findAtasanLangsung(notulisNama)`**: Fungsi baru untuk mencari atasan langsung notulis dari data MASTER_PEGAWAI — fallback ke "KETUA KPU KABUPATEN SIAK" jika tidak ditemukan
- **[Ubah] `generateNotulaAI()`**: `atasan_langsung` dan `notulis` sekarang diisi dari database pegawai (via `_findAtasanLangsung`), bukan dari output AI — menghilangkan hardcode "AR. Wahyu Pradana" dan "KETUA KPU KABUPATEN SIAK"
- **[Hapus] Field lama**: `pembuka`, `agenda`, `isi_rapat`, `penutup_rapat`, `jam_selesai`, `kesimpulan`, `notula` (sebagai field AI) — tidak lagi digunakan di prompt, placeholder, maupun mapping template
- **[Fix] PDF konsisten**: PDF hanya berisi 1 dokumen notula resmi dari template — tanpa JSON mentah, debug, atau salinan prompt

### v2.10.0 — 4 Jul 2026 (AI Notula Fix + Upload Notulen TTD)
- **[Fix] Duplikasi isi notula di PDF**: System prompt diubah menjadi "TEMPLATE FILLER ENGINE" — AI dilarang keras menulis ulang heading (NOTULA RAPAT, Hari, Tanggal, Tempat, Peserta, TENTANG) di dalam nilai field. User message diubah dari "Buat isi notula" menjadi "Isi nilai placeholder. Jangan buat struktur dokumen."
- **[Fix] `buildNotulaPrompt()`**: Ditambahkan `_inferHari()` untuk menyimpulkan nama hari dari tanggal. Konteks data dikirim dalam format numbered (1-10) agar lebih terstruktur untuk AI.
- **[Fix] `_sanitizeAIOutput()`**: Fungsi baru sebagai defense-in-depth — membersihkan output AI dari struktur template yang mungkin lolos (NOTULA RAPAT, Hari/Tanggal/Tempat label), mencetak warning jika ada pembersihan.
- **[Fix] Kualitas narasi `isi_notula`**: Prompt diperkaya dengan panduan alur narasi profesional — setiap agenda berupa paragraf deskriptif (3-5 kalimat), variasi diksi, transisi alami, contoh narasi kaya dengan nama pimpinan riil KPU Siak.
- **[New] Data pimpinan KPU Siak di prompt**: Prompt berisi struktur pimpinan KPU Kabupaten Siak (Said Dharma Setiawan, Berlian Littaqwa, Dedi Kurniawan, Dailin Fajri Sormin, Moh. Royani) + panduan panggilan profesional.
- **[New] `{{JABATAN_ATASAN}}` dan `{{JABATAN_NOTULIS}}`**: Dua placeholder baru di template Google Docs. JABATAN_ATASAN diisi dari MASTER_PEGAWAI (jabatan atasan langsung notulis), JABATAN_NOTULIS diisi jabatan notulis dari MASTER_PEGAWAI via `_findJabatanPegawai()`.
- **[New] Default {{TEMPAT}}**: Jika AI tidak menyimpulkan tempat rapat, default "Aula Rapat Lt.2 KPU Kabupaten Siak".
- **[New] `uploadSignedNotulen()`**: Backend endpoint untuk upload notulen PDF yang sudah ditandatangani — simpan ke folder Drive dengan prefix `notulen_ttd_`, simpan URL ke kolom SIGNED_PDF_URL (col 14) di NOTULEN sheet.
- **[New] Kolom SIGNED_PDF_URL**: NOTULEN sheet sekarang 14 kolom — kolom baru untuk menyimpan URL notulen TTD.
- **[New] UI Upload TTD**: Modal upload file PDF + tombol hijau "Upload TTD" di card list dan detail modal + link "Notulen TTD" jika sudah diupload.
- **[Ubah] Template placeholders**: Dari 8 menjadi 10 — ditambah `{{JABATAN_ATASAN}}` dan `{{JABATAN_NOTULIS}}`.

### v2.5.0 — 3 Jul 2026 (Notulen Edit + Upload File + Folder per Tanggal)
- **[New] Edit Notulen (`updateNotulen`)**: Fungsi backend untuk mengupdate notulen existing — update row di sheet NOTULEN, hapus-reinsert JALANNYA & POIN, re-generate file .txt di Drive, dan menjalankan TL actions (BUAT_AGENDA / UPDATE_PROGRES)
- **[New] Upload File Undangan (`uploadUndanganFile`)**: Upload file asli (PDF/DOC/JPG/dll) ke folder Drive, bukan lagi hanya link text. Nama file otomatis diberi prefix `undangan_{8char_id}_`. Tetap ada fallback `uploadUndanganLink` untuk link manual
- **[New] Tombol Edit di Detail Modal**: Setiap detail notulen kini punya tombol "Edit" yang memuat ulang data ke wizard 4-step untuk diedit
- **[Ubah] Folder Drive Notulen**: Dari `E-OFFICE/NOTULEN/{tahun}/{bulan}/` menjadi `E-OFFICE/NOTULEN/{tahun}/{bulan}/{tanggal}/` — memudahkan pencarian per hari karena dalam 1 minggu bisa beberapa kali rapat
- **[Ubah] Frontend Upload Modal**: Input link diganti jadi input file (`<input type="file">`) dengan opsi fallback link jika pengguna lebih suka upload manual ke Drive
- **[Fix] Date Serialization**: Konversi Date object ke string `yyyy-MM-dd` via `_fmtDate()` sebelum dikirim ke frontend — `google.script.run` gagal serialisasi Date object, mengakibatkan frontend menerima `null`

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
- v2.9 — Notifikasi email assignment / reminder rapat
- v2.10 — Template notulen multiple (Coktas/Pleno/Rakor/Bimtek/Sosialisasi)
- v2.11 — Agenda: folder per subbag + upload evidence ke Drive
- v3.0 — Approval workflow
- v3.1 — Komentar / diskusi per agenda

---

## Agenda Data Model

### Spreadsheet: `1-xohP9CXPUIOL8Ar8L_L3xTOfs_S6fMkUj098nmyE10`

**MASTER_AGENDA** (16+1 kolom)
| ID | NOMOR_AGENDA | JUDUL | SUMBER | JENIS | SUBBAGIAN | PRIORITAS | STATUS | TARGET_OUTPUT | DESKRIPSI | DASAR_AGENDA | TANGGAL_MULAI | TANGGAL_SELESAI | CREATED_BY_EMAIL | CREATED_AT | UPDATED_AT | DASAR_FILE_URL |

**MASTER_WORKFLOW**
| ID | AGENDA_ID | URUTAN | NAMA_WORKFLOW | STATUS | TARGET | PIC_EMAIL | KETERANGAN | CREATED_AT | UPDATED_AT |

**MASTER_PROGRESS**
| ID | WORKFLOW_ID | URUTAN | NAMA_PROGRESS | STATUS | PERSENTASE | TARGET | REALISASI | PIC_EMAIL | CATATAN | CREATED_AT | UPDATED_AT | LKH_REFERENCE_ID |

**MASTER_EVIDENCE**
| ID | PROGRESS_ID | NAMA_FILE | LINK | KETERANGAN | UPLOAD_BY_EMAIL | UPLOAD_AT |

**MASTER_ASSIGNMENT**
| ID | AGENDA_ID | EMAIL_PEGAWAI | ROLE | STATUS | READ_AT | STARTED_AT | FINISHED_AT | CREATED_AT | UPDATED_AT |

**MASTER_ACTIVITY_LOG**
| ID | USER_EMAIL | AKTIVITAS | REFERENSI | WAKTU |

### SUMBER → DASAR_AGENDA Mapping
| Pilihan Dasar Agenda | SUMBER (otomatis) |
|---|---|
| HASIL_RAPAT_PLENO | RAPAT |
| HASIL_RAPAT_INTERNAL_SEKRE | RAPAT |
| RAPAT_INTERNAL_SUBBAG | RAPAT |
| SURAT_PERINTAH_TUGAS | SURAT_TUGAS |
| DISPOSISI_PIMPINAN | PIMPINAN |
| INSTRUKSI_LANGSUNG | PIMPINAN |
| KEGIATAN_RUTIN | RUTIN |
| LAINNYA | LAINNYA |

### Auto-LKH Smart Content
- **KEGIATAN**: `[Jenis] Judul Agenda — NamaWorkflow — NamaProgress`
- **HASIL**: Otomatis `Dokumen` (jenis berorientasi output fisik) atau `Laporan` (jenis berorientasi evaluasi/monitoring)
- **KETERANGAN**: `"{realisasi}. Dokumen telah selesai dibuat."` atau `"{realisasi}. Laporan telah disusun dengan baik."`

---

## Notulen Data Model

### Spreadsheet: `1hC8lzsHoukbQIfv-JNmZzx3u5pBoU7uY7bmktgU2_uA`

**NOTULEN** (14 kolom)
| ID | TANGGAL | JENIS | JUDUL | PIMPINAN | NOTULIS | JALANNYA_COUNT | POIN_COUNT | CREATED_AT | DRIVE_URL | UNDANGAN_LINK | STATUS | PESERTA_JSON | SIGNED_PDF_URL |

**JALANNYA_RAPAT**
| ID | NOTULEN_ID | PEMBICARA | POKOK_BAHASAN | URUTAN |

**POIN_RAPAT**
| ID | NOTULEN_ID | ISI | TINDAK_LANJUT | ASSIGN_SUBBAG | AGENDA_ID | URUTAN |

**NOTULA_LOG**
| ID | NOTULEN_ID | AI_JSON | DOC_URL | PDF_URL | STATUS | CREATED_AT |

### Tindak Lanjut Options
- `TANPA_TL` — tanpa tindak lanjut
- `BUAT_AGENDA` — generate agenda baru otomatis via `createAgenda()` di `backend_agenda.gs`
- `UPDATE_PROGRES` — update catatan progres agenda existing
- `CATATAN_SAJA` — hanya catatan, tanpa aksi sistem

### Automatisasi
- Poin dengan `BUAT_AGENDA` → `createAgenda()` di spreadsheet `1-xohP9CXPUIOL8Ar8L_L3xTOfs_S6fMkUj098nmyE10`
- Poin dengan `UPDATE_PROGRES` → append catatan ke `MASTER_PROGRESS`
- Backup .txt notulen + upload undangan ke Drive: `E-OFFICE/NOTULEN/{TAHUN}/{BULAN}/{TANGGAL}/`

---

## Key Architecture Decisions
- **Notulen DB terpisah** dari spreadsheet E-LKH dan Agenda → easier management, independent scaling
- **Hybrid notulen → agenda**: notulis input poin + pilih tindak lanjut → sistem generate/update otomatis
- **4-step wizard** dengan auto-save localStorage: user bisa mulai, simpan draft, lanjut kapan saja
- **Jalannya Rapat sebagai array bebas**: tidak ada struktur fixed — notulis bebas input kronologis
- **AI Notula + PDF Export**: Notula dibuat via AI Ollama, dituangkan ke template Google Docs, lalu di-export ke PDF — template tidak pernah diedit langsung (selalu `makeCopy()`)
- **Folder Drive**: `E-OFFICE/NOTULEN/{TAHUN}/{BULAN}/{TANGGAL}/` untuk backup .txt notulen + file undangan — struktur per tanggal karena 1 hari bisa >1 rapat
- **Edit notulen**: Data JALANNYA_RAPAT & POIN_RAPAT di-delete lalu re-insert (bukan update per baris) — simpel, konsisten, hindari kompleksitas tracking perubahan
- **Upload file undangan**: File disimpan di folder tanggal yang sama dengan notulen, nama prefix `undangan_` — memudahkan pencarian bot Telegram via `getFilesByName()`

---

## Known Issues
- `AGENDA_MASTER_SHEET_ID` variable name in `backend_agenda.gs` is misleading (points to E-LKH spreadsheet, not an agenda master sheet) — cosmetic only
- Hardcoded deployment URL in `agenda.html` sidebar E-LKH link — must be updated on redeploy
- `notulen_draft` localStorage key tidak dibedakan per user — jika multi-user di device sama, draft bisa tertimpa
- `updateNotulen` delete & re-insert JALANNYA + POIN — jika ada error di tengah, data child bisa hilang tanpa rollback

---

## v2.11.0 — Refactor Progress: PJ + Anggota + Target per Progress (2026-07-04)

### Perubahan

#### 1. MASTER_PROGRESS headers (backend_agenda.gs)
- `PIC_EMAIL` → `PJ_EMAIL` (Penanggung Jawab)
- Tambah kolom ke-14: `ANGGOTA_EMAILS` (JSON array of emails)
- `ensureAgendaColumn()` otomatis rename header lama yang masih `PIC_EMAIL`

#### 2. Backend Progress CRUD (backend_agenda.gs)
- `createProgress()` / `updateProgress()`:
  - `picEmail` → `pjEmail`
  - Kirim `anggotaEmails` (array), disimpan sebagai JSON string di kolom 14
  - Kirim `target` (Dokumen/Laporan/Lainnya) — disimpan di kolom 7
- `getProgressByWorkflowId()`:
  - Return `pjEmail`, `pjNama`, `anggotaEmails`, `anggotaNamaList` (nama hasil resolve dari MASTER_PEGAWAI)
  - Return `target`
- `autoSaveLKH()` → `autoSaveLKHAll()`:
  - Generate LKH untuk **PJ + semua anggota** (bukan hanya PIC)
  - Ambil `target` dari progress (priority), fallback ke workflow target, lalu agenda jenis
  - LKH_REFERENCE_ID menyimpan multiple refs dengan format `email1:id1,email2:id2` untuk track yang sudah dibuat

#### 3. Frontend Progress Modal (agenda.html)
- Hapus `fProgressPIC` → ganti `fProgressPJ` (Penanggung Jawab)
- Tambah `fProgressTarget` — dropdown: Dokumen / Laporan / Lainnya
- Tambah `fProgressAnggota` — `<select multiple>` untuk pilih anggota
- Helper: `deselectAll()`, `getAnggotaEmails()`, `setAnggotaSelect()`
- `saveProgress()`: validasi target wajib, kirim `pjEmail` + `anggotaEmails` + `target`
- `populateDropdowns()`: isi `fProgressPJ` dan `fProgressAnggota` dari pegawaiList

#### 4. Render detail (agenda.html — renderWorkflows)
- Setiap progress menampilkan:
  - **Target badge** (pill warna ungu)
  - **PJ** (Penanggung Jawab)
  - **Anggota** (daftar nama, jika ada)

### Alur baru
1. Workflow punya **PIC** (kasubbag) — tidak berubah
2. Di dalam workflow, Progress punya:
   - **Target** — menentukan hasil LKH (Dokumen/Laporan/Lainnya)
   - **PJ** — penanggung jawab task, LKH auto-generated untuknya
   - **Anggota** — orang lain yang ikut, LKH juga auto-generated
3. Siapa saja upload evidence (tidak dibatasi)
4. Saat progress selesai → LKH untuk PJ + semua anggota

---

## Critical Context for Next Session
- **Notulen spreadsheet**: `1hC8lzsHoukbQIfv-JNmZzx3u5pBoU7uY7bmktgU2_uA`
- **Agenda tindak lanjut spreadsheet**: `1-xohP9CXPUIOL8Ar8L_L3xTOfs_S6fMkUj098nmyE10`
- **Master pegawai spreadsheet**: `1JivPdetUS5lu5ZjJveqwhpKhwU5r0QiRb4GtJGXxDtA`
- **URL base external**: `https://script.google.com/macros/s/AKfycbxejATwEFa6KmgBqjxFGiA2L_mEJGG0-CaHGsaIyxedRz5_vGA-QiAIhSE-mYwXFY_E/exec`
- **All notulen JS functions** are in `index.html` (lines ~1452-2245 area)
- **All notulen backend** is in `notulen.gs` (standalone, self-contained, ~893 lines)
- **AI Notula**: Hanya 6 field dari AI (`judul`, `hari`, `tanggal`, `tempat`, `peserta`, `isi_notula`); `atasan_langsung`, `notulis`, `jabatan_atasan`, `jabatan_notulis` diisi dari database pegawai
- **Template placeholders (10)**: `{{JUDUL}}`, `{{HARI}}`, `{{TANGGAL}}`, `{{TEMPAT}}`, `{{PESERTA}}`, `{{ISI_NOTULA}}`, `{{ATASAN_LANGSUNG}}`, `{{NOTULIS}}`, `{{JABATAN_ATASAN}}`, `{{JABATAN_NOTULIS}}`
- **Notulen endpoints**: `getListNotulen`, `getDetailNotulen`, `simpanNotulen`, `updateNotulen`, `uploadUndanganFile`, `uploadUndanganLink`, `uploadSignedNotulen`, `hapusNotulen`, `getListAgendaForNotulen`, `generateNotulaAI`, `getDataPegawai`
- **NOTULEN sheet columns (14)**: ID, TANGGAL, JENIS, JUDUL, PIMPINAN, NOTULIS, JALANNYA_COUNT, POIN_COUNT, CREATED_AT, DRIVE_URL, UNDANGAN_LINK, STATUS, PESERTA_JSON, SIGNED_PDF_URL
- **CSS for step wizard & notulen badges** is in `style.html`
- **Menu navigation** uses `switchMenu()` SPA pattern in `index.html`
