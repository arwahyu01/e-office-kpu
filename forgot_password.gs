function requestResetPassword(email) {
  const ss = SpreadsheetApp.getActive();
  const shPegawai = ss.getSheetByName('MASTER_PEGAWAI');
  const shReset   = ss.getSheetByName('RESET_PASSWORD');

  const data = shPegawai.getDataRange().getValues();

  const row = data.find((r, i) =>
    i > 0 &&
    String(r[8]).toLowerCase() === email.toLowerCase() &&
    r[10] === 'AKTIF'
  );

  if (!row) {
    return {
      success: false,
      message: 'Email tidak terdaftar atau akun tidak aktif'
    };
  }

  const token = Utilities.getUuid();
  const expiredAt = new Date(Date.now() + 30 * 60 * 1000); // 30 menit

  shReset.appendRow([
    email,
    token,
    expiredAt,
    false
  ]);

  const resetUrl = ScriptApp.getService().getUrl() + '?page=reset&token=' + encodeURIComponent(token);


  MailApp.sendEmail({
    to: email,
    subject: 'Reset Password E-LKH KPU Kabupaten Siak',
    htmlBody: `
      <p>Yth. ${row[1]},</p>
      <p>Kami menerima permintaan reset password akun <b>E-LKH KPU</b>.</p>
      <p>Silakan klik tautan berikut:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p><b>Berlaku 30 menit.</b></p>
      <br>
      <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
      <hr>
      <small>E-LKH KPU Kabupaten Siak</small>
    `
  });

  return { success: true };
}

function resetPassword(token, newPassword) {
  const ss = SpreadsheetApp.getActive();
  const shReset   = ss.getSheetByName('RESET_PASSWORD');
  const shPegawai = ss.getSheetByName('MASTER_PEGAWAI');

  if (!token) {
    return { success: false, message: 'Token tidak ditemukan' };
  }

  const resetData = shReset.getDataRange().getValues();

  const resetIndex = resetData.findIndex((r, i) => {
    if (i === 0) return false;

    const sheetToken = String(r[1]).trim();
    const inputToken = String(token).trim();
    const used       = r[3] === true;

    return sheetToken === inputToken && !used;
  });

  if (resetIndex === -1) {
    return { success: false, message: 'Token tidak valid atau sudah digunakan' };
  }

  const resetRow = resetData[resetIndex];
  const expiredAt = new Date(resetRow[2]);

  if (new Date() > expiredAt) {
    return { success: false, message: 'Token sudah kedaluwarsa' };
  }

  const email = String(resetRow[0]).trim();
  const hash = hashPassword(newPassword);
  const pegawaiData = shPegawai.getDataRange().getValues();

  let updated = false;

  for (let i = 1; i < pegawaiData.length; i++) {
    const emailSheet = String(pegawaiData[i][8]).trim();

    if (emailSheet === email) {
      shPegawai.getRange(i + 1, 10).setValue(hash);
      updated = true;
      break;
    }
  }

  if (!updated) {
    return { success: false, message: 'Email pegawai tidak ditemukan' };
  }

  shReset.getRange(resetIndex + 1, 4).setValue(true);

  return { success: true };
}

