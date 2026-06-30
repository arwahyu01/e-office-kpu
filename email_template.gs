const EmailTemplate = {

  UPLOAD_BERHASIL(payload) {
    return {
      subject: 'Konfirmasi Upload LKH Bulanan',
      body: `
      Yth. ${payload.nama},

      Laporan Kinerja Harian (LKH) Anda telah berhasil diunggah.

      Rincian:
      - Nama File   : ${payload.fileName}
      - Periode     : ${payload.folderName}
      - Waktu Upload: ${Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd MMM yyyy HH:mm')} WIB

      File dapat diakses di:
      ${payload.fileUrl}

      Terima kasih.

      —
      Sistem E-LKH
      KPU Kabupaten Siak
      `
    };
  },

  PENGINGAT_MENGISI(payload) {
    return {
      subject: 'Pengingat Laporan Kinerja Harian',
      body: `
      Halo ${payload.nama},

      Hari ini jangan lupa mengisi laporan kinerja harian ya..

      Laporan bisa diisi melalui:
      ${payload.link || 'https://tinyurl.com/lhk-kpusiak'}

      Jika sudah diisi, abaikan pesan ini.

      Terima kasih.

      —
      Sistem E-LKH
      KPU Kabupaten Siak
      `
    };
  },

  CETAK_LHK(payload) {
    return {
      subject: `Laporan Kinerja Harian (LKH) – ${payload.periode}`,
      body: `
      Yth. ${payload.nama},

      Laporan Kinerja Harian (LKH) Anda telah berhasil dibuat melalui sistem E-LKH.

      Rincian:
      - Nama File : ${payload.fileName}
      - Periode   : ${payload.periode}

      Dokumen dapat diakses melalui:
      ${payload.fileUrl}

      Terima kasih.

      —
      Sistem E-LKH
      KPU Kabupaten Siak
      `
    };
  },

  PENGAJUAN_LHK(payload) {
    return {
      subject: 'Pengajuan Persetujuan LKH',
      body: `
      Yth. ${payload.namaAtasan},

      Pegawai berikut mengajukan permohonan persetujuan
      Laporan Kinerja Harian (LKH):

      Nama    : ${payload.namaPegawai}
      NIP     : ${payload.nip}
      Jabatan : ${payload.jabatan}
      Subbag  : ${payload.subbag}
      Periode : ${payload.periode}
      Jumlah Hari Terisi : ${payload.totalHari}
      Jumlah LKH      : ${payload.totalAgenda}

      Silakan meninjau melalui sistem:
      ${payload.link}

      Terima kasih.

      —
      Sistem E-LKH
      KPU Kabupaten Siak
      `
    };
  },

  PENGAJUAN_DITERIMA(payload) {
    return {
      subject: `Pengajuan LKH Berhasil – ${payload.periode}`,
      body: `
      Yth. ${payload.nama},

      Pengajuan Laporan Kinerja Harian (LKH) Anda telah berhasil dikirim
      dan sedang menunggu persetujuan atasan.

      Rincian:
      - Periode : ${payload.periode}
      - Tanggal Pengajuan : ${payload.tanggal}

      Dokumen dapat diakses melalui:
      ${payload.fileUrl}

      Anda akan menerima pemberitahuan setelah proses verifikasi selesai.

      Terima kasih.

      —
      Sistem E-LKH
      KPU Kabupaten Siak
      `
    };
  },

  LHK_DISETUJUI(payload) {
    return {
      subject: `LKH Disetujui – ${payload.periode}`,
      body: `
      Yth. ${payload.nama},

      Laporan Kinerja Harian (LKH) Anda telah disetujui.

      Rincian:
      - Periode : ${payload.periode}
      - Disetujui oleh : ${payload.disetujuiOleh}
      - Tanggal Persetujuan : ${payload.tanggal}

      Dokumen dapat diakses melalui:
      ${payload.fileUrl}

      Terima kasih atas kerja samanya.

      —
      Sistem E-LKH
      KPU Kabupaten Siak
      `
    };
  },

  LHK_DITOLAK(payload) {
    return {
      subject: `LKH Perlu Perbaikan – ${payload.periode}`,
      body: `
      Yth. ${payload.nama},

      Laporan Kinerja Harian (LKH) Anda belum dapat disetujui.

      Catatan dari atasan:
      ${payload.catatan}

      Silakan melakukan perbaikan melalui sistem E-LKH,
      kemudian ajukan kembali.

      Terima kasih.

      —
      Sistem E-LKH
      KPU Kabupaten Siak
      `
    };
  },

  AUTO_APPROVE_LHK(payload) {
    return {
      subject: `LKH Tersimpan – ${payload.periode}`,
      body: `
      Yth. ${payload.nama},

      Laporan Kinerja Harian (LKH) Anda telah berhasil dibuat
      dan otomatis disetujui oleh sistem.

      Rincian:
      - Periode : ${payload.periode}
      - Tanggal : ${payload.tanggal}

      Dokumen dapat diakses melalui:
      ${payload.fileUrl}

      Terima kasih.

      —
      Sistem E-LKH
      KPU Kabupaten Siak
      `
    };
  },

  PENGINGAT_ABSENSI(payload) {
    return {
      subject: 'Pengingat Pengisian Absensi WFA',
      body: `
      Yth. ${payload.nama},

      Ini adalah pengingat untuk melakukan pengisian
      absensi Work From Anywhere (WFA) pada hari ini.

      Silakan melakukan absensi melalui tautan berikut:
      ${payload.link || 'https://tinyurl.com/lhk-kpusiak'}

      Mohon agar pengisian dilakukan sesuai ketentuan
      dan waktu yang telah ditetapkan.

      Jika Anda sudah melakukan absensi,
      abaikan pesan ini.

      Terima kasih.

      —
      Sistem E-LKH
      KPU Kabupaten Siak
      `
    };
  }
};
