/* =========================================================
   E-Office KPU - BACKEND SYSTEM
   Versi 1.0.1
   Elektornik Laporan Kinerja Pegawai
   by arwp
========================================================= */

// Konfigurasi Sheet
const CONFIG = {
  SHEET_MASTER: 'MASTER_PEGAWAI',
  SHEET_AGENDA: 'AGENDA',
  SHEET_LOGS: 'SYSTEM_LOGS',
  TIMEZONE: 'Asia/Jakarta',
  VERSION: '1.1.0'
};

const CACHE_TTL = {
  MASTER: 600,
  AGENDA: 300,
  LAPORAN: 600
};

const SHEET_AGENDA_ID = "1JivPdetUS5lu5ZjJveqwhpKhwU5r0QiRb4GtJGXxDtA";
const SYSTEM_SECRET = 'KPU-SIAK-EAGENDA-2026';

function getCachedData(key, ttl, loaderFn) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);

  const data = loaderFn();
  cache.put(key, JSON.stringify(data), ttl);
  return data;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getStyles(moduleName) {
  let styles = include('style');

  if (moduleName) {
    try {
      styles += include('style_' + moduleName);
    } catch (e) {
      // Style tidak ditemukan
    }
  }

  return styles;
}

function doGet(e) {
  try {
    const params = e?.parameter || {};

    if (params.page === 'reset') {
      return HtmlService.createHtmlOutputFromFile('reset_password')
        .setTitle('Reset Password')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }

    if (params.verify) {
      const tpl = HtmlService.createTemplateFromFile('verify');
      tpl.cetakId = params.verify;
      return tpl.evaluate()
        .setTitle('Verifikasi Dokumen LHK')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }

    const routes = {
      'agenda-tindak-lanjut': {
        file: 'agenda',
        title: 'E-LKH | AGENDA',
        initPage: 'dashboard',
        allowFrame: false
      },
      absensi: {
        file: 'absensi',
        title: 'E-Office | PRESENSI WFA',
        initPage: 'absensi-kelola'
      },
      presensi: {
        file: 'presensi',
        title: 'E-Office | ABSENSI',
        initPage: 'presensi-kelola'
      },
      agenda: {
        file: 'index',
        title: 'E-Office | KPU SIAK',
        allowFrame: true,
        initPage: 'dashboard'
      },
      default: {
        file: 'index',
        title: 'E-Office | KPU SIAK',
        allowFrame: true,
        initPage: params.page || 'dashboard'
      }
    };


    const routeKey = routes[params.page]
      ? params.page
      : 'default';

    const route = routes[routeKey];


    const tpl = HtmlService.createTemplateFromFile(route.file);
    tpl.INIT_PAGE = route.initPage;

    const output = tpl.evaluate()
      .setTitle(route.title)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');

    if (route.allowFrame) {
      output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    return output;

  } catch (err) {
    return HtmlService.createHtmlOutput(
      `<h1>Error</h1><pre>${err.message}</pre>`
    );
  }
}

function initializeSheets() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let masterSheet = ss.getSheetByName(CONFIG.SHEET_MASTER);
    let agendaSheet = ss.getSheetByName(CONFIG.SHEET_AGENDA);
    let logSheet = ss.getSheetByName(CONFIG.SHEET_LOGS);

    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.SHEET_LOGS);
      const headers = ['TIMESTAMP', 'LEVEL', 'MODULE', 'MESSAGE'];
      logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      logSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      logSystem('Sheet SYSTEM_LOGS dibuat', 'INFO', 'Setup');
    }

    return {
      master: masterSheet,
      agenda: agendaSheet,
      logs: logSheet
    };

  } catch (error) {
    throw new Error('Gagal menginisialisasi sheets: ' + error.message);
  }
}

function logSystem(message, level = 'INFO', module = 'System') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(CONFIG.SHEET_LOGS);

    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.SHEET_LOGS);
      const headers = ['TIMESTAMP', 'LEVEL', 'MODULE', 'MESSAGE'];
      logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      logSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }

    const timestamp = new Date();
    logSheet.appendRow([
      timestamp,
      level,
      module,
      message.toString().substring(0, 500)
    ]);

    // logSheet.autoResizeColumns(1, 4);

    // Hapus log lama (lebih dari 1000 baris)
    const lastRow = logSheet.getLastRow();
    if (lastRow > 1000) {
      const rowsToDelete = lastRow - 800;
      if (rowsToDelete > 1) {
        logSheet.deleteRows(2, rowsToDelete);
        logSystem(`Dihapus ${rowsToDelete} log lama`, 'INFO', 'Cleanup');
      }
    }

  } catch (error) {
  }
}

function getSystemVersion() {
  return {
    version: CONFIG.VERSION,
    timestamp: new Date().toISOString(),
    timezone: CONFIG.TIMEZONE
  };
}

function getSystemInfo() {
  try {
    const ss = SpreadsheetApp.getActive();

    let masterCount = 0;
    let agendaCount = 0;
    let logCount = 0;

    const masterSheet = ss.getSheetByName(CONFIG.SHEET_MASTER);
    if (masterSheet && masterSheet.getLastRow() > 1) {
      masterCount = masterSheet.getLastRow() - 1;
    }

    const agendaSheet = ss.getSheetByName(CONFIG.SHEET_AGENDA);
    if (agendaSheet && agendaSheet.getLastRow() > 1) {
      agendaCount = agendaSheet.getLastRow() - 1;
    }

    const logSheet = ss.getSheetByName(CONFIG.SHEET_LOGS);
    if (logSheet && logSheet.getLastRow() > 1) {
      logCount = logSheet.getLastRow() - 1;
    }

    return {
      version: CONFIG.VERSION,
      sheets: {
        master: masterCount,
        agenda: agendaCount,
        logs: logCount
      },
      timestamp: new Date().toISOString(),
      timezone: CONFIG.TIMEZONE,
      url: ss.getUrl()
    };

  } catch (error) {
    return {
      error: error.message
    };
  }
}

// ---------- REGISTER & LOGIN --------------
function hashPassword(password) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const salt = 'e-agenda-pro-' + ss.getId().substring(0, 8);

    const digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password + salt,
      Utilities.Charset.UTF_8
    );

    return digest.reduce((str, byte) => {
      const hex = (byte < 0 ? byte + 256 : byte).toString(16);
      return str + (hex.length === 1 ? '0' : '') + hex;
    }, '');

  } catch (error) {
    throw new Error('Gagal memproses password');
  }
}

function verifyPassword(inputPassword, storedHash) {
  try {
    const hashedInput = hashPassword(inputPassword);
    return hashedInput === storedHash;
  } catch (error) {
    return false;
  }
}

function cekStatusUser() {
  try {
    initializeSheets();
    return {
      status: 'LOGIN_REQUIRED',
      message: 'Silakan login dengan email dan password'
    };

  } catch (error) {
    logSystem(`Error cek status: ${error.message}`, 'ERROR', 'Auth');
    return {
      status: 'ERROR',
      message: 'Terjadi kesalahan sistem: ' + error.toString()
    };
  }
}

function prosesLogin(data) {
  try {
    const { email, password } = data;

    if (!email || !password) {
      return {
        success: false,
        message: 'Email dan password harus diisi'
      };
    }

    const ss = SpreadsheetApp.getActive();
    const masterSheet = ss.getSheetByName(CONFIG.SHEET_MASTER);

    if (!masterSheet) {
      return {
        success: false,
        message: 'Database tidak ditemukan'
      };
    }

    const dbData = masterSheet.getDataRange().getValues();
    const userEmail = email.toLowerCase().trim();

    // Cari user berdasarkan email
    for (let i = 1; i < dbData.length; i++) {
      const row = dbData[i];
      const dbEmail = (row[8] || '').toString().toLowerCase().trim();

      if (dbEmail === userEmail) {
        const dbPassword = (row[9] || '').toString();

        if (!dbPassword) {
          return {
            success: false,
            message: 'Akun belum diaktivasi. Silakan daftar terlebih dahulu.'
          };
        }

        if (verifyPassword(password, dbPassword)) {
          const userData = {
            id: row[0],
            nama: row[1]?.toString() || '',
            nip: row[2]?.toString() || '',
            jabatan: row[3]?.toString() || '',
            gol: row[4]?.toString() || '',
            subbag: row[5]?.toString() || '',
            email: userEmail,
            level: row[12]?.toString() || '',
            nip_atasan: row[7]?.toString() || '',
            nama_atasan: row[6]?.toString() || '',
            level_presensi: row[13]?.toString() || ''
          };

          logSystem(`Login berhasil: ${userEmail}`, 'INFO', 'Auth');
          clearCache(CONFIG.SHEET_MASTER);

          return {
            success: true,
            message: 'Login berhasil',
            user: userData
          };
        } else {
          logSystem(`Password salah untuk: ${userEmail}`, 'WARN', 'Auth');
          return {
            success: false,
            message: 'Email atau password salah'
          };
        }
      }
    }

    logSystem(`Email tidak ditemukan: ${userEmail}`, 'WARN', 'Auth');
    return {
      success: false,
      message: 'Email tidak terdaftar'
    };

  } catch (error) {
    logSystem(`Login error: ${error.message}`, 'ERROR', 'Auth');

    return {
      success: false,
      message: 'Terjadi kesalahan: ' + error.message
    };
  }
}

