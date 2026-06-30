const SHEET_PRESENSIS_ID = "1vdDdNDiarKVfRSieZVgKrhnY-3pDtBaJfl-2QQlrh0w";

// Sheet Names
const MASTER_PEGAWAI_SHEET = "MASTER_PEGAWAI";
const SHEET_LOG_PRESENSI_PEGAWAI = "LOG_PRESENSI";
const SHEET_KETERANGAN_PRESENSI = "KETERANGAN";
const SHEET_REKAP_STATUS = "REKAP_STATUS";
const SHEET_LOG_ACTIVITY = "LOG_ACTIVITY";

const JENIS_KETERANGAN_PRESENSI = ["Sakit", "Cuti", "Izin", "Dinas Luar", "Tugas Belajar", "Lainnya"];


function getMasterPegawaiPresensi() {

  const ss = SpreadsheetApp.openById(SHEET_AGENDA_ID);

  const sheet =
    ss.getSheetByName(
      MASTER_PEGAWAI_SHEET
    );

  if (!sheet) return [];

  const data =
    sheet.getDataRange()
      .getValues();

  const result = [];

  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    result.push({

      nama:
        String(row[1] || '').trim(),

      nip:
        String(row[2] || '').trim(),

      jabatan:
        String(row[3] || '').trim(),

      gol:
        String(row[4] || '').trim(),

      subbag:
        String(row[5] || '').trim(),

      namaAtasan:
        String(row[6] || '').trim(),

      nipAtasan:
        String(row[7] || '').trim(),

      email:
        String(row[8] || '')
          .trim()
          .toLowerCase(),

      status:
        String(row[10] || '').trim(),

      hakAkses:
        String(row[12] || '').trim(),

      levelPresensi:
        String(row[13] || '').trim(),

      idFinger:
        String(row[14] || '').trim()
    });
  }

  return result;
}

function getPegawaiMapPresensi() {

  const list =
    getMasterPegawaiPresensi();

  return {

    byFinger:
      Object.fromEntries(
        list.map(p => [
          String(p.idFinger).trim(),
          p
        ])
      ),

    byNip:
      Object.fromEntries(
        list.map(p => [
          String(p.nip).trim(),
          p
        ])
      ),

    byEmail:
      Object.fromEntries(
        list.map(p => [
          String(p.email)
            .trim()
            .toLowerCase(),
          p
        ])
      )
  };
}



/**
 * Inisialisasi Database Google Sheets
 */
function initDatabase() {
  const ss = SpreadsheetApp.openById(SHEET_PRESENSIS_ID);
  
  // Sheet LOG_PRESENSI
  if (!ss.getSheetByName(SHEET_LOG_PRESENSI_PEGAWAI)) {
    const s = ss.insertSheet(SHEET_LOG_PRESENSI_PEGAWAI);
    s.appendRow(["LOG_ID", "ID_PEGAWAI", "Nama", "Tanggal", "Jam Masuk", "Jam Pulang", "Status"]);
    s.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  // Sheet KETERANGAN
  if (!ss.getSheetByName(SHEET_KETERANGAN_PRESENSI)) {
    const s = ss.insertSheet(SHEET_KETERANGAN_PRESENSI);
    s.appendRow(["ID_KET", "ID_PEGAWAI", "Nama", "Jenis", "Tgl Mulai", "Tgl Selesai", "Keterangan", "FileURL", "Status Verifikasi", "Timestamp"]);
    s.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Sheet REKAP_STATUS
  if (!ss.getSheetByName(SHEET_REKAP_STATUS)) {
    const s = ss.insertSheet(SHEET_REKAP_STATUS);
    s.appendRow(["ID_REKAP", "Bulan", "Tahun", "Subbag", "Status", "Timestamp"]);
    s.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  // Sheet LOG_ACTIVITY
  if (!ss.getSheetByName(SHEET_LOG_ACTIVITY)) {
    const s = ss.insertSheet(SHEET_LOG_ACTIVITY);
    s.appendRow(["ID_LOG", "WAKTU", "USER", "ROLE", "AKSI", "TARGET_ID", "JENIS", "STATUS", "KETERANGAN"]);
    s.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  return "Database Berhasil Diinisialisasi";
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_PRESENSIS_ID);
}


// =============== FUNGSI CORE PRESENSI ===============

function getPeriodePresensi(bulan, tahun) {
  const start = new Date(tahun, bulan - 2, 21);
  const end = new Date(tahun, bulan - 1, 20);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getDashboardDataPresensi(subbag, nip) {
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_LOG_PRESENSI_PEGAWAI);
  if (!logSheet) return { total: 0, hadir: 0, terlambat: 0, izin: 0, percentage: 0 };
  const data = logSheet.getDataRange().getValues();
  
  let stats = {
    total: 0,
    hadir: 0,
    terlambat: 0,
    izin: 0,
    percentage: 0
  };
  
  for (let i = 1; i < data.length; i++) {
    stats.total++;
    const status = data[i][6];
    if (status === "Hadir") stats.hadir++;
    if (status === "Terlambat") stats.terlambat++;
    if (status === "Izin" || status === "Sakit") stats.izin++;
  }
  
  if (stats.total > 0) {
    stats.percentage = ((stats.hadir + stats.terlambat) / stats.total * 100).toFixed(1);
  }
  
  return stats;
}

function getAttendanceSummaryData(
  bulan,
  tahun,
  subbag
) {

  const ss =
    getSpreadsheet();

  const currentStatus =
    getRekapStatus(
      bulan,
      tahun,
      subbag
    );

  if (
    currentStatus === 'Belum Diajukan' ||
    currentStatus === 'Disetujui'
  ) {
    return null;
  }

  const logSheet =
    ss.getSheetByName(
      SHEET_LOG_PRESENSI_PEGAWAI
    );

  const ketSheet =
    ss.getSheetByName(
      SHEET_KETERANGAN_PRESENSI
    );

  const pegawaiList =
    getMasterPegawaiPresensi();

  const targetBulan =
    Number(bulan);

  const targetTahun =
    Number(tahun);

  const periode =
    getPeriodePresensi(
      targetBulan,
      targetTahun
    );

  /**
   * =============================
   * MAP PEGAWAI
   * =============================
   */
  const nipToId = {};

  const pegawaiMap = {};

  const allowedIds =
    new Set();

  for (
    let i = 0;
    i < pegawaiList.length;
    i++
  ) {

    const pegawai =
      pegawaiList[i];

    const id =
      String(
        pegawai.idFinger || ''
      ).trim();

    const nip =
      String(
        pegawai.nip || ''
      ).trim();

    const sbg =
      pegawai.subbag || '';

    if (!id) continue;

    pegawaiMap[id] =
      pegawai;

    if (nip) {
      nipToId[nip] = id;
    }

    if (
      !subbag ||
      subbag === 'SEMUA' ||
      sbg === subbag
    ) {

      allowedIds.add(id);
    }
  }

  /**
   * =============================
   * DAILY MAP
   * =============================
   */
  const dailyMap = {};

  /**
   * =============================
   * LOAD LOG
   * =============================
   */
  if (logSheet) {

    const logs =
      logSheet
        .getDataRange()
        .getValues();

    for (
      let i = 1;
      i < logs.length;
      i++
    ) {

      const id =
        String(
          logs[i][1] || ''
        ).trim();

      if (
        !allowedIds.has(id)
      ) {
        continue;
      }

      const pegawai =
        pegawaiMap[id];

      if (!pegawai) {
        continue;
      }

      const rawDate =
        logs[i][3];

      if (!rawDate) {
        continue;
      }

      const d =
        rawDate instanceof Date
          ? rawDate
          : new Date(rawDate);

      if (
        isNaN(
          d.getTime()
        )
      ) {
        continue;
      }

      if (
        d < periode.start ||
        d > periode.end
      ) {
        continue;
      }

      const dateStr =
        Utilities.formatDate(
          d,
          'GMT+7',
          'yyyy-MM-dd'
        );

      const key =
        `${id}_${dateStr}`;

      const masuk =
        logs[i][4]
          ? String(logs[i][4])
          : '';

      const pulang =
        logs[i][5]
          ? String(logs[i][5])
          : '';

      let status =
        logs[i][6] || '';

      /**
       * =============================
       * KHUSUS JAGAT SAKSANA
       * =============================
       *
       * ADA MASUK + PULANG
       * = TERPENUHI
       */
      const hakakses =
        (
          pegawai.hakAkses || ''
        )
        .toString()
        .trim()
        .toUpperCase();

      if (
        hakakses ===
        'JAGAT_SAKSANA'
      ) {

        if (
          masuk &&
          pulang
        ) {

          status =
            'Terpenuhi';

        } else {

          status =
            'Tidak Lengkap';
        }

      } else {

        /**
         * =============================
         * PEGAWAI NORMAL
         * =============================
         */
        const check =
          validatePresenceRulesLog(
            d,
            masuk,
            pulang,
            pegawai
          );

        status =
          status ||
          check.status ||
          'Tidak Hadir';
      }

      dailyMap[key] = {

        id,

        date:
          dateStr,

        status
      };
    }
  }

  /**
   * =============================
   * OVERRIDE KETERANGAN
   * =============================
   */
  if (ketSheet) {

    const ketData =
      ketSheet
        .getDataRange()
        .getValues();

    for (
      let i = 1;
      i < ketData.length;
      i++
    ) {

      const nip =
        String(
          ketData[i][1] || ''
        ).trim();

      const id =
        nipToId[nip];

      if (
        !id ||
        !allowedIds.has(id)
      ) {
        continue;
      }

      const statusVerif =
        String(
          ketData[i][8] || ''
        )
        .trim()
        .toUpperCase();

      if (
        statusVerif !==
        'DISETUJUI'
      ) {
        continue;
      }

      const jenis =
        String(
          ketData[i][3] || ''
        ).trim();

      let start =
        ketData[i][4];

      let end =
        ketData[i][5];

      start =
        start instanceof Date
          ? start
          : new Date(start);

      end =
        end instanceof Date
          ? end
          : new Date(end);

      if (
        isNaN(
          start.getTime()
        ) ||
        isNaN(
          end.getTime()
        )
      ) {
        continue;
      }

      const current =
        new Date(start);

      while (
        current <= end
      ) {

        if (
          current >= periode.start &&
          current <= periode.end
        ) {

          const dateStr =
            Utilities.formatDate(
              current,
              'GMT+7',
              'yyyy-MM-dd'
            );

          const key =
            `${id}_${dateStr}`;

          dailyMap[key] = {

            id,

            date:
              dateStr,

            status:
              jenis
          };
        }

        current.setDate(
          current.getDate() + 1
        );
      }
    }
  }

  /**
   * =============================
   * SUMMARY FINAL
   * =============================
   */
  const summary = {

    'Terpenuhi': 0,

    'Kurang': 0,

    'Tidak Lengkap': 0,

    'Tidak Hadir': 0,

    'Izin': 0,

    'Sakit': 0,

    'Cuti': 0,

    'Dinas Luar': 0,

    'Tugas Belajar': 0,

    'Error': 0
  };

  for (const key in dailyMap) {

    const status =
      String(
        dailyMap[key].status || ''
      ).trim();

    if (
      summary.hasOwnProperty(
        status
      )
    ) {

      summary[status]++;

      continue;
    }

    const s =
      status.toLowerCase();

    if (
      s.includes('izin')
    ) {

      summary['Izin']++;

    } else if (
      s.includes('sakit')
    ) {

      summary['Sakit']++;

    } else if (
      s.includes('cuti')
    ) {

      summary['Cuti']++;

    } else if (
      s.includes('dinas')
    ) {

      summary['Dinas Luar']++;

    } else if (
      s.includes('tugas')
    ) {

      summary['Tugas Belajar']++;

    } else if (
      s.includes('error')
    ) {

      summary['Error']++;
    }
  }

  return summary;
}

function getPegawaiListPresensi() {

  const pegawai = getMasterPegawaiPresensi();

  const list = [];

  for (let i = 0; i < pegawai.length; i++) {

    list.push({
      idFinger: pegawai[i].idFinger,
      nama: pegawai[i].nama,
      nip: pegawai[i].nip,
      subbag: pegawai[i].subbag,
      email: pegawai[i].email,
      hakAkses: pegawai[i].hakAkses
    });
  }

  return list;
}

function simpanKeteranganAdmin(payload) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KETERANGAN_PRESENSI);
  const id = "KET-" + new Date().getTime();
  
  let fileUrl = "";
  if (payload.fileBase64) {
    fileUrl = uploadFile(payload.fileBase64, payload.fileName, payload.nama, payload.idFinger);
  }
  
  const row = [
    id,
    payload.idFinger,
    payload.nama,
    payload.jenis,
    payload.tglMulai,
    payload.tglSelesai,
    payload.keterangan,
    fileUrl,
    "Disetujui",
    new Date()
  ];
  
  sheet.appendRow(row);
  
  // LOG ACTIVITY
  logActivity({
    user: payload.nama,
    role: "ADMIN",
    aksi: "AJUKAN",
    targetId: id,
    jenis: payload.jenis,
    status: "Disetujui",
    keterangan: payload.keterangan
  });
  
  return { success: true, message: "Keterangan berhasil disimpan." };
}

function logActivity(p) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_LOG_ACTIVITY);
  if (!sheet) return;
  
  const idLog = "LOG-" + new Date().getTime();
  sheet.appendRow([
    idLog,
    new Date(),
    p.user || "-",
    p.role || "-",
    p.aksi || "-",
    p.targetId || "-",
    p.jenis || "-",
    p.status || "-",
    p.keterangan || "-"
  ]);
}

