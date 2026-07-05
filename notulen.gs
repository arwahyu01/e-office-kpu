/* =========================================================
   NOTULEN RAPAT — E-OFFICE KPU SIAK (STANDALONE DB)
   ========================================================= */

const NOTULEN_SPREADSHEET_ID = "1hC8lzsHoukbQIfv-JNmZzx3u5pBoU7uY7bmktgU2_uA";
const NOTULEN_SHEET_NAME = 'NOTULEN';
const JALANNYA_SHEET_NAME = 'JALANNYA_RAPAT';
const POIN_RAPAT_SHEET_NAME = 'POIN_RAPAT';
const NOTULA_LOG_SHEET_NAME = 'NOTULA_LOG';

const NOTULA_TEMPLATE_ID = "1tYuwrnIv2eroTqMhaK61XfvXH5ZcfXUWB673tSv6mm8";

const NOTULEN_HEADERS = [
  'ID', 'TANGGAL', 'JENIS', 'JUDUL', 'PIMPINAN',
  'NOTULIS', 'JALANNYA_COUNT', 'POIN_COUNT', 'CREATED_AT',
  'DRIVE_URL', 'UNDANGAN_LINK', 'STATUS', 'PESERTA_JSON',
  'SIGNED_PDF_URL'
];
const JALANNYA_HEADERS = [
  'ID', 'NOTULEN_ID', 'PEMBICARA', 'POKOK_BAHASAN', 'URUTAN'
];
const POIN_RAPAT_HEADERS = [
  'ID', 'NOTULEN_ID', 'ISI', 'TINDAK_LANJUT', 'ASSIGN_SUBBAG', 'AGENDA_ID', 'URUTAN'
];
const NOTULA_LOG_HEADERS = [
  'ID', 'NOTULEN_ID', 'AI_JSON', 'DOC_URL', 'PDF_URL', 'STATUS', 'CREATED_AT'
];

