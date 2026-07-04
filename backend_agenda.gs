/* =========================================================
   BACKEND AGENDA & TINDAK LANJUT — E-OFFICE KPU SIAK
   Versi 2.0
   - MASTER_ASSIGNMENT (relasi pegawai)
   - Wizard 3 langkah
   - Workflow dinamis + urutan
   - Progress + Evidence
   - Integrasi LKH
   ========================================================= */

const AGENDA_SPREADSHEET_ID = "1-xohP9CXPUIOL8Ar8L_L3xTOfs_S6fMkUj098nmyE10";
const AGENDA_MASTER_SHEET_ID = "1JivPdetUS5lu5ZjJveqwhpKhwU5r0QiRb4GtJGXxDtA";

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
    "DASAR_FILE_URL"
  ],
  MASTER_WORKFLOW: [
    "ID","AGENDA_ID","URUTAN","NAMA_WORKFLOW","STATUS",
    "TARGET","PIC_EMAIL","KETERANGAN","CREATED_AT","UPDATED_AT"
  ],
  MASTER_PROGRESS: [
    "ID","WORKFLOW_ID","URUTAN","NAMA_PROGRESS","STATUS",
    "PERSENTASE","TARGET","REALISASI","PJ_EMAIL","CATATAN",
    "CREATED_AT","UPDATED_AT","LKH_REFERENCE_ID","ANGGOTA_EMAILS"
  ],
  MASTER_EVIDENCE: [
    "ID","PROGRESS_ID","NAMA_FILE","LINK","KETERANGAN",
    "UPLOAD_BY_EMAIL","UPLOAD_AT"
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
    jabatan: p.jabatan, subbag: p.subbag
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

function jenisToHasilType(jenis) {
  var docTypes = ['COKLIT','COKTAS','PLENO','PLENO_TERBUKA','BIMTEK','SOSIALISASI','WORKSHOP','FGD','DISEMINASI','PENYUSUNAN','VERIFIKASI','FASILITASI','KEHUMASAN','PELAYANAN_PUBLIK','PROTOKOL','PERSIDANGAN','UMUM','LAINNYA','COK'];
  var laporanTypes = ['REKAPITULASI','PELAPORAN','MONITORING','EVALUASI','RAKOR','RAPAT_INTERNAL','BRIEFING','RAPAT'];
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
    if (!data.jenis) return { success: false, message: "Jenis kegiatan wajib dipilih", field: "jenis" };
    if (!data.dasarAgenda) return { success: false, message: "Dasar agenda wajib dipilih", field: "dasarAgenda" };
    if (!data.picEmail) return { success: false, message: "PIC wajib dipilih", field: "pic" };

    const ss = getAgendaSpreadsheet();
    const sh = ss.getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
    const id = Utilities.getUuid();
    const now = new Date();
    var sumber = data.sumber || deriveSumberFromDasar(data.dasarAgenda || '');

    sh.appendRow([
      id, generateNomorAgenda(), data.judul, sumber,
      data.jenis || "UMUM", data.subbagian || "",
      data.prioritas || "SEDANG", "RENCANA", data.targetOutput || "",
      data.deskripsi || "", data.dasarAgenda || "",
      data.tanggalMulai || "", data.tanggalSelesai || "",
      data.createdByEmail || "", now, now,
      data.dasarFileUrl || ""
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
        if (data.judul) sh.getRange(r, 3).setValue(data.judul);
        if (data.sumber !== undefined) sh.getRange(r, 4).setValue(data.sumber);
        else if (data.dasarAgenda) sh.getRange(r, 4).setValue(deriveSumberFromDasar(data.dasarAgenda));
        if (data.jenis) sh.getRange(r, 5).setValue(data.jenis);
        if (data.subbagian !== undefined) sh.getRange(r, 6).setValue(data.subbagian);
        if (data.prioritas) sh.getRange(r, 7).setValue(data.prioritas);
        if (data.status) sh.getRange(r, 8).setValue(data.status);
        if (data.targetOutput !== undefined) sh.getRange(r, 9).setValue(data.targetOutput);
        if (data.deskripsi !== undefined) sh.getRange(r, 10).setValue(data.deskripsi);
        if (data.dasarAgenda !== undefined) sh.getRange(r, 11).setValue(data.dasarAgenda);
        if (data.tanggalMulai) sh.getRange(r, 12).setValue(data.tanggalMulai);
        if (data.tanggalSelesai) sh.getRange(r, 13).setValue(data.tanggalSelesai);
        if (data.dasarFileUrl !== undefined) sh.getRange(r, 17).setValue(data.dasarFileUrl);
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

  // Overdue check
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
    tanggalMulai: row[11] instanceof Date ? Utilities.formatDate(row[11], AGENDA_TIMEZONE, "yyyy-MM-dd") : String(row[11] || ""),
    tanggalSelesai: row[12] instanceof Date ? Utilities.formatDate(row[12], AGENDA_TIMEZONE, "yyyy-MM-dd") : String(row[12] || ""),
    createdByEmail: createdBy,
    createdByNama: creator ? creator.nama : createdBy,
    createdAt: row[14] instanceof Date ? Utilities.formatDate(row[14], AGENDA_TIMEZONE, "dd MMM yyyy HH:mm") : String(row[14] || ""),
    updatedAt: row[15] instanceof Date ? Utilities.formatDate(row[15], AGENDA_TIMEZONE, "dd MMM yyyy HH:mm") : String(row[15] || ""),
    isOverdue: isOverdue
  };
}

function getListAgenda(filter) {
  try {
    ensureAgendaSheets();
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
    if (sh.getLastRow() < 2) return { success: true, data: [], stats: {} };

    const rows = sh.getDataRange().getValues();
    const pegawaiMap = getPegawaiMapByEmail();
    const userEmail = (filter?.userEmail || "").toLowerCase().trim();
    const role = (filter?.role || "").toUpperCase().trim();
    const statusFilter = (filter?.status || "").trim();
    const subbagFilter = (filter?.subbag || "").trim();
    const result = [];
    const isAdmin = ["ADMIN","SEKRETARIS","PIMPINAN"].includes(role);

    let total=0, rencana=0, berjalan=0, selesai=0, overdue=0;

    for (let i = 1; i < rows.length; i++) {
      const a = formatAgendaRow(rows[i], pegawaiMap);
      if (!a) continue;

      // Filter akses
      if (!isAdmin && a.createdByEmail !== userEmail) {
        const assignments = getAssignmentsByAgendaId(a.id);
        const assigned = assignments.some(as => as.emailPegawai === userEmail);
        if (!assigned) continue;
      }

      if (statusFilter && a.status !== statusFilter) continue;
      if (subbagFilter && a.subbagian !== subbagFilter) continue;

      total++;
      if (a.status === "RENCANA") rencana++;
      else if (a.status === "BERJALAN") berjalan++;
      else if (a.status === "SELESAI") selesai++;
      if (a.isOverdue) overdue++;

      // Hitung progress
      const progressInfo = getProgressSummary(a.id);
      const assignments = getAssignmentsByAgendaId(a.id);

      result.push({
        ...a,
        progressPersentase: progressInfo.persentase,
        totalWorkflow: progressInfo.totalWorkflow,
        totalProgress: progressInfo.totalProgress,
        assignments: assignments,
        picNama: (assignments.find(as => as.role === "PIC") || {}).nama || a.createdByNama,
        picEmail: (assignments.find(as => as.role === "PIC") || {}).emailPegawai || a.createdByEmail
      });
    }

    // Sort: overdue first, then by tanggalSelesai
    result.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return (b.tanggalSelesai || "").localeCompare(a.tanggalSelesai || "");
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
        if (data.urutan !== undefined) sh.getRange(r, 3).setValue(data.urutan);
        sh.getRange(r, 10).setValue(new Date());
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
        createdAt: rows[i][8] instanceof Date ? Utilities.formatDate(rows[i][8], AGENDA_TIMEZONE, "dd MMM yyyy") : String(rows[i][8] || ""),
        updatedAt: rows[i][9] instanceof Date ? Utilities.formatDate(rows[i][9], AGENDA_TIMEZONE, "dd MMM yyyy") : String(rows[i][9] || "")
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
// AUTO SAVE TO LKH (AGENDA sheet in E-LKH spreadsheet)
// — Generate untuk PJ + semua Anggota
// =============================================
function autoSaveLKHAll(progressId, workflowId, pjEmail, anggotaEmails, namaProgress, realisasi, status) {
  try {
    if (status !== "SELESAI" || !realisasi) return;
    var allEmails = [pjEmail].concat(anggotaEmails || []).filter(Boolean);
    if (!allEmails.length) return;

    // Get workflow & agenda context
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
    var tglStr = Utilities.formatDate(now, AGENDA_TIMEZONE, "yyyy-MM-dd");
    // Ambil target dari progress (priority), fallback ke workflow target, lalu agenda jenis
    var progSh2 = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
    var progRows2 = progSh2.getDataRange().getValues();
    var progTarget = "";
    for (var pt = 1; pt < progRows2.length; pt++) {
      if (progRows2[pt][0] === progressId) { progTarget = String(progRows2[pt][6] || "").trim(); break; }
    }
    var hasilLkh = progTarget || wfTarget || jenisToHasilType(agendaJenis || '');
    var kegiatanLkh = '[' + (agendaJenis || 'UMUM') + '] ' + (agendaJudul || '') + ' — ' + (wfNama || '') + ' — ' + namaProgress;
    var keteranganLkh = generateKeteranganLKH(hasilLkh, realisasi, namaProgress, agendaJudul);

    // Cari LKH_REFERENCE_ID dari MASTER_PROGRESS (untuk PJ)
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
    var existingRefIds = [];

    allEmails.forEach(function(email) {
      var peg = getPegawaiByEmail(email);
      var nama = peg ? peg.nama : email;
      var nip = peg ? peg.nip : "";

      // Cari apakah sudah ada LKH untuk email ini
      var found = false;
      for (var j = 0; j < lkhRefIds.length; j++) {
        if (lkhRefIds[j].indexOf(email) !== -1) { found = true; break; }
      }

      if (!found) {
        var lkhId = Utilities.getUuid();
        sh.appendRow([lkhId, email, nip, nama, tglStr, kegiatanLkh, hasilLkh, keteranganLkh, now, "AGENDA"]);
        existingRefIds.push(email + ':' + lkhId);
      }
    });

    // Simpan LKH_REFERENCE_ID ke MASTER_PROGRESS jika ada baru
    if (existingRefIds.length && progRowNum > 0) {
      var allRefs = lkhRefIds.concat(existingRefIds);
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
    autoSaveLKHAll(id, data.workflowId, data.pjEmail, data.anggotaEmails || [], data.namaProgress, data.realisasi, data.status || "RENCANA");
    logAgendaActivity(data.userEmail || "", "BUAT_PROGRESS", "");
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
        autoSaveLKHAll(data.id, wfId, effPj, effAnggota, effNama, effRealisasi, effStatus);

        logAgendaActivity(data.userEmail || "", "UPDATE_PROGRESS", "");
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
        // Hapus evidence terkait
        const shEv = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_EVIDENCE);
        if (shEv) {
          const evData = shEv.getDataRange().getValues();
          for (let j = evData.length - 1; j >= 1; j--) {
            if (evData[j][1] === id) shEv.deleteRow(j + 1);
          }
        }
        sh.deleteRow(i + 1);
        checkAndUpdateWorkflowStatus(wfId);
        logAgendaActivity(userEmail || "", "HAPUS_PROGRESS", "");
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
      data.uploadByEmail || "", new Date()]);
    logAgendaActivity(data.uploadByEmail || "", "UPLOAD_EVIDENCE", "");
    return { success: true, message: "Evidence ditambahkan" };
  } catch (err) { return { success: false, message: err.message }; }
}

function deleteEvidence(id, userEmail) {
  try {
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_EVIDENCE);
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) { sh.deleteRow(i + 1); return { success: true }; }
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
      const uploadBy = String(rows[i][5] || "").trim();
      const peg = pegawaiMap[uploadBy] || null;
      result.push({
        id: rows[i][0], progressId: rows[i][1], namaFile: rows[i][2],
        link: rows[i][3], keterangan: rows[i][4],
        uploadByEmail: uploadBy, uploadByNama: peg ? peg.nama : uploadBy,
        uploadAt: rows[i][6] instanceof Date ? Utilities.formatDate(rows[i][6], AGENDA_TIMEZONE, "dd MMM yyyy HH:mm") : String(rows[i][6] || "")
      });
    }
    return result;
  } catch (err) { return []; }
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
// INTEGRASI LKH — Progress selesai → jadikan LKH
// =============================================
function getProgressSelesaiForLKH(userEmail) {
  try {
    if (!userEmail) return { success: false, message: "Email tidak valid" };

    // Ambil semua agenda yang terkait user
    const list = getListAgenda({ userEmail, role: "USER" });
    if (!list.success) return list;

    const result = [];

    list.data.forEach(agenda => {
      if (agenda.status !== "SELESAI") return;
      const wfs = getWorkflowByAgendaId(agenda.id);
      wfs.forEach(wf => {
        if (wf.status !== "SELESAI") return;
        const progs = getProgressByWorkflowId(wf.id);
        progs.forEach(p => {
          if (p.status === "SELESAI" && p.realisasi) {
            result.push({
              agendaId: agenda.id,
              agendaJudul: agenda.judul,
              agendaJenis: agenda.jenis || '',
              workflowNama: wf.namaWorkflow,
              progressId: p.id,
              progressNama: p.namaProgress,
              realisasi: p.realisasi,
              tanggalSelesai: p.updatedAt
            });
          }
        });
      });
    });

    return { success: true, data: result };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// MONITORING — EKSEKUTIF DASHBOARD
// =============================================
function getMonitoringData(statusFilter, subbagFilter) {
  try {
    ensureAgendaSheets();
    const sh = getAgendaSpreadsheet().getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
    if (sh.getLastRow() < 2) return { success: true, stats: {}, subbag: [], prioritas: [], sumber: [], overdue: [] };

    const rows = sh.getDataRange().getValues();
    const pegawaiMap = getPegawaiMapByEmail();
    const now = new Date();

    // Normalize filters
    statusFilter = (statusFilter || "").trim();
    subbagFilter = (subbagFilter || "").trim();

    let total=0, rencana=0, berjalan=0, selesai=0, overdueCount=0;
    const subbagMap = {};
    const prioritasMap = { MENDESAK:0, TINGGI:0, SEDANG:0, RENDAH:0 };
    const sumberMap = {};
    const overdueList = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const status = String(row[7] || "");
      const prioritas = String(row[6] || "SEDANG");
      const sumber = String(row[3] || "LAINNYA");
      const subbag = String(row[5] || "Tanpa Subbag");

      // Apply filters
      if (statusFilter && status !== statusFilter) continue;
      if (subbagFilter && subbag !== subbagFilter) continue;

      total++;
      if (status === "RENCANA") rencana++;
      else if (status === "BERJALAN") berjalan++;
      else if (status === "SELESAI") selesai++;

      // Overdue check
      const tglSelesai = row[12];
      let isOverdue = false;
      if (tglSelesai && status !== "SELESAI") {
        const d = new Date(String(tglSelesai) + "T23:59:59");
        if (!isNaN(d) && d < now) isOverdue = true;
      }
      if (isOverdue) {
        overdueCount++;
        const selisih = Math.floor((now - d) / (1000*60*60*24));
        const pic = (pegawaiMap[String(row[13]).trim()] || {}).nama || String(row[13]);
        overdueList.push({
          id: row[0], judul: row[2], subbag, prioritas,
          tenggat: tglSelesai, telat: selisih, pic
        });
      }

      // Per Subbag progress
      if (!subbagMap[subbag]) subbagMap[subbag] = { total:0, done:0, nama:subbag };
      subbagMap[subbag].total++;
      if (status === "SELESAI") subbagMap[subbag].done++;

      // Per Prioritas
      if (prioritasMap[prioritas] !== undefined) prioritasMap[prioritas]++;

      // Per Sumber
      if (!sumberMap[sumber]) sumberMap[sumber] = 0;
      sumberMap[sumber]++;
    }

    // Sort overdue by most late
    overdueList.sort((a,b) => b.telat - a.telat);

    // Format subbag progress
    const subbagArr = Object.values(subbagMap).map(s => ({
      subbag: s.nama,
      persentase: s.total > 0 ? Math.round((s.done / s.total) * 100) : 0,
      total: s.total,
      done: s.done
    })).sort((a,b) => a.persentase - b.persentase);

    // Format prioritas
    const prioritasArr = Object.entries(prioritasMap).map(([label, count]) => ({ label, count }));

    // Format sumber
    const sumberArr = Object.entries(sumberMap).map(([label, count]) => ({ label:label.charAt(0)+label.slice(1).toLowerCase(), count }))
      .sort((a,b) => b.count - a.count);

    return {
      success: true,
      stats: { total, rencana, berjalan, selesai, overdue: overdueCount },
      subbag: subbagArr,
      prioritas: prioritasArr,
      sumber: sumberArr,
      overdue: overdueList
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// =============================================
// KALENDER KEGIATAN
// =============================================
function getCalendarData(userEmail, bulan, tahun) {
  try {
    ensureAgendaSheets();
    var result = { success: true, agenda: [], manual: [] };

    // 1. Ambil agenda yg di-assign ke user
    var list = getListAgenda({ userEmail: userEmail, role: 'USER', status: '', subbag: '' });
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
            picNama: a.picNama || a.createdByNama || ''
          });
        }
      });
    }

    // 2. Ambil manual events dari KALENDER_EVENT
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
function getMyActivityDashboard(userEmail) {
  try {
    ensureAgendaSheets();
    var ss = getAgendaSpreadsheet();
    var email = (userEmail || '').toLowerCase().trim();
    var pegawaiMap = getPegawaiMapByEmail();
    var peg = pegawaiMap[email] || null;
    var userNama = peg ? peg.nama : email;
    var userRole = peg ? peg.jabatan : '';

    // 1. Stats from activity log
    var logSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_ACTIVITY_LOG);
    var logData = logSh && logSh.getLastRow() >= 2 ? logSh.getDataRange().getValues() : [];
    var stats = { total: 0, membuat: 0, mengupdate: 0, menghapus: 0, workflow: 0, progress: 0, evidence: 0, mingguIni: 0 };
    // 2. Build activity list
    var activities = [];
    var agendaMap = {};
    try {
      var agSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_AGENDA);
      if (agSh && agSh.getLastRow() >= 2) {
        var agRows = agSh.getDataRange().getValues();
        for (var ai = 1; ai < agRows.length; ai++) agendaMap[agRows[ai][0]] = agRows[ai][2] || '';
      }
    } catch(e) {}

    // Evidence map: count evidence per agenda ID
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

    // Progress → agenda ID mapping
    var progressAgendaMap = {};
    try {
      var progSh = ss.getSheetByName(AGENDA_SHEETS.MASTER_PROGRESS);
      if (progSh && progSh.getLastRow() >= 2) {
        var progRows = progSh.getDataRange().getValues();
        for (var pi = 1; pi < progRows.length; pi++) {
          var workflowId = String(progRows[pi][1] || '').trim();
          progressAgendaMap[progRows[pi][0]] = workflowId; // progressId → workflowId
        }
      }
    } catch(e) {}
    // workflowId → agendaId
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

    var oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (var i = logData.length - 1; i >= 1; i--) {
      if (String(logData[i][1] || '').toLowerCase().trim() !== email) continue;
      stats.total++;
      var rawAktivitas = String(logData[i][2] || '').trim();
      if (rawAktivitas === 'BUAT_AGENDA') stats.membuat++;
      else if (rawAktivitas === 'UPDATE_AGENDA' || rawAktivitas === 'HAPUS_AGENDA') {
        if (rawAktivitas === 'UPDATE_AGENDA') stats.mengupdate++;
        else stats.menghapus++;
      }
      else if (rawAktivitas.indexOf('WORKFLOW') >= 0) stats.workflow++;
      else if (rawAktivitas.indexOf('PROGRESS') >= 0) stats.progress++;
      else if (rawAktivitas.indexOf('EVIDENCE') >= 0) stats.evidence++;

      try {
        var logDate = new Date(logData[i][4]);
        if (logDate >= oneWeekAgo) stats.mingguIni++;
      } catch(e) {}

      var refId = String(logData[i][3] || '').trim();
      var judul = agendaMap[refId] || '';
      var waktu = '';
      try { waktu = Utilities.formatDate(new Date(logData[i][4]), AGENDA_TIMEZONE, "dd MMM yyyy HH:mm"); } catch(e) { waktu = String(logData[i][4] || ''); }

      // Evidence count for this activity's agenda
      var evCount = 0;
      if (rawAktivitas.indexOf('EVIDENCE') >= 0) {
        // count all evidence for the same progress
        Object.keys(evCountMap).forEach(function(k) { evCount += evCountMap[k]; });
      }

      activities.push({
        aktivitas: rawAktivitas, aktivitasLabel: getActivityLabel(rawAktivitas),
        referensi: refId, judul: judul, waktu: waktu, evidenceCount: evCount
      });
      if (activities.length >= 50) break;
    }

    // Total evidence count
    var totalEvidence = 0;
    Object.keys(evCountMap).forEach(function(k) { totalEvidence += evCountMap[k]; });

    return {
      success: true,
      userNama: userNama,
      userRole: userRole,
      stats: stats,
      activities: activities,
      totalEvidence: totalEvidence
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
    'UPLOAD_EVIDENCE': 'Mengunggah lampiran'
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
