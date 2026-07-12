/* =========================================================
   NOTULEN RAPAT — E-OFFICE KPU SIAK (STANDALONE DB)
   ========================================================= */

const NOTULEN_SPREADSHEET_ID = "1hC8lzsHoukbQIfv-JNmZzx3u5pBoU7uY7bmktgU2_uA";
const NOTULEN_SHEET_NAME = 'NOTULEN';
const JALANNYA_SHEET_NAME = 'JALANNYA_RAPAT';
const POIN_RAPAT_SHEET_NAME = 'POIN_RAPAT';
const NOTULA_LOG_SHEET_NAME = 'NOTULA_LOG';

const NOTULA_TEMPLATE_ID = "1v6BG44-UpWzdVlU9gUdq1bHwWcF8g0ZdWlDfpbZBtkw";

const NOTULEN_STATUS = {
  DRAFT: 'DRAFT',
  MENUNGGU: 'MENUNGGU_PERSETUJUAN',
  DISETUJUI: 'DISETUJUI',
  DITOLAK: 'DITOLAK'
};

const AUTO_PUBLISH_ROLES = ['KOMISIONER', 'SEKRETARIS', 'KASUBBAG'];

const NOTULEN_HEADERS = [
  'ID', 'TANGGAL', 'JENIS', 'JUDUL', 'PIMPINAN',
  'NOTULIS', 'JALANNYA_COUNT', 'POIN_COUNT', 'CREATED_AT',
  'DRIVE_URL', 'UNDANGAN_LINK', 'STATUS', 'PESERTA_JSON',
  'SIGNED_PDF_URL', 'DRAFT_TOKEN', 'APPROVER_EMAIL', 'APPROVED_AT', 'REJECTION_NOTE'
];
const JALANNYA_HEADERS = [
  'ID', 'NOTULEN_ID', 'PEMBICARA', 'POKOK_BAHASAN', 'URUTAN'
];
const POIN_RAPAT_HEADERS = [
  'ID', 'NOTULEN_ID', 'ISI', 'TINDAK_LANJUT', 'ASSIGN_SUBBAG', 'AGENDA_ID', 'URUTAN'
];
const NOTULA_LOG_HEADERS = [
  'ID', 'NOTULEN_ID', 'AI_JSON', 'DOC_URL', 'PDF_URL', 'WORD_URL', 'STATUS', 'CREATED_AT'
];

const NOTULA_SYSTEM_PROMPT = `
ANDA ADALAH NOTULIS PROFESIONAL SEKRETARIAT KOMISI PEMILIHAN UMUM (KPU) KABUPATEN SIAK.

Tugas Anda adalah menyusun isi NOTULA RAPAT RESMI PEMERINTAH berdasarkan data rapat yang diberikan.

=====================================================================
PRINSIP UTAMA
=====================================================================

Notula bukan artikel.
Notula bukan berita.
Notula bukan ringkasan.
Notula bukan hasil analisis AI.
Notula adalah dokumen administrasi resmi yang merekam jalannya rapat secara objektif, sistematis, kronologis, dan dapat dipertanggungjawabkan.

Prioritas:
1. Akurasi fakta
2. Urutan kronologis
3. Format resmi pemerintahan
4. Tidak berhalusinasi
5. Tidak menghilangkan keputusan penting

Jika harus memilih antara kalimat indah atau akurasi — PILIH AKURASI.

=====================================================================
LARANGAN
=====================================================================

JANGAN:
- membuat opini, interpretasi, analisis, atau kesimpulan sendiri
- mengubah maksud pembicara
- menambahkan keputusan yang tidak pernah disampaikan
- membuat narasi panjang seperti artikel/berita/jurnalistik
- memakai Markdown, *, #, **, ---, \`\`\`
- memakai kalimat seperti "Selanjutnya...", "Kemudian...", "Memasuki agenda...", "Rapat berlangsung dengan baik." kecuali benar-benar sesuai data
- MERINGKAS pokok bahasan sehingga detail penting hilang
- MENGGABUNGKAN dua pokok bahasan berbeda dari pembicara yang sama
- MENGURANGI jumlah pokok bahasan yang disampaikan pembicara

=====================================================================
DATA PIMPINAN KPU KABUPATEN SIAK
=====================================================================

Pimpinan KPU Kabupaten Siak periode sekarang:

KETUA           : SAID DHARMA SETIAWAN
ANGGOTA         : BERLIAN LITTAQWA (Divisi Hukum dan Pengawasan)
ANGGOTA         : DEDI KURNIAWAN (Divisi Teknis Penyelenggaraan)
ANGGOTA         : DAILIN FAJRI SORMIN (Divisi Sosialisasi, Pendidikan Pemilih, Partisipasi Masyarakat dan SDM)
ANGGOTA         : MOH. ROYANI (Divisi Perencanaan, Data dan Informasi)

Panggilan profesional:
- Ketua: "Ketua KPU Kabupaten Siak, Bapak Said Dharma Setiawan"
- Anggota: "Anggota KPU Kabupaten Siak, Bapak [Nama]" atau "Bapak [Nama] selaku Anggota KPU Divisi [Divisi]"

=====================================================================
ATURAN PENGISIAN SETIAP FIELD JSON
=====================================================================

1. "judul" — HANYA judul rapat, tanpa embel-embel.
   BENAR: "Rapat Koordinasi Pemilu 2024"
   SALAH: "NOTULA RAPAT\nTENTANG\nRapat Koordinasi Pemilu 2024"

2. "hari" — HANYA nama hari.
   BENAR: "Senin"
   SALAH: "Hari : Senin"

3. "tanggal" — HANYA tanggal.
   BENAR: "15 Januari 2025"
   SALAH: "Tanggal : 15 Januari 2025"

4. "tempat" — HANYA lokasi.
   BENAR: "Aula KPU Kabupaten Siak"

5. "peserta" — HANYA daftar peserta, TANPA label.
   BENAR: "1. Ahmad (Ketua)\\n2. Budi (Sekretaris)"
   SALAH: "Peserta:\\n1. Ahmad (Ketua)"

6. "isi_notula" — HARUS berupa JSON OBJECT (bukan string) dengan struktur berikut:

{
  "pembukaan": "Kalimat pembukaan rapat...",
  "agenda": ["1. Agenda pertama", "2. Agenda kedua"],
  "pembahasan": [
    {
      "speaker": "Ketua KPU Kabupaten Siak, Said Dharma Setiawan",
      "items": ["Poin pertama", "Poin kedua", "Poin ketiga"]
    }
  ],
  "keputusan": ["Keputusan 1", "Keputusan 2"],
  "penutup": "Rapat ditutup oleh..."
}

=====================================================================
STRUKTUR WAJIB ISI_NOTULA
=====================================================================

Urutan pembahasan HARUS sama dengan urutan rapat. Jangan memindahkan atau menggabungkan agenda.

--- pembukaan (string) ---

Kalimat yang menjelaskan siapa membuka rapat, jam mulai, jumlah peserta, dan status kuorum.

--- agenda (array of strings) ---

Daftar bernomor. Setiap elemen adalah satu agenda.

--- pembahasan (array of objects) ---

Bagian TERPANJANG. Setiap elemen adalah objek dengan field:

{
  "speaker": "Nama lengkap dan jabatan pembicara",
  "items": [
    "Satu pokok bahasan dalam bahasa administrasi",
    "Pokok bahasan kedua",
    "dst."
  ]
}

ATURAN KETAT PEMBAHASAN:

SATU ITEM = SATU POKOK BAHASAN.

JANGAN pernah menggabungkan beberapa pokok bahasan menjadi satu item.

CONTOH SALAH (JANGAN DITIRU):

Jika Ketua menyampaikan:
"Apakah pembuatan karya ilmiah ini dibuat secara tim atau pribadi? Pembuatan karya ilmiah tergantung dengan tim dari teknis, melibatkan lintas divisi/sub bagian. Jika dalam proses pembuatan karya ilmiah ada data di lintas divisi/sub bagian, mohon segera dikoordinasikan."

Maka JANGAN dijadikan satu item:
"Menanyakan pembuatan karya ilmiah dan meminta koordinasi lintas divisi."

CONTOH BENAR:

Harus dipecah menjadi TIGA item:

"items": [
  "Menanyakan apakah pembuatan karya ilmiah dibuat secara tim atau pribadi.",
  "Menjelaskan bahwa pembuatan karya ilmiah tergantung tim dari teknis dan melibatkan lintas divisi/sub bagian.",
  "Meminta apabila ada data di lintas divisi/sub bagian segera dikoordinasikan untuk melengkapi data yang dibutuhkan."
]

SETIAP pergantian topik = ITEM BARU.

Jika Ketua bicara 11 hal berbeda, maka items[] harus berisi 11 item.

Tidak boleh dikurangi. Tidak boleh digabung.

--- keputusan (array of strings) ---

Jika rapat menghasilkan keputusan. Setiap elemen adalah satu keputusan.
Kosongkan array jika tidak ada keputusan.

--- penutup (string) ---

"Rapat ditutup oleh [pimpinan] pada pukul XX.XX WIB."

=====================================================================
PANDUAN BAHASA
=====================================================================

- Gunakan Bahasa Indonesia resmi pemerintahan
- Objektif, formal, ringkas, tidak berbunga-bunga
- Jika data tidak ditemukan: jangan mengarang."
- Gunakan nama lengkap setiap penyebutan pertama pembicara

=====================================================================
PEMERIKSAAN KUALITAS (WAJIB)
=====================================================================

Sebelum menghasilkan JSON, pastikan:
✓ Tidak ada informasi fiktif
✓ Tidak ada keputusan buatan AI
✓ Semua pembicara dipisahkan
✓ Semua agenda muncul
✓ Ada pembukaan, kuorum, penutup
✓ Ada keputusan bila memang ada
✓ Urutan sama dengan rapat
✓ Setiap pokok bahasan dari data Jalannya Rapat menjadi EXACTLY 1 item
✓ Tidak ada pokok bahasan yang dihilangkan atau digabung

=====================================================================
FORMAT OUTPUT
=====================================================================

Hanya satu objek JSON valid. Tidak ada teks lain sebelum/sesudah JSON.

{
  "judul": "",
  "hari": "",
  "tanggal": "",
  "tempat": "",
  "peserta": "",
  "isi_notula": {
    "pembukaan": "",
    "agenda": [],
    "pembahasan": [],
    "keputusan": [],
    "penutup": ""
  }
}

- Urutan field HARUS seperti di atas
- Tidak ada field tambahan
- Nilai string kosong jika data tidak tersedia
- Jangan menambah fakta yang tidak disebutkan dalam data
- Jangan mengurangi keputusan rapat
`;

