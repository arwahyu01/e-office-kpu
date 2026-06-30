# DEVELOPMENT LOG — Modul Agenda & Tindak Lanjut

## Roadmap

| Fase | Target | Status |
|------|--------|--------|
| 1 | Analisis project existing & reusable component | ✅ Selesai |
| 2 | Desain database (dengan MASTER_ASSIGNMENT) | ✅ Selesai |
| 3 | Desain UI (Wizard 3 langkah + Dashboard + Detail) | ✅ Selesai |
| 4 | Backend core + CRUD + Assignment | ✅ Selesai |
| 5 | Frontend (agenda.html, style_agenda.html) | ✅ Selesai |
| 6 | Integrasi LKH | ✅ Selesai |
| 7 | Testing & validasi | ⏳ Pending |

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
- [ ] Testing CRUD end-to-end
- [ ] UAT

---

## Change Log

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

### Planned
- v2.1 — Notifikasi email assignment
- v2.2 — Template Coktas/Pelno/Rakor/Bimtek/Sosialisasi/Pleno
- v2.3 — Approval workflow
- v2.4 — Komentar

---

## Known Issues
- `AGENDA_MASTER_SHEET_ID` variable name in `backend_agenda.gs` is misleading (points to E-LKH spreadsheet, not an agenda master sheet) — cosmetic only
- Hardcoded deployment URL in `agenda.html` sidebar E-LKH link — must be updated on redeploy

---

## Next Task
1. ✅ Deploy ke GAS environment
2. ✅ Bug fixes applied (v2.0.1)
3. Test CRUD end-to-end:
   - Wizard flow (all 3 steps, all 4 assignment types)
   - Assignment engine populates MASTER_ASSIGNMENT correctly
   - Workflow creation, reordering, and auto-status updates
   - Progress with evidence upload
   - LKH integration — complete progress → open LKH modal → check "Jadikan LKH" → submit → verify entry in LKH module
4. UAT dengan user