function getPendingVerifikasi(role) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KETERANGAN_PRESENSI);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  let targetStatus = "";
  if (role == "KASUBBAG") targetStatus = "Menunggu Kasubbag";
  else if (role == "SEKRETARIS") targetStatus = "Menunggu Sekretaris";
  else return [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][8] == targetStatus) {
      result.push({
        id: data[i][0],
        nip: data[i][1],
        nama: data[i][2],
        jenis: data[i][3],
        tglMulai: data[i][4] instanceof Date ? Utilities.formatDate(data[i][4], "GMT+7", "yyyy-MM-dd") : data[i][4],
        tglSelesai: data[i][5] instanceof Date ? Utilities.formatDate(data[i][5], "GMT+7", "yyyy-MM-dd") : data[i][5],
        keterangan: data[i][6],
        fileUrl: data[i][7],
        status: data[i][8]
      });
    }
  }
  return result;
}

function verifikasiKeterangan(id, action, role) {
  const ss = getSpreadsheet();
  const isRekap = id.toString().startsWith("REK-");
  const sheetName = isRekap ? SHEET_REKAP_STATUS : SHEET_KETERANGAN_PRESENSI;
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      let newStatus = "";
      const currentStatus = data[i][isRekap ? 4 : 8];
      
      if (action === "approve") {
        const roleUpper = role.toUpperCase();
        if (roleUpper === "KASUBBAG") newStatus = "Menunggu Sekretaris";
        else if (roleUpper === "SEKRETARIS") newStatus = "Disetujui";
      } else if (action === "reject") {
        newStatus = "Dikembalikan";
      } else {
        newStatus = "Dikembalikan";
      }
      
      if (newStatus) {
        sheet.getRange(i + 1, isRekap ? 5 : 9).setValue(newStatus);
        
        // LOG ACTIVITY
        logActivity({
          user: role,
          role: role.toUpperCase(),
          aksi: action.toUpperCase(),
          targetId: id,
          jenis: isRekap ? "REKAP" : "KETERANGAN",
          status: newStatus,
          keterangan: action === "reject" ? "Ditolak/Dikembalikan untuk revisi" : "Persetujuan berjenjang"
        });

        
        return { success: true, status: newStatus };
      }
    }
  }
  throw new Error("Data tidak ditemukan");
}

function ajukanRekapBulanan(bulan, tahun, subbag) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_REKAP_STATUS);
  const id = "REK-" + new Date().getTime();
  
  sheet.appendRow([id, bulan, tahun, subbag || "SEMUA", "Menunggu Kasubbag", new Date()]);

  logActivity({
    user: "ADMIN",
    role: "ADMIN",
    aksi: "AJUKAN",
    targetId: id,
    jenis: "REKAP",
    status: "Menunggu Kasubbag",
    keterangan: `Pengajuan rekap periode ${bulan}-${tahun} (${subbag || 'Semua'})`
  });

  return { success: true, message: "Rekap bulanan berhasil diajukan." };
}

function getPendingRekapVerifikasi(role) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_REKAP_STATUS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  let targetStatus = "";
  if (role === "KASUBBAG") targetStatus = "MENUNGGU_KASUBBAG";
  else if (role === "SEKRETARIS") targetStatus = "MENUNGGU_SEKRETARIS";
  
  if (!targetStatus) return [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][4] === targetStatus) {
      result.push({
        id: data[i][0],
        bulan: data[i][1],
        tahun: data[i][2],
        subbag: data[i][3],
        status: data[i][4],
        isRekap: true
      });
    }
  }
  return result;
}

function updateLogPresensi(idPegawai, mulai, selesai, jenis) {
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_LOG_PRESENSI_PEGAWAI);
  const start = new Date(mulai);
  const end = new Date(selesai);
  
  const dataLogs = logSheet.getDataRange().getValues();
  const existingRows = {}; // { [id_date]: rowIndex }
  for (let i = 1; i < dataLogs.length; i++) {
    const d = dataLogs[i][3] instanceof Date ? dataLogs[i][3] : new Date(dataLogs[i][3]);
    if (!isNaN(d.getTime())) {
      const dateStr = Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd");
      existingRows[`${dataLogs[i][1]}_${dateStr}`] = i + 1;
    }
  }

  let current = new Date(start);
  while (current <= end) {
    const isoDate = Utilities.formatDate(current, "GMT+7", "yyyy-MM-dd");
    const key = `${idPegawai}_${isoDate}`;
    
    if (existingRows[key]) {
      logSheet.getRange(existingRows[key], 7).setValue(jenis);
    } else {
      logSheet.appendRow([
        "LOG-" + new Date().getTime(),
        idPegawai,
        "", 
        isoDate,
        "-",
        "-",
        jenis
      ]);
    }
    current.setDate(current.getDate() + 1);
  }
}

