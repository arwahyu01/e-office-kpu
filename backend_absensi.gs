const SHEET_ABSENSI_ID = "1zb_-zP7cRc86ggssuYgeS5Hd-w3m5-RxfBfrWtK7WWA";
const SHEET_ABSENSI = "ABSENSI";
const SHEET_MASTER_PEGAWAI = "MASTER_PEGAWAI";

function getSpreadsheetAgenda(){
  return SpreadsheetApp.openById(SHEET_AGENDA_ID);
}

// =============== FUNGSI DASAR ===============

function getSpreadsheetAbsensi() {
  const file = DriveApp.getFileById(SHEET_ABSENSI_ID);
  return SpreadsheetApp.open(file);
}

function getUserInfo(email){

  if(!email){
    email = Session.getActiveUser().getEmail();
  }

  const ss = getSpreadsheetAgenda();
  const sheet = ss.getSheetByName(SHEET_MASTER_PEGAWAI);

  if(!sheet){
    return {success:false,error:"Sheet MASTER_PEGAWAI tidak ditemukan"};
  }

  const data = sheet.getDataRange().getValues();

  for(let i=1;i<data.length;i++){

    const emailSheet = String(data[i][8]).trim().toLowerCase(); 
    // kolom EMAIL = kolom I = index 8

    if(emailSheet === email.toLowerCase()){

      return {
        success:true,
        data:{
          nama:data[i][1],      // kolom NAMA
          nip:data[i][2],       // kolom NIP
          jabatan:data[i][3],   // kolom JABATAN
          email:email,
          isRegistered:true
        }
      };

    }

  }

  return {success:false,error:"Email tidak terdaftar di MASTER_PEGAWAI"};
}

// ==========================================
// LOGIKA SUBMIT ABSEN DENGAN GANTI WAKTU
// ==========================================
function submitAbsen(tipe, emailFromClient) {
  try {
    const userResponse = getUserInfo(emailFromClient);
    if (!userResponse.success) return { success: false, error: userResponse.error };
    const user = userResponse.data;
    
    const ss = getSpreadsheetAbsensi();
    let sheetAbsen = ss.getSheetByName(SHEET_ABSENSI) || ss.insertSheet(SHEET_ABSENSI);
    
    const sekarang = new Date();
    const jamSekarang = sekarang.getHours();
    
    // Validasi Poin g.3 (Rekam pukul 06.00 - 23.59)
    if (jamSekarang < 6) {
      return { success: false, error: "Perekaman kehadiran dimulai pukul 06.00" };
    }

    const timezone = Session.getScriptTimeZone();
    const tglSekarang = Utilities.formatDate(sekarang, timezone, 'dd/MM/yyyy');
    const waktuSekarangStr = Utilities.formatDate(sekarang, timezone, 'HH:mm');
    const data = sheetAbsen.getDataRange().getValues();

    // Cari baris user hari ini
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      let tglSheet = data[i][0] instanceof Date ? Utilities.formatDate(data[i][0], timezone, 'dd/MM/yyyy') : String(data[i][0]).trim();
      if (tglSheet === tglSekarang && String(data[i][1]).toLowerCase() === user.email.toLowerCase()) { 
        rowIndex = i + 1; 
        break; 
      }
    }

    const jadwal = getJadwalKerja(sekarang);
    const menitBatasMasuk = jamKeMenit(jadwal.jamMasuk); // 07:30 -> 450 menit
    const menitSekarang = (sekarang.getHours() * 60) + sekarang.getMinutes();

    if (tipe === "MASUK") {
      if (rowIndex !== -1 && data[rowIndex-1][3] !== "") {
        return { success: false, error: "Anda sudah absen masuk hari ini!" };
      }

      let menitTelat = Math.max(0, menitSekarang - menitBatasMasuk);
      let status = "Tepat Waktu";
      
      // Aturan Poin c & d (Terlambat & Toleransi)
      if (menitTelat > 0) {
        if (menitTelat < 60) { // Antara 07.31 - 08.29 (Poin d)
          status = "Terlambat (Wajib Ganti Waktu)";
        } else {
          status = "Terlambat";
        }
      }
      
      if (rowIndex !== -1) {
        sheetAbsen.getRange(rowIndex, 4).setValue(waktuSekarangStr);
        sheetAbsen.getRange(rowIndex, 6).setValue(status);
        sheetAbsen.getRange(rowIndex, 7).setValue(menitTelat);
      } else {
        sheetAbsen.appendRow([tglSekarang, user.email, user.nama, waktuSekarangStr, "", status, menitTelat, ""]);
      }
      return { success: true, message: `Berhasil Masuk pukul ${waktuSekarangStr}. ${menitTelat > 0 ? 'Anda terlambat '+menitTelat+' menit.' : ''}` };

    } else { 
      // LOGIKA PULANG (Poin f & d)
      if (rowIndex === -1 || data[rowIndex-1][3] === "") {
        return { success: false, error: "Harap absen MASUK terlebih dahulu!" };
      }

      const menitMasuk = jamKeMenit(String(data[rowIndex-1][3]));
      const menitTelatPagi = parseInt(data[rowIndex-1][6]) || 0;
      
      // Pegawai wajib mengganti waktu keterlambatan (Poin d)
      // Jam Pulang Wajib = Jam Pulang Normal + Menit Telat Pagi
      const menitPulangNormal = jamKeMenit(jadwal.jamPulang);
      const menitPulangWajib = menitPulangNormal + menitTelatPagi;

      if (menitSekarang < menitPulangWajib) {
        const jamWajib = menitKeJamHanyaAngka(menitPulangWajib);
        return { 
          success: false, 
          error: `Belum waktunya pulang. Karena tadi terlambat ${menitTelatPagi} menit, Anda baru bisa pulang pukul ${jamWajib} (Ganti Waktu).` 
        };
      }

      const totalKerjaMenit = menitSekarang - menitMasuk;
      const totalJamStr = menitKeJam(totalKerjaMenit);

      sheetAbsen.getRange(rowIndex, 5).setValue(waktuSekarangStr);
      sheetAbsen.getRange(rowIndex, 8).setValue(totalJamStr);
      
      return { success: true, message: `Berhasil Pulang pukul ${waktuSekarangStr}. Total kerja: ${totalJamStr}` };
    }
  } catch (e) {
    return { success: false, error: "Sistem Error: " + e.toString() };
  }
}

