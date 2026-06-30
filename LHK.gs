/*****************************************************************
 * LHK GENERATOR
 * Sistem Otomatis Laporan Harian Kinerja (LHK)
 *
 * Dibuat dengan sepenuh hati oleh ARWP
 *
 * Catatan:
 * - Jangan mengubah struktur utama tanpa pemahaman yang cukup.
 * - Perubahan silakan dilakukan sesuai kebutuhan atau hubungi pengembang.
 *****************************************************************/

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('LHK')
    .addItem('Generate Agenda', 'generateAgenda')
    .addItem('Sync Libur Nasional', 'syncLiburNasionalICS')
    .addItem('Cetak LHK (PDF)', 'cetakLHK')
    .addToUi();
}

function onEdit(e) {
  try {
    const sheet = e.range.getSheet();
    if (sheet.getName() !== 'LHK') return;

    const a1 = e.range.getA1Notation();
    if (a1 !== 'C4' && a1 !== 'C10') return;

    const nama = sheet.getRange('C4').getValue();
    const periode = sheet.getRange('C10').getValue();

    if (!nama || !periode) return;

    const statusCell = sheet.getRange('E4');
    statusCell
      .setValue('⏳ Memproses LHK…')
      .setFontColor('#b26a00');

    SpreadsheetApp.flush();
    Utilities.sleep(300);

    generateAgenda();

    statusCell
      .setValue('✅ LHK diperbarui')
      .setFontColor('#1b5e20');
      
    clearStatusLater();

  } catch (err) {
    Logger.log(err);
    const sheet = e.range.getSheet();
    sheet.getRange('E4')
      .setValue('❌ Gagal memproses')
      .setFontColor('red');
      clearStatusLater();

  }
}

/**
 * Generate agenda LHK
 */
function generateAgenda() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('LHK');
  const shAgenda = ss.getSheetByName('AGENDA');

  const nama = String(sh.getRange('C4').getValue()).trim().toLowerCase();
  const periodeText = sh.getRange('C10').getValue();

  hitungTanggalCetak();

  if (!nama || !periodeText) {
    SpreadsheetApp.getUi().alert('Nama atau periode belum diisi.');
    return;
  }

  const parts = periodeText.split(' - ');
  if (parts.length !== 2) {
    SpreadsheetApp.getUi().alert('Format periode tidak valid.');
    return;
  }

  const start = parseTanggalIndonesia(parts[0]);
  const end = parseTanggalIndonesia(parts[1]);
  if (!(start instanceof Date) || !(end instanceof Date)) {
    SpreadsheetApp.getUi().alert('Tanggal periode tidak terbaca.');
    return;
  }

  // Normalisasi jam agar perbandingan tanggal aman
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const liburMap = buildLiburMap();

  const lastRow = shAgenda.getLastRow();
  if (lastRow < 2) return;

  const data = shAgenda.getRange(2, 1, lastRow - 1, 9).getValues();

  /** 
   * agendaMap hanya berisi:
   * - user terpilih
   * - tanggal dalam range periode
   */
  const agendaMap = Object.create(null);

  for (let i = 0; i < data.length; i++) {
    const r = data[i];

    const rNama = String(r[3]).trim().toLowerCase(); // kolom D
    const rDate = r[4];                              // kolom E

    if (
      rNama !== nama ||
      !(rDate instanceof Date) ||
      rDate < start ||
      rDate > end
    ) continue;

    const key = Utilities.formatDate(rDate, 'Asia/Jakarta', 'yyyy-MM-dd');

    if (!agendaMap[key]) {
      agendaMap[key] = { task: [], out: [], ket: [] };
    }

    if (r[5]) agendaMap[key].task.push(r[5]);
    if (r[6]) agendaMap[key].out.push(r[6]);
    if (r[7]) agendaMap[key].ket.push(r[7]);
  }

  const output = [];
  const fontColors = [];
  let no = 1;

  for (
    let d = new Date(start);
    d <= end && output.length < 31;
    d.setDate(d.getDate() + 1)
  ) {
    const key = Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
    const hari = namaHariIndonesia(d);
    const tanggal = formatTanggalIndonesia(d);

    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isLibur = isWeekend || liburMap[key];

    const agenda = agendaMap[key] || { task: [], out: [], ket: [] };

    output.push([
      no,
      hari,
      tanggal,
      formatList(agenda.task, 'number'), // 'dash','number'
      formatList(agenda.out, 'number'),
      formatList(agenda.ket, 'number')
    ]);

    fontColors.push([
      'black',
      isLibur ? 'red' : 'black',
      'black',
      'black',
      'black',
      'black'
    ]);

    no++;
  }

  sh.getRange('A14:F44').clearContent();
  sh.getRange(14, 1, output.length, 6).setValues(output);
  sh.getRange(14, 1, fontColors.length, 6).setFontColors(fontColors);
}