function getRekapPresensi1(
  idPegawai,
  bulan,
  tahun
) {

  const ss = getSpreadsheet();

  const logSheet =
    ss.getSheetByName(
      SHEET_LOG_PRESENSI_PEGAWAI
    );

  const ketSheet =
    ss.getSheetByName(
      SHEET_KETERANGAN_PRESENSI
    );

  if (!logSheet) {
    return [];
  }

  const logs =
    logSheet
      .getDataRange()
      .getValues();

  const ketData =
    ketSheet
      ? ketSheet
          .getDataRange()
          .getValues()
      : [];

  const targetId =
    String(idPegawai).trim();

  const targetBulan =
    Number(bulan);

  const targetTahun =
    Number(tahun);

  const periode =
    getPeriodePresensi(
      targetBulan,
      targetTahun
    );

  /**
   * ================================
   * LOAD MASTER PEGAWAI
   * ================================
   */
  const pegawais = getMasterPegawaiPresensi();

  const pegawai =
    pegawais.find(
      p =>
        String(p.idFinger)
          .trim() === targetId
    );

  if (!pegawai) {
    return [];
  }

  /**
   * ================================
   * LOAD HARI LIBUR
   * ================================
   */
  const liburMap =
    hariLibur();

  /**
   * ================================
   * BUILD HARI KERJA
   * ================================
   */
  const hariKerja = [];

  const iterDate =
    new Date(periode.start);

  while (iterDate <= periode.end) {

    if (
      isHariKerjaPegawai(
        pegawai,
        iterDate,
        liburMap
      )
    ) {

      hariKerja.push(
        Utilities.formatDate(
          iterDate,
          'GMT+7',
          'yyyy-MM-dd'
        )
      );
    }

    iterDate.setDate(
      iterDate.getDate() + 1
    );
  }

  /**
   * ================================
   * BUILD LOG MAP
   * ================================
   */
  const logMap = {};

  for (let i = 1; i < logs.length; i++) {

    const rowId =
      String(logs[i][1] || '')
        .trim();

    if (rowId !== targetId) {
      continue;
    }

    const rawDate =
      logs[i][3];

    if (!rawDate) {
      continue;
    }

    const rowDate =
      rawDate instanceof Date
        ? rawDate
        : new Date(rawDate);

    if (
      isNaN(rowDate.getTime())
    ) {
      continue;
    }

    if (
      rowDate < periode.start ||
      rowDate > periode.end
    ) {
      continue;
    }

    const dateKey =
      Utilities.formatDate(
        rowDate,
        'GMT+7',
        'yyyy-MM-dd'
      );

    logMap[dateKey] = {

      masuk:
        logs[i][4]
          ? String(logs[i][4])
          : '-',

      pulang:
        logs[i][5]
          ? String(logs[i][5])
          : '-',

      status:
        logs[i][6] || ''
    };
  }

  /**
   * ================================
   * BUILD KETERANGAN MAP
   * ================================
   */
  const ketMap = {};

  for (let i = 1; i < ketData.length; i++) {

    const rowId =
      String(ketData[i][1] || '')
        .trim();

    if (rowId !== targetId) {
      continue;
    }

    const statusApprove =
      String(ketData[i][8] || '')
        .toUpperCase()
        .trim();

    /**
     * Hanya approved
     */
    if (
      statusApprove !==
      'DISETUJUI'
    ) {
      continue;
    }

    const jenis =
      String(ketData[i][3] || '')
        .trim();

    const keterangan =
      String(ketData[i][6] || '')
        .trim();

    const fileUrl =
      ketData[i][7] || '';

    let start =
      ketData[i][4];

    let end =
      ketData[i][5];

    start =
      start instanceof Date
        ? start
        : new Date(start);

    end =
      end instanceof Date
        ? end
        : new Date(end);

    if (
      isNaN(start.getTime()) ||
      isNaN(end.getTime())
    ) {
      continue;
    }

    const current =
      new Date(start);

    while (current <= end) {

      if (
        current >= periode.start &&
        current <= periode.end
      ) {

        if (
          isHariKerjaPegawai(
            pegawai,
            current,
            liburMap
          )
        ) {

          const key =
            Utilities.formatDate(
              current,
              'GMT+7',
              'yyyy-MM-dd'
            );

          ketMap[key] = {

            status:
              jenis,

            catatan:
              keterangan ||

              jenis,

            fileUrl
          };
        }
      }

      current.setDate(
        current.getDate() + 1
      );
    }
  }

  /**
   * ================================
   * BUILD FINAL REKAP
   * ================================
   */
  const rekap = [];

  for (const dateKey of hariKerja) {

    const tgl =
      new Date(
        dateKey +
        'T00:00:00+07:00'
      );

    const log =
      logMap[dateKey];

    const ket =
      ketMap[dateKey];

    /**
     * PRIORITAS:
     * KETERANGAN > LOG
     */
    if (ket) {

      rekap.push({

        tanggal:
          dateKey,

        masuk:
          log?.masuk || '-',

        pulang:
          log?.pulang || '-',

        status:
          ket.status,

        catatan:
          ket.catatan || '-',

        fileUrl:
          ket.fileUrl || ''
      });

      continue;
    }

    /**
     * ADA LOG PRESENSI
     */
    if (log) {

      const checkResult =
        validatePresenceRulesLog(
          tgl,
          log.masuk,
          log.pulang,
          pegawai
        );

      rekap.push({

        tanggal:
          dateKey,

        masuk:
          log.masuk,

        pulang:
          log.pulang,

        status:
          log.status ||
          checkResult.status ||
          'Hadir',

        catatan:
          checkResult.catatan ||
          '-',

        fileUrl:
          ''
      });

      continue;
    }

  /**
   * JIKA TANGGAL MASIH MASA DEPAN
   */
    const now = new Date();

    const currentDate = new Date(
      tgl.getFullYear(),
      tgl.getMonth(),
      tgl.getDate()
    );

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Jam evaluasi alpha
    const batasAlpha = 18;

    /**
     * MASIH MASA DEPAN
     */
    if (currentDate > today) {

      rekap.push({

        tanggal: dateKey,
        masuk  : '-',
        pulang : '-',

        status : 'Belum Masuk',

        catatan: '-',

        fileUrl: ''
      });

    }

    /**
     * HARI INI
     */
    else if (
      currentDate.getTime() ===
      today.getTime()
    ) {

      /**
       * Belum lewat batas evaluasi
       */
      if (now.getHours() < batasAlpha) {

        rekap.push({

          tanggal: dateKey,
          masuk  : '-',
          pulang : '-',

          status : 'Pending',

          catatan:
            'Menunggu akhir jam kerja',

          fileUrl: ''
        });

      } else {

        /**
         * Sudah lewat jam kerja
         */
        rekap.push({

          tanggal: dateKey,
          masuk  : '-',
          pulang : '-',

          status : 'Tidak Hadir',

          catatan: '-',

          fileUrl: ''
        });
      }

    }

    /**
     * TANGGAL SUDAH LEWAT
     */
    else {

      rekap.push({

        tanggal: dateKey,
        masuk  : '-',
        pulang : '-',

        status : 'Tidak Hadir',

        catatan: '-',

        fileUrl: ''
      });
    }

  }

  return rekap;
}

function getRekapStatus(bulan, tahun, subbag) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_REKAP_STATUS);
  if (!sheet) return "Belum Diajukan";
  
  const data = sheet.getDataRange().getValues();

  const targetBulan = Number(bulan);   // "04" → 4
  const targetTahun = Number(tahun);

  for (let i = 1; i < data.length; i++) {
    const rowBulan = Number(data[i][1]);
    const rowTahun = Number(data[i][2]);

    if (
      rowBulan === targetBulan &&
      rowTahun === targetTahun &&
      (data[i][3] === subbag || data[i][3] === "SEMUA")
    ) {
      return data[i][4];
    }
  }

  return "Belum Diajukan";
}


function getRekapByNip(
  nip,
  bulan,
  tahun
) {

  const maps =
    getPegawaiMapPresensi();

  const pegawai =
    maps.byNip[
      String(nip).trim()
    ];

  if (!pegawai) {
    return [];
  }

  return getRekapPresensi1(
    pegawai.idFinger,
    bulan,
    tahun
  );
}

/**
 * Validates a single attendance log entry.
 *
 * @param {string|Date} dateStr  - The attendance date
 * @param {string}      masuk    - Clock-in time  (e.g. "07:30" or "-")
 * @param {string}      pulang   - Clock-out time (e.g. "16:00" or "-")
 * @param {Object}      [pegawai]- Optional employee object; used to apply JAGAT_SAKSANA rules.
 * @returns {{ status: string, catatan: string }}
 */
