/* =========================================================
   BACKEND AGENDA & TINDAK LANJUT — E-LKH KPU SIAK
   Versi 2.0
   - MASTER_ASSIGNMENT (relasi pegawai)
   - Wizard 3 langkah
   - Workflow dinamis + urutan
   - Progress + Evidence
   - Integrasi LKH
   ========================================================= */

const AGENDA_SPREADSHEET_ID = "1-xohP9CXPUIOL8Ar8L_L3xTOfs_S6fMkUj098nmyE10";
const AGENDA_MASTER_SHEET_ID = "1JivPdetUS5lu5ZjJveqwhpKhwU5r0QiRb4GtJGXxDtA";

const EVIDENCE_ROOT_FOLDER_ID = "17Qcb0BKL5s9suzeyleaZZ0ZImryDPZn6";

const AGENDA_SHEETS = {
  MASTER_AGENDA: "MASTER_AGENDA",
  MASTER_WORKFLOW: "MASTER_WORKFLOW",
  MASTER_PROGRESS: "MASTER_PROGRESS",
  MASTER_EVIDENCE: "MASTER_EVIDENCE",
  MASTER_ASSIGNMENT: "MASTER_ASSIGNMENT",
  MASTER_ACTIVITY_LOG: "MASTER_ACTIVITY_LOG",
  KALENDER_EVENT: "KALENDER_EVENT"
};

const AGENDA_HEADERS = {
  MASTER_AGENDA: [
    "ID","NOMOR_AGENDA","JUDUL","SUMBER","JENIS","SUBBAGIAN",
    "PRIORITAS","STATUS","TARGET_OUTPUT","DESKRIPSI","DASAR_AGENDA",
    "TANGGAL_MULAI","TANGGAL_SELESAI","CREATED_BY_EMAIL","CREATED_AT","UPDATED_AT",
    "DASAR_FILE_URL","ASSIGNMENT_TYPE"
  ],
  MASTER_WORKFLOW: [
    "ID","AGENDA_ID","URUTAN","NAMA_WORKFLOW","STATUS",
    "TARGET","PIC_EMAIL","KETERANGAN","TANGGAL_MULAI","TANGGAL_SELESAI","CREATED_AT","UPDATED_AT"
  ],
  MASTER_PROGRESS: [
    "ID","WORKFLOW_ID","URUTAN","NAMA_PROGRESS","STATUS",
    "PERSENTASE","TARGET","REALISASI","PJ_EMAIL","CATATAN",
    "CREATED_AT","UPDATED_AT","LKH_REFERENCE_ID","ANGGOTA_EMAILS"
  ],
  MASTER_EVIDENCE: [
    "ID","PROGRESS_ID","NAMA_FILE","LINK","KETERANGAN",
    "UPLOAD_BY_EMAIL","UPLOAD_AT","FILE_DRIVE_ID","MIME_TYPE"
  ],
  MASTER_ASSIGNMENT: [
    "ID","AGENDA_ID","EMAIL_PEGAWAI","ROLE","STATUS",
    "READ_AT","STARTED_AT","FINISHED_AT","CREATED_AT","UPDATED_AT"
  ],
  MASTER_ACTIVITY_LOG: [
    "ID","USER_EMAIL","AKTIVITAS","REFERENSI","WAKTU"
  ],
  KALENDER_EVENT: [
    "ID","USER_EMAIL","JUDUL","DESKRIPSI","TANGGAL_MULAI","TANGGAL_SELESAI","WARNA","CREATED_AT"
  ]
};

const AGENDA_TIMEZONE = "Asia/Jakarta";

function getAgendaSpreadsheet() {
  return SpreadsheetApp.openById(AGENDA_SPREADSHEET_ID);
}

function getMasterPegawaiSpreadsheet() {
  return SpreadsheetApp.openById(AGENDA_MASTER_SHEET_ID);
}

// =============================================
// INISIALISASI SHEET
// =============================================
function initAgendaDatabase() {
  const ss = getAgendaSpreadsheet();
  Object.keys(AGENDA_SHEETS).forEach(key => {
    const name = AGENDA_SHEETS[key];
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, AGENDA_HEADERS[key].length)
        .setValues([AGENDA_HEADERS[key]])
        .setFontWeight("bold")
        .setBackground("#f3f3f3");
      sh.setFrozenRows(1);
    }
  });
  return true;
}

function ensureAgendaSheets() {
  const cache = CacheService.getScriptCache();
  if (!cache.get("AGENDA_DB_INIT_v2")) {
    initAgendaDatabase();
    cache.put("AGENDA_DB_INIT_v2", "1", 21600);
  }
  ensureAgendaColumn();
}

// =============================================
// MASTER PEGAWAI — SINGLE SOURCE OF TRUTH
// =============================================
function getAllPegawai() {
  try {
    const ss = getMasterPegawaiSpreadsheet();
    const sh = ss.getSheetByName("MASTER_PEGAWAI");
    if (!sh) return [];
    const data = sh.getDataRange().getValues();
    const result = [];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][10] || "").toUpperCase().trim() !== "AKTIF") continue;
      result.push({
        no: Number(data[i][0]) || (i + 1),
        nama: String(data[i][1] || "").trim(),
        nip: String(data[i][2] || "").trim(),
        jabatan: String(data[i][3] || "").trim(),
        gol: String(data[i][4] || "").trim(),
        subbag: String(data[i][5] || "").trim(),
        atasan: String(data[i][6] || "").trim(),
        nipAtasan: String(data[i][7] || "").trim(),
        email: String(data[i][8] || "").trim().toLowerCase(),
        hakAkses: String(data[i][12] || "").trim(),
        idFinger: String(data[i][14] || "").trim()
      });
    }
    return result;
  } catch (err) {
    console.error("getAllPegawai error:", err);
    return [];
  }
}

function getPegawaiByEmail(email) {
  if (!email) return null;
  return getAllPegawai().find(p => p.email === email.toLowerCase().trim()) || null;
}

function getPegawaiMapByEmail() {
  const map = {};
  getAllPegawai().forEach(p => { map[p.email] = p; });
  return map;
}

function getPegawaiDropdown() {
  return getAllPegawai().map(p => ({
    email: p.email, nama: p.nama, nip: p.nip,
    jabatan: p.jabatan, subbag: p.subbag, hakAkses: p.hakAkses
  }));
}

function getPegawaiBySubbag(subbag) {
  return getAllPegawai().filter(p => p.subbag === subbag);
}

// =============================================
// HELPERS
// =============================================
function generateNomorAgenda() {
  const ss = getAgendaSpreadsheet();
  const sh = ss.getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
  const count = Math.max(0, sh.getLastRow() - 1);
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = String(now.getMonth() + 1).padStart(2, "0");
  const urut = String(count + 1).padStart(4, "0");
  return `AG/${tahun}/${bulan}/${urut}`;
}

function logAgendaActivity(userEmail, aktivitas, referensi) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_ACTIVITY_LOG);
    if (!sh) return;
    sh.appendRow([Utilities.getUuid(), userEmail, aktivitas, referensi || "", new Date()]);
  } catch (err) { console.error("log error:", err); }
}

// Helper: resolve workflowId → agendaId
function _workflowToAgendaId(workflowId) {
  if (!workflowId) return '';
  try {
    var sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
    if (!sh || sh.getLastRow() < 2) return '';
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === workflowId) return String(rows[i][1] || '').trim();
    }
  } catch(e) {}
  return '';
}

// Helper: resolve progressId → workflowId → agendaId
function _progressToAgendaId(progressId) {
  if (!progressId) return '';
  try {
    var sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
    if (!sh || sh.getLastRow() < 2) return '';
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === progressId) return _workflowToAgendaId(String(rows[i][1] || '').trim());
    }
  } catch(e) {}
  return '';
}

function clearAgendaCache() {
  CacheService.getScriptCache().remove("AGENDA_DB_INIT_v2");
}

function ensureAgendaColumn() {
  const ss = getAgendaSpreadsheet();
  Object.keys(AGENDA_SHEETS).forEach(key => {
    const sh = ss.getSheetByName(AGENDA_SHEETS[key]);
    if (!sh || sh.getLastRow() < 1) return;
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const targetHeaders = AGENDA_HEADERS[key];
    if (!targetHeaders) return;
    // Rename old header PIC_EMAIL → PJ_EMAIL
    if (key === 'MASTER_PROGRESS' && headers.length > 8 && String(headers[8] || '').trim() === 'PIC_EMAIL') {
      sh.getRange(1, 9).setValue('PJ_EMAIL');
    }
    targetHeaders.forEach((h, idx) => {
      if (idx >= headers.length) {
        sh.getRange(1, idx + 1).setValue(h);
      }
    });
  });
}

// =============================================
// CRUD AGENDA — WIZARD STEP 1+3
// =============================================
function deriveSumberFromDasar(dasarAgenda) {
  var map = {
    'HASIL_RAPAT_PLENO': 'RAPAT',
    'HASIL_RAPAT_INTERNAL_SEKRE': 'RAPAT',
    'RAPAT_INTERNAL_SUBBAG': 'RAPAT',
    'SURAT_PERINTAH_TUGAS': 'SURAT_TUGAS',
    'DISPOSISI_PIMPINAN': 'PIMPINAN',
    'INSTRUKSI_LANGSUNG': 'PIMPINAN',
    'KEGIATAN_RUTIN': 'RUTIN',
  };
  return map[dasarAgenda] || 'LAINNYA';
}