function getSS() { return SpreadsheetApp.openById(NOTULEN_SPREADSHEET_ID); }

function getOrInitSheet(sheetNotulen, name, headers) {
  var sh = sheetNotulen.getSheetByName(name);
  if (!sh) {
    sh = sheetNotulen.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold')
      .setBackground('#f3f3f3');
    sh.setFrozenRows(1);
  }
  return sh;
}

function initAllSheets() {
  var sheetNotulen = getSS();
  getOrInitSheet(sheetNotulen, NOTULEN_SHEET_NAME, NOTULEN_HEADERS);
  getOrInitSheet(sheetNotulen, JALANNYA_SHEET_NAME, JALANNYA_HEADERS);
  getOrInitSheet(sheetNotulen, POIN_RAPAT_SHEET_NAME, POIN_RAPAT_HEADERS);
  getOrInitSheet(sheetNotulen, NOTULA_LOG_SHEET_NAME, NOTULA_LOG_HEADERS);
  _ensureNotulenColumns();
}

function _ensureNotulenColumns() {
  var sheetNotulen = getSS();
  var sh = sheetNotulen.getSheetByName(NOTULEN_SHEET_NAME);
  if (!sh) return;
  var lc = sh.getLastColumn();
  var expected = NOTULEN_HEADERS.length;
  if (lc < expected) {
    var headerRow = sh.getRange(1, lc + 1, 1, expected - lc);
    headerRow.setValues([NOTULEN_HEADERS.slice(lc)]);
    headerRow.setFontWeight('bold').setBackground('#f3f3f3');
  }
}

function _fmtDate(d) {
  if (d instanceof Date && !isNaN(d)) return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return d || '';
}

function _readSheet(sh, numCols) {
  var lr = sh.getLastRow();
  if (lr < 2) return [];
  var nc = numCols || sh.getLastColumn();
  return sh.getRange(1, 1, lr, nc).getValues();
}