function validatePresenceRulesLog(dateStr, masuk, pulang, pegawai) {

  // ===== HELPER: KONVERSI MENIT → JAM MENIT =====
  function formatMenit(menit) {
    if (!menit || menit <= 0) return "0 menit";
    const jam  = Math.floor(menit / 60);
    const sisa = menit % 60;
    if (jam > 0 && sisa > 0) return `${jam} jam ${sisa} menit`;
    if (jam > 0) return `${jam} jam`;
    return `${sisa} menit`;
  }

  // ===== HELPER: KONVERSI KE MENIT =====
  function toMinutes(t) {
    if (!t || t === "-") return null;
    if (Object.prototype.toString.call(t) === "[object Date]") {
      return t.getHours() * 60 + t.getMinutes();
    }
    t = String(t).replace(":", ".");
    const [h, m] = t.split(".").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  // ===== DETEKSI JAGAT_SAKSANA =====
  const hakAkses = pegawai
    ? (pegawai.hakAkses || '').toString().trim().toUpperCase()
    : '';
  const isJagat = hakAkses === 'JAGAT_SAKSANA';

  const m = toMinutes(masuk);
  let   p = toMinutes(pulang);

  // ===== TIDAK ADA DATA =====
  if (m === null && p === null) {
    return { status: "Tidak Hadir", catatan: "Tidak ada data presensi" };
  }

  if (m !== null && p === null) {
    return { status: "Tidak Lengkap", catatan: "Tidak absen pulang" };
  }

  if (m === null && p !== null) {
    return { status: "Tidak Lengkap", catatan: "Tidak absen masuk" };
  }

  // ===== SHIFT MALAM: pulang di hari berikutnya =====
  if (p <= m) {
    p += 24 * 60;
  }

  const durasi = p - m;

  // ===== ATURAN JAGAT_SAKSANA =====
  if (isJagat) {
    const DURASI_MINIMAL_JAGAT = 6 * 60; // 6 jam
    if (durasi < DURASI_MINIMAL_JAGAT) {
      return {
        status : "Kurang",
        catatan: `Durasi kurang (${formatMenit(durasi)} dari minimal 6 jam)`
      };
    }
    return { status: "Terpenuhi", catatan: "-" };
  }

  // ===== ATURAN PEGAWAI NORMAL ASN =====
  const date      = new Date(dateStr);
  const day       = date.getDay();                              // 0=Minggu, 5=Jumat, 6=Sabtu
  const JAM_MASUK = 7 * 60 + 30;                               // 07:30
  const JAM_PULANG = (day === 5) ? (16 * 60 + 30) : (16 * 60); // 16:30 Jumat, 16:00 lainnya
  const STANDAR_KERJA = 450;                                    // 7 jam 30 menit

  let status  = "";
  const catatan = [];

  if (durasi >= STANDAR_KERJA) {
    status = "Terpenuhi";
  } else {
    status = "Kurang";
    catatan.push(`Durasi kurang ${formatMenit(STANDAR_KERJA - durasi)}`);
  }

  if (m > JAM_MASUK) {
    catatan.push(`Terlambat ${formatMenit(m - JAM_MASUK)}`);
  }

  if (p < JAM_PULANG) {
    catatan.push(`Pulang cepat ${formatMenit(JAM_PULANG - p)}`);
  }

  return {
    status,
    catatan: catatan.join(", ") || "-"
  };
}


function processFingerprintData(rawContent) {
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_LOG_PRESENSI_PEGAWAI);
  const pegawaiList = getMasterPegawaiPresensi();

  if (!logSheet) {
    throw new Error("Sheet tidak ditemukan");
  }

  // ================== LOAD PEGAWAI ==================
  const pegawaiMap = getPegawaiMapPresensi().byFinger;

  // ================== PARSE FILE ==================
  // Use a more robust split for different line endings (LF, CRLF, CR)
  const lines = rawContent.split(/\r\n|\n|\r/);
  const groupedData = {};

  lines.forEach(line => {
    if (!line.trim()) return;

    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) return;

    const id = parts[0].toString().trim();
    const date = parts[1];
    const time = parts[2];
    const status = parts[4];

    const key = `${id}_${date}`;

    if (!groupedData[key]) {
      groupedData[key] = { id, date, masuk: "-", pulang: "-" };
    }

    if (status === "0") {
      if (groupedData[key].masuk === "-" || time < groupedData[key].masuk) {
        groupedData[key].masuk = time;
      }
    } else if (status === "1") {
      if (groupedData[key].pulang === "-" || time > groupedData[key].pulang) {
        groupedData[key].pulang = time;
      }
    } else {
      // Fallback: treat as potential masuk or pulang
      if (groupedData[key].masuk === "-" || time < groupedData[key].masuk) groupedData[key].masuk = time;
      if (groupedData[key].pulang === "-" || time > groupedData[key].pulang) groupedData[key].pulang = time;
    }
  });

  // ================== LOAD DATA EXISTING ==================
  const logData = logSheet.getDataRange().getValues();
  const existingRows = {};

  for (let i = 1; i < logData.length; i++) {
    const id = String(logData[i][1] || "").trim();
    const rawDate = logData[i][3];
    if (!id || !rawDate) continue;
    
    let dateStr = "";
    if (rawDate instanceof Date) {
      dateStr = Utilities.formatDate(rawDate, "GMT+7", "yyyy-MM-dd");
    } else {
      dateStr = String(rawDate).trim();
    }
    
    const key = `${id}_${dateStr}`;
    existingRows[key] = i + 1;
  }

  // ================== PREPARE BATCH ==================
  const newRows = [];
  const updates = [];

  for (const key in groupedData) {
    const item = groupedData[key];

    const pegawai = pegawaiMap[String(item.id).trim()];
    const nama = pegawai?.nama || "Unknown";

    const masuk = item.masuk !== "-" ? item.masuk.substring(0, 5) : "-";
    const pulang = item.pulang !== "-" ? item.pulang.substring(0, 5) : "-";

    const hasil = validatePresenceRulesLog(item.date, masuk, pulang, pegawai);

    if (existingRows[key]) {
      updates.push({
        row: existingRows[key],
        data: [nama, item.date, masuk, pulang, hasil.status]
      });
    } else {
      newRows.push([
        "LOG-" + new Date().getTime(),
        item.id,
        nama,
        item.date,
        masuk,
        pulang,
        hasil.status
      ]);
    }
  }

  // ================== WRITE UPDATE ==================
  // Grouping updates by row to minimize setValues calls if possible, 
  // but since they are likely scattered, we just ensure they are correct.
  if (updates.length > 0) {
    updates.forEach(u => {
      logSheet.getRange(u.row, 3, 1, 5).setValues([u.data]);
    });
  }

  // ================== WRITE INSERT==================
  if (newRows.length > 0) {
    logSheet
      .getRange(logSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length)
      .setValues(newRows);
  }

  return {
    success: true,
    inserted: newRows.length,
    updated: updates.length
  };
}

// =============== HELPER FUNCTIONS ===============
function uploadFile(base64, fileName, nama, nip) {
  const folder = DriveApp.getFolderById(FOLDER_UPLOAD_ID);
  const bytes = Utilities.base64Decode(base64.split(",")[1]);
  const blob = Utilities.newBlob(bytes, "application/pdf", `KET_${nip}_${new Date().getTime()}.pdf`);
  const file = folder.createFile(blob);
  return file.getUrl();
}

function getKeteranganList(nip) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KETERANGAN_PRESENSI);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    const rowNip = data[i][1] ? data[i][1].toString() : "";
    if (!nip || rowNip === nip.toString()) {
      result.push({
        id: data[i][0],
        nip: rowNip,
        nama: data[i][2],
        jenis: data[i][3],
        tglMulai: data[i][4],
        tglSelesai: data[i][5],
        keterangan: data[i][6],
        fileUrl: data[i][7],
        status: data[i][8]
      });
    }
  }
  return result;
}

/**
 * ================================
 * MAP HARI LIBUR NASIONAL
 * ================================
 */
function hariLiburPresensi() {

  const sh =
    SpreadsheetApp
      .getActive()
      .getSheetByName(
        'LIBUR_NASIONAL'
      );

  const map = {};

  if (!sh || sh.getLastRow() < 2) {
    return map;
  }

  const data =
    sh.getRange(
      2,
      1,
      sh.getLastRow() - 1,
      3
    ).getValues();

  data.forEach(r => {

    const tgl = r[0];

    const flag =
      String(r[2] || '')
        .trim()
        .toUpperCase();

    if (
      tgl instanceof Date &&
      flag === 'YA'
    ) {

      const key =
        Utilities.formatDate(
          tgl,
          'Asia/Jakarta',
          'yyyy-MM-dd'
        );

      map[key] = true;
    }
  });

  return map;
}


/**
 * ================================
 * VALIDASI HARI KERJA
 * ================================
 */
function isHariKerjaPegawai(
  pegawai,
  tanggal,
  liburMap
) {

  const hari =
    tanggal.getDay();

  const key =
    Utilities.formatDate(
      tanggal,
      'Asia/Jakarta',
      'yyyy-MM-dd'
    );

  const isLiburNasional =
    !!liburMap[key];

  const hakakses =
    (pegawai.hakAkses || '')
      .toString()
      .trim()
      .toUpperCase();

  /**
   * ================================
   * JAGAT SAKSANA
   * FULL HARI
   * ================================
   */
  if (
    hakakses === 'JAGAT_SAKSANA'
  ) {
    return true;
  }

  /**
   * ================================
   * PEGAWAI NORMAL
   * ================================
   */
  if (
    hari === 0 ||
    hari === 6 ||
    isLiburNasional
  ) {
    return false;
  }

  return true;
}


/**
 * ================================
 * TARGET MINIMAL HARI KERJA
 * ================================
 */