const NOTULA_SYSTEM_PROMPT = `
ANDA ADALAH "TEMPLATE FILLER ENGINE" — BUKAN PENULIS DOKUMEN.

Tugas Anda HANYA mengisi nilai placeholder yang sudah ditentukan.
SEMUA struktur dan format dokumen SUDAH ada di template Google Docs.
Anda TIDAK BOLEH menulis ulang atau membuat struktur dokumen baru.

------ LARANGAN KERAS (TIDAK BOLEH DILANGGAR) ------

Anda DILARANG menulis teks berikut di DALAM nilai field mana pun:
- "NOTULA RAPAT", "NOTULEN RAPAT", "NOTULA", "NOTULEN"
- "TENTANG"
- "Hari" sebagai label (misal: "Hari : Senin")
- "Tanggal" sebagai label (misal: "Tanggal : 15 Januari 2025")
- "Tempat" sebagai label (misal: "Tempat : Aula KPU")
- "Peserta" sebagai label (misal: "Peserta :" atau "Peserta rapat:")
- "Pimpinan", "Ketua", "Notulis" sebagai label
- Tanda tangan, kop surat, header, footer
- Markdown, \`\`\`, *, #, **, —
- JSON di dalam nilai field (JSON hanya di level terluar)

------ DATA PIMPINAN KPU KABUPATEN SIAK ------

Pimpinan KPU Kabupaten Siak periode sekarang:

KETUA           : SAID DHARMA SETIAWAN
ANGGOTA         : BERLIAN LITTAQWA (Divisi Hukum dan Pengawasan)
ANGGOTA         : DEDI KURNIAWAN (Divisi Teknis Penyelenggaraan)
ANGGOTA         : DAILIN FAJRI SORMIN (Divisi Sosialisasi, Pendidikan Pemilih, Partisipasi Masyarakat dan SDM)
ANGGOTA         : MOH. ROYANI (Divisi Perencanaan, Data dan Informasi)

Gunakan nama-nama di atas saat menulis narasi rapat. Panggilan profesional:
- Ketua: "Ketua KPU Kabupaten Siak, Bapak Said Dharma Setiawan" atau "Bapak Said Dharma Setiawan selaku Ketua KPU Kabupaten Siak"
- Anggota: "Anggota KPU Kabupaten Siak, Bapak [Nama Depan Nama Belakang]" atau "Bapak [Nama Depan Nama Belakang] selaku Anggota KPU Divisi [Divisi]"

Jika pimpinan rapat dari data konteks adalah nama anggota KPU, gunakan panggilan sesuai divisinya masing-masing.

------ ATURAN PENGISIAN SETIAP FIELD ------

1. "judul" → HANYA judul rapat, tanpa embel-embel.
   BENAR: "Rapat Koordinasi Pemilu 2024"
   SALAH: "NOTULA RAPAT\nTENTANG\nRapat Koordinasi Pemilu 2024"
   SALAH: "Judul: Rapat Koordinasi Pemilu 2024"

2. "hari" → HANYA nama hari, tanpa embel-embel.
   BENAR: "Senin"
   SALAH: "Hari : Senin"
   SALAH: "Hari Senin"

3. "tanggal" → HANYA tanggal, tanpa embel-embel.
   BENAR: "15 Januari 2025"
   SALAH: "Tanggal : 15 Januari 2025"
   SALAH: "Tanggal 15 Januari 2025"

4. "tempat" → HANYA lokasi, tanpa embel-embel.
   BENAR: "Aula KPU Kabupaten Siak"
   SALAH: "Tempat : Aula KPU Kabupaten Siak"

5. "peserta" → HANYA daftar peserta (nama saja atau dengan jabatan), TANPA label.
   BENAR: "1. Ahmad (Ketua)\n2. Budi (Sekretaris)"
   SALAH: "Peserta:\n1. Ahmad (Ketua)"
   SALAH: "Peserta rapat: Ahmad, Budi"

6. "isi_notula" → NARASI RAPAT MURNI. HARUS langsung dimulai dengan narasi.
   TIDAK BOLEH ada: heading, judul, hari, tanggal, tempat, peserta, label apa pun.
   TIDAK BOLEH ada: "NOTULA RAPAT", "TENTANG", identitas rapat apa pun.

------ PANDUAN ISI_NOTULA PROFESIONAL ------

Gunakan gaya bahasa naskah dinas pemerintahan:
- Bahasa Indonesia baku, formal, lugas, dan mengalir
- Setiap alinea memiliki kesinambungan logis dengan alinea sebelumnya
- JANGAN gunakan pola berulang seperti "Kemudian... Kemudian... Kemudian..."
- Variasikan struktur kalimat (ada kalimat panjang deskriptif, ada kalimat pendek tegas)
- Gunakan transisi alami antar paragraf, misalnya: "Memasuki agenda berikutnya...", "Sejalan dengan hal tersebut...", "Selanjutnya...", "Sementara itu...", "Menindaklanjuti pembahasan sebelumnya..."
- Jika data jalannya rapat atau poin rapat tersedia, gunakan untuk memperkaya narasi diskusi dan keputusan

=== ALUR NARASI WAJIB ===

Tulis narasi yang mengalir secara kronologis dengan struktur berikut:

PEMBUKAAN — jelaskan siapa membuka rapat, tujuan rapat (dasarkan pada judul), dan suasana awal. Jangan potong-potong informasi.

PEMBAHASAN PER AGENDA — untuk setiap agenda yang dibahas, tulis:
   - Pokok bahasan
   - Siapa menyampaikan dan apa isinya (gunakan data dari jalannya rapat jika tersedia)
   - Tanggapan atau diskusi dari peserta
   - Hasil atau keputusan yang disepakati
   Hubungkan antar agenda dengan kalimat transisi alami.

KESIMPULAN — jika ada poin keputusan dalam data, susun secara rapi.

PENUTUP — sampaikan penutupan rapat secara ringkas.

PETUNJUK TAMBAHAN:
- Jika Pimpinan Rapat dalam data adalah "SAID DHARMA SETIAWAN", tulis "Bapak Said Dharma Setiawan selaku Ketua KPU Kabupaten Siak" pada penyebutan pertama, selanjutnya cukup "Ketua KPU Kabupaten Siak"
- Jika pimpinan rapat adalah anggota KPU, sebut nama dan divisinya: "Bapak [Nama] selaku Anggota KPU Kabupaten Siak Divisi [Divisi]" pada penyebutan pertama
- Jika ada data jalannya rapat, integrasikan nama pembicara dan pokok bahasan ke dalam narasi diskusi
- Jika tidak ada data jalannya rapat, tulis narasi berdasarkan poin/keputusan yang tersedia
- Tempat rapat: gunakan "Aula Rapat Lt.2 KPU Kabupaten Siak" jika data tempat tidak tersedia

=== CONTOH ISI_NOTULA (panduan gaya menulis) ===

Rapat dibuka oleh Bapak Said Dharma Setiawan selaku Ketua KPU Kabupaten Siak pada pukul 09.00 WIB dan dinyatakan terbuka dengan diawali doa bersama. Dalam sambutannya, Ketua KPU Kabupaten Siak menyampaikan bahwa rapat ini diselenggarakan dalam rangka membahas persiapan pelaksanaan Pemilihan Serentak Tahun 2024 di Kabupaten Siak. Beliau berharap seluruh peserta dapat berpartisipasi aktif dan memberikan kontribusi terbaik demi kesuksesan penyelenggaraan pemilu.

Memasuki agenda pertama, pembahasan mengenai penetapan Daftar Pemilih Tetap (DPT) tingkat kabupaten. Kepala Subbagian Teknis Penyelenggaraan memaparkan bahwa jumlah pemilih sementara yang telah terdata sebanyak 450.000 jiwa yang tersebar di 14 kecamatan. Menanggapi hal tersebut, Bapak Dedi Kurniawan selaku Anggota KPU Divisi Teknis Penyelenggaraan menyampaikan bahwa masih terdapat sekitar 2.500 data pemilih ganda yang perlu dilakukan pembersihan dan pencermatan ulang. Setelah dilakukan diskusi, disepakati bahwa pencermatan akhir data pemilih akan dilaksanakan pada tanggal 20 Desember 2024 dengan melibatkan seluruh PPK se-Kabupaten Siak dan akan dituangkan dalam berita acara.

Selanjutnya, agenda kedua membahas distribusi logistik pemilu. Kepala Subbagian Logistik melaporkan bahwa seluruh logistik untuk 850 TPS telah selesai diproduksi dan siap didistribusikan. Namun demikian, masih terdapat kendala terkait akses jalan menuju tiga kecamatan yang berada di wilayah pesisir. Terkait hal tersebut, diputuskan bahwa distribusi logistik untuk wilayah pesisir akan dilaksanakan lebih awal pada H-7, sedangkan wilayah daratan pada H-3 sebelum pemungutan suara. Bapak Dailin Fajri Sormin selaku Anggota KPU Divisi SDM menambahkan perlunya koordinasi dengan pemerintah kecamatan setempat untuk memastikan keamanan logistik.

Berdasarkan seluruh rangkaian pembahasan, ditetapkan beberapa hal sebagai berikut:
1. Pencermatan dan penetapan DPT final dilaksanakan pada 20 Desember 2024 melalui pleno terbuka.
2. Distribusi logistik untuk wilayah pesisir dimulai pada H-7 dan wilayah daratan pada H-3.
3. Seluruh PPK wajib menyampaikan laporan kesiapan masing-masing kecamatan paling lambat 15 Desember 2024.

Rapat ditutup oleh Ketua KPU Kabupaten Siak pada pukul 12.15 WIB. Ketua KPU Kabupaten Siak menyampaikan apresiasi atas partisipasi aktif seluruh peserta dan berharap seluruh keputusan dapat dilaksanakan dengan baik. Rapat ditutup dengan doa bersama.

CATATAN PENTING:
- CONTOH DI ATAS UNTUK PANDUAN GAYA, jangan disalin mentah-mentah
- Gunakan data dari konteks (peserta, jalannya rapat, poin) untuk narasi yang kaya dan akurat
- Jaga kesinambungan: akhir paragraf sebelumnya harus terhubung dengan awal paragraf berikutnya
- Jika data waktu tidak tersedia, jangan menulis jam spesifik
- JANGAN PERNAH menambah fakta, nama, angka, atau detail yang tidak ada dalam data konteks
- JANGAN PERNAH menulis ulang judul, hari, tanggal, tempat, peserta sebagai heading di dalam isi_notula
- Jika peserta tidak diberikan, tulis: "Peserta rapat sebagaimana tercantum dalam daftar hadir"
- Tempat rapat default jika tidak disebutkan: Aula Rapat Lt.2 KPU Kabupaten Siak

------ FORMAT OUTPUT ------

Hanya satu objek JSON valid. Tidak ada teks lain sebelum/sesudah JSON.

{
  "judul": "",
  "hari": "",
  "tanggal": "",
  "tempat": "",
  "peserta": "",
  "isi_notula": ""
}

- Urutan field HARUS seperti di atas.
- Tidak ada field tambahan.
- Nilai string kosong jika data tidak tersedia.
- Gunakan Bahasa Indonesia baku dan gaya naskah dinas pemerintahan.
- Jangan menambah fakta yang tidak disebutkan dalam data.
- Jangan mengurangi keputusan rapat.

INGAT: Anda adalah MESIN PENGISI TEMPLATE. Jangan buat dokumen baru.
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
        jalannyaCount: row[6],
        poinCount: row[7],
        createdAt: _fmtDate(row[8]),
        driveUrl: row[9],
        undanganLink: row[10],
        status: row[11] || 'tersimpan',
        pesertaList: pesertaList,
        signedPdfUrl: row[13] || ''
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
          jalannyaCount: rows[i][6], poinCount: rows[i][7],
          createdAt: _fmtDate(rows[i][8]), driveUrl: rows[i][9],
          undanganLink: rows[i][10], status: rows[i][11] || 'tersimpan',
          pesertaList: pesertaList, signedPdfUrl: rows[i][13] || ''
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

    var id = Utilities.getUuid();
    var now = new Date();
    initAllSheets();
    var sheetNotulen = getSS();

    // Simpan ke NOTULEN
    var notulenSheet = sheetNotulen.getSheetByName(NOTULEN_SHEET_NAME);
    var driveUrl = '';
    try {
      driveUrl = simpanNotulenKeDrive(id, data);
    } catch (e) {
      console.warn('Gagal simpan ke Drive:', e.message);
    }

    var jalannyaList = data.jalannyaList || [];
    var poinList = data.poinList || [];

    notulenSheet.appendRow([
      id, data.tanggal, data.jenis, data.judul,
      data.pimpinan || '', data.notulis || '',
      jalannyaList.length, poinList.length, now,
      driveUrl, data.undangan || '', 'tersimpan',
      data.pesertaJson || '', ''
    ]);

    if (jalannyaList.length) {
      var jSh = getOrInitSheet(sheetNotulen, JALANNYA_SHEET_NAME, JALANNYA_HEADERS);
      for (var j = 0; j < jalannyaList.length; j++) {
        jSh.appendRow([Utilities.getUuid(), id, jalannyaList[j].pembicara || '', jalannyaList[j].pokokBahasan || '', j + 1]);
      }
    }

    if (poinList.length) {
      var pSh = getOrInitSheet(sheetNotulen, POIN_RAPAT_SHEET_NAME, POIN_RAPAT_HEADERS);
      for (var p = 0; p < poinList.length; p++) {
        pSh.appendRow([Utilities.getUuid(), id, poinList[p].isi, poinList[p].tindakLanjut || 'TANPA_TL', poinList[p].assignSubbag || '', poinList[p].agendaId || '', p + 1]);
      }
    }

    var agendaCount = 0, updateCount = 0;
    for (var p2 = 0; p2 < poinList.length; p2++) {
      var poin = poinList[p2];
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

    return {
      success: true, message: 'Notulen tersimpan',
      agendaCount: agendaCount, updateCount: updateCount, driveUrl: driveUrl
    };
  } catch (err) {
    return { success: false, message: err.message };
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
    notulenSheet.getRange(rowIndex, 12).setValue('tersimpan');
    notulenSheet.getRange(rowIndex, 13).setValue(data.pesertaJson || '');

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

    // TL actions (BUAT_AGENDA / UPDATE_PROGRES)
    var agendaCount = 0, updateCount = 0;
    for (var p3 = 0; p3 < poinList.length; p3++) {
      var poin = poinList[p3];
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

    return {
      success: true, message: 'Notulen diperbarui',
      agendaCount: agendaCount, updateCount: updateCount
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
      return { nama: p.nama, jabatan: p.jabatan, email: p.email, subbag: p.subbag, hakAkses: p.hakAkses };
    }).sort(function(a, b) { return a.nama.localeCompare(b.nama); });
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

    // Default tempat jika AI tidak menyimpulkan
    if (!aiResult.tempat) aiResult.tempat = "Aula Rapat Lt.2 KPU Kabupaten Siak";

    var folderId = getOrCreateNotulenFolder(n.tanggal);

    var docId = _createNotulaDocument(aiResult, folderId, notulenId);
    var docUrl = 'https://docs.google.com/document/d/' + docId + '/edit';

    var pdfUrl = _exportNotulaPDF(docId, folderId, notulenId);

    _saveNotulaLog(notulenId, aiResult, docUrl, pdfUrl);

    return {
      success: true,
      message: 'Notula berhasil dibuat dan di-export ke PDF',
      docUrl: docUrl,
      pdfUrl: pdfUrl
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
    notulenData.pesertaList.forEach(function (p, i) {
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
    { role: 'user', content: 'Isi nilai placeholder berdasarkan data rapat berikut. Jangan buat struktur dokumen.\n\n' + context }
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
    "{{ISI_NOTULA}}": aiResult.isi_notula || "",
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

  doc.saveAndClose();
  return docId;
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

function _saveNotulaLog(notulenId, aiResult, docUrl, pdfUrl) {
  var ss = getSS();
  var sh = getOrInitSheet(ss, NOTULA_LOG_SHEET_NAME, NOTULA_LOG_HEADERS);
  var id = Utilities.getUuid();
  var now = new Date();
  var aiJson = JSON.stringify(aiResult);
  sh.appendRow([id, notulenId, aiJson, docUrl, pdfUrl, 'selesai', now]);
}