function clearCache(name) {
  const cache = CacheService.getScriptCache();
  cache.remove(name);
}

function prosesDaftar(data) {
  try {
    const { nama, email, password } = data;

    if (!nama || !email || !password) {
      return {
        success: false,
        message: 'Semua field harus diisi'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: 'Password minimal 6 karakter'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Format email tidak valid'
      };
    }

    const ss = SpreadsheetApp.getActive();
    const masterSheet = ss.getSheetByName(CONFIG.SHEET_MASTER);

    if (!masterSheet) {
      return {
        success: false,
        message: 'Database master tidak ditemukan'
      };
    }

    const dbData = masterSheet.getDataRange().getValues();
    const userEmail = email.toLowerCase().trim();
    const userNama = nama.trim();

    for (let i = 1; i < dbData.length; i++) {
      const dbEmail = (dbData[i][8] || '').toString().toLowerCase().trim();
      if (dbEmail === userEmail) {
        return {
          success: false,
          message: 'Email ini sudah terdaftar'
        };
      }
    }

    let rowIndex = -1;
    for (let i = 1; i < dbData.length; i++) {
      const dbNama = (dbData[i][1] || '').toString().trim();

      if (dbNama === userNama) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      const newId = Utilities.getUuid();
      const now = new Date();

      masterSheet.appendRow([
        newId,           // ID
        userNama,        // NAMA
        '',              // NIP
        '',              // JABATAN
        '',              // GOLONGAN
        '',              // SUBBAG
        '',             //
        '',             //
        userEmail,       // EMAIL
        hashPassword(password), // PASSWORD
        'AKTIF',
        now
      ]);

      const lastRow = masterSheet.getLastRow();
      masterSheet.getRange(lastRow, 8).setNumberFormat('yyyy-MM-dd HH:mm:ss');

    } else {
      // Jika nama ditemukan, cek apakah sudah punya akun
      const existingEmail = (dbData[rowIndex][8] || '').toString().trim();
      if (existingEmail) {
        return {
          success: false,
          message: `Nama "${userNama}" sudah terdaftar dengan email ${existingEmail}`
        };
      }

      masterSheet.getRange(rowIndex + 1, 12).setValue(new Date());         // CREATED_AT
      masterSheet.getRange(rowIndex + 1, 9).setValue(userEmail);          // EMAIL
      masterSheet.getRange(rowIndex + 1, 10).setValue(hashPassword(password)); // PASSWORD
      masterSheet.getRange(rowIndex + 1, 11).setValue('AKTIF');           // STATUS
      masterSheet.getRange(rowIndex + 1, 12).setNumberFormat('yyyy-MM-dd HH:mm:ss');
    }

    logSystem(`Pendaftaran berhasil: ${userEmail} (${userNama})`, 'INFO', 'Auth');

    return {
      success: true,
      message: 'Pendaftaran berhasil! Silakan login dengan akun Anda'
    };

  } catch (error) {
    logSystem(`Daftar error: ${error.message}`, 'ERROR', 'Auth');

    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat pendaftaran'
    };
  }
}

function getMasterPegawai() {
  try {
    const ss = SpreadsheetApp.getActive();
    const masterSheet = ss.getSheetByName(CONFIG.SHEET_MASTER);

    if (!masterSheet || masterSheet.getLastRow() < 2) {
      return [];
    }

    const lastRow = masterSheet.getLastRow();
    const data = masterSheet.getRange(2, 2, lastRow - 1, 8).getValues();

    const result = data
      .filter(row => {
        const nama = (row[0] || '').toString().trim();
        return nama !== '';
      })
      .map(row => ({
        nama: row[0]?.toString().trim() || '',
        nip: row[1]?.toString().trim() || '',
        jabatan: row[2]?.toString().trim() || '',
        gol: row[3]?.toString().trim() || '',
        subbag: row[4]?.toString().trim() || '',
        email: row[7]?.toString().trim() || '',
        nip_atasan: row[6] || '',
        nama_atasan: row[5] || '',
        nip_sekretaris: '198010102009021004',
        nama_sekretaris: 'OKTAVIYANUS',
      }))
      .filter(pegawai => !pegawai.email);

    return result;

  } catch (error) {
    logSystem(`Get master error: ${error.message}`, 'ERROR', 'Data');
    return [];
  }
}

function getListPegawaiForMonitoring() {
  try {
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName(CONFIG.SHEET_MASTER);
    if (!sh) return [];

    const data = sh.getDataRange().getValues();
    const result = [];

    for (let i = 1; i < data.length; i++) {
      const nama = (data[i][1] || '').toString().trim();
      const subbag = (data[i][5] || '').toString().trim();
      const email = (data[i][8] || '').toString().toLowerCase().trim();
      const status = (data[i][10] || '').toString().toUpperCase().trim();

      if (nama && email && status === 'AKTIF') {
        result.push({ nama, subbag, email });
      }
    }

    // Sort by name
    return result.sort((a, b) => a.nama.localeCompare(b.nama));

  } catch (err) {
    console.error(err);
    return [];
  }
}

function getProfilByEmail(identifier) {
  try {

    if (!identifier) return null;

    const key = identifier.toString().toLowerCase().trim();

    const data = getCachedData(
      CONFIG.SHEET_MASTER,
      CACHE_TTL.MASTER,
      () => {
        const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_MASTER);
        return sh ? sh.getDataRange().getValues() : [];
      }
    );

    for (let i = 1; i < data.length; i++) {

      const email = (data[i][8] || '').toString().toLowerCase().trim();
      const nip   = (data[i][2] || '').toString().trim();

      if (email === key || nip === identifier.toString().trim()) {

        return {
          id: data[i][0] || '',
          nama: data[i][1] || '',
          nip: data[i][2] || '',
          jabatan: data[i][3] || '',
          gol: data[i][4] || '',
          subbag: data[i][5] || '',
          email: email,
          status: data[i][10] || '',
          nip_atasan: data[i][7] || '',
          nama_atasan: data[i][6],
          nip_sekretaris: '198010102009021004',
          nama_sekretaris: 'OKTAVIYANUS',
          created_at: data[i][11] || '',
          level:data[i][12] || '',
          level_presensi: data[i][13] || ''
        };
      }
    }

    return null;

  } catch (err) {
    console.error(err);
    return null;
  }
}

function updateProfil(data) {
  try {
    if (!data || !data.email) return { success: false, message: 'Data tidak lengkap' };

    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName(CONFIG.SHEET_MASTER);
    if (!sh) return { success: false, message: 'Database tidak ditemukan' };

    const rows = sh.getDataRange().getValues();
    var rowIndex = -1;
    var emailKey = data.email.toString().toLowerCase().trim();

    for (var i = 1; i < rows.length; i++) {
      var dbEmail = (rows[i][8] || '').toString().toLowerCase().trim();
      if (dbEmail === emailKey) { rowIndex = i + 1; break; }
    }

    if (rowIndex === -1) return { success: false, message: 'Pegawai tidak ditemukan' };

    if (data.nama !== undefined) sh.getRange(rowIndex, 2).setValue(data.nama);
    if (data.nip !== undefined) sh.getRange(rowIndex, 3).setValue(data.nip);
    if (data.jabatan !== undefined) sh.getRange(rowIndex, 4).setValue(data.jabatan);
    if (data.gol !== undefined) sh.getRange(rowIndex, 5).setValue(data.gol);
    if (data.subbag !== undefined) sh.getRange(rowIndex, 6).setValue(data.subbag);
    if (data.atasan !== undefined) sh.getRange(rowIndex, 7).setValue(data.atasan);
    if (data.nipAtasan !== undefined) sh.getRange(rowIndex, 8).setValue(data.nipAtasan);
    if (data.emailBaru !== undefined && data.emailBaru !== data.email) {
      sh.getRange(rowIndex, 9).setValue(data.emailBaru);
    }
    if (data.password) {
      sh.getRange(rowIndex, 10).setValue(hashPassword(data.password));
    }

    clearCache(CONFIG.SHEET_MASTER);
    return { success: true, message: 'Profil berhasil diperbarui' };
  } catch (err) {
    return { success: false, message: 'Gagal update profil: ' + err.message };
  }
}