function getMinimalHariKerja(
  pegawai,
  periode,
  liburMap
) {

  const hakakses =
    (pegawai.hakAkses || '')
      .toString()
      .trim()
      .toUpperCase();

  /**
   * ================================
   * JAGAT SAKSANA
   * ================================
   */
  if (
    hakakses === 'JAGAT_SAKSANA'
  ) {

    let totalHari = 0;

    const d =
      new Date(periode.start);

    while (d <= periode.end) {

      /**
       * Future date tidak dihitung
       */
      const now = new Date();

      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      const currentDate = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      );

      if (currentDate <= today) {
        totalHari++;
      }

      d.setDate(
        d.getDate() + 1
      );
    }

    /**
     * Toleransi OFF 3 hari
     */
    return Math.max(
      0,
      totalHari - 3
    );
  }

  /**
   * ================================
   * PEGAWAI NORMAL
   * ================================
   */
  let totalHariKerja = 0;

  const d =
    new Date(periode.start);

  while (d <= periode.end) {

    /**
     * Future date tidak dihitung
     */
    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const currentDate = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    );

    if (
      currentDate <= today &&
      isHariKerjaPegawai(
        pegawai,
        d,
        liburMap
      )
    ) {

      totalHariKerja++;
    }

    d.setDate(
      d.getDate() + 1
    );
  }

  return totalHariKerja;
}


/**
 * ================================
 * REKAP BULANAN
 * ================================
 */
function getRekapBulanan(
  bulan,
  tahun,
  jenis
) {

  const ss =
    getSpreadsheet();

  const targetBulan =
    Number(bulan);

  const targetTahun =
    Number(tahun);

  const periode =
    getPeriodePresensi(
      targetBulan,
      targetTahun
    );

  /**
   * ================================
   * VALIDASI KEUANGAN
   * ================================
   */
  if (jenis === 'keuangan') {

    let isApproved = false;

    const rekapSheet =
      ss.getSheetByName(
        SHEET_REKAP_STATUS
      );

    if (rekapSheet) {

      const rekapData =
        rekapSheet
          .getDataRange()
          .getValues();

      for (let i = 1; i < rekapData.length; i++) {

        const rowBulan =
          Number(rekapData[i][1]);

        const rowTahun =
          Number(rekapData[i][2]);

        const status =
          String(
            rekapData[i][4] || ''
          )
          .trim()
          .toUpperCase();

        if (
          rowBulan === targetBulan &&
          rowTahun === targetTahun &&
          (
            status === 'DISETUJUI' ||
            status === 'SELESAI'
          )
        ) {

          isApproved = true;
          break;
        }
      }
    }

    if (!isApproved) {
      return [];
    }
  }

  /**
   * ================================
   * LOAD DATA
   * ================================
   */
  const logSheet =
    ss.getSheetByName(
      SHEET_LOG_PRESENSI_PEGAWAI
    );

  const ketSheet =
    ss.getSheetByName(
      SHEET_KETERANGAN_PRESENSI
    );

  const logs =
    logSheet
      ? logSheet
          .getDataRange()
          .getValues()
      : [];

  const ketData =
    ketSheet
      ? ketSheet
          .getDataRange()
          .getValues()
      : [];

  const pegawais =
    getMasterPegawaiPresensi();

  const liburMap =
    hariLiburPresensi();

  /**
   * ================================
   * INIT SUMMARY
   * ================================
   */
  const summaryMap = {};

  pegawais.forEach(pegawai => {

    const idFinger =
      String(
        pegawai.idFinger || ''
      ).trim();

    if (!idFinger) {
      return;
    }

    summaryMap[idFinger] = {

      idFinger,

      nama:
        pegawai.nama || '-',

      hadir: 0,
      terlambat: 0,
      tidakLengkap: 0,
      izin: 0,
      alpha: 0,

      totalHariKerja:
        getMinimalHariKerja(
          pegawai,
          periode,
          liburMap
        ),

      _hadirDates:
        new Set(),

      _izinDates:
        new Set()
    };
  });

  /**
   * ================================
   * PROCESS LOG
   * ================================
   */
  for (let i = 1; i < logs.length; i++) {

    const idFinger =
      String(logs[i][1] || '')
        .trim();

    if (!summaryMap[idFinger]) {
      continue;
    }

    const pegawai =
      pegawais.find(
        p =>
          String(p.idFinger)
            .trim() === idFinger
      );

    if (!pegawai) {
      continue;
    }

    const rawDate =
      logs[i][3];

    if (!rawDate) {
      continue;
    }

    const d =
      rawDate instanceof Date
        ? rawDate
        : new Date(rawDate);

    if (
      isNaN(d.getTime())
    ) {
      continue;
    }

    if (
      d < periode.start ||
      d > periode.end
    ) {
      continue;
    }

    /**
     * Future date skip
     */
    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const currentDate = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    );

    if (currentDate > today) {
      continue;
    }

    if (
      !isHariKerjaPegawai(
        pegawai,
        d,
        liburMap
      )
    ) {
      continue;
    }

    const key =
      Utilities.formatDate(
        d,
        'GMT+7',
        'yyyy-MM-dd'
      );

    /**
     * Hindari double count
     */
    if (
      summaryMap[idFinger]
        ._hadirDates
        .has(key)
    ) {
      continue;
    }

    summaryMap[idFinger]
      ._hadirDates
      .add(key);

    const masuk =
      logs[i][4];

    const pulang =
      logs[i][5];

    const status =
      String(
        logs[i][6] || ''
      ).trim();

    /**
     * STATUS
     */
    if (
      status === 'Terpenuhi' ||
      status === 'Kurang'
    ) {

      summaryMap[idFinger]
        .hadir++;

    } else if (
      status === 'Tidak Lengkap'
    ) {

      summaryMap[idFinger]
        .tidakLengkap++;
    }

    /**
     * TERLAMBAT
     */
    const hasil =
      validatePresenceRulesLog(
        d,
        masuk,
        pulang,
        pegawai
      );

    const catatan =
      String(
        hasil.catatan || ''
      ).toLowerCase();

    if (
      catatan.includes(
        'terlambat'
      )
    ) {

      summaryMap[idFinger]
        .terlambat++;
    }
  }

  /**
   * ================================
   * PROCESS IZIN
   * ================================
   */
  for (let i = 1; i < ketData.length; i++) {

    const idFinger =
      String(ketData[i][1] || '')
        .trim();

    if (!summaryMap[idFinger]) {
      continue;
    }

    const pegawai =
      pegawais.find(
        p =>
          String(p.idFinger)
            .trim() === idFinger
      );

    if (!pegawai) {
      continue;
    }

    const statusVerif =
      String(
        ketData[i][8] || ''
      )
      .trim()
      .toUpperCase();

    if (
      statusVerif !==
      'DISETUJUI'
    ) {
      continue;
    }

    const jenisKet =
      String(
        ketData[i][3] || ''
      )
      .trim()
      .toLowerCase();

    const jenisValid = [

      'izin',
      'cuti',
      'sakit',
      'dinas luar',
      'tugas belajar'
    ];

    if (
      !jenisValid.includes(
        jenisKet
      )
    ) {
      continue;
    }

    let start =
      ketData[i][4];

    let end =
      ketData[i][5];

    start =
      start instanceof Date
        ? start
        : new Date(start);

    end =
      end instanceof Date
        ? end
        : new Date(end);

    if (
      isNaN(start.getTime()) ||
      isNaN(end.getTime())
    ) {
      continue;
    }

    const current =
      new Date(start);

    while (current <= end) {

      if (
        current >= periode.start &&
        current <= periode.end
      ) {

        /**
         * Future date skip
         */
        const now = new Date();

        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        const currentDate =
          new Date(
            current.getFullYear(),
            current.getMonth(),
            current.getDate()
          );

        if (currentDate > today) {

          current.setDate(
            current.getDate() + 1
          );

          continue;
        }

        if (
          isHariKerjaPegawai(
            pegawai,
            current,
            liburMap
          )
        ) {

          const key =
            Utilities.formatDate(
              current,
              'GMT+7',
              'yyyy-MM-dd'
            );

          if (
            !summaryMap[idFinger]
              ._izinDates
              .has(key)
          ) {

            summaryMap[idFinger]
              ._izinDates
              .add(key);

            summaryMap[idFinger]
              .izin++;
          }
        }
      }

      current.setDate(
        current.getDate() + 1
      );
    }
  }

  /**
   * ================================
   * FINAL RESULT
   * ================================
   */
  return Object.values(summaryMap)

    .map(p => {

      const totalAktif =

        p.hadir +
        p.izin +
        p.tidakLengkap;

      p.alpha = Math.max(
        0,
        p.totalHariKerja -
        totalAktif
      );

      let statusBulanan =
        'Terpenuhi';

      if (p.alpha >= 5) {

        statusBulanan =
          'Tidak Disiplin';

      } else if (
        p.tidakLengkap > 0
      ) {

        statusBulanan =
          'Tidak Lengkap';

      } else if (
        p.terlambat > 5
      ) {

        statusBulanan =
          'Terlambat';

      } else if (
        p.izin > 5
      ) {

        statusBulanan =
          'Banyak Izin';
      }

      delete p._hadirDates;
      delete p._izinDates;

      return {
        ...p,
        statusBulanan
      };
    })

    .sort((a, b) =>
      a.nama.localeCompare(
        b.nama
      )
    );
}