function uniqueArray(arr) {
  return [...new Set(arr.map(v => String(v).trim()))];
}

function formatList(arr, type = 'dash') {
  if (!arr || arr.length === 0) return '';
  if (arr.length === 1) return arr[0];

  if (type === 'number') {
    return arr.map((v, i) => `${i + 1}. ${v}`).join('\n');
  }

  // default dash
  return arr.map(v => `- ${v}`).join('\n');
}


/* =================================================
 * helper
 * ================================================= */

//  function buildLiburMap() {
//   const sh = SpreadsheetApp.getActive().getSheetByName('LIBUR_NASIONAL');
//   const map = {};
//   if (!sh || sh.getLastRow() < 2) return map;

//   const data = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
//   data.forEach(r => {
//     if (r[0] instanceof Date) {
//       const key = Utilities.formatDate(r[0], 'Asia/Jakarta', 'yyyy-MM-dd');
//       map[key] = r[1] || 'Libur Nasional';
//     }
//   });
//   return map;
// }

function buildLiburMap() {
  const sh = SpreadsheetApp.getActive().getSheetByName('LIBUR_NASIONAL');
  const map = {};

  if (!sh || sh.getLastRow() < 2) return map;
  const data = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();

  data.forEach(row => {
    const [tglRaw, keterangan, status] = row;
    if (String(status).toUpperCase().trim() !== 'YA') return;

    let tanggal;

    if (tglRaw instanceof Date) {
      tanggal = tglRaw;
    } else if (typeof tglRaw === 'string' && tglRaw.trim() !== '') {
      tanggal = new Date(tglRaw);
    }

    if (!tanggal || isNaN(tanggal)) return;

    const key = Utilities.formatDate(
      tanggal,
      'Asia/Jakarta',
      'yyyy-MM-dd'
    );

    map[key] = keterangan || 'Libur Nasional';
  });

  return map;
}


function syncLiburNasionalICS() {
  const ICS_URL =
    'https://calendar.google.com/calendar/ical/en.indonesian%23holiday%40group.v.calendar.google.com/public/basic.ics';

  const START_YEAR = 2025;

  const res = UrlFetchApp.fetch(ICS_URL, {
    muteHttpExceptions: true,
    followRedirects: true
  });

  if (res.getResponseCode() !== 200) {
    throw new Error('Gagal mengambil data libur nasional');
  }

  const lines = res.getContentText().split(/\r?\n/);

  const ss = SpreadsheetApp.getActive();
  const sh =
    ss.getSheetByName('LIBUR_NASIONAL') ||
    ss.insertSheet('LIBUR_NASIONAL');

  sh.clear();
  sh.getRange(1, 1, 1, 3).setValues([
    ['Tanggal', 'Keterangan', 'LIBUR']
  ]);

  let currentDate = null;
  let currentSummary = null;
  const rows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('DTSTART;VALUE=DATE:')) {
      const raw = line.replace('DTSTART;VALUE=DATE:', '').trim();
      const year = Number(raw.substring(0, 4));
      const month = Number(raw.substring(4, 6)) - 1;
      const day = Number(raw.substring(6, 8));

      currentDate = new Date(year, month, day);
    }

    if (line.startsWith('SUMMARY:')) {
      currentSummary = line.replace('SUMMARY:', '').trim();
    }

    if (currentDate && currentSummary) {
      if (currentDate.getFullYear() >= START_YEAR) {
        rows.push([
          currentDate,
          currentSummary,
          'YA'
        ]);
      }
      currentDate = null;
      currentSummary = null;
    }
  }
  
  rows.sort((a, b) => a[0] - b[0]);

  if (rows.length) {
    sh.getRange(2, 1, rows.length, 3).setValues(rows);
    sh.getRange('A2:A').setNumberFormat('yyyy-MM-dd');
  }

  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    `Sinkronisasi selesai: ${rows.length} libur nasional (≥ ${START_YEAR})`
  );
}