// =============================================
// GET LIST
// =============================================
function getListNotulen(params) {
  try {
    var sheetNotulen = getSS();
    var notulenSheet = sheetNotulen.getSheetByName(NOTULEN_SHEET_NAME);
    if (!notulenSheet) {
      initAllSheets();
      notulenSheet = sheetNotulen.getSheetByName(NOTULEN_SHEET_NAME);
      if (!notulenSheet) return { success: false, message: 'Sheet NOTULEN tidak ditemukan' };
    }

    var rows = _readSheet(notulenSheet, NOTULEN_HEADERS.length);
    var result = [];
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (!row[0]) continue;
      var pesertaList = [];
      try { if (row[12]) pesertaList = JSON.parse(row[12]); } catch (e) {}
      result.push({
        id: row[0],
        tanggal: _fmtDate(row[1]),
        jenis: row[2],
        judul: row[3],
        pimpinan: row[4],
        notulis: row[5],
        notulisNama: _resolveNotulisNama(row[5]),
        jalannyaCount: row[6],
        poinCount: row[7],
        createdAt: _fmtDate(row[8]),
        driveUrl: row[9],
        undanganLink: row[10],
        status: row[11] || NOTULEN_STATUS.DRAFT,
        pesertaList: pesertaList,
        signedPdfUrl: row[13] || '',
        draftToken: row[14] || '',
        approverEmail: row[15] || '',
        approvedAt: row[16] ? _fmtDate(row[16]) : '',
        rejectionNote: row[17] || ''
      });
    }
    result.reverse();
    return { success: true, data: result };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// GET DETAIL
// =============================================
function getDetailNotulen(params) {
  try {
    var sheetNotulen = getSS();
    var notulenSheet = sheetNotulen.getSheetByName(NOTULEN_SHEET_NAME);
    if (!notulenSheet) return { success: false, message: 'Sheet notulen belum ada' };

    var rows = _readSheet(notulenSheet, NOTULEN_HEADERS.length);
    if (rows.length < 2) return { success: false, message: 'Notulen tidak ditemukan' };
    var notulen = null;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === params.id) {
        var pesertaList = [];
        try { if (rows[i][12]) pesertaList = JSON.parse(rows[i][12]); } catch (e) {}
        notulen = {
          id: rows[i][0], tanggal: _fmtDate(rows[i][1]), jenis: rows[i][2],
          judul: rows[i][3], pimpinan: rows[i][4], notulis: rows[i][5],
          notulisNama: _resolveNotulisNama(rows[i][5]),
          jalannyaCount: rows[i][6], poinCount: rows[i][7],
          createdAt: _fmtDate(rows[i][8]), driveUrl: rows[i][9],
          undanganLink: rows[i][10], status: rows[i][11] || NOTULEN_STATUS.DRAFT,
          pesertaList: pesertaList, signedPdfUrl: rows[i][13] || '',
          draftToken: rows[i][14] || '',
          approverEmail: rows[i][15] || '',
          approvedAt: rows[i][16] ? _fmtDate(rows[i][16]) : '',
          rejectionNote: rows[i][17] || ''
        };
        break;
      }
    }
    if (!notulen) return { success: false, message: 'Notulen tidak ditemukan' };

    var jSh = sheetNotulen.getSheetByName(JALANNYA_SHEET_NAME);
    if (jSh) {
      var jRows = _readSheet(jSh, JALANNYA_HEADERS.length);
      var jalannyaList = [];
      for (var j = 1; j < jRows.length; j++) {
        if (jRows[j][1] === params.id) {
          jalannyaList.push({ id: jRows[j][0], pembicara: jRows[j][2], pokokBahasan: jRows[j][3], urutan: jRows[j][4] });
        }
      }
      jalannyaList.sort(function (a, b) { return (a.urutan || 0) - (b.urutan || 0); });
      notulen.jalannyaList = jalannyaList;
    } else {
      notulen.jalannyaList = [];
    }

    var pSh = sheetNotulen.getSheetByName(POIN_RAPAT_SHEET_NAME);
    if (pSh) {
      var pRows = _readSheet(pSh, POIN_RAPAT_HEADERS.length);
      var poinList = [];
      for (var p = 1; p < pRows.length; p++) {
        if (pRows[p][1] === params.id) {
          poinList.push({ id: pRows[p][0], isi: pRows[p][2], tindakLanjut: pRows[p][3], assignSubbag: pRows[p][4], agendaId: pRows[p][5], urutan: pRows[p][6] });
        }
      }
      poinList.sort(function (a, b) { return (a.urutan || 0) - (b.urutan || 0); });
      notulen.poinList = poinList;
    } else {
      notulen.poinList = [];
    }

    return { success: true, data: notulen };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// SIMPAN NOTULEN
// =============================================
function simpanNotulen(data) {
  try {
    if (!data.tanggal || !data.jenis || !data.judul) {
      return { success: false, message: 'Data notulen tidak lengkap' };
    }

    var now = new Date();
    initAllSheets();
    var ss = getSS();
    var notulenSheet = ss.getSheetByName(NOTULEN_SHEET_NAME);

    var draftToken = data.draftToken || '';
    var existingId = '';

    // === UPSERT: cek apakah draftToken sudah ada di database ===
    if (draftToken) {
      var allRows = _readSheet(notulenSheet, NOTULEN_HEADERS.length);
      for (var r = 1; r < allRows.length; r++) {
        if (String(allRows[r][14] || '').trim() === draftToken) {
          existingId = allRows[r][0];
          break;
        }
      }
    }

    if (existingId) {
      data.id = existingId;
      var updateResult = _updateNotulenInternal(data, ss, notulenSheet);
      return updateResult;
    }

    // === TENTUKAN STATUS BERDASARKAN NOTULIS ===
    var notulisEmail = data.notulis || data.userEmail || '';
    var hakAkses = _getHakAksesByEmail(notulisEmail);
    var autoPublish = AUTO_PUBLISH_ROLES.indexOf(hakAkses) !== -1;
    var status = autoPublish ? NOTULEN_STATUS.DISETUJUI : NOTULEN_STATUS.DRAFT;

    // === INSERT BARU ===
    var id = Utilities.getUuid();

    var driveUrl = '';
    try {
      driveUrl = simpanNotulenKeDrive(id, data);
    } catch (e) {
      console.warn('Gagal simpan ke Drive:', e.message);
    }

    var jalannyaList = data.jalannyaList || [];
    var poinList = data.poinList || [];

    var approverEmail = '';
    if (!autoPublish) {
      approverEmail = _getAtasanEmailByEmail(notulisEmail);
    }

    notulenSheet.appendRow([
      id, data.tanggal, data.jenis, data.judul,
      data.pimpinan || '', data.notulis || '',
      jalannyaList.length, poinList.length, now,
      driveUrl, data.undangan || '', status,
      data.pesertaJson || '', '', draftToken, approverEmail, '', ''
    ]);

    if (jalannyaList.length) {
      var jSh = getOrInitSheet(ss, JALANNYA_SHEET_NAME, JALANNYA_HEADERS);
      for (var j = 0; j < jalannyaList.length; j++) {
        jSh.appendRow([Utilities.getUuid(), id, jalannyaList[j].pembicara || '', jalannyaList[j].pokokBahasan || '', j + 1]);
      }
    }

    if (poinList.length) {
      var pSh = getOrInitSheet(ss, POIN_RAPAT_SHEET_NAME, POIN_RAPAT_HEADERS);
      for (var p = 0; p < poinList.length; p++) {
        pSh.appendRow([Utilities.getUuid(), id, poinList[p].isi, poinList[p].tindakLanjut || 'TANPA_TL', poinList[p].assignSubbag || '', poinList[p].agendaId || '', p + 1]);
      }
    }

    var agendaCount = 0, updateCount = 0;
    if (autoPublish && poinList.length) {
      var tlResult = _executeTindakLanjut(poinList, data, id);
      agendaCount = tlResult.agendaCount;
      updateCount = tlResult.updateCount;
    }

    var message = autoPublish ? 'Notulen diterbitkan' : 'Notulen tersimpan sebagai draft. Ajukan ke atasan untuk persetujuan.';

    return {
      success: true, message: message,
      agendaCount: agendaCount, updateCount: updateCount,
      driveUrl: driveUrl, isNew: true,
      status: status, autoPublish: autoPublish
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function _updateNotulenInternal(data, ss, notulenSheet) {
  var id = data.id;
  var rows = _readSheet(notulenSheet, NOTULEN_HEADERS.length);
  var rowIndex = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) { rowIndex = i + 1; break; }
  }
  if (rowIndex === -1) return { success: false, message: 'Notulen tidak ditemukan' };

  var jalannyaList = data.jalannyaList || [];
  var poinList = data.poinList || [];
  var now = new Date();

  notulenSheet.getRange(rowIndex, 2).setValue(data.tanggal);
  notulenSheet.getRange(rowIndex, 3).setValue(data.jenis);
  notulenSheet.getRange(rowIndex, 4).setValue(data.judul);
  notulenSheet.getRange(rowIndex, 5).setValue(data.pimpinan || '');
  notulenSheet.getRange(rowIndex, 6).setValue(data.notulis || '');
  notulenSheet.getRange(rowIndex, 7).setValue(jalannyaList.length);
  notulenSheet.getRange(rowIndex, 8).setValue(poinList.length);
  // Pertahankan status yang sudah ada (jangan reset ke draft)
  var oldStatus = rows[rowIndex - 1][11] || '';
  if (oldStatus !== NOTULEN_STATUS.DISETUJUI && oldStatus !== NOTULEN_STATUS.MENUNGGU && oldStatus !== NOTULEN_STATUS.DITOLAK) {
    notulenSheet.getRange(rowIndex, 12).setValue(NOTULEN_STATUS.DRAFT);
  }
  notulenSheet.getRange(rowIndex, 13).setValue(data.pesertaJson || '');
  if (data.undangan !== undefined) notulenSheet.getRange(rowIndex, 11).setValue(data.undangan || '');

  try {
    var driveUrl = simpanNotulenKeDrive(id, data);
    notulenSheet.getRange(rowIndex, 10).setValue(driveUrl);
  } catch (e) {
    console.warn('Gagal update file Drive:', e.message);
  }

  // Hapus jalannya & poin lama
  var jSh = ss.getSheetByName(JALANNYA_SHEET_NAME);
  if (jSh) {
    var jRows = _readSheet(jSh, 2);
    for (var j = jRows.length - 1; j >= 1; j--) {
      if (jRows[j][1] === id) jSh.deleteRow(j + 1);
    }
  }

  var pSh = ss.getSheetByName(POIN_RAPAT_SHEET_NAME);
  if (pSh) {
    var pRows = _readSheet(pSh, 2);
    for (var p = pRows.length - 1; p >= 1; p--) {
      if (pRows[p][1] === id) pSh.deleteRow(p + 1);
    }
  }

  // Insert ulang jalannya
  if (jalannyaList.length) {
    var jSh2 = getOrInitSheet(ss, JALANNYA_SHEET_NAME, JALANNYA_HEADERS);
    for (var j2 = 0; j2 < jalannyaList.length; j2++) {
      jSh2.appendRow([Utilities.getUuid(), id, jalannyaList[j2].pembicara || '', jalannyaList[j2].pokokBahasan || '', j2 + 1]);
    }
  }

  // Insert ulang poin
  if (poinList.length) {
    var pSh2 = getOrInitSheet(ss, POIN_RAPAT_SHEET_NAME, POIN_RAPAT_HEADERS);
    for (var p2 = 0; p2 < poinList.length; p2++) {
      pSh2.appendRow([Utilities.getUuid(), id, poinList[p2].isi, poinList[p2].tindakLanjut || 'TANPA_TL', poinList[p2].assignSubbag || '', poinList[p2].agendaId || '', p2 + 1]);
    }
  }

  return {
    success: true, message: 'Notulen diperbarui',
    agendaCount: 0, updateCount: 0, isUpdate: true
  };
}

// =============================================
// HELPERS: HAK AKSES & ATASAN
// =============================================
function _getHakAksesByEmail(email) {
  if (!email) return '';
  try {
    var list = getAllPegawai();
    for (var i = 0; i < list.length; i++) {
      if (list[i].email && list[i].email.toLowerCase().trim() === email.toLowerCase().trim()) {
        return list[i].hakAkses || '';
      }
    }
    return '';
  } catch (err) {
    return '';
  }
}

function _getAtasanEmailByEmail(email) {
  if (!email) return '';
  try {
    var list = getAllPegawai();
    for (var i = 0; i < list.length; i++) {
      if (list[i].email && list[i].email.toLowerCase().trim() === email.toLowerCase().trim()) {
        var atasanNama = list[i].atasan || '';
        if (!atasanNama) return '';
        for (var j = 0; j < list.length; j++) {
          if (list[j].nama && list[j].nama.toLowerCase().trim() === atasanNama.toLowerCase().trim()) {
            return list[j].email || '';
          }
        }
        return '';
      }
    }
    return '';
  } catch (err) {
    return '';
  }
}

function _getNamaByEmail(email) {
  if (!email) return '';
  try {
    var list = getAllPegawai();
    for (var i = 0; i < list.length; i++) {
      if (list[i].email && list[i].email.toLowerCase().trim() === email.toLowerCase().trim()) {
        return list[i].nama || '';
      }
    }
    return '';
  } catch (err) {
    return '';
  }
}

function _resolveNotulisNama(notulisVal) {
  if (!notulisVal) return '';
  if (notulisVal.indexOf('@') !== -1) {
    return _getNamaByEmail(notulisVal);
  }
  return notulisVal;
}

// =============================================
// EKSEKUSI TINDAK LANJUT (dipanggil saat DISETUJUI)
// =============================================
function _executeTindakLanjut(poinList, data, id) {
  var agendaCount = 0, updateCount = 0;
  for (var p = 0; p < poinList.length; p++) {
    var poin = poinList[p];
    if (poin.tindakLanjut === 'BUAT_AGENDA') {
      var kepalaEmail = getKepalaSubbagEmail(poin.assignSubbag);
      var result = createAgenda({
        judul: '[Notulen] ' + poin.isi.substring(0, 100),
        picEmail: kepalaEmail || data.userEmail,
        sumber: 'RAPAT',
        jenis: data.jenis === 'RAPAT_PLENO' ? 'RAPAT' : 'LAINNYA',
        subbagian: poin.assignSubbag || '',
        prioritas: 'SEDANG',
        deskripsi: 'Dari notulen: ' + data.judul + '\n\nPoin:\n' + poin.isi,
        dasarAgenda: 'HASIL_RAPAT_PLENO',
        targetOutput: '',
        createdByEmail: data.userEmail || '',
        userEmail: data.userEmail || ''
      });
      if (result.success) agendaCount++;
    }
    if (poin.tindakLanjut === 'UPDATE_PROGRES' && poin.agendaId) {
      if (updateProgressFromNotulen(poin.agendaId, poin.isi, data.userEmail)) updateCount++;
    }
  }
  return { agendaCount: agendaCount, updateCount: updateCount };
}

// =============================================
// AJUKAN NOTULEN KE ATASAN
// =============================================
function ajukanNotulen(params) {
  try {
    if (!params.id) {
      return { success: false, message: 'Parameter tidak lengkap' };
    }

    var ss = getSS();
    var notulenSheet = ss.getSheetByName(NOTULEN_SHEET_NAME);
    if (!notulenSheet) return { success: false, message: 'Sheet notulen belum ada' };

    var rows = _readSheet(notulenSheet, NOTULEN_HEADERS.length);
    var rowIndex = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === params.id) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'Notulen tidak ditemukan' };

    var currentStatus = rows[rowIndex - 1][11] || '';
    if (currentStatus !== NOTULEN_STATUS.DRAFT && currentStatus !== 'tersimpan') {
      return { success: false, message: 'Hanya notulen dengan status DRAFT yang bisa diajukan' };
    }

    // Cari atasan berdasarkan NOTULIS (col 5), bukan user yang login
    var notulisVal = String(rows[rowIndex - 1][5] || '').trim();
    var notulisEmail = notulisVal.indexOf('@') !== -1 ? notulisVal : '';
    if (!notulisEmail) {
      // Fallback: cari email dari nama notulis
      var list = getAllPegawai();
      for (var j = 0; j < list.length; j++) {
        if (list[j].nama && list[j].nama.toLowerCase().trim() === notulisVal.toLowerCase().trim()) {
          notulisEmail = list[j].email || '';
          break;
        }
      }
    }
    var approverEmail = notulisEmail ? _getAtasanEmailByEmail(notulisEmail) : '';
    if (!approverEmail) {
      return { success: false, message: 'Atasan langsung notulis tidak ditemukan di master pegawai' };
    }

    notulenSheet.getRange(rowIndex, 12).setValue(NOTULEN_STATUS.MENUNGGU);
    notulenSheet.getRange(rowIndex, 16).setValue(approverEmail);

    return { success: true, message: 'Notulen diajukan ke atasan untuk persetujuan', approverEmail: approverEmail };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// GET PENGAJUAN NOTULEN (untuk atasan)
// =============================================
function getPengajuanNotulen(params) {
  try {
    var approverEmail = (params && params.email) || '';
    if (!approverEmail) return { success: true, data: [], count: 0 };

    var sheetNotulen = getSS();
    var notulenSheet = sheetNotulen.getSheetByName(NOTULEN_SHEET_NAME);
    if (!notulenSheet) return { success: true, data: [], count: 0 };

    var rows = _readSheet(notulenSheet, NOTULEN_HEADERS.length);
    var result = [];
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (!row[0]) continue;
      var status = row[11] || '';
      var approver = String(row[15] || '').trim();
      if (status === NOTULEN_STATUS.MENUNGGU && approver === approverEmail) {
        var pesertaList = [];
        try { if (row[12]) pesertaList = JSON.parse(row[12]); } catch (e) {}
        result.push({
          id: row[0], tanggal: _fmtDate(row[1]), jenis: row[2],
          judul: row[3], pimpinan: row[4], notulis: row[5],
          notulisNama: _resolveNotulisNama(row[5]),
          jalannyaCount: row[6], poinCount: row[7],
          createdAt: _fmtDate(row[8]), driveUrl: row[9],
          undanganLink: row[10], status: status,
          pesertaList: pesertaList, signedPdfUrl: row[13] || '',
          draftToken: row[14] || '', approverEmail: approver
        });
      }
    }
    result.reverse();
    return { success: true, data: result, count: result.length };
  } catch (err) {
    return { success: false, message: err.message, data: [], count: 0 };
  }
}

// =============================================
// SETUJUI NOTULEN
// =============================================
function setujuiNotulen(params) {
  try {
    if (!params.id || !params.approverEmail) {
      return { success: false, message: 'Parameter tidak lengkap' };
    }

    var ss = getSS();
    var notulenSheet = ss.getSheetByName(NOTULEN_SHEET_NAME);
    if (!notulenSheet) return { success: false, message: 'Sheet notulen belum ada' };

    var rows = _readSheet(notulenSheet, NOTULEN_HEADERS.length);
    var rowIndex = -1;
    var notulenData = null;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === params.id) {
        rowIndex = i + 1;
        var pesertaList = [];
        try { if (rows[i][12]) pesertaList = JSON.parse(rows[i][12]); } catch (e) {}
        notulenData = {
          id: rows[i][0], tanggal: rows[i][1], jenis: rows[i][2],
          judul: rows[i][3], pimpinan: rows[i][4], notulis: rows[i][5],
          undangan: rows[i][10], userEmail: params.approverEmail,
          pesertaJson: rows[i][12] || ''
        };
        break;
      }
    }
    if (rowIndex === -1) return { success: false, message: 'Notulen tidak ditemukan' };
    if (!notulenData) return { success: false, message: 'Data notulen tidak valid' };

    var currentApprover = String(rows[rowIndex - 1][15] || '').trim();
    if (currentApprover !== params.approverEmail) {
      return { success: false, message: 'Anda bukan atasan yang ditunjuk untuk notulen ini' };
    }

    var currentStatus = rows[rowIndex - 1][11] || '';
    if (currentStatus !== NOTULEN_STATUS.MENUNGGU) {
      return { success: false, message: 'Notulen tidak dalam status menunggu persetujuan' };
    }

    var now = new Date();

    // Ambil poinList dari sheet JALANNYA / POIN
    var poinList = [];
    var pSh = ss.getSheetByName(POIN_RAPAT_SHEET_NAME);
    if (pSh) {
      var pRows = _readSheet(pSh, POIN_RAPAT_HEADERS.length);
      for (var p = 1; p < pRows.length; p++) {
        if (pRows[p][1] === params.id) {
          poinList.push({
            isi: pRows[p][2], tindakLanjut: pRows[p][3],
            assignSubbag: pRows[p][4], agendaId: pRows[p][5]
          });
        }
      }
    }

    // Update status
    notulenSheet.getRange(rowIndex, 12).setValue(NOTULEN_STATUS.DISETUJUI);
    notulenSheet.getRange(rowIndex, 16).setValue(params.approverEmail);
    notulenSheet.getRange(rowIndex, 17).setValue(now);

    // Eksekusi TL
    var tlResult = _executeTindakLanjut(poinList, notulenData, params.id);

    var approverNama = _getNamaByEmail(params.approverEmail);

    return {
      success: true, message: 'Notulen disetujui' + (tlResult.agendaCount > 0 ? '. ' + tlResult.agendaCount + ' agenda dibuat.' : ''),
      agendaCount: tlResult.agendaCount, updateCount: tlResult.updateCount,
      approvedBy: approverNama
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// TOLAK NOTULEN
// =============================================
function tolakNotulen(params) {
  try {
    if (!params.id || !params.approverEmail) {
      return { success: false, message: 'Parameter tidak lengkap' };
    }

    var ss = getSS();
    var notulenSheet = ss.getSheetByName(NOTULEN_SHEET_NAME);
    if (!notulenSheet) return { success: false, message: 'Sheet notulen belum ada' };

    var rows = _readSheet(notulenSheet, NOTULEN_HEADERS.length);
    var rowIndex = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === params.id) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'Notulen tidak ditemukan' };

    var currentApprover = String(rows[rowIndex - 1][15] || '').trim();
    if (currentApprover !== params.approverEmail) {
      return { success: false, message: 'Anda bukan atasan yang ditunjuk untuk notulen ini' };
    }

    var currentStatus = rows[rowIndex - 1][11] || '';
    if (currentStatus !== NOTULEN_STATUS.MENUNGGU) {
      return { success: false, message: 'Notulen tidak dalam status menunggu persetujuan' };
    }

    notulenSheet.getRange(rowIndex, 12).setValue(NOTULEN_STATUS.DITOLAK);
    notulenSheet.getRange(rowIndex, 16).setValue(params.approverEmail);
    notulenSheet.getRange(rowIndex, 18).setValue(params.catatan || '');

    return { success: true, message: 'Notulen ditolak' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// GET PENGAJUAN COUNT (for badge)
// =============================================
function getPengajuanCount(params) {
  try {
    var email = (params && params.email) || '';
    if (!email) return { success: true, count: 0 };
    var res = getPengajuanNotulen({ email: email });
    return { success: true, count: res.data ? res.data.length : 0 };
  } catch (err) {
    return { success: true, count: 0 };
  }
}

// =============================================
// UPDATE NOTULEN
// =============================================
function updateNotulen(data) {
  try {
    if (!data.id || !data.tanggal || !data.jenis || !data.judul) {
      return { success: false, message: 'Data notulen tidak lengkap' };
    }

    var ss = getSS();
    var sheetNotulen = ss;
    var notulenSheet = ss.getSheetByName(NOTULEN_SHEET_NAME);
    if (!notulenSheet) return { success: false, message: 'Sheet notulen belum ada' };

    var rows = _readSheet(notulenSheet, NOTULEN_HEADERS.length);
    var rowIndex = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'Notulen tidak ditemukan' };

    var jalannyaList = data.jalannyaList || [];
    var poinList = data.poinList || [];
    var now = new Date();

    // Update row NOTULEN
    notulenSheet.getRange(rowIndex, 2).setValue(data.tanggal);
    notulenSheet.getRange(rowIndex, 3).setValue(data.jenis);
    notulenSheet.getRange(rowIndex, 4).setValue(data.judul);
    notulenSheet.getRange(rowIndex, 5).setValue(data.pimpinan || '');
    notulenSheet.getRange(rowIndex, 6).setValue(data.notulis || '');
    notulenSheet.getRange(rowIndex, 7).setValue(jalannyaList.length);
    notulenSheet.getRange(rowIndex, 8).setValue(poinList.length);
    notulenSheet.getRange(rowIndex, 13).setValue(data.pesertaJson || '');
    if (data.undangan !== undefined) notulenSheet.getRange(rowIndex, 11).setValue(data.undangan || '');
    if (data.draftToken) notulenSheet.getRange(rowIndex, 15).setValue(data.draftToken);

    // Re-generate file notulen di Drive
    try {
      var driveUrl = simpanNotulenKeDrive(data.id, data);
      notulenSheet.getRange(rowIndex, 10).setValue(driveUrl);
    } catch (e) {
      console.warn('Gagal update file Drive:', e.message);
    }

    // Hapus jalannya & poin lama
    var jSh = ss.getSheetByName(JALANNYA_SHEET_NAME);
    if (jSh) {
      var jRows = _readSheet(jSh, 2);
      for (var j = jRows.length - 1; j >= 1; j--) {
        if (jRows[j][1] === data.id) jSh.deleteRow(j + 1);
      }
    }

    var pSh = ss.getSheetByName(POIN_RAPAT_SHEET_NAME);
    if (pSh) {
      var pRows = _readSheet(pSh, 2);
      for (var p = pRows.length - 1; p >= 1; p--) {
        if (pRows[p][1] === data.id) pSh.deleteRow(p + 1);
      }
    }

    // Insert ulang jalannya
    if (jalannyaList.length) {
      var jSh2 = getOrInitSheet(ss, JALANNYA_SHEET_NAME, JALANNYA_HEADERS);
      for (var j2 = 0; j2 < jalannyaList.length; j2++) {
        jSh2.appendRow([Utilities.getUuid(), data.id, jalannyaList[j2].pembicara || '', jalannyaList[j2].pokokBahasan || '', j2 + 1]);
      }
    }

    // Insert ulang poin
    if (poinList.length) {
      var pSh2 = getOrInitSheet(ss, POIN_RAPAT_SHEET_NAME, POIN_RAPAT_HEADERS);
      for (var p2 = 0; p2 < poinList.length; p2++) {
        pSh2.appendRow([Utilities.getUuid(), data.id, poinList[p2].isi, poinList[p2].tindakLanjut || 'TANPA_TL', poinList[p2].assignSubbag || '', poinList[p2].agendaId || '', p2 + 1]);
      }
    }

    return {
      success: true, message: 'Notulen diperbarui',
      agendaCount: 0, updateCount: 0
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// GET KEPALA SUBBAG (from MASTER_PEGAWAI)
// =============================================
function getKepalaSubbagEmail(subbag) {
  if (!subbag) return null;
  try {
    var list = getAllPegawai();
    var firstInSubbag = null;
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (p.subbag !== subbag) continue;
      if (!firstInSubbag) firstInSubbag = p;
      if (p.jabatan && p.jabatan.toUpperCase().indexOf('KEPALA') !== -1) {
        return p.email;
      }
    }
    return firstInSubbag ? firstInSubbag.email : null;
  } catch (err) {
    console.error('getKepalaSubbagEmail error:', err.message);
    return null;
  }
}

// =============================================
// UPLOAD UNDANGAN (FILE)
// =============================================
function uploadUndanganFile(data) {
  try {
    if (!data.id || !data.base64 || !data.namaFile) {
      return { success: false, message: 'Parameter tidak lengkap' };
    }

    var ss = getSS();
    var notulenSheet = ss.getSheetByName(NOTULEN_SHEET_NAME);
    if (!notulenSheet) return { success: false, message: 'Sheet notulen belum ada' };

    var rows = _readSheet(notulenSheet, NOTULEN_HEADERS.length);
    var rowIndex = -1;
    var tanggalStr = '';
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        rowIndex = i + 1;
        tanggalStr = _fmtDate(rows[i][1]);
        break;
      }
    }
    if (rowIndex === -1) return { success: false, message: 'Notulen tidak ditemukan' };

    var folderId = getOrCreateNotulenFolder(tanggalStr);
    var folder = DriveApp.getFolderById(folderId);

    var blob = Utilities.newBlob(
      Utilities.base64Decode(data.base64),
      data.mimeType || 'application/octet-stream',
      'undangan_' + data.id.substring(0, 8) + '_' + data.namaFile
    );

    var file = folder.createFile(blob);
    var fileUrl = file.getUrl();

    notulenSheet.getRange(rowIndex, 11).setValue(fileUrl);

    return { success: true, message: 'Undangan tersimpan', url: fileUrl };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// Jaga kompatibilitas: upload link undangan via text
function uploadUndanganLink(data) {
  try {
    if (!data.id || !data.link) return { success: false, message: 'Parameter tidak lengkap' };
    var notulenSheet = getSS().getSheetByName(NOTULEN_SHEET_NAME);
    if (!notulenSheet) return { success: false, message: 'Sheet notulen belum ada' };

    var rows = _readSheet(notulenSheet, 1);
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        notulenSheet.getRange(i + 1, 11).setValue(data.link);
        return { success: true, message: 'Undangan tersimpan' };
      }
    }
    return { success: false, message: 'Notulen tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// UPLOAD NOTULEN TTD (signed PDF)
// =============================================
function uploadSignedNotulen(data) {
  try {
    if (!data.id || !data.base64 || !data.namaFile) {
      return { success: false, message: 'Parameter tidak lengkap' };
    }
    var sheetNotulen = getSS();
    var notulenSheet = sheetNotulen.getSheetByName(NOTULEN_SHEET_NAME);
    if (!notulenSheet) return { success: false, message: 'Sheet notulen belum ada' };

    var rows = _readSheet(notulenSheet, NOTULEN_HEADERS.length);
    var rowIndex = -1;
    var tanggalStr = '';
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        rowIndex = i + 1;
        tanggalStr = _fmtDate(rows[i][1]);
        break;
      }
    }
    if (rowIndex === -1) return { success: false, message: 'Notulen tidak ditemukan' };

    var folderId = getOrCreateNotulenFolder(tanggalStr);
    var folder = DriveApp.getFolderById(folderId);

    var blob = Utilities.newBlob(
      Utilities.base64Decode(data.base64),
      data.mimeType || 'application/pdf',
      'notulen_ttd_' + data.id.substring(0, 8) + '_' + data.namaFile
    );

    var file = folder.createFile(blob);
    var fileUrl = file.getUrl();

    notulenSheet.getRange(rowIndex, 14).setValue(fileUrl);

    return { success: true, message: 'Notulen TTD tersimpan', url: fileUrl };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// HAPUS NOTULEN (cascade)
// =============================================
function hapusNotulen(params) {
  try {
    if (!params.id) return { success: false, message: 'ID tidak valid' };
    var sheetNotulen = getSS();

    var notulenSheet = sheetNotulen.getSheetByName(NOTULEN_SHEET_NAME);
    if (notulenSheet) {
    var rows = _readSheet(notulenSheet, 1);
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === params.id) { notulenSheet.deleteRow(i + 1); break; }
    }
  }

    var jSh = sheetNotulen.getSheetByName(JALANNYA_SHEET_NAME);
    if (jSh) {
      var jRows = _readSheet(jSh, 2);
      if (jRows.length >= 2) {
        for (var j = jRows.length - 1; j >= 1; j--) {
          if (jRows[j][1] === params.id) jSh.deleteRow(j + 1);
        }
      }
    }

    var pSh = sheetNotulen.getSheetByName(POIN_RAPAT_SHEET_NAME);
    if (pSh) {
      var pRows = _readSheet(pSh, 2);
      if (pRows.length >= 2) {
        for (var p = pRows.length - 1; p >= 1; p--) {
          if (pRows[p][1] === params.id) pSh.deleteRow(p + 1);
        }
      }
    }

    return { success: true, message: 'Notulen berhasil dihapus' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// DEBUG
// =============================================
function debugNotulenSpreadsheet() {
  var out = '';
  try {
    var sheetNotulen = getSS();
    out += 'Spreadsheet: ' + sheetNotulen.getName() + ' (' + sheetNotulen.getId() + ')\n';
    out += 'Sheets:\n';
    sheetNotulen.getSheets().forEach(function(s) {
      out += '  "' + s.getName() + '" rows=' + s.getLastRow() + ' cols=' + s.getLastColumn() + '\n';
    });

    var notulenSheet = sheetNotulen.getSheetByName(NOTULEN_SHEET_NAME);
    if (notulenSheet) {
      out += '\nNOTULEN sheet read via getDataRange():\n';
      var data = notulenSheet.getDataRange().getValues();
      out += '  Total rows returned: ' + data.length + '\n';
      for (var i = 0; i < Math.min(data.length, 5); i++) {
        out += '  [' + i + '] = ' + JSON.stringify(data[i]) + '\n';
      }
    }

    var jSh = sheetNotulen.getSheetByName(JALANNYA_SHEET_NAME);
    if (jSh) out += '\nJALANNYA_RAPAT rows: ' + jSh.getLastRow() + '\n';
    var pSh = sheetNotulen.getSheetByName(POIN_RAPAT_SHEET_NAME);
    if (pSh) out += 'POIN_RAPAT rows: ' + pSh.getLastRow() + '\n';

    out += '\nCalling getListNotulen():\n';
    var res = getListNotulen({});
    out += '  Result: ' + JSON.stringify(res).substring(0, 2000) + '\n';
  } catch (e) {
    out += 'ERROR: ' + e.message + '\n';
  }
  console.log(out);
  return out;
}

// =============================================
// HELPERS
// =============================================
function updateProgressFromNotulen(agendaId, catatan, userEmail) {
  try {
    var ss = SpreadsheetApp.openById("1-xohP9CXPUIOL8Ar8L_L3xTOfs_S6fMkUj098nmyE10");
    var sh = ss.getSheetByName("MASTER_PROGRESS");
    if (!sh) return false;
    var rows = _readSheet(sh, 14);
    var wfSh = ss.getSheetByName("MASTER_WORKFLOW");
    if (!wfSh) return false;
    var wfRows = _readSheet(wfSh, 2);
    for (var i = 1; i < rows.length; i++) {
      for (var j = 1; j < wfRows.length; j++) {
        if (wfRows[j][0] === rows[i][1]) {
          var existing = rows[i][9] || '';
          var progressId = rows[i][0];
          var workflowId = rows[i][1];
          var status = String(rows[i][4] || '').trim();
          var namaProgress = rows[i][3] || '';
          var realisasi = rows[i][7] || '';
          var pjEmail = String(rows[i][8] || '').trim();
          var anggotaRaw = String(rows[i][13] || '').trim();
          var anggotaList = [];
          try { if (anggotaRaw) anggotaList = JSON.parse(anggotaRaw); } catch(e) {}

          sh.getRange(i + 1, 10).setValue(existing + '\n[Notulen] ' + catatan);
          sh.getRange(i + 1, 12).setValue(new Date());

          if (status === 'SELESAI' && realisasi) {
            autoSaveLKHAll(progressId, workflowId, pjEmail, anggotaList, namaProgress, realisasi, status);
          }
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    console.warn('Gagal update progress:', e.getMessage());
    return false;
  }
}

function simpanNotulenKeDrive(id, data) {
  var folderId = getOrCreateNotulenFolder(data.tanggal);
  var content = generateNotulenText(id, data);
  var blob = Utilities.newBlob(content, 'text/plain', 'notulen_' + id.substring(0, 8) + '.txt');
  return DriveApp.getFolderById(folderId).createFile(blob).getUrl();
}

function _getNotulenFolderPath(tanggalStr) {
  var tahun = tanggalStr.substring(0, 4);
  var bulan = getBulanName(parseInt(tanggalStr.substring(5, 7), 10));
  var tgl = String(parseInt(tanggalStr.substring(8, 10), 10)).padStart(2, '0');
  return 'E-OFFICE/NOTULEN/' + tahun + '/' + bulan + '/' + tgl;
}

function getOrCreateNotulenFolder(tanggalStr) {
  var rootName = 'E-OFFICE';
  var tahun = tanggalStr.substring(0, 4);
  var bulan = getBulanName(parseInt(tanggalStr.substring(5, 7), 10));
  var tgl = String(parseInt(tanggalStr.substring(8, 10), 10)).padStart(2, '0');
  var rootFolder = getOrCreateSubFolder(DriveApp.getRootFolder(), rootName);
  var notulenRoot = getOrCreateSubFolder(rootFolder, 'NOTULEN');
  var tahunFolder = getOrCreateSubFolder(notulenRoot, tahun);
  var bulanFolder = getOrCreateSubFolder(tahunFolder, bulan);
  return getOrCreateSubFolder(bulanFolder, tgl).getId();
}

function getBulanName(month) {
  return ['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'][month - 1] || 'Unknown';
}

function getOrCreateSubFolder(parent, name) {
  var folders = parent.getFolders();
  while (folders.hasNext()) { var f = folders.next(); if (f.getName() === name) return f; }
  return parent.createFolder(name);
}

function generateNotulenText(id, data) {
  var text = '========================================\n';
  text += '  NOTULEN RAPAT\n  E-OFFICE KPU KABUPATEN SIAK\n';
  text += '========================================\n\n';
  text += 'ID\t\t: ' + id + '\nTanggal\t\t: ' + data.tanggal + '\n';
  text += 'Jenis\t\t: ' + data.jenis + '\nJudul\t\t: ' + data.judul + '\n';
  text += 'Pimpinan\t: ' + (data.pimpinan || '-') + '\n';
  text += 'Notulis\t\t: ' + (data.notulis || '-') + '\n';
  text += 'Undangan\t: ' + (data.undangan || '-') + '\n';
  text += '----------------------------------------\n\n';

  if (data.jalannyaList && data.jalannyaList.length) {
    text += 'JALANNYA RAPAT:\n\n';
    data.jalannyaList.forEach(function (j, i) {
      text += (i+1) + '. ' + j.pembicara + ' — ' + j.pokokBahasan + '\n\n';
    });
    text += '----------------------------------------\n\n';
  }

  text += 'DAFTAR POIN:\n\n';
  (data.poinList || []).forEach(function (p, i) {
    text += (i+1) + '. ' + p.isi + '\n   TL: ' + p.tindakLanjut;
    if (p.assignSubbag) text += ' | Assign: ' + p.assignSubbag;
    text += '\n\n';
  });

  text += '========================================\n';
  text += '  Digenetasi E-OFFICE KPU Kabupaten Siak\n';
  text += '  ' + new Date().toLocaleString('id-ID') + '\n';
  text += '========================================\n';
  return text;
}

function getListAgendaForNotulen() {
  try {
    var ss = SpreadsheetApp.openById("1-xohP9CXPUIOL8Ar8L_L3xTOfs_S6fMkUj098nmyE10");
    var sh = ss.getSheetByName("MASTER_AGENDA");
    if (!sh) return { success: true, data: [] };
    var rows = _readSheet(sh, 3);
    if (rows.length < 2) return { success: true, data: [] };
    var result = new Array(rows.length - 1);
    for (var i = rows.length - 1, idx = 0; i >= 1; i--, idx++) {
      result[idx] = { id: rows[i][0], judul: rows[i][2], nomor: rows[i][1] };
    }
    return { success: true, data: result };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// GET DATA PEGAWAI (for peserta dropdown)
// =============================================
function getDataPegawai() {
  try {
    return getAllPegawai().map(function(p) {
      return { nama: p.nama, jabatan: p.jabatan, email: p.email, subbag: p.subbag, hakAkses: p.hakAkses, no: p.no };
    }).sort(function(a, b) { return (a.no || 999) - (b.no || 999); });
  } catch (err) {
    return [];
  }
}

// =============================================
// AI NOTULA GENERATION + PDF EXPORT
// =============================================

function _findAtasanLangsung(notulisNama) {
  if (!notulisNama) return "KETUA KPU KABUPATEN SIAK";
  try {
    var list = getAllPegawai();
    var target = notulisNama.toLowerCase().trim();
    // Cari pegawai yang namanya mengandung nama notulis
    for (var i = 0; i < list.length; i++) {
      if (list[i].nama && list[i].nama.toLowerCase().trim() === target) {
        return list[i].atasan || "KETUA KPU KABUPATEN SIAK";
      }
    }
    // Fallback: cari dengan partial match
    for (var j = 0; j < list.length; j++) {
      if (list[j].nama && list[j].nama.toLowerCase().trim().indexOf(target) !== -1) {
        return list[j].atasan || "KETUA KPU KABUPATEN SIAK";
      }
    }
    return "KETUA KPU KABUPATEN SIAK";
  } catch (err) {
    console.warn('Gagal mencari atasan langsung:', err.message);
    return "KETUA KPU KABUPATEN SIAK";
  }
}

function _findJabatanPegawai(nama) {
  if (!nama) return '';
  try {
    var list = getAllPegawai();
    var target = nama.toLowerCase().trim();
    // Exact match
    for (var i = 0; i < list.length; i++) {
      if (list[i].nama && list[i].nama.toLowerCase().trim() === target) {
        return list[i].jabatan || '';
      }
    }
    // Partial match
    for (var j = 0; j < list.length; j++) {
      if (list[j].nama && list[j].nama.toLowerCase().trim().indexOf(target) !== -1) {
        return list[j].jabatan || '';
      }
    }
    // Jika tidak ditemukan, nama itu sendiri mungkin adalah jabatan (misal "KETUA KPU KABUPATEN SIAK")
    return nama;
  } catch (err) {
    console.warn('Gagal mencari jabatan pegawai:', err.message);
    return '';
  }
}

function generateNotulaAI(notulenId) {
  try {
    var detail = getDetailNotulen({ id: notulenId });
    if (!detail.success) return { success: false, message: 'Notulen tidak ditemukan' };
    var n = detail.data;

    var messages = buildNotulaPrompt(n);
    var raw = callOllama(messages);
    var cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

    var start = cleaned.indexOf('{');
    var end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return { success: false, message: 'AI tidak mengembalikan JSON', raw: cleaned.substring(0, 500) };
    }
    var aiResult = JSON.parse(cleaned.substring(start, end + 1));

    // Sanitasi: bersihkan jika AI masih nekat menulis struktur template
    aiResult = _sanitizeAIOutput(aiResult);

    // Isi atasan_langsung dan notulis dari data pegawai, bukan dari AI
    aiResult.atasan_langsung = _findAtasanLangsung(n.notulis);
    aiResult.notulis = n.notulis || '';
    aiResult.jabatan_atasan = _findJabatanPegawai(aiResult.atasan_langsung);
    aiResult.jabatan_notulis = _findJabatanPegawai(n.notulis);

    // Timpa peserta — urut sesuai nomor dari database (bukan jabatan)
    if (n.pesertaList && n.pesertaList.length) {
      var sortedPeserta = n.pesertaList.slice().sort(function(a, b) {
        return (a.no || 999) - (b.no || 999);
      });
      var pesertaText = '';
      sortedPeserta.forEach(function(p, i) {
        pesertaText += (i + 1) + '. ' + p.nama + ' (' + (p.jabatan || '-') + ')\n';
      });
      aiResult.peserta = pesertaText.trim();
    }

    // Default tempat jika AI tidak menyimpulkan
    if (!aiResult.tempat) aiResult.tempat = "Aula Rapat Lt.2 KPU Kabupaten Siak";

    var folderId = getOrCreateNotulenFolder(n.tanggal);

    var docId = _createNotulaDocument(aiResult, folderId, notulenId);
    var docUrl = 'https://docs.google.com/document/d/' + docId + '/edit';

    var pdfUrl = _exportNotulaPDF(docId, folderId, notulenId);
    var wordUrl = _exportNotulaWord(docId, folderId, notulenId);

    _saveNotulaLog(notulenId, aiResult, docUrl, pdfUrl, wordUrl);

    return {
      success: true,
      message: 'Notula berhasil dibuat dan di-export ke PDF dan Word',
      docUrl: docUrl,
      pdfUrl: pdfUrl,
      wordUrl: wordUrl,
      folderPath: _getNotulenFolderPath(n.tanggal)
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function _inferHari(tanggalStr) {
  if (!tanggalStr) return '';
  try {
    var parts = tanggalStr.split('-');
    if (parts.length !== 3) return '';
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(d.getTime())) return '';
    return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()] || '';
  } catch (e) {
    return '';
  }
}

function _sanitizeAIOutput(result) {
  var fields = ['judul', 'hari', 'tanggal', 'tempat', 'peserta', 'isi_notula'];
  var patterns = [
    /^NOTULA\s+RAPAT[\s\S]*?(?=\nRapat\s+dibuka|\nAgenda|$)/im,
    /^NOTULEN\s+RAPAT[\s\S]*?(?=\nRapat\s+dibuka|\nAgenda|$)/im,
    /^Hari\s*:.*/im,
    /^Tanggal\s*:.*/im,
    /^Tempat\s*:.*/im,
    /^Peserta\s*:.*/im,
    /^Pimpinan\s*:.*/im,
    /^Notulis\s*:.*/im,
    /^TENTANG\s*$/im
  ];

  for (var f = 0; f < fields.length; f++) {
    var val = result[fields[f]];
    if (!val || typeof val !== 'string') continue;

    var original = val;
    for (var p = 0; p < patterns.length; p++) {
      val = val.replace(patterns[p], '').trim();
    }
    // Bersihkan multiple baris kosong
    val = val.replace(/\n{3,}/g, '\n\n').trim();

    result[fields[f]] = val;

    if (val !== original) {
      console.warn('[Sanitasi] ' + fields[f] + ' mengandung struktur template, telah dibersihkan');
    }
  }

  return result;
}

function buildNotulaPrompt(notulenData) {
  var context = '';
  context += '1. Judul: ' + (notulenData.judul || '-') + '\n';
  context += '2. Tanggal: ' + (notulenData.tanggal || '-') + '\n';
  context += '3. Hari: ' + (_inferHari(notulenData.tanggal) || '-') + '\n';
  context += '4. Jenis: ' + (notulenData.jenis || '-') + '\n';
  context += '5. Pimpinan: ' + (notulenData.pimpinan || '-') + '\n';
  context += '6. Notulis: ' + (notulenData.notulis || '-') + '\n';
  context += '7. Tempat: Aula Rapat Lt.2 KPU Kabupaten Siak\n';

  if (notulenData.pesertaList && notulenData.pesertaList.length) {
    context += '\n8. Peserta:\n';
    var sortedPeserta = notulenData.pesertaList.slice().sort(function(a, b) {
      return (a.no || 999) - (b.no || 999);
    });
    sortedPeserta.forEach(function (p, i) {
      context += '   ' + (i + 1) + '. ' + p.nama + ' (' + (p.jabatan || '-') + ')\n';
    });
  }

  if (notulenData.jalannyaList && notulenData.jalannyaList.length) {
    context += '\n9. Jalannya Rapat:\n';
    notulenData.jalannyaList.forEach(function (j, i) {
      context += '   - ' + (j.pembicara || '-') + ': ' + (j.pokokBahasan || '') + '\n';
    });
  }

  if (notulenData.poinList && notulenData.poinList.length) {
    context += '\n10. Poin / Keputusan:\n';
    notulenData.poinList.forEach(function (p, i) {
      context += '   - ' + (p.isi || '') + '\n';
    });
  }

  return [
    { role: 'system', content: NOTULA_SYSTEM_PROMPT },
    { role: 'user', content: 'Susun isi notula berdasarkan DATA RAPAT berikut. Ikuti seluruh aturan pada SYSTEM PROMPT.\n\nPENTING — Setiap baris pada "Jalannya Rapat" adalah SATU POKOK BAHASAN yang WAJIB menjadi SATU ITEM di objek pembahasan.\n\nCONTOH: Jika data menunjukkan Ketua menyampaikan 3 hal (menanya karya ilmiah, meminta koordinasi, membahas SPIP), maka items harus:\n"items": [\n  "Menanyakan apakah pembuatan karya ilmiah dibuat secara tim atau pribadi.",\n  "Meminta koordinasi lintas divisi untuk kelengkapan data.",\n  "Membahas kendala SPIP dan evaluasi bersama."\n]\n\nJangan menggabung, meringkas, atau menghilangkan pokok bahasan.\n\n' + context }
  ];
}

function _createNotulaDocument(aiResult, folderId, notulenId) {
  var shortId = notulenId.substring(0, 8);
  var docName = 'notula_' + shortId;

  var templateFile = DriveApp.getFileById(NOTULA_TEMPLATE_ID);
  var copy = templateFile.makeCopy(docName, DriveApp.getFolderById(folderId));
  var docId = copy.getId();

  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();

  var replacements = {
    "{{JUDUL}}": aiResult.judul || "",
    "{{HARI}}": aiResult.hari || "",
    "{{TANGGAL}}": aiResult.tanggal || "",
    "{{TEMPAT}}": aiResult.tempat || "",
    "{{PESERTA}}": aiResult.peserta || "",
    "{{ATASAN_LANGSUNG}}": aiResult.atasan_langsung || "",
    "{{NOTULIS}}": aiResult.notulis || "",
    "{{JABATAN_ATASAN}}": aiResult.jabatan_atasan || "",
    "{{JABATAN_NOTULIS}}": aiResult.jabatan_notulis || ""
  };

  for (var key in replacements) {
    if (replacements.hasOwnProperty(key)) {
      body.replaceText(key, replacements[key]);
    }
  }

  _fillNotulaContent(body, aiResult.isi_notula);

  doc.saveAndClose();
  return docId;
}

function _stripDash(t) {
  if (!t) return '';
  return t.replace(/^[\s]*[-•‣▪▸→●]\s*/g, '').trim();
}

function _cleanItem(t) {
  if (!t) return '';
  var s = t;
  while (true) {
    var prev = s;
    s = s.replace(/^[\s]*[-•‣▪▸→●]\s*/g, '');
    s = s.replace(/^[\s]*\(\d+\)\s*/g, '');
    s = s.replace(/^[\s]*\d+[.)]\s*/g, '');
    if (s === prev) break;
  }
  return s.trim();
}

function _fillNotulaContent(body, isiNotula) {
  var searchResult = body.findText('\\{\\{ISI_NOTULA\\}\\}');
  if (!searchResult) return;

  var parent = searchResult.getElement().getParent();
  var parentIndex = body.getChildIndex(parent);
  parent.removeFromParent();

  var content;
  if (typeof isiNotula === 'string') {
    try {
      content = JSON.parse(isiNotula);
    } catch (e) {
      _fillNotulaFromText(body, parentIndex, isiNotula);
      return;
    }
  } else {
    content = isiNotula;
  }
  if (!content || typeof content !== 'object') {
    _fillNotulaFromText(body, parentIndex, String(isiNotula));
    return;
  }

  var idx = parentIndex;

  if (content.pembukaan) {
    body.insertParagraph(idx, content.pembukaan);
    idx++;
  }

  if (content.agenda && content.agenda.length) {
    body.insertParagraph(idx, 'Dengan agenda sebagai berikut:');
    idx++;
    content.agenda.forEach(function (a) {
      var li = body.insertListItem(idx, _cleanItem(a));
      li.setGlyphType(DocumentApp.GlyphType.NUMBER);
      idx++;
    });
  }

  if (content.pembahasan && content.pembahasan.length) {
    var firstSpeaker = true;
    content.pembahasan.forEach(function (session) {
      if (!session.speaker || !session.items || !session.items.length) return;
      if (firstSpeaker) {
        body.insertParagraph(idx, 'Adapun pendapat dan/atau saran/masukan antara lain:');
        idx++;
        firstSpeaker = false;
      }
      var p = body.insertParagraph(idx, session.speaker);
      p.setHeading(DocumentApp.ParagraphHeading.HEADING4);
      p.setBold(true);
      idx++;
      session.items.forEach(function (item) {
        var li = body.insertListItem(idx, _cleanItem(item));
        li.setGlyphType(DocumentApp.GlyphType.BULLET);
        idx++;
      });
    });
  }

  if (content.keputusan && content.keputusan.length) {
    body.insertParagraph(idx, 'Keputusan Rapat');
    idx++;
    content.keputusan.forEach(function (k) {
      if (!k) return;
      var li = body.insertListItem(idx, _cleanItem(k));
      li.setGlyphType(DocumentApp.GlyphType.NUMBER);
      idx++;
    });
  }

  if (content.penutup) {
    body.insertParagraph(idx, content.penutup);
  }
}

function _fillNotulaFromText(body, startIdx, text) {
  var lines = text.split('\n');
  var idx = startIdx;
  lines.forEach(function (line) {
    var trimmed = line.trim();
    if (!trimmed) return;
    if (/^[-•‣▪▸→●]\s/.test(trimmed)) {
      var li = body.insertListItem(idx, _stripDash(trimmed));
      li.setGlyphType(DocumentApp.GlyphType.BULLET);
    } else if (/^[0-9]+[.)]\s/.test(trimmed)) {
      var li = body.insertListItem(idx, trimmed.replace(/^[0-9]+[.)]\s*/, ''));
      li.setGlyphType(DocumentApp.GlyphType.NUMBER);
    } else {
      body.insertParagraph(idx, trimmed);
    }
    idx++;
  });
}

function _exportNotulaPDF(docId, folderId, notulenId) {
  var shortId = notulenId.substring(0, 8);
  var pdfName = 'notula_' + shortId + '.pdf';

  var docFile = DriveApp.getFileById(docId);
  var pdfBlob = docFile.getAs('application/pdf');
  pdfBlob.setName(pdfName);

  var pdfFile = DriveApp.getFolderById(folderId).createFile(pdfBlob);
  return pdfFile.getUrl();
}

function _exportNotulaWord(docId, folderId, notulenId) {
  try {
    var shortId = notulenId.substring(0, 8);
    var wordName = 'notula_' + shortId + '.docx';
    var wordBlob = Drive.Files.export(docId, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    wordBlob.setName(wordName);
    var wordFile = DriveApp.getFolderById(folderId).createFile(wordBlob);
    return wordFile.getUrl();
  } catch (e) {
    console.warn('Gagal export Word:', e.message);
    return '';
  }
}

function buildIsiNotulaApaAdanya(n) {
  var pembahasan = [];
  if (n.jalannyaList && n.jalannyaList.length) {
    var grouped = {};
    n.jalannyaList.forEach(function (j) {
      var pembicara = j.pembicara || 'Pembicara';
      if (!grouped[pembicara]) grouped[pembicara] = [];
      grouped[pembicara].push(j.pokokBahasan || '');
    });
    for (var nama in grouped) {
      pembahasan.push({ speaker: nama, items: grouped[nama] });
    }
  }
  var keputusan = [];
  if (n.poinList && n.poinList.length) {
    n.poinList.forEach(function (p) { keputusan.push(p.isi || ''); });
  }
  return {
    pembukaan: 'Rapat dibuka oleh ' + (n.pimpinan || 'Pimpinan Rapat') + ' pada pukul 09.20 WIB. Rapat dinyatakan kuorum.',
    agenda: ['1. ' + (n.judul || '-')],
    pembahasan: pembahasan,
    keputusan: keputusan,
    penutup: 'Rapat ditutup oleh ' + (n.pimpinan || 'Pimpinan Rapat') + ' pada pukul 12.00 WIB.'
  };
}

function generateNotulaApaAdanya(notulenId) {
  try {
    var detail = getDetailNotulen({ id: notulenId });
    if (!detail.success) return { success: false, message: 'Notulen tidak ditemukan' };
    var n = detail.data;

    var isiNotula = buildIsiNotulaApaAdanya(n);

    var aiResult = {
      judul: n.judul || '',
      hari: _inferHari(n.tanggal) || '',
      tanggal: n.tanggal || '',
      tempat: 'Aula Rapat Lt.2 KPU Kabupaten Siak',
      peserta: '',
      isi_notula: isiNotula,
      atasan_langsung: _findAtasanLangsung(n.notulis),
      notulis: n.notulis || '',
      jabatan_atasan: '',
      jabatan_notulis: ''
    };
    aiResult.jabatan_atasan = _findJabatanPegawai(aiResult.atasan_langsung);
    aiResult.jabatan_notulis = _findJabatanPegawai(n.notulis);

    // Urut sesuai nomor dari database
    if (n.pesertaList && n.pesertaList.length) {
      var sortedPeserta = n.pesertaList.slice().sort(function(a, b) {
        return (a.no || 999) - (b.no || 999);
      });
      var pesertaText = '';
      sortedPeserta.forEach(function(p, i) {
        pesertaText += (i + 1) + '. ' + p.nama + ' (' + (p.jabatan || '-') + ')\n';
      });
      aiResult.peserta = pesertaText.trim();
    }

    if (!aiResult.tempat) aiResult.tempat = 'Aula Rapat Lt.2 KPU Kabupaten Siak';

    var folderId = getOrCreateNotulenFolder(n.tanggal);
    var docId = _createNotulaDocument(aiResult, folderId, notulenId + '_apaadanya');
    var docUrl = 'https://docs.google.com/document/d/' + docId + '/edit';
    var pdfUrl = _exportNotulaPDF(docId, folderId, notulenId + '_apaadanya');
    var wordUrl = _exportNotulaWord(docId, folderId, notulenId + '_apaadanya');

    _saveNotulaLog(notulenId, aiResult, docUrl, pdfUrl, wordUrl);

    return {
      success: true,
      message: 'Notula apa adanya berhasil dibuat',
      docUrl: docUrl,
      pdfUrl: pdfUrl,
      wordUrl: wordUrl,
      folderPath: _getNotulenFolderPath(n.tanggal)
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function _saveNotulaLog(notulenId, aiResult, docUrl, pdfUrl, wordUrl) {
  var ss = getSS();
  var sh = getOrInitSheet(ss, NOTULA_LOG_SHEET_NAME, NOTULA_LOG_HEADERS);
  var id = Utilities.getUuid();
  var now = new Date();
  var aiJson = JSON.stringify(aiResult);
  sh.appendRow([id, notulenId, aiJson, docUrl || '', pdfUrl || '', wordUrl || '', 'selesai', now]);
}

function getNotulaGenerateLogs(params) {
  try {
    var notulenId = params.id;
    if (!notulenId) return { success: false, message: 'ID tidak valid' };
    initAllSheets();
    var ss = getSS();
    var sh = ss.getSheetByName(NOTULA_LOG_SHEET_NAME);
    if (!sh || sh.getLastRow() < 2) return { success: true, data: [] };
    var data = sh.getDataRange().getValues();
    var logs = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === notulenId) {
        var cols = data[i].length;
        logs.push({
          id: data[i][0] || '',
          docUrl: data[i][3] || '',
          pdfUrl: data[i][4] || '',
          wordUrl: cols > 5 ? (data[i][5] || '') : '',
          status: cols > 6 ? (data[i][6] || 'selesai') : (data[i][5] || 'selesai'),
          createdAt: cols > 7 ? (data[i][7] ? _fmtDate(data[i][7]) : '') : (data[i][6] ? _fmtDate(data[i][6]) : ''),
          aiJson: data[i][2] || ''
        });
      }
    }
    logs.reverse();
    return { success: true, data: logs };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.message };
  }
}