/**
 * Revisi Pengajuan Keterangan
 */
function revisiPengajuan(id, payload) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KETERANGAN_PRESENSI);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      // Update data
      sheet.getRange(i + 1, 4).setValue(payload.jenis);
      sheet.getRange(i + 1, 5).setValue(payload.tglMulai);
      sheet.getRange(i + 1, 6).setValue(payload.tglSelesai);
      sheet.getRange(i + 1, 7).setValue(payload.keterangan);
      sheet.getRange(i + 1, 9).setValue("Direvisi");
      
      // LOG ACTIVITY
      logActivity({
        user: payload.nama || "ADMIN",
        role: "ADMIN",
        aksi: "REVISI",
        targetId: id,
        jenis: payload.jenis,
        status: "Direvisi",
        keterangan: "Pengajuan telah direvisi oleh Admin"
      });

      sheet.getRange(i + 1, 9).setValue("Menunggu Kasubbag");
      
      return { success: true, message: "Pengajuan berhasil direvisi dan diajukan kembali." };
    }
  }
  throw new Error("Data pengajuan tidak ditemukan");
}

/**
 * Mendapatkan riwayat aktivitas/pengajuan
 */
function getHistoryPengajuan(targetId, userNip) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_LOG_ACTIVITY);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  for (let i = data.length - 1; i >= 1; i--) { 
    const rowTargetId = data[i][5];
    const rowUser = data[i][2];
    
    let match = false;
    if (targetId && rowTargetId === targetId) match = true;
    else if (!targetId && userNip && rowUser.includes(userNip)) match = true;
    else if (!targetId && !userNip) match = true; 
    
    if (match) {
      result.push({
        id: data[i][0],
        waktu: Utilities.formatDate(data[i][1], "GMT+7", "yyyy-MM-dd HH:mm:ss"),
        user: data[i][2],
        role: data[i][3],
        aksi: data[i][4],
        targetId: data[i][5],
        jenis: data[i][6],
        status: data[i][7],
        keterangan: data[i][8]
      });
    }
    
    if (result.length >= 50) break; 
  }
  return result;
}

function createRekapAwal(bulan, tahun, subbag, createdBy) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_REKAP_STATUS);
  const now  = new Date();

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][1]) === Number(bulan) &&
        Number(data[i][2]) === Number(tahun) &&
        (data[i][3] === (subbag || "SEMUA"))) {
      return data[i][0];
    }
  }

  const rekapId = "REK-" + now.getTime();

  sheet.appendRow([
    rekapId,
    Number(bulan),
    Number(tahun),
    subbag || "SEMUA",
    "DRAFT",
    createdBy || "ADMIN",
    now,
    now
  ]);

  logActivity({
    user: createdBy || "ADMIN",
    role: "ADMIN",
    aksi: "CREATE_REKAP",
    targetId: rekapId,
    status: "DRAFT",
    keterangan: `Rekap dibuat untuk periode ${bulan}-${tahun} (${subbag || 'Semua'})`
  });

  return rekapId;
}


function processFingerprintDataWithRekap(rawContent, rekapId) {
  const ss = getSpreadsheet();
  const logSheet    = ss.getSheetByName(SHEET_LOG_PRESENSI_PEGAWAI);
  const pegawaiList = getMasterPegawaiPresensi();

  if (!logSheet) throw new Error("Sheet tidak ditemukan");

  // ===== LOAD PEGAWAI =====
  const idToNama = {};
  const pegawaiMap = {};
  for (let i = 0; i < pegawaiList.length; i++) {
    const id = String(pegawaiList[i].idFinger || "").trim();
    if (id) {
      idToNama[id] = pegawaiList[i].nama;
      pegawaiMap[id] = pegawaiList[i];
    }
  }

  // ===== PARSE FILE .DAT =====
  const lines = rawContent.split(/\r\n|\n|\r/);
  const groupedData = {};
  lines.forEach(line => {
    if (!line.trim()) return;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) return;
    const id     = parts[0].toString().trim();
    const date   = parts[1];
    const time   = parts[2];
    const status = parts[4]; // 0=masuk, 1=pulang
    
    // Validate that we have a date and time to avoid processing headers or junk
    if (!date || !date.includes("-") || !time || !time.includes(":")) return;

    const key    = `${id}_${date}`;
    if (!groupedData[key]) groupedData[key] = { id, date, masuk: "-", pulang: "-" };
    if (status === "0") {
      if (groupedData[key].masuk === "-" || time < groupedData[key].masuk) groupedData[key].masuk = time;
    } else if (status === "1") {
      if (groupedData[key].pulang === "-" || time > groupedData[key].pulang) groupedData[key].pulang = time;
    } else {
      // Fallback: treat as potential masuk or pulang
      if (groupedData[key].masuk === "-" || time < groupedData[key].masuk) groupedData[key].masuk = time;
      if (groupedData[key].pulang === "-" || time > groupedData[key].pulang) groupedData[key].pulang = time;
    }
  });

  // ===== LOAD EXISTING LOG =====
  const logData = logSheet.getDataRange().getValues();
  const existingRows = {};
  for (let i = 1; i < logData.length; i++) {
    const id = String(logData[i][1] || "").trim();
    const rawDate = logData[i][3];
    if (!id || !rawDate) continue;

    let dateStr = "";
    if (rawDate instanceof Date) {
      dateStr = Utilities.formatDate(rawDate, "GMT+7", "yyyy-MM-dd");
    } else {
      dateStr = String(rawDate).trim();
    }

    const key = `${id}_${dateStr}`;
    existingRows[key] = i + 1;
  }

  // =====  INSERT / UPDATE =====
  const newRows = [];
  const updates = [];

  for (const key in groupedData) {
    const item   = groupedData[key];
    const nama   = idToNama[item.id] || "Unknown";
    const masuk  = item.masuk  !== "-" ? item.masuk.substring(0, 5)  : "-";
    const pulang = item.pulang !== "-" ? item.pulang.substring(0, 5) : "-";
    const pegawai = pegawaiMap[String(item.id).trim()];
    const hasil  = validatePresenceRulesLog(item.date, masuk, pulang, pegawai);

    if (existingRows[key]) {
      updates.push({ row: existingRows[key], data: [nama, item.date, masuk, pulang, hasil.status, rekapId || ""] });
    } else {
      newRows.push([
        "LOG-" + new Date().getTime() + Math.random().toString(36).substr(2, 4),
        item.id, nama, item.date, masuk, pulang, hasil.status,
        rekapId || ""
      ]);
    }
  }

  updates.forEach(u => logSheet.getRange(u.row, 3, 1, 6).setValues([u.data]));
  if (newRows.length > 0) {
    logSheet.getRange(logSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  if (rekapId) _updateRekapTimestamp(rekapId);

  return { success: true, inserted: newRows.length, updated: updates.length };
}

function simpanKeteranganAdminV2(payload) {
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KETERANGAN_PRESENSI);
  const id    = "KET-" + new Date().getTime();

  let fileUrl = "";
  if (payload.fileBase64) {
    fileUrl = uploadFile(payload.fileBase64, payload.fileName, payload.nama, payload.idFinger);
  }

  sheet.appendRow([
    id, payload.idFinger, payload.nama, payload.jenis,
    payload.tglMulai, payload.tglSelesai,
    payload.keterangan, fileUrl,
    "Menunggu Kasubbag", new Date(),
    payload.rekapId || ""
  ]);

  logActivity({
    user: payload.nama,
    role: "ADMIN",
    aksi: "AJUKAN_KETERANGAN",
    targetId: payload.rekapId || id,
    status: "Menunggu Kasubbag",
    keterangan: `${payload.jenis}: ${payload.tglMulai} s/d ${payload.tglSelesai}`
  });

  return { success: true, id, message: "Keterangan berhasil disimpan." };
}