function getKategoriLabel(kat) {
  var map = {
    ADMINISTRASI: '📝 Administrasi',
    RAPAT: '🤝 Rapat & Koordinasi',
    PENYUSUNAN: '📄 Penyusunan Dokumen',
    VERIFIKASI: '🔍 Verifikasi & Monitoring',
    SOSIALISASI: '📢 Sosialisasi & Pelayanan',
    TEKNOLOGI: '💻 Teknologi Informasi',
    PERJALANAN: '🚗 Perjalanan Dinas',
    KEPEGAWAIAN: '👥 Kepegawaian & SDM',
    PENGEMBANGAN: '📚 Pengembangan Kompetensi',
    LAINNYA: '📦 Lainnya'
  };
  return map[kat] || kat || '📦 Lainnya';
}

function jenisToHasilType(jenis) {
  var laporanTypes = ['RAPAT','VERIFIKASI','SOSIALISASI','PERJALANAN','KEPEGAWAIAN','PENGEMBANGAN'];
  if (laporanTypes.indexOf(jenis) !== -1) return 'Laporan';
  return 'Dokumen';
}

function generateKeteranganLKH(hasilType, realisasi, progressNama, judulAgenda) {
  if (!realisasi) return 'Kegiatan ' + progressNama + ' pada agenda ' + judulAgenda + ' telah terlaksana dengan baik.';
  if (hasilType === 'Dokumen') return realisasi + ' Dokumen telah selesai dibuat.';
  if (hasilType === 'Laporan') return realisasi + ' Laporan telah disusun dengan baik.';
  return realisasi + ' ' + hasilType + ' telah selesai.';
}

function createAgenda(data) {
  try {
    ensureAgendaSheets();
    if (!data.judul) return { success: false, message: "Judul agenda wajib diisi", field: "judul" };
    if (!data.jenis) return { success: false, message: "Kategori aktivitas wajib dipilih", field: "jenis" };
    if (!data.dasarAgenda) return { success: false, message: "Dasar agenda wajib dipilih", field: "dasarAgenda" };
    if (!data.picEmail) return { success: false, message: "PIC wajib dipilih", field: "pic" };

    const ss = getAgendaSpreadsheet();
    const sh = ss.getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
    const id = Utilities.getUuid();
    const now = new Date();
    var sumber = data.sumber || deriveSumberFromDasar(data.dasarAgenda || '');

    sh.appendRow([
      id, generateNomorAgenda(), data.judul, sumber,
      data.jenis || "LAINNYA", data.subbagian || "",
      data.prioritas || "SEDANG", "RENCANA", data.targetOutput || "",
      data.deskripsi || "", data.dasarAgenda || "",
      data.tanggalMulai || "", data.tanggalSelesai || "",
      data.createdByEmail || "", now, now,
      data.dasarFileUrl || "",
      data.assignmentType || "SELF"
    ]);

    // Buat assignment
    createAssignments(id, data);

    logAgendaActivity(data.createdByEmail || "", "BUAT_AGENDA", id);
    clearAgendaCache();
    return { success: true, message: "Agenda berhasil dibuat", id: id };
  } catch (err) {
    return { success: false, message: "Gagal membuat agenda: " + err.message };
  }
}

function agendaUpdateAgenda(data) {
  try {
    if (!data.id) return { success: false, message: "ID tidak valid" };

    ensureAgendaSheets();
    const ss = getAgendaSpreadsheet();
    const sh = ss.getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
    const rows = sh.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        const r = i + 1;
        if (data.judul !== undefined) sh.getRange(r, 3).setValue(data.judul);
        if (data.sumber !== undefined) sh.getRange(r, 4).setValue(data.sumber);
        else if (data.dasarAgenda !== undefined) sh.getRange(r, 4).setValue(deriveSumberFromDasar(data.dasarAgenda));
        if (data.jenis !== undefined) sh.getRange(r, 5).setValue(data.jenis);
        if (data.subbagian !== undefined) sh.getRange(r, 6).setValue(data.subbagian);
        if (data.prioritas !== undefined) sh.getRange(r, 7).setValue(data.prioritas);
        if (data.status !== undefined) sh.getRange(r, 8).setValue(data.status);
        if (data.targetOutput !== undefined) sh.getRange(r, 9).setValue(data.targetOutput);
        if (data.deskripsi !== undefined) sh.getRange(r, 10).setValue(data.deskripsi);
        if (data.dasarAgenda !== undefined) sh.getRange(r, 11).setValue(data.dasarAgenda);
        if (data.tanggalMulai !== undefined) sh.getRange(r, 12).setValue(data.tanggalMulai);
        if (data.tanggalSelesai !== undefined) sh.getRange(r, 13).setValue(data.tanggalSelesai);
        if (data.dasarFileUrl !== undefined) sh.getRange(r, 17).setValue(data.dasarFileUrl);
        if (data.assignmentType !== undefined) sh.getRange(r, 18).setValue(data.assignmentType);
        sh.getRange(r, 16).setValue(new Date());
        SpreadsheetApp.flush();

        // Update assignments: hapus lama, buat baru
        const shAssign = ss.getSheetByName(AGENDA_SHEETS.MASTER_ASSIGNMENT);
        if (shAssign) {
          const assignRows = shAssign.getDataRange().getValues();
          for (let a = assignRows.length - 1; a >= 1; a--) {
            if (assignRows[a][1] === data.id) shAssign.deleteRow(a + 1);
          }
        }
        if (data.picEmail || data.assignmentType) {
          createAssignments(data.id, data);
        }

        logAgendaActivity(data.userEmail || "", "UPDATE_AGENDA", data.id);
        clearAgendaCache();
        return { success: true, message: "Agenda diperbarui" };
      }
    }
    return { success: false, message: "Agenda tidak ditemukan" };
  } catch (err) {
    return { success: false, message: "Gagal update: " + err.message };
  }
}

function deleteAgenda(id, userEmail) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        sh.deleteRow(i + 1);
        deleteRelatedData(id);
        logAgendaActivity(userEmail || "", "HAPUS_AGENDA", id);
        return { success: true, message: "Agenda dihapus" };
      }
    }
    return { success: false, message: "Agenda tidak ditemukan" };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function deleteRelatedData(agendaId) {
  const ss = getAgendaSpreadsheet();
  // Hapus assignment
  const shAssign = ss.getSheetByName(AGENDA_SHEETS.MASTER_ASSIGNMENT);
  if (shAssign) {
    const data = shAssign.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === agendaId) shAssign.deleteRow(i + 1);
    }
  }
  // Hapus workflow + progress + evidence
  const shWF = ss.getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
  if (shWF) {
    const wfData = shWF.getDataRange().getValues();
    for (let i = wfData.length - 1; i >= 1; i--) {
      if (wfData[i][1] === agendaId) {
        const wfId = wfData[i][0];
        deleteProgressAndEvidence(wfId);
        shWF.deleteRow(i + 1);
      }
    }
  }
}

function deleteProgressAndEvidence(wfId) {
  const ss = getAgendaSpreadsheet();
  const shProg = ss.getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
  const shEv = ss.getSheetByName(AGENDA_SHEETS.MASTER_EVIDENCE);
  if (!shProg) return;
  const data = shProg.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === wfId) {
      const progId = data[i][0];
      // Hapus evidence
      if (shEv) {
        const evData = shEv.getDataRange().getValues();
        for (let j = evData.length - 1; j >= 1; j--) {
          if (evData[j][1] === progId) shEv.deleteRow(j + 1);
        }
      }
      shProg.deleteRow(i + 1);
    }
  }
}

// =============================================
// MASTER_ASSIGNMENT ENGINE
// =============================================
function createAssignments(agendaId, data) {
  const targetType = data.assignmentType || "SELF";
  const emails = resolveAssignmentEmails(targetType, data);
  const ss = getAgendaSpreadsheet();
  const sh = ss.getSheetByName(AGENDA_SHEETS.MASTER_ASSIGNMENT);

  emails.forEach(email => {
    sh.appendRow([
      Utilities.getUuid(), agendaId, email,
      email === data.picEmail ? "PIC" : "ANGGOTA",
      "AKTIF", "", "", "", new Date(), new Date()
    ]);
    logAgendaActivity(email, "BUAT_ASSIGNMENT", agendaId);
  });
}

function resolveAssignmentEmails(targetType, data) {
  switch (targetType) {
    case "SELF":
      return data.picEmail ? [data.picEmail] : [];
    case "SPECIFIC":
      return (data.anggotaEmail || []).filter(Boolean);
    case "SUBBAG":
      return getPegawaiBySubbag(data.subbagian || "").map(p => p.email).filter(Boolean);
    case "ALL":
      return getAllPegawai().map(p => p.email).filter(Boolean);
    default:
      return data.picEmail ? [data.picEmail] : [];
  }
}

function getAssignmentsByAgendaId(agendaId) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_ASSIGNMENT);
    if (!sh || sh.getLastRow() < 2) return [];
    const data = sh.getDataRange().getValues();
    const pegawaiMap = getPegawaiMapByEmail();
    const result = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] !== agendaId) continue;
      const email = String(data[i][2] || "").trim();
      const peg = pegawaiMap[email] || null;
      result.push({
        id: data[i][0], agendaId: data[i][1], emailPegawai: email,
        nama: peg ? peg.nama : email, jabatan: peg ? peg.jabatan : "",
        subbag: peg ? peg.subbag : "", role: data[i][3],
        status: data[i][4], readAt: data[i][5], startedAt: data[i][6],
        finishedAt: data[i][7]
      });
    }
    return result;
  } catch (err) { return []; }
}

// =============================================
// GET LIST AGENDA + DETAIL
// =============================================
function getAgendaById(id) {
  try {
    ensureAgendaSheets();
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
    const rows = sh.getDataRange().getValues();
    const pegawaiMap = getPegawaiMapByEmail();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] !== id) continue;
      return formatAgendaRow(rows[i], pegawaiMap);
    }
    return null;
  } catch (err) { return null; }
}

