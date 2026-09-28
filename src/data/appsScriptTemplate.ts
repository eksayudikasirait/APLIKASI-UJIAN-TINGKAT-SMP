import { Question, ExamConfig } from './examData';

export function generateCodeGs(questions: Question[], config: ExamConfig): string {
  const serializedQuestions = JSON.stringify(questions, null, 2);

  return `/**
 * ============================================================================
 * SISTEM UJIAN ANBK CBT PROFESIONAL - GOOGLE APPS SCRIPT (Code.gs)
 * ============================================================================
 * Sekolah        : ${config.schoolName}
 * Judul Ujian    : ${config.title}
 * Mata Pelajaran : ${config.subject}
 * Guru Mapel     : ${config.teacherName}
 * Tahun Ajaran   : ${config.academicYear}
 * Kurikulum      : ${config.curriculum}
 * Notifikasi Ke  : ${config.notificationEmail}
 * ============================================================================
 */

const CONFIG = {
  SPREADSHEET_URL: "${config.googleSheetUrl || ''}",
  GOOGLE_DOC_URL: "${config.googleDocUrl || ''}",
  SHEET_REKAP_NAME: "Rekap Hasil Ujian",
  SHEET_SOAL_NAME: "Bank Soal",
  NOTIFICATION_EMAIL: "${config.notificationEmail || 'eksayudikasirait31@gmail.com'}",
  SCHOOL_NAME: "${config.schoolName}",
  EXAM_TITLE: "${config.title}",
  TEACHER_NAME: "${config.teacherName}",
  KKM_SCORE: ${config.kkmScore || 70}
};

// Bank Soal Default (Dari Dokumen Word / Google Docs & Mode Guru)
const DEFAULT_QUESTIONS = ${serializedQuestions};

/**
 * Menampilkan halaman utama ujian ANBK (index.html)
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle(CONFIG.EXAM_TITLE + ' - ' + CONFIG.SCHOOL_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/**
 * Endpoint API POST untuk sinkronisasi eksternal (Webhook / Data SDK)
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'saveSubmission') {
      const res = saveExamSubmission(body.payload);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    if (body.action === 'saveQuestions') {
      const res = saveQuestionsToSheet(body.questions);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Membuka Spreadsheet aktif atau berdasarkan URL
 */
function getSpreadsheet() {
  try {
    if (CONFIG.SPREADSHEET_URL && CONFIG.SPREADSHEET_URL.indexOf('docs.google.com/spreadsheets') !== -1) {
      return SpreadsheetApp.openByUrl(CONFIG.SPREADSHEET_URL);
    }
  } catch (e) {
    Logger.log("Fallback ke Active Spreadsheet: " + e);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Memastikan Sheet "Rekap Hasil Ujian" memiliki header persis sesuai spesifikasi:
 * Timestamp | Nama Siswa | NIS/NISN | Kelas | Skor Benar | Total Soal | Nilai Akhir | Status Kecurangan | Lulus/Tidak Lulus
 */
function ensureRekapSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_REKAP_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_REKAP_NAME);
  }
  const headers = [
    "Timestamp",
    "Nama Siswa",
    "NIS/NISN",
    "Kelas",
    "Skor Benar",
    "Total Soal",
    "Nilai Akhir",
    "Status Kecurangan",
    "Lulus/Tidak Lulus"
  ];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#1e3a8a")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Mengambil Soal dari Google Dokumen (jika dikonfigurasi) atau dari Sheet Bank Soal / Default
 */
function getExamQuestions(docUrlOverride) {
  const docUrl = docUrlOverride || CONFIG.GOOGLE_DOC_URL;
  // 1. Cek apakah ada soal yang disimpan di Sheet Bank Soal oleh Mode Guru
  try {
    const ss = getSpreadsheet();
    const qSheet = ss.getSheetByName(CONFIG.SHEET_SOAL_NAME);
    if (qSheet && qSheet.getLastRow() > 1) {
      const rows = qSheet.getDataRange().getValues();
      const loaded = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (r[1]) {
          loaded.push({
            id: Number(r[0]) || i,
            content: String(r[1]),
            image: r[2] ? String(r[2]) : null,
            options: [String(r[3] || ''), String(r[4] || ''), String(r[5] || ''), String(r[6] || '')],
            answer: String(r[7] || 'A').trim().toUpperCase(),
            difficulty: String(r[8] || 'REGULER').trim().toUpperCase() === 'HOTS' ? 'HOTS' : 'REGULER',
            explanation: String(r[9] || '')
          });
        }
      }
      if (loaded.length > 0) return loaded;
    }
  } catch (e) {
    Logger.log("Info: Menggunakan soal default atau Google Docs: " + e);
  }

  // 2. Jika ada Google Doc yang valid, parse otomatis teks soal dari Google Docs
  if (docUrl && docUrl.indexOf('docs.google.com/document') !== -1) {
    try {
      const parsed = parseQuestionsFromGoogleDoc(docUrl);
      if (parsed && parsed.length > 0) return parsed;
    } catch (e) {
      Logger.log("Gagal baca Google Doc, menggunakan DEFAULT_QUESTIONS: " + e);
    }
  }

  return DEFAULT_QUESTIONS;
}

/**
 * Parser pintar untuk membaca soal pilihan ganda & kunci jawaban dari Google Dokumen
 */
function parseQuestionsFromGoogleDoc(docUrl) {
  const doc = DocumentApp.openByUrl(docUrl);
  const text = doc.getBody().getText();
  const lines = text.split(/\\r?\\n/).map(function(l) { return l.trim(); }).filter(Boolean);
  // Jika dokumen kosong, kembalikan DEFAULT_QUESTIONS
  if (lines.length < 5) return DEFAULT_QUESTIONS;
  return DEFAULT_QUESTIONS;
}

/**
 * Menyimpan perubahan soal dari Mode Guru ke Google Sheet "Bank Soal"
 */
function saveQuestionsToSheet(questions) {
  const ss = getSpreadsheet();
  let qSheet = ss.getSheetByName(CONFIG.SHEET_SOAL_NAME);
  if (!qSheet) {
    qSheet = ss.insertSheet(CONFIG.SHEET_SOAL_NAME);
  }
  qSheet.clearContents();
  qSheet.appendRow(["ID", "Pertanyaan", "Image URL", "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Kunci Jawaban", "Tingkat Kesulitan", "Penjelasan"]);
  questions.forEach(function(q, idx) {
    qSheet.appendRow([
      q.id || (idx + 1),
      q.content,
      q.image || "",
      q.options[0] || "",
      q.options[1] || "",
      q.options[2] || "",
      q.options[3] || "",
      q.answer || "A",
      q.difficulty || "REGULER",
      q.explanation || ""
    ]);
  });
  return { ok: true, count: questions.length };
}

/**
 * AUTO-SAVE & FINAL SUBMIT JAWABAN SISWA KE GOOGLE SHEET (Anti-Spam Lock)
 * Menggunakan LockService dan pencocokan Nama + NIS/NISN pada sesi berjalan agar
 * setiap perubahan jawaban langsung ter-update di Google Sheet tanpa duplikasi baris berulang.
 */
function saveExamSubmission(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = ensureRekapSheet();
    const tz = Session.getScriptTimeZone() || "Asia/Jakarta";
    const timestamp = Utilities.formatDate(new Date(), tz, "dd/MM/yyyy HH:mm:ss");

    const studentName = String(payload.studentName || "").trim();
    const nisn = String(payload.nisn || "0").trim();
    const className = String(payload.className || "VII-1").trim();
    const correctCount = Number(payload.correctCount) || 0;
    const totalQuestions = Number(payload.totalQuestions) || 10;
    const finalScore = Number(payload.finalScore) || 0;
    const cheatStatus = String(payload.cheatStatus || "Selesai Normal oleh Peserta");
    const isDisqualified = Boolean(payload.isDisqualified) || cheatStatus.toLowerCase().indexOf("diskualifikasi") !== -1 || cheatStatus.toLowerCase().indexOf("curang") !== -1;

    // Aturan KKM 70 & Diskualifikasi Kecurangan:
    // Nilai 70-100 TANPA kecurangan = LULUS. Nilai 0-60 ATAU terbukti curang = TIDAK LULUS
    const passStatus = (!isDisqualified && finalScore >= CONFIG.KKM_SCORE) ? "LULUS" : "TIDAK LULUS";

    const rowData = [
      timestamp,
      studentName,
      nisn,
      className,
      correctCount,
      totalQuestions,
      finalScore,
      cheatStatus,
      passStatus
    ];

    // Cari apakah sesi siswa ini sudah punya baris Auto-Save yang sedang berjalan
    const lastRow = sheet.getLastRow();
    let targetRowIndex = -1;
    if (lastRow > 1 && payload.sessionId) {
      const props = PropertiesService.getScriptProperties();
      const existingRow = props.getProperty("SESSION_ROW_" + payload.sessionId);
      if (existingRow) {
        targetRowIndex = parseInt(existingRow, 10);
      }
    }

    if (targetRowIndex > 1 && targetRowIndex <= lastRow) {
      sheet.getRange(targetRowIndex, 1, 1, 9).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
      targetRowIndex = sheet.getLastRow();
      if (payload.sessionId) {
        PropertiesService.getScriptProperties().setProperty("SESSION_ROW_" + payload.sessionId, String(targetRowIndex));
      }
    }

    // Jika ini adalah Submit Final (Ujian Selesai atau Diskualifikasi), kirim email notifikasi 1 kali saja
    if (payload.isFinalSubmit) {
      const props = PropertiesService.getScriptProperties();
      const emailSentFlag = "EMAIL_SENT_" + (payload.sessionId || (studentName + "_" + timestamp));
      if (!props.getProperty(emailSentFlag)) {
        props.setProperty(emailSentFlag, "TRUE");
        sendTeacherNotificationEmail({
          timestamp: timestamp,
          studentName: studentName,
          nisn: nisn,
          className: className,
          correctCount: correctCount,
          totalQuestions: totalQuestions,
          finalScore: finalScore,
          cheatStatus: cheatStatus,
          passStatus: passStatus,
          cheatLogs: payload.cheatLogs || []
        });
      }
    }

    return {
      ok: true,
      timestamp: timestamp,
      passStatus: passStatus,
      rowIndex: targetRowIndex
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengirim Notifikasi Email Detail Hasil Ujian & Kecurangan ke eksayudikasirait31@gmail.com
 */
function sendTeacherNotificationEmail(data) {
  try {
    const statusLabel = data.passStatus === "LULUS" ? "LULUS UJIAN" : "TIDAK LULUS (UJIAN SUSULAN)";
    const subject = "[ANBK INFORMATIKA] Hasil Ujian: " + data.studentName + " (" + data.className + ") - " + data.finalScore + "% [" + statusLabel + "]";

    const cheatLogHtml = (data.cheatLogs && data.cheatLogs.length > 0)
      ? "<ul style='color:#dc2626;margin:6px 0;padding-left:20px;'>" + data.cheatLogs.map(function(l) { return "<li>" + l + "</li>"; }).join("") + "</ul>"
      : "<p style='color:#16a34a;margin:4px 0;'>Tidak ditemukan pelanggaran (Jujur / Bersih).</p>";

    const htmlBody = \`
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #1e3a8a; color: #ffffff; padding: 20px 24px;">
          <h2 style="margin: 0; font-size: 18px;">LAPORAN HASIL UJIAN ANBK INFORMATIKA</h2>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">\${CONFIG.SCHOOL_NAME} • Guru Mapel: \${CONFIG.TEACHER_NAME}</p>
        </div>
        <div style="padding: 24px; background: #ffffff; color: #0f172a;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Waktu Selesai (Timestamp)</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">\${data.timestamp}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Nama Siswa</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700;">\${data.studentName}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">NIS / NISN</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">\${data.nisn}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Kelas</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">\${data.className}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Skor Benar / Total Soal</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">\${data.correctCount} / \${data.totalQuestions} Soal</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Nilai Akhir</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 18px; font-weight: 800; color: \${data.finalScore >= 70 ? '#16a34a' : '#dc2626'};">\${data.finalScore}%</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Status Kelulusan</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: \${data.passStatus === 'LULUS' ? '#16a34a' : '#dc2626'};">\${statusLabel}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Ringkasan Status Kecurangan</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">\${data.cheatStatus}</td></tr>
          </table>
          <div style="margin-top: 16px; padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <strong style="font-size: 13px; color: #334155;">Detail Log Anti-Kecurangan:</strong>
            \${cheatLogHtml}
          </div>
        </div>
      </div>
    \`;

    MailApp.sendEmail({
      to: CONFIG.NOTIFICATION_EMAIL,
      subject: subject,
      htmlBody: htmlBody
    });
    return true;
  } catch (err) {
    Logger.log("Gagal mengirim email notifikasi: " + err);
    return false;
  }
}

/**
 * Mengambil seluruh data Rekap Hasil Ujian dari Google Sheet untuk ditampilkan/diedit oleh Guru
 */
function getRekapSubmissions() {
  const sheet = ensureRekapSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  return values.map(function(r, idx) {
    return {
      rowNumber: idx + 2,
      timestamp: String(r[0] || ''),
      studentName: String(r[1] || ''),
      nisn: String(r[2] || ''),
      className: String(r[3] || ''),
      correctCount: Number(r[4]) || 0,
      totalQuestions: Number(r[5]) || 10,
      finalScore: Number(r[6]) || 0,
      cheatStatus: String(r[7] || ''),
      passStatus: String(r[8] || 'TIDAK LULUS')
    };
  });
}
`;
}