// ---------- CRUD AGENDA --------------
function tambahAgenda(data) {
  try {
    if (!data.tanggal || !data.kegiatan || !data.hasil) {
      throw new Error('Tanggal, kegiatan, dan output wajib diisi');
    }

    if (!data.user || !data.user.email) {
      throw new Error('Data pengguna tidak valid');
    }

    const userEmail = data.user.email.toLowerCase().trim();
    const profil = getProfilByEmail(userEmail);

    if (!profil) {
      throw new Error('Profil tidak ditemukan. Silakan login ulang.');
    }

    const tanggalObj = new Date(data.tanggal);
    if (isNaN(tanggalObj.getTime())) {
      throw new Error('Format tanggal tidak valid');
    }

    const ss = SpreadsheetApp.getActive();
    const agendaSheet = ss.getSheetByName(CONFIG.SHEET_AGENDA);

    if (!agendaSheet) {
      throw new Error('Sheet agenda tidak ditemukan');
    }

    let keteranganFinal = (data.keterangan || '').trim();

    const id = Utilities.getUuid();
    const now = new Date();

    agendaSheet.appendRow([
      id,                        // ID
      userEmail,                 // EMAIL
      profil.nip || '',          // NIP
      profil.nama,               // NAMA
      data.tanggal,              // TANGGAL
      data.kegiatan.trim(),      // KEGIATAN
      data.hasil,                // HASIL
      keteranganFinal,            // KETERANGAN
      now,                       // CREATED_AT
      "MANUAL"                   // SUMBER_DATA
    ]);

    const cacheKey = getPeriodeKeyByTanggal(data.tanggal, userEmail);
    CacheService.getScriptCache().remove(cacheKey);

    return {
      success: true,
      message: 'Agenda berhasil disimpan',
      id: id
    };

  } catch (error) {
    logSystem(`Tambah agenda error: ${error.message}`, 'ERROR', 'Agenda');
    throw new Error('Gagal menyimpan agenda: ' + error.message);
  }
}

function updateAgenda(data) {
  try {
    if (!data.id) {
      throw new Error('ID agenda tidak valid');
    }

    if (!data.tanggal || !data.kegiatan || !data.hasil) {
      throw new Error('Tanggal, kegiatan, dan output wajib diisi');
    }

    if (!data.user || !data.user.email) {
      throw new Error('Data pengguna tidak valid');
    }

    const userEmail = data.user.email.toLowerCase().trim();
    const ss = SpreadsheetApp.getActive();
    const agendaSheet = ss.getSheetByName(CONFIG.SHEET_AGENDA);

    if (!agendaSheet) {
      throw new Error('Sheet agenda tidak ditemukan');
    }

    const tanggalObj = new Date(data.tanggal);
    if (isNaN(tanggalObj.getTime())) {
      throw new Error('Format tanggal tidak valid');
    }

    //const bulan = tanggalObj.getMonth() + 1; // 1 - 12
    //const tahun = tanggalObj.getFullYear();
    let keteranganFinal = (data.keterangan || '').trim();

    const agendaData = agendaSheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < agendaData.length; i++) {
      const row = agendaData[i];
      const rowId = row[0]?.toString();
      const rowEmail = (row[1] || '').toString().toLowerCase().trim();

      if (rowId === data.id && rowEmail === userEmail) {
        agendaSheet.getRange(i + 1, 5).setValue(data.tanggal);        // TANGGAL
        agendaSheet.getRange(i + 1, 6).setValue(data.kegiatan.trim());// KEGIATAN
        agendaSheet.getRange(i + 1, 7).setValue(data.hasil);          // HASIL
        agendaSheet.getRange(i + 1, 8).setValue(keteranganFinal);// KETERANGAN
        updated = true;
        break;
      }
    }

    if (!updated) {
      throw new Error('Agenda tidak ditemukan atau Anda tidak memiliki akses');
    }

    // const cacheKey = `AGENDA_30D_${userEmail}`;
    //const cacheKey = `AGENDA_${userEmail}_${bulan}_${tahun}`;
    const cacheKey = getPeriodeKeyByTanggal(data.tanggal, userEmail);
    CacheService.getScriptCache().remove(cacheKey);

    return {
      success: true,
      message: 'Agenda berhasil diperbarui'
    };

  } catch (error) {
    logSystem(`Update agenda error: ${error.message}`, 'ERROR', 'Agenda');
    throw new Error('Gagal memperbarui agenda: ' + error.message);
  }
}

function hapusAgenda(id) {
  try {
    if (!id) {
      throw new Error('ID agenda tidak valid');
    }
    throw new Error('Fungsi ini memerlukan konteks pengguna');

  } catch (error) {
    logSystem(`Hapus agenda error: ${error.message}`, 'ERROR', 'Agenda');
    throw new Error('Gagal menghapus agenda: ' + error.message);
  }
}

function hapusAgendaById(id, userEmail) {
  try {
    if (!id || !userEmail) {
      throw new Error('Parameter tidak lengkap');
    }

    const email = userEmail.toLowerCase().trim();
    const ss = SpreadsheetApp.getActive();
    const agendaSheet = ss.getSheetByName(CONFIG.SHEET_AGENDA);

    if (!agendaSheet) {
      throw new Error('Sheet agenda tidak ditemukan');
    }

    const agendaData = agendaSheet.getDataRange().getValues();
    let deleted = false;

    let tanggalAgenda = null;

    for (let i = 1; i < agendaData.length; i++) {
      const row = agendaData[i];
      const rowId = row[0]?.toString();
      const rowEmail = (row[1] || '').toString().toLowerCase().trim();

      if (rowId === id && rowEmail === email) {
        tanggalAgenda = row[4];
        agendaSheet.deleteRow(i + 1);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      throw new Error('Agenda tidak ditemukan atau Anda tidak memiliki akses');
    }

    logSystem(`Agenda dihapus oleh ${email}: ID ${id}`, 'INFO', 'Agenda');
    const cacheKey = getPeriodeKeyByTanggal(tanggalAgenda,email);
    CacheService.getScriptCache().remove(cacheKey);

    return {
      success: true,
      message: 'Agenda berhasil dihapus'
    };

  } catch (error) {
    logSystem(`Hapus agenda error: ${error.message}`, 'ERROR', 'Agenda');
    throw new Error('Gagal menghapus agenda: ' + error.message);
  }
}

function getFullDashboardData(filter) {
  try {
    if (!filter?.user?.email) {
      return {
        success: false,
        agenda: [],
        stats: { totalBulanIni: 0, tanggalTerakhir: '--' },
        message: 'Data pengguna tidak valid'
      };
    }

    const userEmail = filter.user.email.toLowerCase().trim();
    const bulan = parseInt(filter.bulan, 10); // 1–12
    const tahun = parseInt(filter.tahun, 10);

    if (!bulan || !tahun) {
      return {
        success: false,
        agenda: [],
        stats: { totalBulanIni: 0, tanggalTerakhir: '--' },
        message: 'Filter bulan atau tahun tidak valid'
      };
    }

    const cacheKey = `AGENDA_${userEmail}_${bulan}_${tahun}`;

    return getCachedData(cacheKey, CACHE_TTL.AGENDA, () => {
      const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_AGENDA);

      if (!sh) throw new Error('Sheet AGENDA tidak ditemukan');

      const data = sh.getDataRange().getValues();
      // Periode Kerja
      const startDate = new Date(tahun, bulan - 2, 21, 0, 0, 0);
      const endDate = new Date(tahun, bulan - 1, 20, 23, 59, 59);

      let totalBulanIni = 0;
      let lastDate = null;
      const agenda = [];

      for (let i = 1; i < data.length; i++) {
        if (
          String(data[i][1] || '').toLowerCase().trim() !== userEmail
        ) continue;

        const tgl = data[i][4];
        if (!(tgl instanceof Date)) continue;

        if (tgl < startDate || tgl > endDate) continue;

        totalBulanIni++;

        if (!lastDate || tgl > lastDate) {
          lastDate = tgl;
        }

        var sumberData = String(data[i][9] || '').trim();
        if (!sumberData) sumberData = 'MANUAL';
        agenda.push({
          id: data[i][0],
          tanggalISO: Utilities.formatDate(tgl, CONFIG.TIMEZONE, 'yyyy-MM-dd'),
          tanggal: Utilities.formatDate(tgl, CONFIG.TIMEZONE, 'dd MMM yyyy'),
          kegiatan: data[i][5] || '',
          hasil: data[i][6] || '',
          keterangan: data[i][7] || '',
          sumberData: sumberData
        });
      }

      // Urutkan terbaru → terlama
      agenda.sort((a, b) =>
        b.tanggalISO.localeCompare(a.tanggalISO)
      );

      return {
        success: true,
        agenda,
        stats: {
          totalBulanIni,
          tanggalTerakhir: lastDate
            ? Utilities.formatDate(lastDate, CONFIG.TIMEZONE, 'dd MMM yyyy')
            : '--'
        },
        message: agenda.length
          ? `Periode 21/${bulan - 1 || 12}/${bulan === 1 ? tahun - 1 : tahun} - akhir ${bulan}/${tahun} (${agenda.length})`
          : `Tidak ada agenda pada periode terpilih`
      };
    });

  } catch (error) {
    return {
      success: false,
      agenda: [],
      stats: { totalBulanIni: 0, tanggalTerakhir: '--' },
      message: 'Terjadi kesalahan sistem: ' + error.message
    };
  }
}