function formatAgendaRow(row, pegawaiMap) {
  const createdBy = String(row[13] || "").trim();
  const creator = pegawaiMap[createdBy] || null;
  const now = new Date();

  let isOverdue = false;
  const tglSelesai = row[12];
  if (tglSelesai && String(row[7]) !== "SELESAI") {
    const d = new Date(String(tglSelesai) + "T23:59:59");
    if (!isNaN(d) && d < now) isOverdue = true;
  }

  return {
    id: row[0], nomorAgenda: row[1], judul: row[2],
    sumber: row[3], jenis: row[4], subbagian: row[5],
    prioritas: row[6], status: row[7],
    targetOutput: row[8], deskripsi: row[9],
    dasarAgenda: row[10],
    dasarFileUrl: row[16] || '',
    assignmentType: row[17] || 'SELF',
    tanggalMulai: row[11] instanceof Date ? Utilities.formatDate(row[11], AGENDA_TIMEZONE, "yyyy-MM-dd") : String(row[11] || ""),
    tanggalSelesai: row[12] instanceof Date ? Utilities.formatDate(row[12], AGENDA_TIMEZONE, "yyyy-MM-dd") : String(row[12] || ""),
    createdByEmail: createdBy,
    createdByNama: creator ? creator.nama : createdBy,
    createdAt: row[14] instanceof Date ? Utilities.formatDate(row[14], AGENDA_TIMEZONE, "dd MMM yyyy HH:mm") : String(row[14] || ""),
    updatedAt: row[15] instanceof Date ? Utilities.formatDate(row[15], AGENDA_TIMEZONE, "dd MMM yyyy HH:mm") : String(row[15] || ""),
    isOverdue: isOverdue
  };
}

function computeProgressSummary(agendaId, workflowsByAgenda, progressByWorkflow) {
  const wfs = workflowsByAgenda[agendaId] || [];
  let total = 0, done = 0;
  for (let wi = 0; wi < wfs.length; wi++) {
    const wf = wfs[wi];
    const wfId = String(wf[0] || '').trim();
    const list = progressByWorkflow[wfId] || [];
    total += list.length;
    for (let pi = 0; pi < list.length; pi++) {
      if (String(list[pi][4] || '').trim() === "SELESAI") done++;
    }
  }
  const persentase = total > 0 ? Math.round((done / total) * 100) : 0;
  return { persentase, totalWorkflow: wfs.length, totalProgress: total };
}

function formatAssignments(assignRows, pegawaiMap) {
  const result = [];
  for (let i = 0; i < assignRows.length; i++) {
    const row = assignRows[i];
    const email = String(row[2] || "").trim().toLowerCase();
    const peg = pegawaiMap[email] || null;
    result.push({
      id: row[0], agendaId: row[1], emailPegawai: email,
      nama: peg ? peg.nama : email, jabatan: peg ? peg.jabatan : "",
      subbag: peg ? peg.subbag : "", role: row[3],
      status: row[4], readAt: row[5], startedAt: row[6], finishedAt: row[7]
    });
  }
  return result;
}

function getListAgenda(filter) {
  try {
    ensureAgendaSheets();
    const ss = getAgendaSpreadsheet();
    const sh = ss.getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
    if (sh.getLastRow() < 2) return { success: true, data: [], stats: {} };

    // Batch-read all sheets ONCE
    const agendaRows = sh.getDataRange().getValues();
    const pegawaiMap = getPegawaiMapByEmail();

    const wfSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
    const wfRows = wfSh && wfSh.getLastRow() >= 2 ? wfSh.getDataRange().getValues() : [];
    const workflowsByAgenda = {};
    for (let i = 1; i < wfRows.length; i++) {
      const agId = String(wfRows[i][1] || '').trim();
      if (!workflowsByAgenda[agId]) workflowsByAgenda[agId] = [];
      workflowsByAgenda[agId].push(wfRows[i]);
    }

    const progSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
    const progRows = progSh && progSh.getLastRow() >= 2 ? progSh.getDataRange().getValues() : [];
    const progressByWorkflow = {};
    for (let i = 1; i < progRows.length; i++) {
      const wfId = String(progRows[i][1] || '').trim();
      if (!progressByWorkflow[wfId]) progressByWorkflow[wfId] = [];
      progressByWorkflow[wfId].push(progRows[i]);
    }

    const assignSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_ASSIGNMENT);
    const assignRows = assignSh && assignSh.getLastRow() >= 2 ? assignSh.getDataRange().getValues() : [];
    const assignmentsByAgenda = {};
    for (let i = 1; i < assignRows.length; i++) {
      const agId = String(assignRows[i][1] || '').trim();
      if (!assignmentsByAgenda[agId]) assignmentsByAgenda[agId] = [];
      assignmentsByAgenda[agId].push(assignRows[i]);
    }

    const userEmail = (filter?.userEmail || "").toLowerCase().trim();
    const statusFilter = (filter?.status || "").trim();
    const subbagFilter = (filter?.subbag || "").trim();

    let total=0, rencana=0, berjalan=0, selesai=0, overdue=0;
    const result = [];

    for (let i = 1; i < agendaRows.length; i++) {
      const a = formatAgendaRow(agendaRows[i], pegawaiMap);
      if (!a) continue;

      if (statusFilter && a.status !== statusFilter) continue;
      if (subbagFilter && a.subbagian !== subbagFilter) continue;

      total++;
      if (a.status === "RENCANA") rencana++;
      else if (a.status === "BERJALAN") berjalan++;
      else if (a.status === "SELESAI") selesai++;
      if (a.isOverdue) overdue++;

      const progressInfo = computeProgressSummary(a.id, workflowsByAgenda, progressByWorkflow);
      const agAssignments = assignmentsByAgenda[a.id] || [];
      const formattedAssignments = formatAssignments(agAssignments, pegawaiMap);

      result.push({
        ...a,
        progressPersentase: progressInfo.persentase,
        totalWorkflow: progressInfo.totalWorkflow,
        totalProgress: progressInfo.totalProgress,
        assignments: formattedAssignments,
        picNama: (formattedAssignments.find(as => as.role === "PIC") || formattedAssignments[0] || {}).nama || a.createdByNama,
        picEmail: (formattedAssignments.find(as => as.role === "PIC") || formattedAssignments[0] || {}).emailPegawai || a.createdByEmail
      });
    }

    result.sort((a, b) => {
      const tA = a.tanggalMulai || a.tanggalSelesai || "";
      const tB = b.tanggalMulai || b.tanggalSelesai || "";
      if (!tA && !tB) return 0;
      if (!tA) return 1;
      if (!tB) return -1;
      return tB.localeCompare(tA);
    });

    return {
      success: true, data: result,
      stats: { total, rencana, berjalan, selesai, overdue }
    };
  } catch (err) {
    return { success: false, message: err.message, data: [], stats: {} };
  }
}

function getAgendaDashboardStats(userEmail, role) {
  const list = getListAgenda({ userEmail, role });
  return list.success ? { success: true, stats: list.stats }
    : { success: false, stats: {} };
}

// =============================================
// DETAIL AGENDA (aggregate)
// =============================================
function getDetailAgenda(agendaId) {
  try {
    const agenda = getAgendaById(agendaId);
    if (!agenda) return { success: false, message: "Agenda tidak ditemukan" };

    const workflows = getWorkflowByAgendaId(agendaId);
    const workflowsWithProgress = workflows.map(wf => ({
      ...wf,
      progressList: getProgressByWorkflowId(wf.id).map(prog => ({
        ...prog,
        evidenceList: getEvidenceByProgressId(prog.id)
      }))
    }));

    const assignments = getAssignmentsByAgendaId(agendaId);
    const activityLog = getActivityLog(agendaId, 30);
    const progressSummary = getProgressSummary(agendaId);

    return {
      success: true, agenda, workflows: workflowsWithProgress,
      assignments, progressSummary, activityLog
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// WORKFLOW CRUD
// =============================================
function createWorkflow(data) {
  try {
    if (!data.agendaId || !data.namaWorkflow)
      return { success: false, message: "Data tidak lengkap" };
    const ss = getAgendaSpreadsheet();
    const sh = ss.getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
    const id = Utilities.getUuid();
    const urutan = data.urutan || (sh.getLastRow());
    sh.appendRow([id, data.agendaId, urutan, data.namaWorkflow, "RENCANA",
      data.target || "", data.picEmail || "", data.keterangan || "",
      data.tanggalMulai || "", data.tanggalSelesai || "",
      new Date(), new Date()]);
    logAgendaActivity(data.userEmail || "", "BUAT_WORKFLOW", data.agendaId);
    updateAgendaStatusFromWorkflow(data.agendaId);
    return { success: true, id };
  } catch (err) { return { success: false, message: err.message }; }
}

function updateWorkflow(data) {
  try {
    if (!data.id) return { success: false, message: "ID tidak valid" };
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        const r = i + 1, agendaId = rows[i][1];
        if (data.namaWorkflow) sh.getRange(r, 4).setValue(data.namaWorkflow);
        if (data.status) sh.getRange(r, 5).setValue(data.status);
        if (data.target) sh.getRange(r, 6).setValue(data.target);
        if (data.picEmail) sh.getRange(r, 7).setValue(data.picEmail);
        if (data.keterangan !== undefined) sh.getRange(r, 8).setValue(data.keterangan);
        if (data.tanggalMulai !== undefined) sh.getRange(r, 9).setValue(data.tanggalMulai);
        if (data.tanggalSelesai !== undefined) sh.getRange(r, 10).setValue(data.tanggalSelesai);
        if (data.urutan !== undefined) sh.getRange(r, 3).setValue(data.urutan);
        sh.getRange(r, 12).setValue(new Date());
        logAgendaActivity(data.userEmail || "", "UPDATE_WORKFLOW", agendaId);
        updateAgendaStatusFromWorkflow(agendaId);
        return { success: true, message: "Workflow diperbarui" };
      }
    }
    return { success: false, message: "Workflow tidak ditemukan" };
  } catch (err) { return { success: false, message: err.message }; }
}

function deleteWorkflow(id, userEmail) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        const agendaId = rows[i][1];
        deleteProgressAndEvidence(id);
        sh.deleteRow(i + 1);
        logAgendaActivity(userEmail || "", "HAPUS_WORKFLOW", agendaId);
        updateAgendaStatusFromWorkflow(agendaId);
        return { success: true, message: "Workflow dihapus" };
      }
    }
    return { success: false, message: "Workflow tidak ditemukan" };
  } catch (err) { return { success: false, message: err.message }; }
}