function getTimelinePresensi(idFinger, rekapId) {
  const ss = getSpreadsheet();

  // Ambil info periode dari REKAP_STATUS
  const rekapSheet = ss.getSheetByName(SHEET_REKAP_STATUS);
  const rekapData  = rekapSheet.getDataRange().getValues();
  
  const rekapRow = rekapData.find(row => row[0] === rekapId);
  if (!rekapRow) throw new Error("REKAP_ID tidak ditemukan: " + rekapId);
  
  const targetBulan = Number(rekapRow[1]);
  const targetTahun = Number(rekapRow[2]);
  const periode = getPeriodePresensi(targetBulan, targetTahun);

  const pegawais = getMasterPegawaiPresensi();
  const pegawai  = pegawais.find(p => String(p.idFinger).trim() === idFinger.toString().trim());
  if (!pegawai) throw new Error("Pegawai tidak ditemukan: " + idFinger);

  const liburMap = hariLiburPresensi();
  const targetId = idFinger.toString().trim();

  // Buat daftar semua hari dalam bulan yang merupakan hari kerja bagi pegawai tersebut
  const hariKerja = [];
  let dIter = new Date(periode.start);
  while (dIter <= periode.end) {
    if (isHariKerjaPegawai(pegawai, dIter, liburMap)) {
      hariKerja.push(Utilities.formatDate(dIter, "GMT+7", "yyyy-MM-dd"));
    }
    dIter.setDate(dIter.getDate() + 1);
  }

  // Load LOG_PRESENSI
  const logSheet = ss.getSheetByName(SHEET_LOG_PRESENSI_PEGAWAI);
  const logMap   = {}; 

  if (logSheet) {
    const logs = logSheet.getDataRange().getValues();
    for (let i = 1; i < logs.length; i++) {
      const rowId = logs[i][1]?.toString().trim();
      if (rowId !== targetId) continue;

      const rawDate = logs[i][3];
      if (!rawDate) continue;
      const d = rawDate instanceof Date ? rawDate : new Date(rawDate);
      if (isNaN(d.getTime())) continue;

      if (d < periode.start || d > periode.end) continue;

      const dateStr = Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd");
      logMap[dateStr] = {
        masuk   : logs[i][4] ? String(logs[i][4]) : "-",
        pulang  : logs[i][5] ? String(logs[i][5]) : "-",
        statusLog: logs[i][6] || ""
      };
    }
  }

  // Load KETERANGAN (Approved)
  const ketSheet = ss.getSheetByName(SHEET_KETERANGAN_PRESENSI);
  const ketRanges = [];

  if (ketSheet) {
    const ketData = ketSheet.getDataRange().getValues();
    for (let j = 1; j < ketData.length; j++) {
      const rowId = ketData[j][1]?.toString().trim();
      if (rowId !== targetId) continue;
      
      const statusVerif = (ketData[j][8] || "").toString().toUpperCase();
      if (statusVerif !== "DISETUJUI") continue;

      const start = new Date(ketData[j][4]);
      const end   = new Date(ketData[j][5]);

      ketRanges.push({
        start,
        end,
        jenis: ketData[j][3],
        fileUrl: ketData[j][7],
        keterangan: ketData[j][6]
      });
    }
  }

  const timeline = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const dateStr of hariKerja) {
    const tgl = new Date(dateStr + "T00:00:00+07:00");
    const currentDate = new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate());

    let ketInfo = null;
    for (const ket of ketRanges) {
      if (tgl >= ket.start && tgl <= ket.end) { ketInfo = ket; break; }
    }

    if (ketInfo) {
      timeline.push({
        tanggal : dateStr,
        masuk   : "-",
        pulang  : "-",
        status  : ketInfo.jenis,
        catatan : ketInfo.keterangan || "-",
        fileUrl : ketInfo.fileUrl || ""
      });
    } else if (logMap[dateStr]) {
      const log = logMap[dateStr];
      const check = validatePresenceRulesLog(tgl, log.masuk, log.pulang, pegawai);
      timeline.push({
        tanggal : dateStr,
        masuk   : log.masuk,
        pulang  : log.pulang,
        status  : log.statusLog || check.status,
        catatan : check.catatan || "-",
        fileUrl : ""
      });
    } else {
      let status = "Tidak Hadir";
      let catatan = "-";
      
      if (currentDate > today) {
        status = "Belum Masuk";
      } else if (currentDate.getTime() === today.getTime()) {
        if (now.getHours() < 18) {
          status = "Pending";
          catatan = "Menunggu akhir jam kerja";
        }
      }

      timeline.push({
        tanggal : dateStr,
        masuk   : "-",
        pulang  : "-",
        status  : status,
        catatan : catatan,
        fileUrl : ""
      });
    }
  }

  return timeline;
}


function verifikasiRekap(rekapId, action, role, userName, alasan) {
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_REKAP_STATUS);
  const data  = sheet.getDataRange().getValues();

  const roleUpper = (role || "").toUpperCase();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] !== rekapId) continue;

    const currentStatus = (data[i][4] || "").toUpperCase();
    let newStatus = "";

    if (action === "approve") {
      if (roleUpper === "KASUBBAG")   newStatus = "MENUNGGU_SEKRETARIS";
      else if (roleUpper === "SEKRETARIS") newStatus = "DISETUJUI";
      else throw new Error("Role tidak valid untuk approve");
    } else if (action === "reject") {
      newStatus = "DIKEMBALIKAN";
    } else {
      throw new Error("Action tidak valid: " + action);
    }

    sheet.getRange(i + 1, 5).setValue(newStatus);
    sheet.getRange(i + 1, 8).setValue(new Date());

    if (action === "reject" && alasan) {
      const currentCreatedBy = data[i][5] || "";
      sheet.getRange(i + 1, 6).setValue(currentCreatedBy); // tetap
    }

    logActivity({
      user     : userName || roleUpper,
      role     : roleUpper,
      aksi     : action === "approve" ? "APPROVE" : "REJECT",
      targetId : rekapId,
      status   : newStatus,
      keterangan: alasan || (action === "approve" ? "Persetujuan rekap" : "Dikembalikan untuk revisi")
    });

    return { success: true, status: newStatus };
  }

  throw new Error("REKAP_ID tidak ditemukan: " + rekapId);
}


function ajukanRekapV2(rekapId, userName) {
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_REKAP_STATUS);
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] !== rekapId) continue;

    sheet.getRange(i + 1, 5).setValue("MENUNGGU_KASUBBAG");
    sheet.getRange(i + 1, 8).setValue(new Date());

    logActivity({
      user      : userName || "ADMIN",
      role      : "ADMIN",
      aksi      : "AJUKAN",
      targetId  : rekapId,
      status    : "MENUNGGU_KASUBBAG",
      keterangan: `Rekap diajukan oleh ${userName || 'Admin'}`
    });

    return { success: true };
  }
  throw new Error("REKAP_ID tidak ditemukan: " + rekapId);
}

function getRekapListByStatus(status) {
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_REKAP_STATUS);
  if (!sheet) return [];

  const data   = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const rowStatus = (data[i][4] || "").toUpperCase();
    if (rowStatus === status.toUpperCase()) {
      result.push({
        id       : data[i][0],
        bulan    : data[i][1],
        tahun    : data[i][2],
        subbag   : data[i][3],
        status   : data[i][4],
        createdBy: data[i][5],
        createdAt: data[i][6] instanceof Date ? Utilities.formatDate(data[i][6], "GMT+7", "yyyy-MM-dd") : data[i][6],
        updatedAt: data[i][7] instanceof Date ? Utilities.formatDate(data[i][7], "GMT+7", "yyyy-MM-dd HH:mm") : data[i][7],
        isRekap  : true
      });
    }
  }
  return result;
}


function getRekapListDisetujui() {
  return getRekapListByStatus("DISETUJUI");
}

function _updateRekapTimestamp(rekapId) {
  const sheet = getSpreadsheet().getSheetByName(SHEET_REKAP_STATUS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === rekapId) {
      sheet.getRange(i + 1, 8).setValue(new Date());
      break;
    }
  }
}

function getRekapDikembalikanDetail() {
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_REKAP_STATUS);
  const logSheet = ss.getSheetByName(SHEET_LOG_ACTIVITY);
  if (!sheet) return [];

  const data   = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const status = (data[i][4] || "").toString().toUpperCase();
    if (status !== "DIKEMBALIKAN") continue;

    let alasan = "-";
    if (logSheet) {
      const logs = logSheet.getDataRange().getValues();
      for (let j = logs.length - 1; j >= 1; j--) {
        const rowRekapId = logs[j][5];
        const action     = (logs[j][4] || "").toUpperCase();
        if (rowRekapId === data[i][0] && action === "REJECT") {
          alasan = logs[j][8] || "-";
          break;
        }
      }
    }

    result.push({
      id       : data[i][0],
      bulan    : data[i][1],
      tahun    : data[i][2],
      subbag   : data[i][3] || "Semua",
      status   : data[i][4],
      alasan   : alasan,
      updatedAt: data[i][7] instanceof Date ? Utilities.formatDate(data[i][7], "GMT+7", "yyyy-MM-dd HH:mm") : (data[i][7] || "-")
    });
  }
  return result;
}

function getRiwayatRekap(rekapId) {
  return getHistoryPengajuan(rekapId, null);
}

// ---------------------------------------------------------------
// HELPER: Format Nama Bulan
// ---------------------------------------------------------------
function formatNamaBulan(bulan) {
  const bulanList = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return bulanList[Number(bulan) - 1] || '';
}
 
// ---------------------------------------------------------------
// CEK STATUS REKAP SELESAI
// ---------------------------------------------------------------
function isRekapSelesai(bulan, tahun) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_REKAP_STATUS);
    if (!sheet) return false;
 
    const data = sheet.getDataRange().getValues();
    const targetBulan = Number(bulan);
    const targetTahun = Number(tahun);
 
    for (let i = 1; i < data.length; i++) {
      if (
        Number(data[i][1]) === targetBulan &&
        Number(data[i][2]) === targetTahun &&
        (data[i][4] || '').toString().toUpperCase() === 'SELESAI'
      ) {
        return true;
      }
    }
    return false;
  } catch (e) {
    Logger.log('isRekapSelesai error: ' + e.message);
    return false;
  }
}
 