function getPeriodeKeyByTanggal(tanggal, email) {
  const d = new Date(tanggal);
  let bulan = d.getMonth() + 1;
  let tahun = d.getFullYear();

  // Jika tanggal >= 21 → masuk periode bulan berikutnya
  if (d.getDate() >= 21) {
    bulan++;
    if (bulan > 12) {
      bulan = 1;
      tahun++;
    }
  }

  return `AGENDA_${email}_${bulan}_${tahun}`;
}

function limitWords(text, maxWords = 100) {
  if (!text) return '';
  const words = String(text).trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
}

function getListLaporan(payload) {

  const email = payload.user.email;
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("PENGAJUAN_LHK");

  const data = sh.getDataRange().getValues();
  const hasil = [];

  for (let i = 1; i < data.length; i++) {

    if (String(data[i][1]).toLowerCase().trim() !== email) continue;

    hasil.push({
      periode: data[i][6],
      totalHari: data[i][7],
      totalAgenda: data[i][8],
      status: data[i][9],
      tanggal: Utilities.formatDate(new Date(data[i][11]), 'Asia/Jakarta', 'dd MMM yyyy HH:mm'),
      tanggalSetuju: String(data[i][12]).toString() != '' ? Utilities.formatDate(new Date(data[i][12]), 'Asia/Jakarta', 'dd MMM yyyy HH:mm') : '',
      fileUrl: data[i][14],
      namaFile: data[i][14],
      catatan:data[i][10]
    });
  }

  return {
    success: true,
    laporan: hasil.reverse()
  };
}