function reorderWorkflow(agendaId, workflowId, newUrutan) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
    const rows = sh.getDataRange().getValues();
    const wfs = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === agendaId) {
        wfs.push({ id: rows[i][0], urutan: rows[i][2], row: i + 1 });
      }
    }
    wfs.sort((a, b) => a.urutan - b.urutan);
    const idx = wfs.findIndex(w => w.id === workflowId);
    if (idx === -1) return { success: false, message: "Workflow tidak ditemukan" };

    // Hapus dari posisi lama
    const [item] = wfs.splice(idx, 1);
    // Masukkan di posisi baru
    wfs.splice(Math.min(newUrutan - 1, wfs.length), 0, item);
    // Update urutan
    wfs.forEach((w, i) => {
      sh.getRange(w.row, 3).setValue(i + 1);
    });
    return { success: true };
  } catch (err) { return { success: false, message: err.message }; }
}

function getWorkflowByAgendaId(agendaId) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
    if (!sh || sh.getLastRow() < 2) return [];
    const rows = sh.getDataRange().getValues();
    const pegawaiMap = getPegawaiMapByEmail();
    const result = [];
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) !== agendaId) continue;
      const picEmail = String(rows[i][6] || "").trim();
      const pic = pegawaiMap[picEmail] || null;
      result.push({
        id: rows[i][0], agendaId: rows[i][1], urutan: rows[i][2],
        namaWorkflow: rows[i][3], status: rows[i][4],
        target: rows[i][5], picEmail, picNama: pic ? pic.nama : picEmail,
        keterangan: rows[i][7],
        tanggalMulai: rows[i][8] instanceof Date ? Utilities.formatDate(rows[i][8], AGENDA_TIMEZONE, "yyyy-MM-dd") : String(rows[i][8] || ""),
        tanggalSelesai: rows[i][9] instanceof Date ? Utilities.formatDate(rows[i][9], AGENDA_TIMEZONE, "yyyy-MM-dd") : String(rows[i][9] || ""),
        createdAt: rows[i][10] instanceof Date ? Utilities.formatDate(rows[i][10], AGENDA_TIMEZONE, "dd MMM yyyy") : String(rows[i][10] || ""),
        updatedAt: rows[i][11] instanceof Date ? Utilities.formatDate(rows[i][11], AGENDA_TIMEZONE, "dd MMM yyyy") : String(rows[i][11] || "")
      });
    }
    return result.sort((a, b) => a.urutan - b.urutan);
  } catch (err) { return []; }
}

function updateAgendaStatusFromWorkflow(agendaId) {
  try {
    const wfs = getWorkflowByAgendaId(agendaId);
    if (!wfs.length) return;
    const allDone = wfs.every(w => w.status === "SELESAI");
    const anyStarted = wfs.some(w => w.status === "BERJALAN" || w.status === "SELESAI");

    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === agendaId) {
        if (allDone) sh.getRange(i + 1, 8).setValue("SELESAI");
        else if (anyStarted) sh.getRange(i + 1, 8).setValue("BERJALAN");
        sh.getRange(i + 1, 16).setValue(new Date());
        break;
      }
    }
  } catch (err) { console.error(err); }
}

// =============================================
// AUTO SAVE TO LKH (AGENDA sheet in E-Office spreadsheet)
// — Generate untuk PJ + semua Anggota
// =============================================
function autoSaveLKHAll(progressId, workflowId, pjEmail, anggotaEmails, namaProgress, realisasi, status, tanggalLkh) {
  try {
    if (status !== "SELESAI" || !realisasi) return;
    var allEmails = [pjEmail].concat(anggotaEmails || []).filter(Boolean);
    if (!allEmails.length) return;

    var wfSh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
    var wfRows = wfSh.getDataRange().getValues();
    var agendaId = "", wfNama = "", wfTarget = "";
    for (var w = 1; w < wfRows.length; w++) {
      if (wfRows[w][0] === workflowId) { agendaId = wfRows[w][1]; wfNama = wfRows[w][3]; wfTarget = String(wfRows[w][5] || "").trim(); break; }
    }

    var agendaJudul = "", agendaJenis = "";
    if (agendaId) {
      var agSh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
      var agRows = agSh.getDataRange().getValues();
      for (var a = 1; a < agRows.length; a++) {
        if (agRows[a][0] === agendaId) { agendaJudul = agRows[a][2]; agendaJenis = agRows[a][4]; break; }
      }
    }

    var elkhSs = SpreadsheetApp.openById(AGENDA_MASTER_SHEET_ID);
    var sh = elkhSs.getSheetByName("AGENDA");
    if (!sh) return;

    var now = new Date();
    var tglStr = tanggalLkh || Utilities.formatDate(now, AGENDA_TIMEZONE, "yyyy-MM-dd");
    var progSh2 = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
    var progRows2 = progSh2.getDataRange().getValues();
    var progTarget = "";
    for (var pt = 1; pt < progRows2.length; pt++) {
      if (progRows2[pt][0] === progressId) { progTarget = String(progRows2[pt][6] || "").trim(); break; }
    }
    var hasilLkh = progTarget || wfTarget || jenisToHasilType(agendaJenis || '');
    var kegiatanLkh = '[' + getKategoriLabel(agendaJenis) + '] ' + (agendaJudul || '') + ' — ' + (wfNama || '') + ' — ' + namaProgress;
    var keteranganLkh = generateKeteranganLKH(hasilLkh, realisasi, namaProgress, agendaJudul);
    var referensi = [progressId, workflowId, agendaId].filter(Boolean).join(':');

    var progSh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
    var progRows = progSh.getDataRange().getValues();
    var lkhRefIdsStr = "";
    var progRowNum = -1;
    for (var i = 1; i < progRows.length; i++) {
      if (progRows[i][0] === progressId) {
        lkhRefIdsStr = String(progRows[i][12] || "").trim();
        progRowNum = i + 1;
        break;
      }
    }
    var lkhRefIds = lkhRefIdsStr ? lkhRefIdsStr.split(',') : [];
    var newRefIds = [];
    var lkhData = sh.getDataRange().getValues();

    allEmails.forEach(function(email) {
      var peg = getPegawaiByEmail(email);
      var nama = peg ? peg.nama : email;
      var nip = peg ? peg.nip : "";

      var existingLkhId = "";
      for (var j = 0; j < lkhRefIds.length; j++) {
        if (lkhRefIds[j].indexOf(email + ':') === 0) {
          existingLkhId = lkhRefIds[j].split(':')[1];
          break;
        }
      }

      if (existingLkhId) {
        for (var r = 1; r < lkhData.length; r++) {
          if (String(lkhData[r][0] || '') === existingLkhId) {
            var rn = r + 1;
            sh.getRange(rn, 5).setValue(tglStr);
            sh.getRange(rn, 6).setValue(kegiatanLkh);
            sh.getRange(rn, 7).setValue(hasilLkh);
            sh.getRange(rn, 8).setValue(keteranganLkh);
            sh.getRange(rn, 9).setValue(now);
            sh.getRange(rn, 10).setValue("AGENDA");
            sh.getRange(rn, 11).setValue(referensi);
            break;
          }
        }
      } else {
        var lkhId = Utilities.getUuid();
        sh.appendRow([lkhId, email, nip, nama, tglStr, kegiatanLkh, hasilLkh, keteranganLkh, now, "AGENDA", referensi]);
        newRefIds.push(email + ':' + lkhId);
      }
    });

    if (newRefIds.length && progRowNum > 0) {
      var allRefs = lkhRefIds.concat(newRefIds);
      progSh.getRange(progRowNum, 13).setValue(allRefs.join(','));
    }
  } catch (err) {
    console.error("autoSaveLKHAll error:", err);
  }
}

// =============================================
// PROGRESS CRUD
// =============================================
function createProgress(data) {
  try {
    if (!data.workflowId || !data.namaProgress)
      return { success: false, message: "Data tidak lengkap" };
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
    const id = Utilities.getUuid();
    const urutan = data.urutan || (sh.getLastRow());
    var anggotaJson = data.anggotaEmails && data.anggotaEmails.length ? JSON.stringify(data.anggotaEmails) : '';
    sh.appendRow([id, data.workflowId, urutan, data.namaProgress,
      data.status || "RENCANA", data.persentase || 0,
      data.target || "", data.realisasi || "",
      data.pjEmail || "", data.catatan || "", new Date(), new Date(), '', anggotaJson]);
    autoSaveLKHAll(id, data.workflowId, data.pjEmail, data.anggotaEmails || [], data.namaProgress, data.realisasi, data.status || "RENCANA", data.tanggalLkh);
    var agendaId = _workflowToAgendaId(data.workflowId);
    logAgendaActivity(data.userEmail || "", "BUAT_PROGRESS", agendaId || data.workflowId);
    return { success: true, id };
  } catch (err) { return { success: false, message: err.message }; }
}

