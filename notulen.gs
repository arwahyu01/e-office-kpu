/* =========================================================
   NOTULEN RAPAT — E-OFFICE KPU SIAK (STANDALONE DB)
   ========================================================= */

const NOTULEN_SPREADSHEET_ID = "1hC8lzsHoukbQIfv-JNmZzx3u5pBoU7uY7bmktgU2_uA";
const NOTULEN_SHEET_NAME = 'NOTULEN';
const JALANNYA_SHEET_NAME = 'JALANNYA_RAPAT';
const POIN_RAPAT_SHEET_NAME = 'POIN_RAPAT';

const NOTULEN_HEADERS = [
  'ID', 'TANGGAL', 'JENIS', 'JUDUL', 'PIMPINAN',
  'NOTULIS', 'JALANNYA_COUNT', 'POIN_COUNT', 'CREATED_AT',
  'DRIVE_URL', 'UNDANGAN_LINK', 'STATUS'
];
const JALANNYA_HEADERS = [
  'ID', 'NOTULEN_ID', 'PEMBICARA', 'POKOK_BAHASAN', 'URUTAN'
];
const POIN_RAPAT_HEADERS = [
  'ID', 'NOTULEN_ID', 'ISI', 'TINDAK_LANJUT', 'ASSIGN_SUBBAG', 'AGENDA_ID', 'URUTAN'
];

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
        status: row[11] || 'tersimpan'
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
        notulen = {
          id: rows[i][0], tanggal: _fmtDate(rows[i][1]), jenis: rows[i][2],
          judul: rows[i][3], pimpinan: rows[i][4], notulis: rows[i][5],
          jalannyaCount: rows[i][6], poinCount: rows[i][7],
          createdAt: _fmtDate(rows[i][8]), driveUrl: rows[i][9],
          undanganLink: rows[i][10], status: rows[i][11] || 'tersimpan'
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
      driveUrl, data.undangan || '', 'tersimpan'
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
        var result = createAgenda({
          judul: '[Notulen] ' + poin.isi.substring(0, 100),
          picEmail: data.userEmail,
          sumber: 'RAPAT',
          jenis: data.jenis === 'RAPAT_PLENO' ? 'PLENO' : 'UMUM',
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
        var result = createAgenda({
          judul: '[Notulen] ' + poin.isi.substring(0, 100),
          picEmail: data.userEmail,
          sumber: 'RAPAT',
          jenis: data.jenis === 'RAPAT_PLENO' ? 'PLENO' : 'UMUM',
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
    var rows = _readSheet(sh, 12);
    var wfSh = ss.getSheetByName("MASTER_WORKFLOW");
    if (!wfSh) return false;
    var wfRows = _readSheet(wfSh, 1);
    for (var i = 1; i < rows.length; i++) {
      for (var j = 1; j < wfRows.length; j++) {
        if (wfRows[j][0] === rows[i][1]) {
          var existing = rows[i][9] || '';
          sh.getRange(i + 1, 10).setValue(existing + '\n[Notulen] ' + catatan);
          sh.getRange(i + 1, 12).setValue(new Date());
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    console.warn('Gagal update progress:', e.message);
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