function getLiburNasional(date) {
  const sh = SpreadsheetApp.getActive().getSheetByName('LIBUR_NASIONAL');
  if (!sh || sh.getLastRow() < 2) return null;

  const data = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  const key = Utilities.formatDate(date, 'Asia/Jakarta', 'yyyy-MM-dd');

  for (const r of data) {
    if (r[0] instanceof Date) {
      const d = Utilities.formatDate(r[0], 'Asia/Jakarta', 'yyyy-MM-dd');
      if (d === key) return r[1];
    }
  }
  return null;
}

function cetakLHK() {
  const ROOT_FOLDER_ID = '1ux-rbkFYhNw6XQQxBmj50yK6wxw5lnAv'; // ini ID folder target, jika mau di ubah (KABARI ARWP)

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('LHK');

  const nama = sh.getRange('C4').getValue() || 'LHK';
  const periode = sh.getRange('C10').getValue() || '';

  if (!periode) {
    SpreadsheetApp.getUi().alert('Periode belum dipilih.');
    return;
  }

  const endText = periode.split(' - ')[1];
  const endDate = parseTanggalIndonesia(endText);
  const folderName = `${bulanIndonesia(endDate.getMonth())} ${endDate.getFullYear()}`;

  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const folder = getOrCreateFolder(root, folderName);

  const url = ss.getUrl().replace(/edit$/, '') +
    'export?format=pdf' +
    '&gid=' + sh.getSheetId() +
    '&size=A4' +
    '&portrait=true' +
    '&fitw=true' +
    '&sheetnames=false' +
    '&printtitle=false' +
    '&pagenumbers=false' +
    '&gridlines=false' +
    '&fzr=false' +
    '&r1=0&r2=52&c1=0&c2=6';

  const fileName = `LHK_${nama}_${folderName}.pdf`;

  deleteIfExists(folder, fileName);

  const blob = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
  }).getBlob().setName(fileName);

  const file = folder.createFile(blob);

    SpreadsheetApp.getUi().showModalDialog(
      HtmlService.createHtmlOutput(
        `<script>
          window.open('${file.getUrl()}', '_blank');
          google.script.host.close();
        </script>`
      ),
      'Cetak LHK'
    );
}

function parseTanggalIndonesia(teks) {
  const b = {
    januari:0,februari:1,maret:2,april:3,mei:4,juni:5,
    juli:6,agustus:7,september:8,oktober:9,november:10,desember:11
  };
  const p = teks.trim().split(' ');
  return new Date(p[2], b[p[1].toLowerCase()], p[0]);
}

function namaHariIndonesia(d) {
  return ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()];
}

function formatTanggalIndonesia(d) {
  const b = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return String(d.getDate()).padStart(2,'0')+' '+b[d.getMonth()]+' '+d.getFullYear();
}

function clearStatusLater() {
  Utilities.sleep(3000);
  const sh = SpreadsheetApp.getActive().getSheetByName('LHK');
  sh.getRange('E4').clearContent();
}

function hitungTanggalCetak() {
  const sh = SpreadsheetApp.getActive().getSheetByName('LHK');
  const periodeText = sh.getRange('C10').getValue();
  if (!periodeText) return;

  const endText = periodeText.split(' - ')[1];
  let d = parseTanggalIndonesia(endText);
  if (!(d instanceof Date)) return;

  d.setDate(d.getDate() + 1);

  while (true) {
    const key = Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
    const day = d.getDay();

    const isWeekend = day === 0 || day === 6;

    if (!isWeekend) break;

    d.setDate(d.getDate() + 1);
  }

  const hasil =
    'Siak Sri Indrapura, ' + formatTanggalIndonesia(d);

  sh.getRange('E46').setValue(hasil);
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext()
    ? folders.next()
    : parent.createFolder(name);
}

function bulanIndonesia(index) {
  return [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ][index];
}

function deleteIfExists(folder, fileName) {
  const files = folder.getFilesByName(fileName);
  while (files.hasNext()) {
    files.next().setTrashed(true);
  }
}