function updateProgress(data) {
  try {
    if (!data.id) return { success: false, message: "ID tidak valid" };
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        const r = i + 1, wfId = rows[i][1];
        if (data.namaProgress) sh.getRange(r, 4).setValue(data.namaProgress);
        if (data.status) sh.getRange(r, 5).setValue(data.status);
        if (data.persentase !== undefined) sh.getRange(r, 6).setValue(data.persentase);
        if (data.target !== undefined) sh.getRange(r, 7).setValue(data.target);
        if (data.realisasi !== undefined) sh.getRange(r, 8).setValue(data.realisasi);
        if (data.pjEmail) sh.getRange(r, 9).setValue(data.pjEmail);
        if (data.catatan !== undefined) sh.getRange(r, 10).setValue(data.catatan);
        if (data.anggotaEmails !== undefined) {
          sh.getRange(r, 14).setValue(data.anggotaEmails.length ? JSON.stringify(data.anggotaEmails) : '');
        }
        sh.getRange(r, 12).setValue(new Date());

        // Auto-update workflow status
        if (data.status === "SELESAI" || data.persentase === 100) {
          checkAndUpdateWorkflowStatus(wfId);
        } else if (data.status === "BERJALAN" || (data.persentase > 0)) {
          updateSingleWorkflowStatus(wfId, "BERJALAN");
        }

        var effStatus = data.status || rows[i][4];
        var effRealisasi = data.realisasi !== undefined ? data.realisasi : rows[i][7];
        var effNama = data.namaProgress || rows[i][3];
        var effPj = data.pjEmail || rows[i][8];
        var anggotaStr = String(rows[i][13] || '');
        var effAnggota = [];
        try { effAnggota = JSON.parse(anggotaStr); } catch(e) {}
        if (data.anggotaEmails !== undefined) effAnggota = data.anggotaEmails;
        autoSaveLKHAll(data.id, wfId, effPj, effAnggota, effNama, effRealisasi, effStatus, data.tanggalLkh);

        var agendaId2 = _workflowToAgendaId(wfId);
        logAgendaActivity(data.userEmail || "", "UPDATE_PROGRESS", agendaId2 || wfId);
        return { success: true, message: "Progress diperbarui" };
      }
    }
    return { success: false, message: "Progress tidak ditemukan" };
  } catch (err) { return { success: false, message: err.message }; }
}

function deleteProgress(id, userEmail) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        const wfId = rows[i][1];
        const shEv = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_EVIDENCE);
        if (shEv) {
          const evData = shEv.getDataRange().getValues();
          for (let j = evData.length - 1; j >= 1; j--) {
            if (evData[j][1] === id) shEv.deleteRow(j + 1);
          }
        }
        // Hapus LKH entry terkait
        var lkhRefStr = String(rows[i][12] || '').trim();
        if (lkhRefStr) {
          try {
            var lkhRefs = lkhRefStr.split(',');
            var lkhSheet = SpreadsheetApp.openById(AGENDA_MASTER_SHEET_ID).getSheetByName('AGENDA');
            if (lkhSheet && lkhSheet.getLastRow() >= 2) {
              var lkhData = lkhSheet.getDataRange().getValues();
              for (var li = lkhData.length - 1; li >= 1; li--) {
                var lkhIdCell = String(lkhData[li][0] || '').trim();
                for (var ri = 0; ri < lkhRefs.length; ri++) {
                  var parts = lkhRefs[ri].split(':');
                  if (parts.length === 2 && parts[1] === lkhIdCell) {
                    lkhSheet.deleteRow(li + 1);
                    break;
                  }
                }
              }
            }
          } catch(e) { console.error('cleanup LKH error:', e); }
        }
        sh.deleteRow(i + 1);
        checkAndUpdateWorkflowStatus(wfId);
        var agendaId3 = _workflowToAgendaId(wfId);
        logAgendaActivity(userEmail || "", "HAPUS_PROGRESS", agendaId3 || wfId);
        return { success: true, message: "Progress dihapus" };
      }
    }
    return { success: false, message: "Progress tidak ditemukan" };
  } catch (err) { return { success: false, message: err.message }; }
}

function getProgressByWorkflowId(workflowId) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
    if (!sh || sh.getLastRow() < 2) return [];
    const rows = sh.getDataRange().getValues();
    const pegawaiMap = getPegawaiMapByEmail();
    const result = [];
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) !== workflowId) continue;
      const pjEmail = String(rows[i][8] || "").trim();
      const pj = pegawaiMap[pjEmail] || null;
      var anggotaList = [];
      try { var raw = String(rows[i][13] || ''); if (raw) anggotaList = JSON.parse(raw); } catch(e) {}
      var anggotaNamaList = anggotaList.map(function(e) { var p = pegawaiMap[e]; return p ? p.nama : e; });
      result.push({
        id: rows[i][0], workflowId: rows[i][1], urutan: rows[i][2],
        namaProgress: rows[i][3], status: rows[i][4],
        persentase: rows[i][5], target: rows[i][6], realisasi: rows[i][7],
        pjEmail: pjEmail, pjNama: pj ? pj.nama : pjEmail,
        anggotaEmails: anggotaList,
        anggotaNamaList: anggotaNamaList,
        catatan: rows[i][9],
        createdAt: rows[i][10] instanceof Date ? Utilities.formatDate(rows[i][10], AGENDA_TIMEZONE, "dd MMM yyyy") : String(rows[i][10] || ""),
        updatedAt: rows[i][11] instanceof Date ? Utilities.formatDate(rows[i][11], AGENDA_TIMEZONE, "dd MMM yyyy") : String(rows[i][11] || "")
      });
    }
    return result.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
  } catch (err) { return []; }
}

function checkAndUpdateWorkflowStatus(workflowId) {
  try {
    const list = getProgressByWorkflowId(workflowId);
    const allDone = list.length > 0 && list.every(p => p.status === "SELESAI");
    updateSingleWorkflowStatus(workflowId, allDone ? "SELESAI" : "BERJALAN");
    if (allDone) {
      // Check if all workflows done → update agenda
      const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
      const rows = sh.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === workflowId) {
          updateAgendaStatusFromWorkflow(rows[i][1]);
          break;
        }
      }
    }
  } catch (err) { console.error(err); }
}

function updateSingleWorkflowStatus(workflowId, status) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === workflowId) {
        sh.getRange(i + 1, 5).setValue(status);
        sh.getRange(i + 1, 10).setValue(new Date());
        break;
      }
    }
  } catch (err) { console.error(err); }
}

function getProgressSummary(agendaId) {
  try {
    const wfs = getWorkflowByAgendaId(agendaId);
    let total = 0, done = 0;
    wfs.forEach(wf => {
      const list = getProgressByWorkflowId(wf.id);
      total += list.length;
      done += list.filter(p => p.status === "SELESAI").length;
    });
    const persentase = total > 0 ? Math.round((done / total) * 100) : 0;
    const status = total === 0 ? "RENCANA" : done === total ? "SELESAI" : done > 0 ? "BERJALAN" : "RENCANA";
    return { persentase, totalWorkflow: wfs.length, totalProgress: total };
  } catch (err) { return { persentase: 0, totalWorkflow: 0, totalProgress: 0 }; }
}

// =============================================
// EVIDENCE CRUD
// =============================================
function createEvidence(data) {
  try {
    if (!data.progressId || !data.namaFile)
      return { success: false, message: "Data tidak lengkap" };
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_EVIDENCE);
    sh.appendRow([Utilities.getUuid(), data.progressId, data.namaFile,
      data.link || "", data.keterangan || "",
      data.uploadByEmail || "", new Date(),
      data.fileDriveId || "", data.mimeType || ""]);
    var agendaId4 = _progressToAgendaId(data.progressId);
    logAgendaActivity(data.uploadByEmail || "", "UPLOAD_EVIDENCE", agendaId4 || data.progressId);
    return { success: true, message: "Evidence ditambahkan" };
  } catch (err) { return { success: false, message: err.message }; }
}

/**
 * Upload a single file to Drive and create evidence row.
 * Called from client via google.script.run with file blob.
 */
function createEvidenceFile(progressId, fileBlob, keterangan, uploadByEmail) {
  try {
    if (!progressId || !fileBlob)
      return { success: false, message: "Data tidak lengkap" };
    var folder = _getEvidenceFolder(progressId);
    var driveFile = folder.createFile(fileBlob);
    driveFile.setDescription("Evidence for progress: " + progressId);
    var fileUrl = driveFile.getUrl();
    var fileName = driveFile.getName();
    var mimeType = fileBlob.getContentType() || driveFile.getMimeType() || "";
    var fileDriveId = driveFile.getId();
    var id = Utilities.getUuid();
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_EVIDENCE);
    sh.appendRow([id, progressId, fileName, fileUrl, keterangan || "",
      uploadByEmail || "", new Date(), fileDriveId, mimeType]);
    var agendaId4 = _progressToAgendaId(progressId);
    logAgendaActivity(uploadByEmail || "", "UPLOAD_EVIDENCE", agendaId4 || progressId);
    return {
      success: true, id: id, namaFile: fileName, link: fileUrl,
      fileDriveId: fileDriveId, mimeType: mimeType
    };
  } catch (err) {
    return { success: false, message: "Gagal upload file: " + err.message };
  }
}