function parseFileName(fileName, userName) {
  try {
    // Format: LHK_AR. WAHYU PRADANA_Januari 2026.pdf
    const pattern = `LHK_${userName}_`;

    if (fileName.includes(pattern)) {
      const startIndex = fileName.indexOf(pattern) + pattern.length;
      const endIndex = fileName.lastIndexOf('.pdf');
      const rest = fileName.substring(startIndex, endIndex);
      const parts = rest.split(' ');

      if (parts.length >= 2) {
        const bulan = parts[0];
        const tahun = parseInt(parts[1]);

        const validMonths = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        const bulanLower = bulan.toLowerCase();
        const validBulan = validMonths.find(m => m.toLowerCase() === bulanLower);

        if (validBulan && !isNaN(tahun)) {
          return { bulan: validBulan, tahun: tahun };
        }
      }
    }


    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    for (const month of months) {
      if (fileName.includes(month)) {
        const yearMatch = fileName.match(/(20\d{2})/);
        const tahun = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

        return { bulan: month, tahun: tahun };
      }
    }

    return { bulan: 'Unknown', tahun: new Date().getFullYear() };

  } catch (error) {
    return { bulan: 'Unknown', tahun: new Date().getFullYear() };
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ---------- UPLOAD FILE AGENDA --------------
function simpanLaporanKeDrive(data) {
  if (!data || !data.base64) {
    throw new Error('Data file tidak valid.');
  }

  const ROOT_FINAL_FOLDER_ID = '1LGcju9xYYKB_PP25edSeqE1ewhwcAlFg'; // LHK 2026 SIGNED
  const tanggal = new Date(data.tanggal);
  if (isNaN(tanggal)) {
    throw new Error('Tanggal tidak valid.');
  }

  const nama = data.nama.toString().trim().toUpperCase();
  const email = data.email;
  const folderName = `${bulanIndonesia(tanggal.getMonth())} ${tanggal.getFullYear()}`;
  const rootFinal = DriveApp.getFolderById(ROOT_FINAL_FOLDER_ID);
  const folderFinal = getOrCreateFolder(rootFinal, folderName);
  const ext = data.namaFile.includes('.') ? data.namaFile.split('.').pop() : 'pdf';
  const finalFileName = `LHK_${nama}_${folderName}.${ext}`;

  // HAPUS JIKA FILE SUDAH ADA
  const existing = folderFinal.getFilesByName(finalFileName);
  while (existing.hasNext()) {
    existing.next().setTrashed(true);
  }

  const blob = Utilities.newBlob(
    Utilities.base64Decode(data.base64),
    data.mimeType,
    finalFileName
  );

  const file = folderFinal.createFile(blob);

  hapusFileSementara(folderName, finalFileName);

  // kirim email
  kirimNotifikasiEmail('UPLOAD_BERHASIL', {
    email,
    nama,
    fileName: finalFileName,
    fileUrl: file.getUrl(),
    folderName
  });


  return {
    fileId: file.getId(),
    url: file.getUrl(),
    fileName: finalFileName,
    folder: folderName,
    overwritten: true
  };
}

function hapusFileSementara(folderName, fileName) {
  try {
    const ROOT_TEMP_FOLDER_ID  = '1ux-rbkFYhNw6XQQxBmj50yK6wxw5lnAv'; // LHK 2026
    const rootTemp = DriveApp.getFolderById(ROOT_TEMP_FOLDER_ID);
    const folders = rootTemp.getFoldersByName(folderName);
    if (!folders.hasNext()) return;

    const tempFolder = folders.next();
    const files = tempFolder.getFilesByName(fileName);

    while (files.hasNext()) {
      files.next().setTrashed(true);
    }
  } catch (err) {
    // error handling
  }
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext()
    ? folders.next()
    : parent.createFolder(name);
}

function isWeekend(date) {
  const day = date.getDay(); // 0=Min, 6=Sab
  return day === 0 || day === 6;
}

function getEmailAtasan(masterData, namaAtasan) {
  if (!namaAtasan) return '';

  for (let i = 1; i < masterData.length; i++) {
    if (String(masterData[i][1]).trim() === String(namaAtasan).trim()) {
      return String(masterData[i][8]).toLowerCase().trim(); // kolom EMAIL
    }
  }
  return '';
}

// ---------- CETAK FILE AGENDA --------------
function cetakAgendaUser(payload) {
  try {
    const email = String(payload?.email || '').toLowerCase().trim();
    const periodeText = payload?.periode;
    const tglCetak = payload?.tglCetak;
    const isPreview = payload.preview === true;

    if (!email) return { success: false, message: 'Email tidak valid' };
    if (!periodeText) return { success: false, message: 'Periode tidak valid' };
    if (!tglCetak) return { success: false, message: 'Tanggal cetak tidak valid' };

    const parts = periodeText.split(' - ');
    if (parts.length !== 2) {
      return { success: false, message: 'Format periode salah' };
    }

    const start = parseTanggalIndonesia(parts[0]);
    const end = parseTanggalIndonesia(parts[1]);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const tanggalCetak = new Date(tglCetak);
    if (isNaN(tanggalCetak)) {
      return { success: false, message: 'Tanggal cetak tidak valid' };
    }

    tanggalCetak.setHours(0, 0, 0, 0);

    if (tanggalCetak < end) {
      return {
        success: false,
        message: 'Tanggal cetak tidak boleh lebih kecil dari tanggal akhir periode terpilih'
      };
    }

    const ss = SpreadsheetApp.getActive();
    const shPegawai = ss.getSheetByName(CONFIG.SHEET_MASTER);
    const pegawaiData = shPegawai.getDataRange().getValues();

    const pegawai = pegawaiData.find((r, i) =>
      i > 0 &&
      String(r[8]).toLowerCase().trim() === email &&
      String(r[10]).toUpperCase().trim() === 'AKTIF'
    );

    if (!pegawai) {
      return { success: false, message: 'Pegawai tidak ditemukan atau tidak aktif' };
    }

    const [
      ,
      nama,
      nip,
      jabatan,
      pangkat,
      subBagian,
    ] = pegawai;

    const cetakId =
      'LHK-' +
      Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss') +
      '-' +
      Utilities.getUuid().slice(0, 6).toUpperCase();

    const unitKerja = 'KPU Kabupaten Siak';
    const sheetName = 'LHK_PRINT_' + nip;
    const template = ss.getSheetByName('LHK_TEMPLATE');
    const oldSheet = ss.getSheetByName(sheetName);
    if (oldSheet) {
      ss.deleteSheet(oldSheet);
    }
    const sheet = template.copyTo(ss).setName(sheetName);

    sheet.getRange('C4').setValue(nama);
    sheet.getRange('C5').setValue(nip);
    sheet.getRange('C6').setValue(pangkat);
    sheet.getRange('C7').setValue(jabatan);
    sheet.getRange('C8').setValue(subBagian);
    sheet.getRange('C9').setValue(unitKerja);
    sheet.getRange('C10').setValue(periodeText);

    const shAgenda = ss.getSheetByName('AGENDA');
    const agendaData = shAgenda.getDataRange().getValues();

    const agendaMap = {};

    for (let i = 1; i < agendaData.length; i++) {
      const r = agendaData[i];
      if (String(r[1]).toLowerCase().trim() !== email) continue;

      const d = r[4];
      if (!(d instanceof Date) || d < start || d > end) continue;

      const key = Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
      agendaMap[key] = agendaMap[key] || { task: [], out: [], ket: [] };

      if (r[5]) agendaMap[key].task.push(r[5]);
      if (r[6]) agendaMap[key].out.push(r[6]);
      if (r[7]) agendaMap[key].ket.push(r[7]);
    }

    // METADATA AGENDA
    let totalHari = 0;
    let totalAgenda = 0;

    Object.values(agendaMap).forEach(a => {
      if (a.task.length || a.out.length || a.ket.length) {
        totalHari++;
        totalAgenda += a.task.length;
      }
    });

    // SIGNATURE OTENTIKASI
    const signatureRaw = [
      nip,
      periodeText,
      totalHari,
      totalAgenda,
      Utilities.formatDate(tanggalCetak, 'Asia/Jakarta', 'yyyy-MM-dd'),
      cetakId,
      SYSTEM_SECRET
    ].join('|');

    const signature = Utilities.base64Encode(
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        signatureRaw
      )
    );

    let row = 14;
    let no = 1;

    for (let d = new Date(start); d <= end && row <= 44; d.setDate(d.getDate() + 1)) {
      const key = Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
      const a = agendaMap[key] || { task: [], out: [], ket: [] };
      // let keteranganLibur = '';
      // let isLibur = false;

       // ===== SABTU / MINGGU =====
      // if (!isLibur && isWeekend(d)) {
        // keteranganLibur = hakAkses == 'JAGAT_SAKSANA' ? formatList(a.ket, 'number') : 'Libur Akhir Pekan';
      //   isLibur = true;
      // }

      const range =  sheet.getRange(row, 1, 1, 6);
      range.setValues([[
        no++,
        namaHariIndonesia(d),
        formatTanggalIndonesia(d),
        formatList(a.task, 'number'),
        formatList(a.out, 'number'),
        formatList(a.ket, 'number')
      ]]);

      // if (isLibur) {
      //   range.setFontColor('#b91c1c');
      // }

      row++;
    }

    sheet.getRange('E46').setValue('Siak Sri Indrapura, ' + formatTanggalIndonesia(tanggalCetak));
    sheet.getRange('E51').setValue(nama);
    sheet.getRange('E52').setValue('NIP. ' + nip);
    ss.setActiveSheet(sheet);
    sheet.getRange('A1:F52').activate();

    // ===== FOOTER DOKUMEN =====
    sheet.getRange('A54:F54')
      .merge()
      .setValue('Dokumen ini dicetak melalui Sistem E-Agenda KPU Kabupaten Siak | ID Cetak: '+ cetakId)
      .setFontSize(8)
      .setHorizontalAlignment('right')
      .setVerticalAlignment('middle');

    // QR CODE VERIFIKASI
    const verifyUrl ='https://tinyurl.com/lhk-kpusiak?verify=' + encodeURIComponent(cetakId);
    const qrUrl = 'https://quickchart.io/qr?size=150&text=' + encodeURIComponent(verifyUrl);
    const qrBlob = UrlFetchApp.fetch(qrUrl).getBlob().setName('qr.png');
    const qrImg = sheet.insertImage(qrBlob, 6, 49);
    qrImg.setWidth(75).setHeight(75);

    SpreadsheetApp.flush();
    Utilities.sleep(3000);

    const bulanTahun =  bulanIndonesia(end.getMonth()) + ' ' + end.getFullYear();
    const safeNama = safeFileName(nama);
    const finalFileName = `LHK_${safeNama}_${bulanTahun}.pdf`;
    const ROOT_FOLDER_ID = '1ux-rbkFYhNw6XQQxBmj50yK6wxw5lnAv'; // LHK 2026
    const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const folder = getOrCreateFolder(root, bulanTahun);

    const exportUrl = ss.getUrl().replace(/edit$/, '') +
    'export?format=pdf' +
    '&gid=' + sheet.getSheetId() +
    '&size=A4' +
    '&portrait=true' +
    '&fitw=true' +
    '&sheetnames=false' +
    '&printtitle=false' +
    '&pagenumbers=true' +
    '&gridlines=false' +
    '&fzr=false' +
    '&r1=0&r2=57&c1=0&c2=6';

    const response = UrlFetchApp.fetch(exportUrl, {
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      }
    });

    const pdfBlob = response.getBlob().setName(finalFileName);
    const existing = folder.getFilesByName(finalFileName);
    while (existing.hasNext()) {
      existing.next().setTrashed(true);
    }

    const file = folder.createFile(pdfBlob);

    if (isPreview) {
      return {
        success: true,
        preview: true,
        url: file.getUrl(),
        fileName: finalFileName
      };
    }

    logSystem(
      `CETAK_LHK|${cetakId}|${nip}|${nama}|${periodeText}|${totalHari}|${totalAgenda}|${signature}`,
      'INFO',
      'VERIFIKASI'
    );

    // AMBIL DATA ATASAN
    const namaAtasan = pegawai[6];
    const emailAtasan = getEmailAtasan(pegawaiData, namaAtasan);
    const statusPengajuan = emailAtasan ? "DIAJUKAN" : "DISETUJUI";

    const shPengajuan = ss.getSheetByName("PENGAJUAN_LHK");
    const dataPengajuan = shPengajuan.getDataRange().getValues();

    let ditemukan = false;

    // CEK APAKAH SUDAH ADA PENGAJUAN PERIODE INI
    for (let i = 1; i < dataPengajuan.length; i++) {

      const emailRow = String(dataPengajuan[i][1]).toLowerCase().trim();
      const periodeRow = dataPengajuan[i][6];

      if (emailRow === email && periodeRow === periodeText) {
        shPengajuan.getRange(i + 1, 8, 1, 7).setValues([[
          totalHari,              // TOTAL_HARI
          totalAgenda,            // TOTAL_AGENDA
          statusPengajuan,        // STATUS
          dataPengajuan[i][10],   // CATATAN tetap
          new Date(),             // DIAJUKAN_AT
          statusPengajuan === "DISETUJUI" ? new Date() : "",
          statusPengajuan === "DISETUJUI" ? email : ""
        ]]);

        shPengajuan.getRange(i + 1, 15).setValue(file.getUrl());

        ditemukan = true;
        break;
      }
    }

    // JIKA BELUM ADA, INSERT BARU
    if (!ditemukan) {
      shPengajuan.appendRow([
        cetakId,
        email,
        nama,
        nip,
        subBagian,
        emailAtasan || "-",
        periodeText,
        totalHari,
        totalAgenda,
        statusPengajuan,
        "",
        new Date(),
        statusPengajuan === "DISETUJUI" ? new Date() : "",
        statusPengajuan === "DISETUJUI" ? email : "",
        file.getUrl()
      ]);
    }

    // KIRIM KE ATASAN
    if(email == emailAtasan){
      setujuiPengajuan(cetakId,emailAtasan);
    }else{
      // file.addViewer(emailAtasan);
      kirimNotifikasiEmail('PENGAJUAN_LHK', {
        email: emailAtasan,
        namaAtasan: namaAtasan,
        namaPegawai: nama,
        nip: nip,
        jabatan: jabatan,
        subbag: subBagian,
        periode: periodeText,
        totalHari: totalHari,
        totalAgenda: totalAgenda,
        link: file.getUrl()
      });

      // Notifikasi ke pegawai
      kirimNotifikasiEmail('PENGAJUAN_DITERIMA', {
        email: email,
        nama: nama,
        periode: periodeText,
        tanggal: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd MMM yyyy'),
        fileUrl: file.getUrl()
      });
    }
  
    return {
      success: true,
      url: file.getUrl(),
      fileName: finalFileName,
      folder: bulanTahun
    };


  } catch (err) {
    Logger.log(err);
    return {
      success: false,
      message: 'Gagal mencetak agenda: ' + err.message
    };
  }
}