// Helper untuk format HH:mm dari menit
function menitKeJamHanyaAngka(totalMenit) {
  const h = Math.floor(totalMenit / 60);
  const m = totalMenit % 60;
  return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
}

// ==========================================
// PENYESUAIAN JADWAL SESUAI DOKUMEN KPU
// ==========================================
function getJadwalKerja(date) {
  const hari = date.getDay(); // 0 Minggu, 1 Senin, ..., 5 Jumat, 6 Sabtu
  
  // Default Jam Masuk (Senin - Jumat sama)
  let jamMasuk = "07:30";
  let jamPulang = "16:00"; // Default Senin-Kamis

  // Aturan Hari Jumat (Poin b.2)
  if (hari === 5) {
    jamPulang = "16:30";
  }
  
  // Jika Sabtu/Minggu (Bisa disesuaikan jika perlu libur)
  if (hari === 0 || hari === 6) {
    jamMasuk = "07:30"; 
    jamPulang = "16:00";
  }

  return { jamMasuk, jamPulang };
}

function jamKeMenit(jam){

  const p = jam.split(":")
  return (parseInt(p[0]) * 60) + parseInt(p[1])

}

function menitKeJam(menit){

  if(!menit || menit <= 0){
  return "0 Jam"
  }

  const jam = Math.floor(menit / 60)
  const sisaMenit = menit % 60

  if(jam > 0 && sisaMenit > 0){
  return `${jam} Jam ${sisaMenit} Menit`
  }

  if(jam > 0){
  return `${jam} Jam`
  }

  return `${sisaMenit} Menit`

}

function getStats(emailFromClient){

  try{

    const ss = getSpreadsheetAbsensi()
    const sheet = ss.getSheetByName("ABSENSI")

    if(!sheet){
      return {success:true,data:{hadir:0,telat:0,logs:[]}}
    }

    const lastRow = sheet.getLastRow()

    if(lastRow < 2){
      return {success:true,data:{hadir:0,telat:0,logs:[]}}
    }

    const data = sheet.getRange(2,1,lastRow-1,8).getValues()

    let hadir = 0
    let telat = 0
    let logs = []

    const email = String(emailFromClient).trim().toLowerCase()

    for(let i=0;i<data.length;i++){

      const emailSheet = String(data[i][1]).trim().toLowerCase()
      if(emailSheet !== email) continue

      hadir++

      const tanggal = data[i][0]
      const jamMasuk = data[i][3]
      const jamPulang = data[i][4]
      const status = String(data[i][5] || "")
      const menitTelat = parseFloat(data[i][6]) || 0
      const totalJam = data[i][7]

      if(menitTelat > 0) telat++

      let statusFinal = status

      if(status === "Terlambat" && menitTelat > 0){

        if(menitTelat >= 60){

          const jam = Math.floor(menitTelat / 60)
          const sisa = menitTelat % 60

          statusFinal = sisa > 0
            ? `Terlambat (${jam} Jam ${sisa} m)`
            : `Terlambat (${jam} Jam)`

        }else{
          statusFinal = `Terlambat (${menitTelat} m)`
        }
      }

      logs.push({
        tanggal,
        email: String(data[i][1] || ""),
        nama: String(data[i][2] || ""),
        jamMasuk,
        jamPulang,
        status: statusFinal,
        menitTelat: String(data[i][6] || ""),
        totalJam: String(totalJam || "")
      })

    }

    logs.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal))

    logs = logs.map(row => [

      row.tanggal instanceof Date
        ? Utilities.formatDate(row.tanggal,Session.getScriptTimeZone(),"dd/MM/yyyy")
        : String(row.tanggal || ""),

      row.email,
      row.nama,

      row.jamMasuk instanceof Date
        ? Utilities.formatDate(row.jamMasuk,Session.getScriptTimeZone(),"HH:mm")
        : String(row.jamMasuk || ""),

      row.jamPulang instanceof Date
        ? Utilities.formatDate(row.jamPulang,Session.getScriptTimeZone(),"HH:mm")
        : String(row.jamPulang || ""),

      row.status,
      row.menitTelat,
      row.totalJam

    ])

    return{
      success:true,
      data:{
        hadir:hadir,
        telat:telat,
        logs:logs
      }
    }

  }catch(e){

    return{
      success:false,
      error:e.toString()
    }

  }

}

function formatDate(date){
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "HH:mm")
}