function createEvidenceFileFromBase64(progressId, base64Data, fileName, keterangan, uploadByEmail) {
  try {
    if (!progressId || !base64Data || !fileName)
      return { success: false, message: "Data tidak lengkap" };
    var matches = base64Data.match(/^data:(.*);base64,(.*)$/);
    if (!matches) return { success: false, message: "Format data tidak valid" };
    var mimeType = matches[1];
    var base64 = matches[2];
    var folder = _getEvidenceFolder(progressId);
    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName);
    var driveFile = folder.createFile(blob);
    driveFile.setDescription("Evidence for progress: " + progressId);
    var fileUrl = driveFile.getUrl();
    var fileDriveId = driveFile.getId();
    var id = Utilities.getUuid();
    var sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_EVIDENCE);
    sh.appendRow([id, progressId, fileName, fileUrl, keterangan || "",
      uploadByEmail || "", new Date(), fileDriveId, mimeType]);
    var agendaId4 = _progressToAgendaId(progressId);
    logAgendaActivity(uploadByEmail || "", "UPLOAD_EVIDENCE", agendaId4 || progressId);
    return {
      success: true, id: id, namaFile: fileName, link: fileUrl,
      fileDriveId: fileDriveId, mimeType: mimeType
    };
  } catch (err) {
    return { success: false, message: "Gagal upload file: " + err.message };
  }
}

function deleteEvidence(id, userEmail) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_EVIDENCE);
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        // Hapus file dari Drive jika ada
        var fileDriveId = String(rows[i][7] || "").trim();
        if (fileDriveId) {
          try { DriveApp.getFileById(fileDriveId).setTrashed(true); } catch (e) { /* file mungkin sudah dihapus */ }
        }
        sh.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: "Evidence tidak ditemukan" };
  } catch (err) { return { success: false, message: err.message }; }
}

function getEvidenceByProgressId(progressId) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_EVIDENCE);
    if (!sh || sh.getLastRow() < 2) return [];
    const rows = sh.getDataRange().getValues();
    const pegawaiMap = getPegawaiMapByEmail();
    const result = [];
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) !== progressId) continue;
      var uploadBy = String(rows[i][5] || "").trim();
      var peg = pegawaiMap[uploadBy] || null;
      var mime = String(rows[i][8] || "").trim();
      result.push({
        id: rows[i][0], progressId: rows[i][1], namaFile: rows[i][2],
        link: rows[i][3], keterangan: rows[i][4],
        uploadByEmail: uploadBy, uploadByNama: peg ? peg.nama : uploadBy,
        uploadAt: rows[i][6] instanceof Date ? Utilities.formatDate(rows[i][6], AGENDA_TIMEZONE, "dd MMM yyyy HH:mm") : String(rows[i][6] || ""),
        fileDriveId: String(rows[i][7] || "").trim(),
        mimeType: _mapMimeType(mime)
      });
    }
    return result;
  } catch (err) { return []; }
}

function _getEvidenceFolder(progressId) {
  var subbagian = "TANPA_SUBBAGIAN";
  var judul = "TANPA_JUDUL";
  var tahun = Utilities.formatDate(new Date(), AGENDA_TIMEZONE, "yyyy");

  if (progressId) {
    try {
      var wfId = "";
      var agId = "";
      var progSh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
      if (progSh && progSh.getLastRow() >= 2) {
        var progData = progSh.getDataRange().getValues();
        for (var i = 1; i < progData.length; i++) {
          if (progData[i][0] === progressId) { wfId = String(progData[i][1] || "").trim(); break; }
        }
      }
      if (wfId) {
        var wfSh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
        if (wfSh && wfSh.getLastRow() >= 2) {
          var wfData = wfSh.getDataRange().getValues();
          for (var j = 1; j < wfData.length; j++) {
            if (wfData[j][0] === wfId) { agId = String(wfData[j][1] || "").trim(); break; }
          }
        }
      }
      if (agId) {
        var agSh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
        if (agSh && agSh.getLastRow() >= 2) {
          var agData = agSh.getDataRange().getValues();
          for (var k = 1; k < agData.length; k++) {
            if (agData[k][0] === agId) {
              var rawSubbag = String(agData[k][5] || "").trim();
              if (rawSubbag) subbagian = rawSubbag;
              var rawJudul = String(agData[k][2] || "").trim();
              if (rawJudul) judul = rawJudul;
              break;
            }
          }
        }
      }
    } catch (e) {}
  }

  var sanitize = function (name) {
    return String(name).replace(/[\/\\:*?"<>|]/g, "_").trim() || "TANPA_NAMA";
  };

  var rootFolder = DriveApp.getFolderById(EVIDENCE_ROOT_FOLDER_ID);
  var subbagFolder = _getOrCreateSubfolder(rootFolder, sanitize(subbagian));
  var tahunFolder = _getOrCreateSubfolder(subbagFolder, tahun);
  var agendaFolder = _getOrCreateSubfolder(tahunFolder, sanitize(judul));

  return agendaFolder;
}

function _getOrCreateSubfolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function _mapMimeType(mime) {
  if (!mime) return "";
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("word") || mime.includes("document")) return "doc";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "xls";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "ppt";
  if (mime.includes("image") || mime.includes("png") || mime.includes("jpg") || mime.includes("jpeg")) return "img";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return "zip";
  if (mime.includes("text") || mime.includes("json") || mime.includes("csv")) return "txt";
  return "file";
}

// =============================================
// ACTIVITY LOG
// =============================================
function getActivityLog(referensi, limit) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_ACTIVITY_LOG);
    if (!sh || sh.getLastRow() < 2) return [];
    const data = sh.getDataRange().getValues();
    const pegawaiMap = getPegawaiMapByEmail();
    const result = [];
    for (let i = data.length - 1; i >= 1; i--) {
      const ref = String(data[i][3] || "");
      if (referensi && ref !== referensi) continue;
      const email = String(data[i][1] || "").trim();
      const peg = pegawaiMap[email] || null;
      result.push({
        userEmail: email, userNama: peg ? peg.nama : email,
        aktivitas: data[i][2], referensi: ref,
        waktu: Utilities.formatDate(new Date(data[i][4]), AGENDA_TIMEZONE, "dd MMM yyyy HH:mm")
      });
      if (limit && result.length >= limit) break;
    }
    return result;
  } catch (err) { return []; }
}

