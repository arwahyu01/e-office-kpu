function kirimNotifikasiEmail(type, payload) {
  try {

    if (!payload || !payload.email) {
      throw new Error("Email tujuan tidak ditemukan");
    }

    const template = EmailTemplate[type];
    if (!template) {
      throw new Error('Template email tidak ditemukan: ' + type);
    }

    const result = template(payload);
    const subject = result.subject || '(Tanpa Subjek)';
    const body = result.body || '';

    MailApp.sendEmail({
      to: payload.email,
      subject: subject,
      body: body,
      name: 'E-Office KPU Kabupaten Siak'
    });

    logSystem(
      `EMAIL|${type}|${payload.email}`,
      'INFO',
      'Notifikasi'
    );
  } catch (err) {
    Logger.log('[EMAIL ERROR] ' + err.message);
  }
}