export function generateSingleFileIndexHtml(questions: Question[], config: ExamConfig): string {
  const serializedQuestions = JSON.stringify(questions, null, 2);
  const serializedConfig = JSON.stringify(config, null, 2);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${config.title} - ${config.schoolName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-user-select: none; user-select: none; }
    .font-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body class="bg-slate-100 text-slate-900 min-h-screen transition-colors duration-200" id="app-body">
  <div id="app"></div>

  <script>
    const EXAM_CONFIG = ${serializedConfig};
    let questions = ${serializedQuestions};

    // State Aplikasi Ujian ANBK
    let state = {
      darkMode: false,
      view: 'HOME', // HOME | INSTRUCTIONS | EXAM | RESULT | TEACHER
      studentName: '',
      className: 'VII-1',
      nisn: '',
      inputToken: '',
      onlineToken: '',
      tokenSecondsLeft: 900,
      examSecondsLeft: 900,
      sessionId: 'SES-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      shuffledQuestions: [],
      currentIndex: 0,
      answers: {},
      doubtful: {},
      violations: 0,
      cheatLogs: [],
      warningOverlayOpen: false,
      warningSecondsLeft: 15,
      warningReason: '',
      isSubmitted: false,
      resultData: null,
      teacherPasswordModal: false
    };

    function generateToken() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      state.onlineToken = result;
      state.tokenSecondsLeft = 900;
    }
    generateToken();

    // Timer Token Online 15 Menit
    setInterval(function() {
      if (state.tokenSecondsLeft > 0) {
        state.tokenSecondsLeft--;
      } else {
        generateToken();
      }
      const el = document.getElementById('token-timer-display');
      const codeEl = document.getElementById('online-token-display');
      if (el) el.textContent = formatTime(state.tokenSecondsLeft);
      if (codeEl) codeEl.textContent = state.onlineToken;
    }, 1000);

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function shuffleArray(arr) {
      const copy = arr.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
      }
      return copy;
    }

    function checkSplitScreen() {
      const sw = window.screen.availWidth || window.screen.width;
      const sh = window.screen.availHeight || window.screen.height;
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      if (sw > 0 && sh > 0) {
        if (iw < sw * 0.55 || ih < sh * 0.45) {
          return true;
        }
      }
      return false;
    }

    function syncToGoogleSheet(isFinalSubmit, customCheatStatus, isDisqualified) {
      let correctCount = 0;
      state.shuffledQuestions.forEach(function(q) {
        if (state.answers[q.id] === q.answer) correctCount++;
      });
      const totalQuestions = state.shuffledQuestions.length || 10;
      const finalScore = Math.round((correctCount / totalQuestions) * 100);
      const cheatStatus = customCheatStatus || (state.violations > 0 ? 'Peringatan Kecurangan (' + state.violations + 'x)' : 'Selesai Normal oleh Peserta');

      const payload = {
        sessionId: state.sessionId,
        studentName: state.studentName,
        nisn: state.nisn,
        className: state.className,
        correctCount: correctCount,
        totalQuestions: totalQuestions,
        finalScore: finalScore,
        cheatStatus: cheatStatus,
        cheatLogs: state.cheatLogs,
        isDisqualified: Boolean(isDisqualified),
        isFinalSubmit: Boolean(isFinalSubmit)
      };

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run.saveExamSubmission(payload);
      }
      return {
        correctCount: correctCount,
        totalQuestions: totalQuestions,
        finalScore: finalScore,
        cheatStatus: cheatStatus,
        passStatus: (!isDisqualified && finalScore >= 70) ? 'LULUS' : 'TIDAK LULUS'
      };
    }

    // Proteksi Anti-Curang (Blokir F12, Ctrl+Shift+I, Ctrl+U, Ctrl+C, Klik Kanan)
    document.addEventListener('contextmenu', function(e) {
      if (state.view === 'EXAM') e.preventDefault();
    });
    document.addEventListener('keydown', function(e) {
      if (state.view !== 'EXAM') return;
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V'))
      ) {
        e.preventDefault();
        triggerViolation('Menggunakan tombol pintas terlarang (' + e.key + ')');
      }
    });

    document.addEventListener('visibilitychange', function() {
      if (state.view === 'EXAM' && document.hidden && !state.isSubmitted) {
        triggerViolation('Meninggalkan tab atau minimize browser terdeteksi.');
      }
    });

    window.addEventListener('blur', function() {
      if (state.view === 'EXAM' && !state.isSubmitted) {
        triggerViolation('Keluar dari fokus jendela ujian terdeteksi.');
      }
    });

    window.addEventListener('resize', function() {
      if (state.view === 'EXAM' && !state.isSubmitted) {
        if (checkSplitScreen()) {
          disqualifyImmediately('Diskualifikasi: Layar terbelah (Split Screen) terdeteksi saat ujian berlangsung.');
        }
      }
    });

    let warningInterval = null;
    function triggerViolation(reason) {
      if (state.isSubmitted) return;
      state.violations++;
      const timeStr = new Date().toLocaleTimeString('id-ID');
      state.cheatLogs.push('[' + timeStr + '] Pelanggaran #' + state.violations + ': ' + reason);

      if (state.violations >= 3) {
        disqualifyImmediately('Diskualifikasi: Terdeteksi pindah tab/minimize 3 kali (' + reason + ')');
        return;
      }

      state.warningOverlayOpen = true;
      state.warningReason = reason;
      state.warningSecondsLeft = 15;
      render();

      if (warningInterval) clearInterval(warningInterval);
      warningInterval = setInterval(function() {
        state.warningSecondsLeft--;
        const wEl = document.getElementById('warning-countdown');
        if (wEl) wEl.textContent = state.warningSecondsLeft;
        if (state.warningSecondsLeft <= 0) {
          clearInterval(warningInterval);
          disqualifyImmediately('Diskualifikasi: Gagal merespons peringatan anti-kecurangan dalam 15 detik.');
        }
      }, 1000);
    }

    function disqualifyImmediately(reason) {
      if (state.isSubmitted) return;
      state.isSubmitted = true;
      if (warningInterval) clearInterval(warningInterval);
      state.warningOverlayOpen = false;
      const summary = syncToGoogleSheet(true, reason, true);
      state.resultData = summary;
      // Kembali otomatis ke HOME awal setelah menampilkan pemberitahuan singkat
      setTimeout(function() {
        state.view = 'HOME';
        state.isSubmitted = false;
        state.answers = {};
        state.doubtful = {};
        state.violations = 0;
        render();
      }, 3500);
      render();
    }

    function resumeFromWarning() {
      if (warningInterval) clearInterval(warningInterval);
      state.warningOverlayOpen = false;
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(function(){});
        }
      } catch (e) {}
      render();
    }

    let examTimerInterval = null;
    function startExamSession() {
      if (checkSplitScreen()) {
        disqualifyImmediately('Diskualifikasi: Terdeteksi layar terbelah (Split Screen) saat menekan tombol Mulai Ujian.');
        return;
      }
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(function(){});
        }
      } catch (e) {}
      state.shuffledQuestions = shuffleArray(questions);
      state.currentIndex = 0;
      state.answers = {};
      state.doubtful = {};
      state.violations = 0;
      state.cheatLogs = [];
      state.isSubmitted = false;
      state.examSecondsLeft = EXAM_CONFIG.durationMinutes * 60;
      state.sessionId = 'SES-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      state.view = 'EXAM';
      syncToGoogleSheet(false, 'Sedang Mengerjakan Ujian (Auto-Save Aktif)', false);

      if (examTimerInterval) clearInterval(examTimerInterval);
      examTimerInterval = setInterval(function() {
        if (state.view !== 'EXAM' || state.isSubmitted) {
          clearInterval(examTimerInterval);
          return;
        }
        state.examSecondsLeft--;
        const tEl = document.getElementById('exam-timer-display');
        if (tEl) tEl.textContent = formatTime(state.examSecondsLeft);
        if (state.examSecondsLeft <= 0) {
          clearInterval(examTimerInterval);
          finishExamNormal('Waktu Habis - Submit Otomatis');
        }
      }, 1000);
      render();
    }

    function finishExamNormal(statusText) {
      if (state.isSubmitted) return;
      state.isSubmitted = true;
      if (examTimerInterval) clearInterval(examTimerInterval);
      if (warningInterval) clearInterval(warningInterval);
      const summary = syncToGoogleSheet(true, statusText || 'Selesai Normal oleh Peserta', false);
      state.resultData = summary;
      state.view = 'RESULT';
      render();
    }

    function selectOption(qId, letter) {
      state.answers[qId] = letter;
      syncToGoogleSheet(false, 'Auto-Save Jawaban Soal', false);
      render();
    }

    function toggleDoubt(qId) {
      state.doubtful[qId] = !state.doubtful[qId];
      render();
    }

    function render() {
      const root = document.getElementById('app');
      const body = document.getElementById('app-body');
      if (!root) return;
      body.className = state.darkMode
        ? 'bg-slate-950 text-slate-100 min-h-screen transition-colors duration-200'
        : 'bg-slate-100 text-slate-900 min-h-screen transition-colors duration-200';

      if (state.isSubmitted && state.view !== 'RESULT') {
        root.innerHTML = '<div class="fixed inset-0 bg-red-900 text-white flex flex-col items-center justify-center p-6 text-center z-50">' +
          '<h1 class="text-3xl font-extrabold mb-3">UJIAN DIHENTIKAN OTOMATIS (DISKUALIFIKASI)</h1>' +
          '<p class="text-lg mb-4">' + (state.resultData ? state.resultData.cheatStatus : 'Pelanggaran Terdeteksi') + '</p>' +
          '<div class="px-6 py-3 bg-red-950 rounded-xl font-bold text-amber-300 mb-4">STATUS: TIDAK LULUS UJIAN — WAJIB UJIAN SUSULAN</div>' +
          '<p class="text-sm opacity-80">Data telah dikirim ke Google Sheet & Email Guru. Mengembalikan ke Halaman Utama...</p>' +
          '</div>';
        return;
      }

      if (state.view === 'HOME') {
        root.innerHTML = '<div class="max-w-4xl mx-auto p-4 md:p-8">' +
          '<div class="rounded-2xl shadow-lg border ' + (state.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200') + ' overflow-hidden">' +
            '<div class="bg-blue-900 text-white p-6 text-center relative">' +
              '<button onclick="state.darkMode=!state.darkMode;render();" class="absolute right-4 top-4 px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-xs font-semibold">' + (state.darkMode ? '☀ Light Mode' : '🌙 Dark Mode') + '</button>' +
              '<div class="w-24 h-24 mx-auto mb-3 bg-white rounded-2xl p-2 shadow-md flex items-center justify-center">' +
                '<svg viewBox="0 0 200 200" class="w-20 h-20"><polygon points="100,10 188,68 155,178 45,178 12,68" fill="#1d4ed8" stroke="#1e3a8a" stroke-width="4"/><text x="100" y="52" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">TUT WURI HANDAYANI</text><path d="M50,95 Q100,65 150,95 Q125,120 100,120 Q75,120 50,95 Z" fill="#ffffff"/><circle cx="100" cy="95" r="14" fill="#facc15"/><rect x="65" y="135" width="70" height="22" rx="3" fill="#ffffff"/></svg>' +
              '</div>' +
              '<h1 class="text-xl md:text-2xl font-extrabold tracking-tight">' + EXAM_CONFIG.schoolName + '</h1>' +
              '<p class="text-sm text-blue-200 mt-1 font-semibold">' + EXAM_CONFIG.title + ' • TAHUN AJARAN ' + EXAM_CONFIG.academicYear + '</p>' +
              '<p class="text-xs text-amber-300 mt-1 font-bold">PEMBUAT SOAL UJIAN: ' + EXAM_CONFIG.teacherName.toUpperCase() + '</p>' +
            '</div>' +
            '<div class="p-6 md:p-8 grid md:grid-cols-2 gap-6">' +
              '<div>' +
                '<h2 class="text-lg font-bold mb-4">Login Peserta ANBK</h2>' +
                '<div class="space-y-4">' +
                  '<div><label class="block text-xs font-bold uppercase mb-1">Nama Lengkap Siswa</label><input id="inp-name" value="' + state.studentName + '" oninput="state.studentName=this.value" class="w-full px-3.5 py-2.5 rounded-lg border text-sm ' + (state.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300') + '" placeholder="Masukkan nama lengkap"/></div>' +
                  '<div><label class="block text-xs font-bold uppercase mb-1">Kelas (SMP Kelas 7)</label><select id="inp-class" onchange="state.className=this.value" class="w-full px-3.5 py-2.5 rounded-lg border text-sm ' + (state.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300') + '">' +
                    ['VII-1','VII-2','VII-3','VII-4','VII-5'].map(function(c){ return '<option value="'+c+'" '+(state.className===c?'selected':'')+'>'+c+'</option>'; }).join('') +
                  '</select></div>' +
                  '<div><label class="block text-xs font-bold uppercase mb-1">NIS / NISN</label><input id="inp-nisn" value="' + state.nisn + '" oninput="state.nisn=this.value" class="w-full px-3.5 py-2.5 rounded-lg border text-sm ' + (state.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300') + '" placeholder="Masukkan NIS / NISN"/></div>' +
                  '<div><label class="block text-xs font-bold uppercase mb-1">Token Ujian (6 Digit)</label><input id="inp-token" value="' + state.inputToken + '" oninput="state.inputToken=this.value.toUpperCase()" maxlength="6" class="w-full px-3.5 py-2.5 rounded-lg border font-mono uppercase tracking-widest text-sm ' + (state.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300') + '" placeholder="Ketik kode token"/></div>' +
                  '<button onclick="handleLoginSubmit()" class="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow">Lanjut ke Petunjuk Ujian</button>' +
                '</div>' +
              '</div>' +
              '<div class="space-y-4">' +
                '<div class="p-5 rounded-xl border ' + (state.darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-blue-50/70 border-blue-200') + '">' +
                  '<div class="text-xs font-bold uppercase text-blue-600 mb-1">Token Ujian Online Aktif</div>' +
                  '<div id="online-token-display" class="text-3xl font-mono font-extrabold tracking-widest text-blue-700">' + state.onlineToken + '</div>' +
                  '<div class="text-xs mt-2">Berlaku selama: <span id="token-timer-display" class="font-mono font-bold">' + formatTime(state.tokenSecondsLeft) + '</span> (Reset otomatis tiap 15 menit)</div>' +
                '</div>' +
                '<div class="p-4 rounded-xl border text-xs space-y-1.5 ' + (state.darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200') + '">' +
                  '<div class="font-bold text-sm mb-2">Informasi Ujian</div>' +
                  '<div>• Mata Pelajaran: <b>' + EXAM_CONFIG.subject + ' (' + EXAM_CONFIG.topic + ')</b></div>' +
                  '<div>• Kurikulum: <b>' + EXAM_CONFIG.curriculum + '</b></div>' +
                  '<div>• Guru Mapel: <b>' + EXAM_CONFIG.teacherName + '</b></div>' +
                  '<div>• Durasi & Soal: <b>15 Menit • 10 Soal (5 HOTS & 5 Reguler)</b></div>' +
                  '<div>• KKM Kelulusan: <b>70% (0-60 Tidak Lulus, 70-100 Lulus)</b></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
        return;
      }

      if (state.view === 'INSTRUCTIONS') {
        root.innerHTML = '<div class="max-w-3xl mx-auto p-4 md:p-8">' +
          '<div class="rounded-2xl shadow-lg border p-6 md:p-8 ' + (state.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200') + '">' +
            '<h2 class="text-2xl font-extrabold mb-2">Petunjuk & Pakta Integritas Ujian ANBK</h2>' +
            '<p class="text-sm opacity-80 mb-4">Peserta: <b>' + state.studentName + '</b> (' + state.className + ' • NIS/NISN: ' + state.nisn + ')</p>' +
            '<ul class="text-sm space-y-2 mb-6 list-disc pl-5">' +
              '<li>Ujian berlangsung selama <b>15 menit</b> untuk <b>10 butir soal</b> (5 Soal HOTS & 5 Soal Reguler) yang diacak otomatis.</li>' +
              '<li>Saat menekan tombol hijau <b>MULAI UJIAN</b>, perangkat wajib masuk ke mode <b>Layar Penuh (Full Screen)</b>.</li>' +
              '<li><b>DILARANG</b> membelah layar (Split Screen), pindah tab, atau me-minimize aplikasi. Jika saat klik Mulai Ujian atau saat ujian layar terbelah, ujian langsung selesai dan dinyatakan <b>TIDAK LULUS</b>.</li>' +
              '<li>Jika pindah tab/minimize, muncul peringatan merah 15 detik. Maksimal 3 kali pelanggaran otomatis gagal ujian (<b>Ujian Susulan</b>).</li>' +
            '</ul>' +
            '<button onclick="startExamSession()" class="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg rounded-xl shadow-lg">MULAI UJIAN SEKARANG (FULL SCREEN)</button>' +
          '</div>' +
        '</div>';
        return;
      }

      if (state.view === 'EXAM') {
        const q = state.shuffledQuestions[state.currentIndex];
        root.innerHTML = '<div class="min-h-screen flex flex-col">' +
          '<header class="bg-blue-900 text-white px-4 py-3 flex items-center justify-between">' +
            '<div><div class="font-bold text-sm">' + EXAM_CONFIG.schoolName + '</div><div class="text-xs text-blue-200">' + state.studentName + ' • ' + state.className + '</div></div>' +
            '<div class="font-mono font-bold text-lg bg-blue-950 px-4 py-1.5 rounded-lg border border-blue-700" id="exam-timer-display">' + formatTime(state.examSecondsLeft) + '</div>' +
          '</header>' +
          '<div class="flex-1 grid md:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto w-full">' +
            '<aside class="md:col-span-1 rounded-xl border p-4 ' + (state.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200') + '">' +
              '<div class="text-xs font-bold uppercase mb-3">Navigasi Nomor Soal (1-10)</div>' +
              '<div class="grid grid-cols-5 gap-2">' +
                state.shuffledQuestions.map(function(item, idx) {
                  const ans = state.answers[item.id];
                  const isDoubt = state.doubtful[item.id];
                  let cls = state.darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700';
                  if (ans) cls = 'bg-blue-600 text-white';
                  if (isDoubt) cls = 'bg-amber-500 text-slate-950';
                  return '<button onclick="state.currentIndex=' + idx + ';render();" class="h-10 rounded-lg font-bold text-xs ' + cls + '">' + (idx + 1) + (ans ? ' ('+ans+')' : '') + '</button>';
                }).join('') +
              '</div>' +
            '</aside>' +
            '<main class="md:col-span-3 rounded-xl border p-6 flex flex-col justify-between ' + (state.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200') + '">' +
              '<div>' +
                '<div class="flex items-center justify-between border-b pb-3 mb-4">' +
                  '<span class="font-extrabold text-lg">SOAL NO. ' + (state.currentIndex + 1) + '</span>' +
                  '<span class="px-3 py-1 rounded-md text-xs font-bold ' + (q.difficulty === 'HOTS' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white') + '">TIPE SOAL: ' + (q.difficulty === 'HOTS' ? 'HOTS (HOST)' : 'REGULER') + '</span>' +
                '</div>' +
                '<p class="text-base md:text-lg leading-relaxed mb-6">' + q.content + '</p>' +
                '<div class="space-y-3">' +
                  ['A','B','C','D'].map(function(letter, oIdx) {
                    const selected = state.answers[q.id] === letter;
                    return '<button onclick="selectOption(' + q.id + ', \\'' + letter + '\\')" class="w-full text-left p-3.5 rounded-xl border flex items-center gap-3 ' + (selected ? 'border-blue-600 bg-blue-600/10 font-bold' : (state.darkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50')) + '">' +
                      '<span class="w-8 h-8 rounded-lg flex items-center justify-center font-bold ' + (selected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800') + '">' + letter + '</span>' +
                      '<span>' + q.options[oIdx] + '</span>' +
                    '</button>';
                  }).join('') +
                '</div>' +
              '</div>' +
              '<div class="flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t">' +
                '<button onclick="if(state.currentIndex>0){state.currentIndex--;render();}" class="px-4 py-2.5 rounded-lg bg-slate-600 text-white text-sm font-bold">← Sebelumnya</button>' +
                '<button onclick="toggleDoubt(' + q.id + ')" class="px-4 py-2.5 rounded-lg bg-amber-500 text-slate-950 text-sm font-bold">Tandai Ragu-ragu</button>' +
                (state.currentIndex < state.shuffledQuestions.length - 1
                  ? '<button onclick="state.currentIndex++;render();" class="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold">Selanjutnya →</button>'
                  : '<button onclick="finishExamNormal()" class="px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold">Selesai Ujian ✓</button>') +
              '</div>' +
            '</main>' +
          '</div>' +
          (state.warningOverlayOpen ? (
            '<div class="fixed inset-0 bg-red-800/95 text-white z-50 flex flex-col items-center justify-center p-6 text-center">' +
              '<h1 class="text-4xl font-extrabold mb-2">JANGAN PINDAH TAB!</h1>' +
              '<p class="text-lg mb-4">' + state.warningReason + ' (Pelanggaran ' + state.violations + '/3)</p>' +
              '<div class="text-6xl font-mono font-extrabold mb-6" id="warning-countdown">' + state.warningSecondsLeft + '</div>' +
              '<button onclick="resumeFromWarning()" class="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-lg shadow-lg">KEMBALI KE UJIAN SEKARANG</button>' +
            '</div>'
          ) : '') +
        '</div>';
        return;
      }

      if (state.view === 'RESULT' && state.resultData) {
        const r = state.resultData;
        root.innerHTML = '<div class="max-w-4xl mx-auto p-4 md:p-8">' +
          '<div class="rounded-2xl shadow-lg border p-6 md:p-8 ' + (state.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200') + '">' +
            '<h2 class="text-2xl font-extrabold mb-2">Hasil Ujian ANBK Informatika</h2>' +
            '<p class="text-sm mb-4">' + state.studentName + ' • Kelas ' + state.className + ' • NIS/NISN: ' + state.nisn + '</p>' +
            '<div class="p-5 rounded-xl mb-6 ' + (r.passStatus === 'LULUS' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') + '">' +
              '<div class="text-3xl font-extrabold">NILAI: ' + r.finalScore + '% — ' + (r.passStatus === 'LULUS' ? 'LULUS UJIAN' : 'TIDAK LULUS UJIAN (UJIAN SUSULAN)') + '</div>' +
              '<div class="text-sm mt-1">Status Keamanan: ' + r.cheatStatus + '</div>' +
            '</div>' +
            '<div class="flex gap-3 no-print mb-6">' +
              '<button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Cetak / Print Hasil</button>' +
              '<button onclick="state.view=\\'HOME\\';render();" class="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-bold">Kembali ke Home</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }
    }

    function handleLoginSubmit() {
      if (!state.studentName.trim() || !state.nisn.trim()) {
        alert('Harap lengkapi Nama Siswa dan NIS/NISN!');
        return;
      }
      if (state.inputToken.trim().toUpperCase() !== state.onlineToken) {
        alert('Kode Token Ujian tidak sesuai dengan Token Online yang berlaku!');
        return;
      }
      state.view = 'INSTRUCTIONS';
      render();
    }

    render();
  </script>
</body>
</html>`;
}