// =============================================
// KALENDER KEGIATAN
// =============================================
function getCalendarData(userEmail, bulan, tahun, userRole) {
  try {
    ensureAgendaSheets();
    var result = { success: true, agenda: [], manual: [], workflow: [] };
    var role = (userRole || '').toUpperCase().trim() || 'USER';

    // 1. Ambil agenda sesuai hak akses user
    var list = getListAgenda({ userEmail: userEmail, role: role, status: '', subbag: '' });
    if (list.success && list.data) {
      var filterBulan = parseInt(bulan);
      var filterTahun = parseInt(tahun);
      list.data.forEach(function(a) {
        var tglMulai = a.tanggalMulai || '';
        var tglSelesai = a.tanggalSelesai || '';
        var match = false;
        // Cek apakah agenda jatuh di bulan/tahun yg diminta
        if (tglMulai) {
          var parts = String(tglMulai).split('-');
          if (parts.length === 3 && parseInt(parts[0]) === filterTahun && parseInt(parts[1]) === filterBulan) match = true;
        }
        if (!match && tglSelesai) {
          var parts2 = String(tglSelesai).split('-');
          if (parts2.length === 3 && parseInt(parts2[0]) === filterTahun && parseInt(parts2[1]) === filterBulan) match = true;
        }
        if (match) {
          result.agenda.push({
            id: a.id, judul: a.judul, tanggalMulai: tglMulai,
            tanggalSelesai: tglSelesai, status: a.status,
            prioritas: a.prioritas, sumber: 'agenda',
            picNama: a.picNama || a.createdByNama || '',
            picEmail: a.picEmail || a.createdByEmail || '',
            subbagian: a.subbagian || '',
            progressPersentase: a.progressPersentase || 0,
            isOverdue: a.isOverdue || false
          });
        }
      });
    }

    // 2. Ambil workflow dengan tanggal
    var wfSh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
    if (wfSh && wfSh.getLastRow() >= 2) {
      var wfData = wfSh.getDataRange().getValues();
      var agSh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
      var agRows = agSh ? agSh.getDataRange().getValues() : [];
      for (var wi = 1; wi < wfData.length; wi++) {
        var wfTglMulai = wfData[wi][8] instanceof Date ? Utilities.formatDate(wfData[wi][8], AGENDA_TIMEZONE, "yyyy-MM-dd") : String(wfData[wi][8] || "");
        var wfTglSelesai = wfData[wi][9] instanceof Date ? Utilities.formatDate(wfData[wi][9], AGENDA_TIMEZONE, "yyyy-MM-dd") : String(wfData[wi][9] || "");
        var wfMatch = false;
        if (wfTglMulai) {
          var wp = wfTglMulai.split('-');
          if (wp.length === 3 && parseInt(wp[0]) === parseInt(tahun) && parseInt(wp[1]) === parseInt(bulan)) wfMatch = true;
        }
        if (!wfMatch && wfTglSelesai) {
          var wp2 = wfTglSelesai.split('-');
          if (wp2.length === 3 && parseInt(wp2[0]) === parseInt(tahun) && parseInt(wp2[1]) === parseInt(bulan)) wfMatch = true;
        }
        if (wfMatch) {
          var wfAgendaId = String(wfData[wi][1] || "");
          var agendaJudul = "", agendaSubbag = "", agendaPrioritas = "";
          for (var ai = 1; ai < agRows.length; ai++) {
            if (String(agRows[ai][0]) === wfAgendaId) {
              agendaJudul = agRows[ai][2] || "";
              agendaSubbag = agRows[ai][5] || "";
              agendaPrioritas = agRows[ai][6] || "";
              break;
            }
          }
          var wfPicEmail = String(wfData[wi][6] || "").trim();
          var wfPicNama = wfPicEmail;
          var pegMap = getPegawaiMapByEmail();
          if (pegMap[wfPicEmail]) wfPicNama = pegMap[wfPicEmail].nama;
          result.workflow.push({
            id: wfData[wi][0], judul: wfData[wi][3] || "",
            tanggalMulai: wfTglMulai, tanggalSelesai: wfTglSelesai,
            status: wfData[wi][4] || "", sumber: 'workflow',
            picNama: wfPicNama, picEmail: wfPicEmail,
            subbagian: agendaSubbag,
            prioritas: agendaPrioritas, agendaJudul: agendaJudul,
            agendaId: wfAgendaId
          });
        }
      }
    }

    // 3. Ambil manual events dari KALENDER_EVENT
    var sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.KALENDER_EVENT);
    if (sh && sh.getLastRow() >= 2) {
      var data = sh.getDataRange().getValues();
      var email = (userEmail || '').toLowerCase().trim();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][1] || '').toLowerCase().trim() !== email) continue;
        // Cek apakah event di bulan ini
        var tgl = String(data[i][4] || '');
        if (tgl) {
          var parts = tgl.split('-');
          if (parts.length === 3 && parseInt(parts[0]) === parseInt(tahun) && parseInt(parts[1]) === parseInt(bulan)) {
            result.manual.push({
              id: data[i][0], judul: data[i][2], deskripsi: data[i][3] || '',
              tanggalMulai: data[i][4] || '', tanggalSelesai: data[i][5] || '',
              warna: data[i][6] || '#6366f1', sumber: 'manual'
            });
          }
        }
      }
    }

    return result;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function createCalendarEvent(data) {
  try {
    if (!data.judul || !data.tanggal) return { success: false, message: 'Judul dan tanggal wajib diisi' };
    ensureAgendaSheets();
    var sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.KALENDER_EVENT);
    sh.appendRow([
      Utilities.getUuid(), data.userEmail || '', data.judul,
      data.deskripsi || '', data.tanggal, data.tanggalSelesai || data.tanggal,
      data.warna || '#6366f1', new Date()
    ]);
    return { success: true, message: 'Event berhasil ditambahkan' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function updateCalendarEvent(data) {
  try {
    if (!data.id) return { success: false, message: 'ID tidak valid' };
    var sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.KALENDER_EVENT);
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        var r = i + 1;
        if (data.judul) sh.getRange(r, 3).setValue(data.judul);
        if (data.deskripsi !== undefined) sh.getRange(r, 4).setValue(data.deskripsi);
        if (data.tanggal) sh.getRange(r, 5).setValue(data.tanggal);
        if (data.tanggalSelesai) sh.getRange(r, 6).setValue(data.tanggalSelesai);
        if (data.warna) sh.getRange(r, 7).setValue(data.warna);
        return { success: true, message: 'Event diperbarui' };
      }
    }
    return { success: false, message: 'Event tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function deleteCalendarEvent(id, userEmail) {
  try {
    var sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.KALENDER_EVENT);
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) { sh.deleteRow(i + 1); return { success: true }; }
    }
    return { success: false, message: 'Event tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// USER ACTIVITY LOG — KEGIATAN SAYA
// =============================================
function getUserActivityLog(userEmail, limit) {
  try {
    ensureAgendaSheets();
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_ACTIVITY_LOG);
    if (!sh || sh.getLastRow() < 2) return { success: true, data: [] };

    const data = sh.getDataRange().getValues();
    const pegawaiMap = getPegawaiMapByEmail();
    const peg = pegawaiMap[userEmail ? userEmail.toLowerCase().trim() : ''] || null;
    const email = userEmail ? userEmail.toLowerCase().trim() : '';

    // Ambil daftar judul agenda
    const agSh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
    const agRows = agSh ? agSh.getDataRange().getValues() : [];
    const agendaMap = {};
    for (let i = 1; i < agRows.length; i++) {
      agendaMap[agRows[i][0]] = agRows[i][2] || '';
    }

    const result = [];
    for (let i = data.length - 1; i >= 1; i--) {
      const logEmail = String(data[i][1] || "").trim().toLowerCase();
      if (logEmail !== email) continue;
      var aktivitas = String(data[i][2] || "").trim();
      var ref = String(data[i][3] || "").trim();
      var waktu = "";
      try {
        waktu = Utilities.formatDate(new Date(data[i][4]), AGENDA_TIMEZONE, "dd MMM yyyy HH:mm");
      } catch (e) { waktu = String(data[i][4] || ""); }

      // Human-readable aktivitas
      var aktivitasLabel = aktivitas;
      var labelMap = {
        'BUAT_AGENDA': 'Membuat agenda baru',
        'UPDATE_AGENDA': 'Memperbarui agenda',
        'HAPUS_AGENDA': 'Menghapus agenda',
        'BUAT_WORKFLOW': 'Menambahkan tahapan workflow',
        'UPDATE_WORKFLOW': 'Memperbarui tahapan workflow',
        'HAPUS_WORKFLOW': 'Menghapus tahapan workflow',
        'BUAT_PROGRESS': 'Menambahkan progress',
        'UPDATE_PROGRESS': 'Memperbarui progress',
        'UPLOAD_EVIDENCE': 'Mengupload evidence'
      };
      if (labelMap[aktivitas]) aktivitasLabel = labelMap[aktivitas];

      result.push({
        userEmail: logEmail,
        userNama: peg ? peg.nama : logEmail,
        aktivitas: aktivitasLabel,
        referensi: ref,
        judul: agendaMap[ref] || '',
        waktu: waktu
      });
      if (limit && result.length >= limit) break;
    }

    return { success: true, data: result };
  } catch (err) {
    return { success: false, message: err.message, data: [] };
  }
}

// =============================================
// MY ACTIVITY DASHBOARD — KEGIATAN SAYA (DRAMATIC)
// =============================================
function getPeriodRange(optYear, optMonth) {
  var now = new Date();
  var today = now.getDate();
  var thisMonth = now.getMonth();
  var thisYear = now.getFullYear();

  var endMonth, endYear;
  if (optYear && optMonth !== undefined && optMonth !== null) {
    endMonth = optMonth - 1;
    endYear = optYear;
  } else {
    if (today >= 21) {
      endMonth = thisMonth + 1;
      endYear = thisYear;
      if (endMonth > 11) { endMonth = 0; endYear++; }
    } else {
      endMonth = thisMonth;
      endYear = thisYear;
    }
  }

  var startMonth = endMonth - 1;
  var startYear = endYear;
  if (startMonth < 0) { startMonth = 11; startYear--; }

  var startDate = new Date(startYear, startMonth, 21, 0, 0, 0);
  var endDate = new Date(endYear, endMonth, 20, 23, 59, 59);

  return {
    start: startDate,
    end: endDate,
    startLabel: Utilities.formatDate(startDate, AGENDA_TIMEZONE, "dd MMM yyyy"),
    endLabel: Utilities.formatDate(endDate, AGENDA_TIMEZONE, "dd MMM yyyy"),
    periodLabel: Utilities.formatDate(startDate, AGENDA_TIMEZONE, "dd MMM") + ' - ' + Utilities.formatDate(endDate, AGENDA_TIMEZONE, "dd MMM yyyy"),
    endMonth: endMonth + 1,
    endYear: endYear
  };
}