function verifyCetakLHK(cetakId) {
  if (!cetakId) {
    return { valid: false, message: 'ID cetak tidak diberikan' };
  }

  const ss = SpreadsheetApp.getActive();

  // ==========================
  // AMBIL DATA VERIFIKASI
  // ==========================
  const shLog = ss.getSheetByName('SYSTEM_LOGS');

  if (!shLog) {
    return { valid: false, message: 'Log sistem tidak ditemukan' };
  }

  const dataLog = shLog.getDataRange().getValues();

  let result = null;

  for (let i = dataLog.length - 1; i > 0; i--) {
    const message = dataLog[i][3];

    if (!message || typeof message !== 'string') continue;

    if (message.startsWith('CETAK_LHK|')) {

      const parts = message.split('|');

      if (parts[1] === cetakId) {

        result = {
          valid: true,
          cetakId: parts[1],
          nip: parts[2],
          nama: parts[3],
          periode: parts[4],
          totalHari: parts[5],
          totalAgenda: parts[6],
          signature: parts[7]
        };

        break;
      }
    }
  }

  if (!result) {
    return {
      valid: false,
      message: 'ID cetak tidak terdaftar dalam sistem'
    };
  }

  // ==========================
  // AMBIL LINK FILE PDF
  // ==========================
  const shPengajuan = ss.getSheetByName('PENGAJUAN_LHK');

  if (shPengajuan) {

    const dataPengajuan = shPengajuan.getDataRange().getValues();

    for (let i = 1; i < dataPengajuan.length; i++) {

      if (String(dataPengajuan[i][0]) === cetakId) {

        result.fileUrl = dataPengajuan[i][14] || '';
        break;
      }
    }
  }

  return result;
}

// function verifyCetakLHK(cetakId) {
//   if (!cetakId) {
//     return { valid: false, message: 'ID cetak tidak diberikan' };
//   }

//   const ss = SpreadsheetApp.getActive();
//   const sh = ss.getSheetByName('SYSTEM_LOGS');
//   if (!sh) {
//     return { valid: false, message: 'Log sistem tidak ditemukan' };
//   }

//   const data = sh.getDataRange().getValues();

//   for (let i = data.length - 1; i > 0; i--) {
//     const message = data[i][3];

//     if (!message || typeof message !== 'string') continue;

//     if (message.startsWith('CETAK_LHK|')) {
//       const parts = message.split('|');
//       if (parts[1] === cetakId) {
//         return {
//           valid: true,
//           cetakId: parts[1],
//           nip: parts[2],
//           nama: parts[3],
//           periode: parts[4],
//           totalHari: parts[5],
//           totalAgenda: parts[6],
//           signature: parts[7]
//         };
//       }
//     }
//   }

//   return {
//     valid: false,
//     message: 'ID cetak tidak terdaftar dalam sistem'
//   };
// }

function bulanIndonesia(index) {
  return [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ][index];
}

