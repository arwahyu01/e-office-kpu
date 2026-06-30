function pengingatAgenda() {
  const now = new Date();
  const jam = now.getHours();
  const menit = now.getMinutes();

  // =====================
  // WINDOW JAM (11:00–11:20)
  // =====================
  if (jam !== 11 || menit > 20) return;

  // =====================
  // HARI (Senin & Kamis)
  // =====================
  const day = now.getDay();
  if (![1, 4].includes(day)) return;

  if (isHariLibur(now)) return;

  const ss = SpreadsheetApp.getActive();
  const shMaster = ss.getSheetByName(CONFIG.SHEET_MASTER);
  const master = shMaster.getDataRange().getValues();

  const props = PropertiesService.getScriptProperties();
  const todayKey = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');

  // =====================
  // AMBIL INDEX TERAKHIR
  // =====================
  let lastIndex = Number(props.getProperty('REMINDER_INDEX') || 1);

  const batchSize = 10;
  let sent = 0;

  for (let i = lastIndex; i < master.length; i++) {
    const nama = master[i][1];
    const email = String(master[i][8]).toLowerCase().trim();
    if (!email) continue;

    const sentKey = `REMINDER_${todayKey}_${email}`;
    if (props.getProperty(sentKey)) continue;

    kirimNotifikasiEmail('PENGINGAT_MENGISI', {
      email,
      nama,
      konteks: 'hari ini',
      link: 'https://tinyurl.com/lhk-kpusiak'
    });

    props.setProperty(sentKey, 'SENT');

    sent++;
    lastIndex = i + 1;

    if (sent >= batchSize) break;
  }

  // =====================
  // SIMPAN PROGRESS
  // =====================
  if (lastIndex >= master.length) {
    props.deleteProperty('REMINDER_INDEX'); // reset
  } else {
    props.setProperty('REMINDER_INDEX', lastIndex);
  }
}

function pengingatAbsensi() {
  const now = new Date();
  const jam = now.getHours();
  const menit = now.getMinutes();

  // =====================
  // WINDOW JAM (07:00–07:20)
  // =====================
  if (jam !== 6 || menit > 50) return;

  // =====================
  // HANYA HARI JUMAT
  // =====================
  const day = now.getDay();

  // Jumat = 5
  if (day !== 5) return;

  // Skip hari libur nasional
  if (isHariLibur(now)) return;

  const ss = SpreadsheetApp.getActive();
  const shMaster = ss.getSheetByName(CONFIG.SHEET_MASTER);

  if (!shMaster) return;

  const master = shMaster.getDataRange().getValues();

  const props = PropertiesService.getScriptProperties();

  const todayKey = Utilities.formatDate(
    now,
    'Asia/Jakarta',
    'yyyy-MM-dd'
  );

  // =====================
  // INDEX PROGRESS
  // =====================
  let lastIndex = Number(
    props.getProperty('ABSENSI_REMINDER_INDEX') || 1
  );

  const batchSize = 10;
  let sent = 0;

  for (let i = lastIndex; i < master.length; i++) {

    const nama = master[i][1];
    const email = String(master[i][8] || '')
      .toLowerCase()
      .trim();

    if (!email) continue;

    // =====================
    // SUDAH DIKIRIM?
    // =====================
    const sentKey = `ABSENSI_REMINDER_${todayKey}_${email}`;

    if (props.getProperty(sentKey)) continue;

    // =====================
    // KIRIM EMAIL
    // =====================
    kirimNotifikasiEmail('PENGINGAT_ABSENSI', {
      email,
      nama,
      konteks: 'hari ini',
      link: 'https://tinyurl.com/lhk-kpusiak'
    });

    props.setProperty(sentKey, 'SENT');

    sent++;
    lastIndex = i + 1;

    // =====================
    // BATASI PER EKSEKUSI
    // =====================
    if (sent >= batchSize) break;
  }

  // =====================
  // SIMPAN PROGRESS
  // =====================
  if (lastIndex >= master.length) {

    props.deleteProperty('ABSENSI_REMINDER_INDEX');

  } else {

    props.setProperty(
      'ABSENSI_REMINDER_INDEX',
      lastIndex
    );
  }
}

function isHariLibur(date) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('LIBUR_NASIONAL');
  if (!sh) return false;

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return false;

  // kolom A (Tanggal) & C (LIBUR)
  const data = sh.getRange(2, 1, lastRow - 1, 3).getValues();

  const key = Utilities.formatDate(date, 'Asia/Jakarta', 'yyyy-MM-dd');

  for (let i = 0; i < data.length; i++) {
    const tanggal = data[i][0];
    const statusLibur = String(data[i][2] || '').toUpperCase().trim();

    if (!(tanggal instanceof Date)) continue;
    if (statusLibur !== 'YA') continue;

    const liburKey = Utilities.formatDate(tanggal, 'Asia/Jakarta', 'yyyy-MM-dd');

    if (liburKey === key) {
      return true;
    }
  }

  return false;
}