function getMyActivityDashboard(userEmail, optYear, optMonth) {
  try {
    ensureAgendaSheets();
    var ss = getAgendaSpreadsheet();
    var email = (userEmail || '').toLowerCase().trim();
    var pegawaiMap = getPegawaiMapByEmail();
    var peg = pegawaiMap[email] || null;
    var userNama = peg ? peg.nama : email;
    var userRole = peg ? peg.jabatan : '';

    var period = getPeriodRange(optYear, optMonth);
    var periodStart = period.start;
    var periodEnd = period.end;

    // Read activity log
    var logSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_ACTIVITY_LOG);
    var logData = logSh && logSh.getLastRow() >= 2 ? logSh.getDataRange().getValues() : [];
    var stats = { total: 0, membuat: 0, mengupdate: 0, menghapus: 0, workflow: 0, progress: 0, evidence: 0 };
    var activities = [];
    var agendaMeta = {};

    try {
      var agSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
      if (agSh && agSh.getLastRow() >= 2) {
        var agRows = agSh.getDataRange().getValues();
        for (var ai = 1; ai < agRows.length; ai++) {
          agendaMeta[agRows[ai][0]] = { judul: agRows[ai][2] || '', status: agRows[ai][7] || '', sumber: agRows[ai][3] || '', prioritas: agRows[ai][6] || '' };
        }
      }
    } catch(e) {}

    var evCountMap = {};
    try {
      var evSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_EVIDENCE);
      if (evSh && evSh.getLastRow() >= 2) {
        var evRows = evSh.getDataRange().getValues();
        for (var evi = 1; evi < evRows.length; evi++) {
          var progressId = String(evRows[evi][1] || '').trim();
          if (!evCountMap[progressId]) evCountMap[progressId] = 0;
          evCountMap[progressId]++;
        }
      }
    } catch(e) {}

    var progressWorkflowMap = {};
    try {
      var progSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
      if (progSh && progSh.getLastRow() >= 2) {
        var progRows = progSh.getDataRange().getValues();
        for (var pi = 1; pi < progRows.length; pi++) {
          progressWorkflowMap[progRows[pi][0]] = String(progRows[pi][1] || '').trim();
        }
      }
    } catch(e) {}

    var workflowAgendaMap = {};
    try {
      var wfSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
      if (wfSh && wfSh.getLastRow() >= 2) {
        var wfRows = wfSh.getDataRange().getValues();
        for (var wi = 1; wi < wfRows.length; wi++) {
          workflowAgendaMap[wfRows[wi][0]] = String(wfRows[wi][1] || '').trim();
        }
      }
    } catch(e) {}

    var evidencePerAgenda = {};
    Object.keys(evCountMap).forEach(function(progId) {
      var wfId = progressWorkflowMap[progId] || '';
      var agId = workflowAgendaMap[wfId] || '';
      if (agId) {
        if (!evidencePerAgenda[agId]) evidencePerAgenda[agId] = 0;
        evidencePerAgenda[agId] += evCountMap[progId];
      }
    });

    for (var i = logData.length - 1; i >= 1; i--) {
      if (String(logData[i][1] || '').toLowerCase().trim() !== email) continue;
      var logDate;
      try { logDate = new Date(logData[i][4]); } catch(e) { continue; }
      if (logDate < periodStart || logDate > periodEnd) continue;

      stats.total++;
      var rawAktivitas = String(logData[i][2] || '').trim();
      if (rawAktivitas === 'BUAT_AGENDA') stats.membuat++;
      else if (rawAktivitas === 'UPDATE_AGENDA') stats.mengupdate++;
      else if (rawAktivitas === 'HAPUS_AGENDA') stats.menghapus++;
      else if (rawAktivitas.indexOf('WORKFLOW') >= 0) stats.workflow++;
      else if (rawAktivitas.indexOf('PROGRESS') >= 0) stats.progress++;
      else if (rawAktivitas.indexOf('EVIDENCE') >= 0) stats.evidence++;

      var refId = String(logData[i][3] || '').trim();
      var meta = agendaMeta[refId] || {};
      var waktu = '';
      try { waktu = Utilities.formatDate(logDate, AGENDA_TIMEZONE, "dd MMM yyyy HH:mm"); } catch(e) { waktu = String(logData[i][4] || ''); }

      activities.push({
        aktivitas: rawAktivitas, aktivitasLabel: getActivityLabel(rawAktivitas),
        referensi: refId, judul: meta.judul || '', waktu: waktu
      });
      if (activities.length >= 50) break;
    }

    var userAgendaIds = {};
    try {
      var agSh2 = ss.getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
      if (agSh2 && agSh2.getLastRow() >= 2) {
        var agRows2 = agSh2.getDataRange().getValues();
        for (var aj = 1; aj < agRows2.length; aj++) {
          if (String(agRows2[aj][13] || '').toLowerCase().trim() === email) {
            userAgendaIds[agRows2[aj][0]] = true;
          }
        }
      }
    } catch(e) {}

    try {
      var assignSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_ASSIGNMENT);
      if (assignSh && assignSh.getLastRow() >= 2) {
        var assignRows = assignSh.getDataRange().getValues();
        for (var asi = 1; asi < assignRows.length; asi++) {
          if (String(assignRows[asi][2] || '').toLowerCase().trim() === email) {
            userAgendaIds[assignRows[asi][1]] = true;
          }
        }
      }
    } catch(e) {}

    try {
      var wfSh2 = ss.getSheetByName(AGENDA_SHEETS.MASTER_WORKFLOW);
      if (wfSh2 && wfSh2.getLastRow() >= 2) {
        var wfRows2 = wfSh2.getDataRange().getValues();
        for (var wi2 = 1; wi2 < wfRows2.length; wi2++) {
          if (String(wfRows2[wi2][6] || '').toLowerCase().trim() === email) {
            userAgendaIds[wfRows2[wi2][1]] = true;
          }
        }
      }
    } catch(e) {}

    try {
      var progSh2 = ss.getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
      if (progSh2 && progSh2.getLastRow() >= 2) {
        var progRows2 = progSh2.getDataRange().getValues();
        for (var pj = 1; pj < progRows2.length; pj++) {
          var isPj = String(progRows2[pj][8] || '').toLowerCase().trim() === email;
          var isAnggota = false;
          try {
            var anggotaArr = JSON.parse(progRows2[pj][13] || '[]');
            for (var ai = 0; ai < anggotaArr.length; ai++) {
              if (String(anggotaArr[ai] || '').toLowerCase().trim() === email) { isAnggota = true; break; }
            }
          } catch(e) {}
          if (isPj || isAnggota) {
            var wfId = String(progRows2[pj][1] || '').trim();
            var agIdPj = workflowAgendaMap[wfId] || '';
            if (agIdPj) userAgendaIds[agIdPj] = true;
          }
        }
      }
    } catch(e) {}

    var completedAgendas = [];
    try {
      var agSh3 = ss.getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
      if (agSh3 && agSh3.getLastRow() >= 2) {
        var agRows3 = agSh3.getDataRange().getValues();
        for (var aj3 = 1; aj3 < agRows3.length; aj3++) {
          var agId = agRows3[aj3][0];
          var status = String(agRows3[aj3][7] || '').trim().toLowerCase();
          if (!userAgendaIds[agId] || status !== 'selesai') continue;
          var updatedAt;
          try { updatedAt = new Date(agRows3[aj3][15]); } catch(e) { continue; }
          if (updatedAt < periodStart || updatedAt > periodEnd) continue;

          completedAgendas.push({
            id: agId,
            judul: agRows3[aj3][2] || '',
            sumber: agRows3[aj3][3] || '',
            prioritas: agRows3[aj3][6] || '',
            tanggalSelesai: Utilities.formatDate(updatedAt, AGENDA_TIMEZONE, "dd MMM yyyy"),
            evidenceCount: evidencePerAgenda[agId] || 0
          });
        }
      }
    } catch(e) {}

    var completedProgress = [];
    try {
      var progSh3 = ss.getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
      if (progSh3 && progSh3.getLastRow() >= 2) {
        var progRows3 = progSh3.getDataRange().getValues();
        for (var pp = 1; pp < progRows3.length; pp++) {
          var pjEmail = String(progRows3[pp][8] || '').toLowerCase().trim();
          var isPj = pjEmail === email;
          var isAnggota = false;
          try {
            var anggotaArr = JSON.parse(progRows3[pp][13] || '[]');
            for (var ai2 = 0; ai2 < anggotaArr.length; ai2++) {
              if (String(anggotaArr[ai2] || '').toLowerCase().trim() === email) { isAnggota = true; break; }
            }
          } catch(e) {}
          if (!isPj && !isAnggota) continue;
          var progStatus = String(progRows3[pp][4] || '').trim().toUpperCase();
          var progPersen = Number(progRows3[pp][5] || 0);
          if (progStatus !== 'SELESAI' && progPersen < 100) continue;
          var progUpdated;
          try { progUpdated = new Date(progRows3[pp][11]); } catch(e) { continue; }
          if (progUpdated < periodStart || progUpdated > periodEnd) continue;
          var progId = progRows3[pp][0];
          var wfId = progressWorkflowMap[progId] || '';
          var agId = workflowAgendaMap[wfId] || '';
          var meta = agendaMeta[agId] || {};
          completedProgress.push({
            id: progId, namaProgress: progRows3[pp][3] || '',
            agendaId: agId, judulAgenda: meta.judul || '',
            sumber: meta.sumber || '',
            tanggalSelesai: Utilities.formatDate(progUpdated, AGENDA_TIMEZONE, "dd MMM yyyy"),
            evidenceCount: evCountMap[progId] || 0
          });
        }
      }
    } catch(e) {}

    return {
      success: true,
      period: { start: period.startLabel, end: period.endLabel, label: period.periodLabel, endMonth: period.endMonth, endYear: period.endYear },
      userNama: userNama,
      userRole: userRole,
      stats: stats,
      activities: activities,
      completedAgendas: completedAgendas,
      completedProgress: completedProgress
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getActivityLabel(raw) {
  var map = {
    'BUAT_AGENDA': 'Membuat agenda baru',
    'UPDATE_AGENDA': 'Memperbarui agenda',
    'HAPUS_AGENDA': 'Menghapus agenda',
    'BUAT_WORKFLOW': 'Menambahkan tahapan',
    'UPDATE_WORKFLOW': 'Memperbarui tahapan',
    'HAPUS_WORKFLOW': 'Menghapus tahapan',
    'BUAT_PROGRESS': 'Melaporkan progress',
    'UPDATE_PROGRESS': 'Memperbarui progress',
    'HAPUS_PROGRESS': 'Menghapus progress',
    'UPLOAD_EVIDENCE': 'Mengunggah lampiran',
    'BUAT_ASSIGNMENT': 'Ditugaskan dalam agenda',
    'VIEW_AGENDA': 'Melihat detail agenda'
  };
  return map[raw] || raw;
}

// =============================================
// ASSIGNMENT SUMMARY FOR LKH
// =============================================
function getMyAssignments(userEmail) {
  try {
    ensureAgendaSheets();
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_ASSIGNMENT);
    if (!sh || sh.getLastRow() < 2) return { success: true, data: [] };

    const data = sh.getDataRange().getValues();
    const agendaIds = [];

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][2] || "").trim().toLowerCase() === userEmail.toLowerCase().trim()) {
        agendaIds.push(data[i][1]);
      }
    }

    const pegawaiMap = getPegawaiMapByEmail();
    const peg = pegawaiMap[userEmail.toLowerCase().trim()] || null;
    const shAgenda = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
    const agendaRows = shAgenda.getDataRange().getValues();
    const result = [];

    agendaIds.forEach(id => {
      for (let i = 1; i < agendaRows.length; i++) {
        if (agendaRows[i][0] === id) {
          result.push({
            id, judul: agendaRows[i][2], status: agendaRows[i][7],
            subbagian: agendaRows[i][5], sumber: agendaRows[i][3],
            userNama: peg ? peg.nama : userEmail,
            userSubbag: peg ? peg.subbag : ""
          });
          break;
        }
      }
    });

    return { success: true, data: result };
  } catch (err) {
    return { success: false, message: err.message, data: [] };
  }
}