// ---------------------------------------------------------------
// SELESAIKAN REKAP BULANAN
// ---------------------------------------------------------------
function selesaikanRekapBulanan(bulan, tahun) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_REKAP_STATUS);
    if (!sheet) return { success: false, message: 'Sheet REKAP_STATUS tidak ditemukan' };
 
    const targetBulan = Number(bulan);
    const targetTahun = Number(tahun);
 
    // Cek sudah SELESAI sebelumnya
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (
        Number(data[i][1]) === targetBulan &&
        Number(data[i][2]) === targetTahun &&
        (data[i][4] || '').toString().toUpperCase() === 'SELESAI'
      ) {
        return { success: false, message: 'Rekap periode ini sudah diselesaikan sebelumnya' };
      }
    }
 
    const rekapId = 'REKAP-' + new Date().getTime();
    sheet.appendRow([rekapId, targetBulan, targetTahun, 'SEMUA', 'SELESAI', new Date()]);
 
    logActivity({
      user: 'ADMIN',
      role: 'ADMIN',
      aksi: 'SELESAIKAN_REKAP',
      targetId: rekapId,
      jenis: 'REKAP_BULANAN',
      status: 'SELESAI',
      keterangan: 'Rekap ' + formatNamaBulan(bulan) + ' ' + tahun + ' diselesaikan'
    });
 
    return {
      success: true,
      message: 'Rekap ' + formatNamaBulan(bulan) + ' ' + tahun + ' berhasil diselesaikan'
    };
  } catch (err) {
    Logger.log('selesaikanRekapBulanan error: ' + err.message);
    return { success: false, message: 'Gagal: ' + err.message };
  }
}
 
// ---------------------------------------------------------------
// GENERATE PDF REKAP ABSENSI MENGGUNAKAN DocumentApp
// ---------------------------------------------------------------
function generateRekapPDFPeriode(bulan, tahun) {
  try {
    const targetBulan  = Number(bulan);
    const targetTahun  = Number(tahun);
    const namaBulan    = formatNamaBulan(targetBulan);
    const periode      = getPeriodePresensi(targetBulan, targetTahun);
 
    const bulanList = [
      'Januari','Februari','Maret','April','Mei','Juni',
      'Juli','Agustus','September','Oktober','November','Desember'
    ];
    const tglMulai     = '21 ' + bulanList[periode.start.getMonth()] + ' ' + periode.start.getFullYear();
    const tglAkhir     = '20 ' + bulanList[periode.end.getMonth()]   + ' ' + periode.end.getFullYear();
    const periodeLabel = tglMulai + ' s/d ' + tglAkhir;
 
    const pegawaiList = getMasterPegawaiPresensi();
    if (!pegawaiList || !pegawaiList.length) {
      return { success: false, message: 'Tidak ada data pegawai' };
    }
 
    // ===== FOLDER DRIVE =====
    const folderName = 'REKAP_ABSENSI_PDF';
    const folderIter = DriveApp.getFoldersByName(folderName);
    const pdfFolder  = folderIter.hasNext() ? folderIter.next() : DriveApp.createFolder(folderName);
 
    const subFolderName = 'Rekap ' + namaBulan + ' ' + targetTahun;
    const subIter       = pdfFolder.getFoldersByName(subFolderName);
    const subFolder     = subIter.hasNext() ? subIter.next() : pdfFolder.createFolder(subFolderName);
 
    // ===== LOAD DATA =====
    const ss       = getSpreadsheet();
    const logSheet = ss.getSheetByName(SHEET_LOG_PRESENSI_PEGAWAI);
    const ketSheet = ss.getSheetByName(SHEET_KETERANGAN_PRESENSI);
    const logData  = logSheet ? logSheet.getDataRange().getValues() : [];
    const ketData  = ketSheet ? ketSheet.getDataRange().getValues() : [];
 
    const logMap = {};
    for (let i = 1; i < logData.length; i++) {
      const id      = (logData[i][1] || '').toString().trim();
      const rawDate = logData[i][3];
      if (!rawDate) continue;
      const d = rawDate instanceof Date ? rawDate : new Date(rawDate);
      if (isNaN(d.getTime()) || d < periode.start || d > periode.end) continue;
      const dateKey = Utilities.formatDate(d, 'GMT+7', 'yyyy-MM-dd');
      logMap[id + '_' + dateKey] = {
        masuk  : logData[i][4] ? String(logData[i][4]) : '-',
        pulang : logData[i][5] ? String(logData[i][5]) : '-',
        status : logData[i][6] || '-'
      };
    }
 
    const ketRanges = [];
    for (let i = 1; i < ketData.length; i++) {
      if ((ketData[i][8] || '').toString().toUpperCase() !== 'DISETUJUI') continue;
      const start = new Date(ketData[i][4]);
      const end   = new Date(ketData[i][5]);
      if (isNaN(start) || isNaN(end)) continue;
      ketRanges.push({ nip: (ketData[i][1] || '').toString().trim(), start, end, jenis: ketData[i][3] || '-' });
    }
 
    const nipToFinger = {};
    pegawaiList.forEach(p => { if (p.nip && p.idFinger) nipToFinger[p.nip] = p.idFinger; });
 
    let successCount = 0;
    const errors     = [];
 
    // ===== LOOP PER PEGAWAI =====
    for (let p = 0; p < pegawaiList.length; p++) {
      try {
        const pegawai = pegawaiList[p];
        if (!pegawai.idFinger) continue;
 
        const rows = [];
        let no = 1;
        let d  = new Date(periode.start);
 
        while (d <= periode.end) {
          const dateKey  = Utilities.formatDate(d, 'GMT+7', 'yyyy-MM-dd');
          const mapKey   = pegawai.idFinger + '_' + dateKey;
          let masuk = '-'; 
          let pulang = '-'; 
          let totalJamKerja = '-'; 
          let keterangan = 'Tidak Hadir';

          if (logMap[mapKey]) {
            masuk      = logMap[mapKey].masuk;
            pulang     = logMap[mapKey].pulang;
            keterangan = logMap[mapKey].status || 'Hadir';
          }

          // ===== HITUNG TOTAL JAM KERJA =====
          if (
            masuk !== '-' &&
            pulang !== '-' &&
            masuk.includes(':') &&
            pulang.includes(':')
          ) {

            try {

              const masukParts  = masuk.split(':');
              const pulangParts = pulang.split(':');

              const masukDate = new Date();
              masukDate.setHours(
                Number(masukParts[0]),
                Number(masukParts[1]),
                0
              );

              const pulangDate = new Date();
              pulangDate.setHours(
                Number(pulangParts[0]),
                Number(pulangParts[1]),
                0
              );

              let diffMs = pulangDate - masukDate;

              // Jika jam pulang lewat tengah malam
              if (diffMs < 0) {
                diffMs += 24 * 60 * 60 * 1000;
              }

              const totalMenit = Math.floor(diffMs / 60000);

              const jam   = Math.floor(totalMenit / 60);
              const menit = totalMenit % 60;

              totalJamKerja =
                String(jam).padStart(2, '0') +
                ':' +
                String(menit).padStart(2, '0');

            } catch(err) {
              totalJamKerja = '-';
            }
          }

 
          for (let k = 0; k < ketRanges.length; k++) {
            const ket = ketRanges[k];
            if (nipToFinger[ket.nip] !== pegawai.idFinger) continue;
            if (d >= ket.start && d <= ket.end) { keterangan = ket.jenis; break; }
          }

          rows.push({
            no     : no++,
            tanggal: Utilities.formatDate(d, 'GMT+7', 'dd MMM yyyy'),
            masuk,
            pulang,
            totalJamKerja,
            keterangan
          });
 
          d.setDate(d.getDate() + 1);
        }
 
        // ===== RENDER HTML =====
        const template = HtmlService.createTemplateFromFile('template_rekap_pdf');

        template.pegawai      = pegawai;
        template.rows         = rows;
        template.periodeLabel = periodeLabel;

        const html = template.evaluate().getContent();

        // ===== HTML → PDF =====
        const blob = Utilities
          .newBlob(html, 'text/html')
          .getAs('application/pdf')
          .setName('Rekap Absensi - ' + pegawai.nama + '.pdf');

        // ===== HAPUS FILE LAMA =====
        const oldFiles = subFolder.getFilesByName(blob.getName());

        while (oldFiles.hasNext()) {
          oldFiles.next().setTrashed(true);
        }

        // ===== SAVE PDF =====
        subFolder.createFile(blob);

        successCount++;
        Utilities.sleep(300);
 
      } catch (pegErr) {
        Logger.log('PDF error [' + pegawaiList[p].nama + ']: ' + pegErr.message);
        errors.push(pegawaiList[p].nama + ': ' + pegErr.message);
      }
    }
 
    logActivity({
      user      : 'ADMIN',
      role      : 'ADMIN',
      aksi      : 'GENERATE_PDF',
      targetId  : targetBulan + '-' + targetTahun,
      jenis     : 'PDF_REKAP',
      status    : 'SUCCESS',
      keterangan: successCount + ' PDF berhasil untuk periode ' + periodeLabel
    });
 
    return {
      success     : true,
      jumlah      : successCount,
      errors      : errors,
      folderUrl   : subFolder.getUrl(),
      periodeLabel: periodeLabel
    };
 
  } catch (err) {
    Logger.log('generateRekapPDFPeriode error: ' + err.message);
    return { success: false, message: 'Gagal: ' + err.message };
  }
}
 