function safeFileName(text) {
  return String(text)
    .replace(/[^\w\s.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hitungHariWajibAgenda(bulan, tahun, level) {
  const { start, end } = getPeriodeKinerja(bulan, tahun);
  const liburMap = hariLibur();

  let total = 0;
  let d = new Date(start.getTime());

  while (d <= end) {

    if (level === 'JAGAT_SAKSANA') {
      total++;
    } else {
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        const key = Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
        if (!liburMap[key]) total++;
      }
    }

    d.setDate(d.getDate() + 1);
  }

  return total;
}

function hariLibur() {
  const sh = SpreadsheetApp.getActive().getSheetByName('LIBUR_NASIONAL');

  const map = {};
  if (!sh || sh.getLastRow() < 2) return map;

  const data = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();

  data.forEach(r => {
    const tgl = r[0];
    const flag = String(r[2] || '').toUpperCase().trim();

    if (tgl instanceof Date && flag === 'YA') {
      const key = Utilities.formatDate(
        tgl,
        'Asia/Jakarta',
        'yyyy-MM-dd'
      );
      map[key] = true;
    }
  });

  return map;
}

function getPeriodeKinerja(bulan, tahun) {

  const start = new Date(tahun, bulan - 2, 21);
  const end = new Date(tahun, bulan - 1, 20);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// ---------- MONITORING AGENDA --------------
function getMonitoringAgenda(filter) {

  try {

    const bulan = Number(filter.bulan);
    const tahun = Number(filter.tahun);

    const subbagFilter = (filter.subbag || '').trim();
    const emailFilter = (filter.emailPegawai || '').toLowerCase().trim();

    if (!bulan || !tahun) {
      throw new Error('Bulan dan tahun wajib diisi');
    }

    const ss = SpreadsheetApp.getActive();

    const shMaster    = ss.getSheetByName(CONFIG.SHEET_MASTER);
    const shAgenda    = ss.getSheetByName(CONFIG.SHEET_AGENDA);
    const shPengajuan = ss.getSheetByName("PENGAJUAN_LHK");

    const master    = shMaster.getDataRange().getValues();
    const agenda    = shAgenda.getDataRange().getValues();
    const pengajuan = shPengajuan.getDataRange().getValues();


    // HEADER MAP ARRAY
    const MH = {};
    master[0].forEach((h,i)=>MH[h.trim()] = i);

    const AH = {};
    agenda[0].forEach((h,i)=>AH[h.trim()] = i);

    const PH = {};
    pengajuan[0].forEach((h,i)=>PH[h.trim()] = i);


    // PERIODE KINERJA
    const { start, end } = getPeriodeKinerja(bulan, tahun);
    // const tahunAkhir = (bulan > 11) ? (tahun + 1) : tahun;
    // const bulanTahun = '21 ' + bulanIndonesia(bulan - 2) + ' ' + tahun + ' - 20 ' + bulanIndonesia(bulan - 1) + ' ' + tahunAkhir;
    const bulanTahun = getPeriodeString(bulan,tahun);

    // HITUNG JUMLAH AGENDA REAL
    const agendaMap = {};

    for (let i = 1; i < agenda.length; i++) {
      const email = String(agenda[i][AH.EMAIL] || '').toLowerCase().trim();
      const tgl = agenda[i][AH.TANGGAL];

      if (!(tgl instanceof Date)) continue;

      if (tgl < start || tgl > end) continue;

      if (!agendaMap[email]) agendaMap[email] = new Set();

      agendaMap[email].add(
        Utilities.formatDate(
          tgl,
          'Asia/Jakarta',
          'yyyy-MM-dd'
        )
      );

    }

    // MAP STATUS PENGAJUAN

    const pengajuanMap = {};

    for (let i = 1; i < pengajuan.length; i++) {

      const email = String(pengajuan[i][PH.EMAIL_PENGAJU] || '').toLowerCase().trim();

      const periode = String(pengajuan[i][PH.PERIODE] || '');

      if (periode !== bulanTahun) continue;

      pengajuanMap[email] = {
        status: pengajuan[i][PH.STATUS] || 'DIAJUKAN',
        link: pengajuan[i][PH.FILE_URL] || ''
      };

    }

    // BUILD RESULT

    const result = [];

    let jumlahDisetujui = 0;
    let jumlahDiajukan = 0;
    let jumlahBelum = 0;


    for (let i = 1; i < master.length; i++) {

      const nama = master[i][MH.NAMA];

      const subbag = master[i][MH.SUBBAG];

      const email = String(master[i][MH.EMAIL] || '').toLowerCase().trim();

      const level = String(master[i][MH.HAK_AKSES] || 'USER').toUpperCase().trim();

      const statusPegawai = master[i][MH.STATUS];

      if (statusPegawai !== 'AKTIF')
        continue;

      if (subbagFilter && subbag !== subbagFilter)
        continue;

      if (emailFilter && email !== emailFilter)
        continue;


      // HITUNG AGENDA
      const agendaTerisi = agendaMap[email]?.size || 0;

      const totalHariWajib = hitungHariWajibAgenda( bulan, tahun, level );
      const persentaseKinerja = totalHariWajib ? Math.min( 100, Math.round( agendaTerisi / totalHariWajib * 100 ) ) : 0;

      // STATUS PENGAJUAN
      const peng = pengajuanMap[email];
      const status = peng?.status || 'DRAFT';

      if (status === 'DISETUJUI')
        jumlahDisetujui++;
      else if (status === 'DIAJUKAN')
        jumlahDiajukan++;
      else
        jumlahBelum++;

      result.push({
        nama,
        subbag,
        email,
        level,
        totalHariWajib,
        agendaTerisi,
        persentaseKinerja,
        status,
        bulan,
        tahun,
        periode: bulanTahun,
        urlPengajuan: peng?.link || ''
      });
    }

    return {
      success: true,
      total: result.length,
      summary: {
        disetujui: jumlahDisetujui,
        diajukan: jumlahDiajukan,
        belum: jumlahBelum,
        persentaseDisetujui:
          result.length
            ? Math.round(
                jumlahDisetujui /
                result.length * 100
              )
            : 0
      },
      data: result
    };
  }

  catch (err) {

    return {
      success: false,
      message: err.message
    };

  }
}

function getPeriodeString(bulan, tahun) {

  const bulanList = [
    'Januari', 'Februari', 'Maret', 'April',
    'Mei', 'Juni', 'Juli', 'Agustus',
    'September', 'Oktober', 'November', 'Desember'
  ];

  const tanggalAkhir = new Date(tahun, bulan - 1, 20);
  const tanggalAwal = new Date(tahun, bulan - 1, 21);
  tanggalAwal.setMonth(tanggalAwal.getMonth() - 1);

  return `21 ${bulanList[tanggalAwal.getMonth()]} ${tanggalAwal.getFullYear()} - 20 ${bulanList[tanggalAkhir.getMonth()]} ${tanggalAkhir.getFullYear()}`;
}

function getAgendaUser(payload) {
  try {
    const email = String(payload.userEmail || '').toLowerCase().trim();
    const bulan = Number(payload.bulan);
    const tahun = Number(payload.tahun);
    const levelUser = payload.levelUser || '';

    if (!email || !bulan || !tahun) {
      throw new Error('Parameter tidak lengkap');
    }

    const ss = SpreadsheetApp.getActive();
    const shMaster = ss.getSheetByName(CONFIG.SHEET_MASTER);
    const shAgenda = ss.getSheetByName(CONFIG.SHEET_AGENDA);

    if (!shMaster || !shAgenda) {
      throw new Error('Sheet MASTER atau AGENDA tidak ditemukan');
    }

    // AMBIL PERIODE
    const { start, end } = getPeriodeKinerja(bulan, tahun);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    // CARI DATA PEGAWAI
    const master = shMaster.getDataRange().getValues();
    let nama = '';
    let subbag = '';

    for (let i = 1; i < master.length; i++) {
      if (String(master[i][8]).toLowerCase().trim() === email) {
        nama = master[i][1];
        subbag = master[i][5];
        break;
      }
    }

    if (!nama) {
      throw new Error('Pegawai tidak ditemukan: ' + email);
    }

    const agendaMap = {};
    let cursor = new Date(start);

    while (cursor <= end) {

      const keyISO = Utilities.formatDate(cursor, 'Asia/Jakarta', 'yyyy-MM-dd');
      const hariKe = cursor.getDay();
      const isWeekend = (hariKe === 0 || hariKe === 6);

      agendaMap[keyISO] = {
        tanggalISO: keyISO,
        tanggal: Utilities.formatDate(cursor, 'Asia/Jakarta', 'dd MMM yyyy'),
        hari: namaHariIndonesia(cursor),
        kegiatan: [],
        hasil: [],
        keterangan: isWeekend ? ['Libur Akhir Pekan'] : []
      };

      cursor.setDate(cursor.getDate() + 1);
    }

    const lastRow = shAgenda.getLastRow();
    if (lastRow < 2) {
      return { success: true, data: [] };
    }

    const agenda = shAgenda.getRange(2,1,lastRow-1,8).getValues();

    for (let i = 0; i < agenda.length; i++) {

      const tgl = agenda[i][4];

      if (!(tgl instanceof Date)) continue;

      tgl.setHours(0,0,0,0);
      if (tgl < start || tgl > end) continue;

      const rowEmail = String(agenda[i][1]).toLowerCase().trim();
      if (rowEmail !== email) continue;

      const keyISO = Utilities.formatDate(tgl, 'Asia/Jakarta', 'yyyy-MM-dd');
      if (!agendaMap[keyISO]) continue;

      agendaMap[keyISO].keterangan = [];

      if (agenda[i][5]) agendaMap[keyISO].kegiatan.push(agenda[i][5]);
      if (agenda[i][6]) agendaMap[keyISO].hasil.push(agenda[i][6]);
      if (agenda[i][7]) agendaMap[keyISO].keterangan.push(agenda[i][7]);
    }

    const agendaDetail = Object.values(agendaMap).sort(
      (a, b) => a.tanggalISO.localeCompare(b.tanggalISO)
    );

    // HITUNG KINERJA
    let hariTerisi = 0;

    for (let i = 0; i < agendaDetail.length; i++) {
      const d = agendaDetail[i];
      if (d.kegiatan.length || d.hasil.length) {
        hariTerisi++;
      }
    }

    const hariWajib = hitungHariWajibAgenda(bulan, tahun, levelUser);
    const hariTerhitung = Math.min(hariTerisi, hariWajib);

    const persentaseKinerja =
      hariWajib > 0
        ? Math.round((hariTerhitung / hariWajib) * 100)
        : 0;

    const potonganTPK = hitungPotonganTPK(persentaseKinerja);

    const statusTPK =
      potonganTPK === 0
        ? 'Memenuhi'
        : potonganTPK === 100
        ? 'TPK Tidak Diberikan'
        : 'Dikenakan Potongan';

    const periodeText =
      Utilities.formatDate(start, 'Asia/Jakarta', 'dd MMM yyyy') +
      ' – ' +
      Utilities.formatDate(end, 'Asia/Jakarta', 'dd MMM yyyy');


      // PANGGIL AI
      const ai = ringkasDanNilaiAgendaUser({
        nama,
        subbag,
        email,
        periode: periodeText,
        agendaDetail,
        kinerja: {
          levelUser,
          hariWajib,
          hariTerisi,
          persentase: persentaseKinerja,
          potonganTPK,
          status: statusTPK
        }
      });

      return {
        success: true,
        periode: periodeText,
        kinerja: {
          levelUser,
          hariWajib,
          hariTerisi,
          persentase: persentaseKinerja,
          potonganTPK,
          status: statusTPK
        },
        data: [{
          nama,
          subbag,
          email,
          agendaDetail
        }],
        ai: ai
      };
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
}

function hitungPotonganTPK(persen) {
  if (persen >= 71) return 0;
  if (persen >= 51) return 5;
  if (persen >= 11) return 7.5;
  if (persen >= 4) return 10;
  return 100;
}

// ---------- PENGAJUAN TTD ATASAN --------------

function getPengajuanUntukAtasan(emailAtasan) {

  const sh = SpreadsheetApp.getActive().getSheetByName("PENGAJUAN_LHK");
  const data = sh.getDataRange().getValues();

  const result = [];
  let jumlahDiajukan = 0;

  for (let i = 1; i < data.length; i++) {

    if (String(data[i][5]).toLowerCase().trim() !== emailAtasan) continue;

    const diajukanAt = data[i][11];
    const diprosesAt = data[i][12];
    if (data[i][9].toString() === "DIAJUKAN") jumlahDiajukan++;

    result.push({
      id: data[i][0],
      nama: data[i][2],
      periode: data[i][6],
      totalHari: data[i][7],
      status: data[i][9],
      tanggalRaw: diajukanAt,
      tanggal: diajukanAt
        ? Utilities.formatDate(new Date(diajukanAt), "Asia/Jakarta", "dd MMM yyyy HH:mm")
        : "",
      tanggalSetuju: diprosesAt
        ? Utilities.formatDate(new Date(diprosesAt), "Asia/Jakarta", "dd MMM yyyy HH:mm")
        : "",
      fileUrl: data[i][14],
      emailAtasan:emailAtasan
    });
  }

  result.sort((a, b) => {

    const priority = {
      "DIAJUKAN": 1,
      "DISETUJUI": 2,
      "DITOLAK": 3
    };

    const pa = priority[a.status] || 99;
    const pb = priority[b.status] || 99;

    if (pa !== pb) return pa - pb;

    return new Date(b.tanggalRaw) - new Date(a.tanggalRaw);

  });

  result.forEach(r => delete r.tanggalRaw);
  const notify = {
    verifikasiCount: jumlahDiajukan
  };

  return {
    success: true,
    data: result,
    notify: notify
  };
}

function setujuiPengajuan(id, emailAtasan) {

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("PENGAJUAN_LHK");
  const data = sh.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {

    if (data[i][0] === id) {

      const statusSekarang = data[i][9];
      if (statusSekarang !== "DIAJUKAN") {
        return { success: false, message: "Pengajuan sudah diproses" };
      }

      const emailPegawai = data[i][1];
      const namaPegawai  = data[i][2];
      const nip          = data[i][3];
      const periode      = data[i][6];
      const cetakId      = data[i][0]; // ID PENGAJUAN

      const now = new Date();
      const tanggalText = Utilities.formatDate(now, 'Asia/Jakarta', 'dd MMM yyyy HH:mm');

      const finalUrl = buatPdfFinalLHK({
        nip,
        namaPegawai,
        emailAtasan,
        cetakId,
        periode,
        emailPegawai
      });

      // update sheet
      sh.getRange(i + 1, 10).setValue("DISETUJUI");
      sh.getRange(i + 1, 13).setValue(now);
      sh.getRange(i + 1, 14).setValue(emailAtasan);
      sh.getRange(i + 1, 15).setValue(finalUrl);

      // kirim email
      kirimNotifikasiEmail('LHK_DISETUJUI', {
        email: emailPegawai,
        nama: namaPegawai,
        periode: periode,
        disetujuiOleh: emailAtasan,
        tanggal: tanggalText,
        fileUrl: finalUrl
      });

      logSystem(`APPROVE_LHK|${id}|${emailAtasan}`, 'INFO', 'VERIFIKASI');

      return { success: true };
    }
  }

  return { success: false, message: "Data tidak ditemukan" };
}

function buildVerifyUrl(cetakId) {
  return 'https://tinyurl.com/lhk-kpusiak?verify=' + encodeURIComponent(cetakId);
}

function generateQRCode(text, size = 150) {
  const url = 'https://quickchart.io/qr?size=' + size + '&text=' + encodeURIComponent(text);
  return UrlFetchApp.fetch(url).getBlob().setName('qr.png');
}

function buatPdfFinalLHK(payload) {

  const { nip, namaPegawai, emailAtasan, cetakId, periode, emailPegawai } = payload;

  const ss = SpreadsheetApp.getActive();
  const sheetName = 'LHK_PRINT_' + nip;
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error("Sheet cetak tidak ditemukan");
  }
  // QR VERIFIKASI DOKUME
  const verifyUrl = buildVerifyUrl(cetakId);
  const qrPegawaiBlob = generateQRCode(verifyUrl);
  const qrPegawai = sheet.insertImage(qrPegawaiBlob, 6, 49);
  qrPegawai.setWidth(75).setHeight(75);
  // QR PERSETUJUAN ATASA
  if(emailPegawai != emailAtasan){
    const approvalData = [
      cetakId,
      emailAtasan,
      Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm')
    ].join('|');

    const qrAtasanBlob = generateQRCode(approvalData);
    const qrAtasan = sheet.insertImage(qrAtasanBlob, 3, 49);
    qrAtasan.setWidth(75).setHeight(75);
  }

  SpreadsheetApp.flush();
  Utilities.sleep(1500);
  // EXPORT PD
  const safeNama = safeFileName(namaPegawai);
  const finalFileName = `LHK_${safeNama}_${periode}.pdf`;

  const ROOT_FINAL_FOLDER_ID = '1LGcju9xYYKB_PP25edSeqE1ewhwcAlFg';
  const root = DriveApp.getFolderById(ROOT_FINAL_FOLDER_ID);
  const folder = getOrCreateFolder(root, periode);

  const exportUrl = ss.getUrl().replace(/edit$/, '') +
    'export?format=pdf' +
    '&gid=' + sheet.getSheetId() +
    '&size=A4' +
    '&portrait=true' +
    '&fitw=true' +
    '&sheetnames=false' +
    '&printtitle=false' +
    '&pagenumbers=true' +
    '&gridlines=false' +
    '&fzr=false' +
    '&r1=0&r2=57&c1=0&c2=6';

  const response = UrlFetchApp.fetch(exportUrl, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
  });

  const pdfBlob = response.getBlob().setName(finalFileName);

  const existing = folder.getFilesByName(finalFileName);
  while (existing.hasNext()) {
    existing.next().setTrashed(true);
  }

  const file = folder.createFile(pdfBlob);

  return file.getUrl();
}

function tolakPengajuan(id, catatanBaru, emailAtasan) {

  const sh = SpreadsheetApp.getActive().getSheetByName("PENGAJUAN_LHK");
  const data = sh.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {

    if (data[i][0] === id) {

      const statusSekarang = data[i][9];
      if (statusSekarang !== "DIAJUKAN") {
        return { success: false, message: "Pengajuan sudah diproses" };
      }

      const emailPegawai = data[i][1];
      const namaPegawai  = data[i][2];
      const periode      = data[i][6];

      const catatanLama = data[i][10] || "";
      const now = new Date();
      const waktuText = Utilities.formatDate(now, 'Asia/Jakarta', 'dd MMM yyyy HH:mm');

      const catatanGabungan =
        (catatanLama ? catatanLama + "\n\n" : "") +
        `[${waktuText} - ${emailAtasan}]\n${catatanBaru}`;

      sh.getRange(i + 1, 10).setValue("DITOLAK");      // STATUS
      sh.getRange(i + 1, 11).setValue(catatanGabungan); // CATATAN
      sh.getRange(i + 1, 13).setValue(now);            // DIPROSES_AT
      sh.getRange(i + 1, 14).setValue(emailAtasan);    // DIPROSES_OLEH

      // kirim email
      kirimNotifikasiEmail('LHK_DITOLAK', {
        email: emailPegawai,
        nama: namaPegawai,
        periode: periode,
        catatan: catatanBaru
      });

      logSystem(`REJECT_LHK|${id}|${emailAtasan}`, 'INFO', 'VERIFIKASI');

      return { success: true };
    }
  }

  return { success: false, message: "Data tidak ditemukan" };
}

// ---------- RINGKASAN AI --------------

function formatAgendaUntukAI(agendaDetail) {
  let text = "";

  agendaDetail.forEach(d => {
    if (!d.kegiatan.length && !d.hasil.length) return;
    text += `${d.tanggal}\n`;
    d.kegiatan.forEach(k => {
      text += `Kegiatan: ${k}\n`;
    });
    d.hasil.forEach(h => {
      text += `Hasil: ${h}\n`;
    });
    text += "\n";

  });

  return text;
}

function ringkasDanNilaiAgendaUser(userData) {
  const agendaText = formatAgendaUntukAI( userData.agendaDetail );

  if (!agendaText) {
    return {
      ringkasan: "Tidak ada aktivitas agenda.",
      penilaian: "Tidak dapat dinilai",
      evaluasi: "Pegawai tidak memiliki data agenda."
    };
  }

  const messages = [
    {
      role: "system",
      content:
        "Anda adalah evaluator kinerja pegawai pemerintahan di lingkungan KPU. " +
        "Lakukan evaluasi secara objektif, profesional, singkat, dan berbasis fakta agenda kerja. " +
        "Jangan membuat asumsi yang tidak tertulis."
    },
    {
      role: "user",

      content: `
        Nama Pegawai:
        ${userData.nama}

        Subbagian:
        ${userData.subbag}

        Periode:
        ${userData.periode}

        Persentase Kinerja:
        ${userData.kinerja.persentase}%

        DAFTAR AGENDA:
        ${agendaText}

        TUGAS:

        Buat:

        1. Ringkasan Aktivitas
        2. Penilaian Kinerja
        3. Evaluasi Kinerja

        KATEGORI PENILAIAN:

        - Sangat Baik
        - Baik
        - Cukup
        - Kurang

        PEDOMAN PENILAIAN:

        "Sangat Baik"
        - agenda konsisten
        - aktivitas variatif
        - kontribusi administratif/operasional jelas
        - minim hari kosong

        "Baik"
        - agenda rutin berjalan normal
        - tugas administratif terlaksana konsisten

        "Cukup"
        - agenda monoton
        - banyak pengulangan
        - aktivitas terbatas
        - cukup banyak hari kosong

        "Kurang"
        - agenda sangat minim
        - tidak konsisten
        - dominan kosong/nihil

        ATURAN RINGKASAN:
        - maksimal 3 kalimat
        - fokus aktivitas utama
        - jangan hiperbola
        - jangan mengulang semua agenda

        ATURAN EVALUASI:
        - profesional
        - objektif
        - berdasarkan agenda nyata
        - jangan berlebihan
        - jangan membuat asumsi
        - jangan menyebut kontribusi strategis jika tidak ada
        - fokus operasional, administrasi, koordinasi, disiplin agenda

        CATATAN:
        - hari libur/tanggal merah bukan indikator negatif
        - agenda apel/rapat rutin tetap dihitung aktivitas kerja
        - agenda nihil tidak dihitung produktif
        - pengulangan aktivitas terlalu sering dapat menurunkan kualitas penilaian

        BATASI:
        - ringkasan maksimal 80 kata
        - evaluasi maksimal 120 kata

        OUTPUT JSON VALID:

        {
          "ringkasan": "...",
          "penilaian": "...",
          "evaluasi": "..."
        }

        Balas HANYA JSON valid tanpa markdown.
        `
    }
  ];

  const aiText = callOllama(messages);
  const cleaned = aiText

    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if ( start === -1 || end === -1 ) {
      throw new Error(
        'JSON tidak ditemukan'
      );
    }

    const jsonText = cleaned.substring( start, end + 1 );
    const parsed = JSON.parse(jsonText);

    return {
      ringkasan: parsed.ringkasan || '-',
      penilaian: parsed.penilaian || '-',
      evaluasi: parsed.evaluasi || '-'
    };

  } catch (e) {
    Logger.log(
      'AI RAW ERROR: ' + aiText
    );

    return {
      ringkasan: 'AI gagal memproses ringkasan.',
      penilaian: '-',
      evaluasi: cleaned
    };
  }
}

function callOllama(messages) {
  const apiKey = "68ac0b025b8a404d86dfe2699b97881d.fHei-922-h-lXC6YJtN46-4v";
  const url = "https://ollama.com/api/chat";
  const payload = {
    model: "gpt-oss:120b",
    messages: messages,
    stream: false
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  return json.message.content;
}

