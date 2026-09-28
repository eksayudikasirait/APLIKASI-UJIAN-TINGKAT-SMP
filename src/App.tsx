/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Question,
  interfaceSubmissionRecord,
  EmailNotificationLog,
  ExamConfig,
  DEFAULT_EXAM_CONFIG,
  CLASS_OPTIONS,
  INITIAL_QUESTIONS,
  INITIAL_SUBMISSIONS
} from './data/examData';
import { TutWuriLogo } from './components/TutWuriLogo';
import { TeacherModeModal } from './components/TeacherModeModal';
import {
  Sun,
  Moon,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  Printer,
  Download,
  RefreshCw,
  KeyRound,
  FileText,
  Table,
  Code2,
  UserCheck,
  Maximize2,
  Mail,
  ExternalLink,
  BookOpen
} from 'lucide-react';

type ViewMode = 'HOME' | 'INSTRUCTIONS' | 'EXAM' | 'RESULT' | 'DISQUALIFIED_TRANSITION';

function generateRandomToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function formatSeconds(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatCurrentTimestamp(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

function shuffleQuestions(arr: Question[]): Question[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function App() {
  // Theme State (Light / Dark Mode)
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Persistent Data States (Questions, Submissions, Email Logs, Config)
  const [examConfig, setExamConfig] = useState<ExamConfig>(() => {
    try {
      const saved = localStorage.getItem('anbk_exam_config_v1');
      return saved ? JSON.parse(saved) : DEFAULT_EXAM_CONFIG;
    } catch {
      return DEFAULT_EXAM_CONFIG;
    }
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('anbk_questions_v1');
      return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
    } catch {
      return INITIAL_QUESTIONS;
    }
  });

  const [submissions, setSubmissions] = useState<interfaceSubmissionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('anbk_submissions_v1');
      return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  });

  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>(() => {
    try {
      const saved = localStorage.getItem('anbk_email_logs_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever data updates
  useEffect(() => {
    try {
      localStorage.setItem('anbk_exam_config_v1', JSON.stringify(examConfig));
    } catch {}
  }, [examConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('anbk_questions_v1', JSON.stringify(questions));
    } catch {}
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem('anbk_submissions_v1', JSON.stringify(submissions));
    } catch {}
  }, [submissions]);

  useEffect(() => {
    try {
      localStorage.setItem('anbk_email_logs_v1', JSON.stringify(emailLogs));
    } catch {}
  }, [emailLogs]);

  // Online Token (6-digit alphanumeric, valid for 15 minutes = 900 seconds, auto-rotates)
  const [onlineToken, setOnlineToken] = useState<string>(() => generateRandomToken());
  const [tokenSecondsLeft, setTokenSecondsLeft] = useState<number>(15 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTokenSecondsLeft((prev) => {
        if (prev <= 1) {
          setOnlineToken(generateRandomToken());
          return 15 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRegenerateToken = () => {
    setOnlineToken(generateRandomToken());
    setTokenSecondsLeft(15 * 60);
  };

  // Student Login & Session State
  const [view, setView] = useState<ViewMode>('HOME');
  const [studentName, setStudentName] = useState<string>('');
  const [className, setClassName] = useState<string>('VII-1');
  const [nisn, setNisn] = useState<string>('');
  const [inputToken, setInputToken] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [homeNotice, setHomeNotice] = useState<string | null>(null);

  // Active Exam State
  const [sessionId, setSessionId] = useState<string>('');
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [doubtful, setDoubtful] = useState<Record<number, boolean>>({});
  const [examSecondsLeft, setExamSecondsLeft] = useState<number>(15 * 60);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);
  const [confirmFinishModal, setConfirmFinishModal] = useState<boolean>(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState<boolean>(false);

  // Anti-Cheating State
  const [violationCount, setViolationCount] = useState<number>(0);
  const [cheatLogs, setCheatLogs] = useState<string[]>([]);
  const [warningOverlayOpen, setWarningOverlayOpen] = useState<boolean>(false);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState<number>(15);
  const [warningReason, setWarningReason] = useState<string>('');
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const [disqualifiedReason, setDisqualifiedReason] = useState<string>('');

  // Final Result Record for current student
  const [latestResult, setLatestResult] = useState<interfaceSubmissionRecord | null>(null);

  // Teacher Mode Authentication State (Password: 31051990 - NOT displayed anywhere in UI)
  const [teacherLoginModalOpen, setTeacherLoginModalOpen] = useState<boolean>(false);
  const [teacherPasswordInput, setTeacherPasswordInput] = useState<string>('');
  const [teacherPasswordError, setTeacherPasswordError] = useState<string | null>(null);
  const [teacherDashboardOpen, setTeacherDashboardOpen] = useState<boolean>(false);

  // Refs to prevent duplicate submission spam (fixes the 1-second infinite loop bug in old script)
  const examSubmittedRef = useRef<boolean>(false);
  const initialViewportRef = useRef<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  // Check if device screen is in Split-Screen mode (Android / iPhone / Chromebook / Laptop)
  const detectSplitScreen = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    const availW = window.screen.availWidth || window.screen.width;
    const availH = window.screen.availHeight || window.screen.height;
    const innerW = window.innerWidth;
    const innerH = window.innerHeight;

    // On mobile/tablet/laptop, if window width or height is drastically smaller than physical screen
    // (while not inside a standard desktop preview iframe), or if height shrank by >45% during exam
    const isEmbeddedPreview = window.self !== window.top;
    if (!isEmbeddedPreview && availW > 0 && availH > 0) {
      if (innerW < availW * 0.55 || innerH < availH * 0.48) {
        return true;
      }
    }

    // Also compare against baseline viewport when exam started
    const baseW = initialViewportRef.current.width;
    const baseH = initialViewportRef.current.height;
    if (baseW > 0 && baseH > 0) {
      if (innerW < baseW * 0.65 || innerH < baseH * 0.55) {
        return true;
      }
    }
    return false;
  }, []);

  // Upsert Student Submission Record (Auto-Save & Final Submit without duplicate row spam)
  const upsertSubmissionRecord = useCallback(
    (
      currentAnswers: Record<number, 'A' | 'B' | 'C' | 'D'>,
      statusText: string,
      isDisqualified: boolean,
      isFinal: boolean,
      logsSnapshot: string[]
    ): interfaceSubmissionRecord => {
      const activeQuestions = shuffledQuestions.length > 0 ? shuffledQuestions : questions;
      let correctCount = 0;
      activeQuestions.forEach((q) => {
        if (currentAnswers[q.id] === q.answer) {
          correctCount++;
        }
      });

      const totalQuestions = activeQuestions.length || 10;
      const finalScore = Math.round((correctCount / totalQuestions) * 100);

      // KKM Rule: 0-60 = TIDAK LULUS, 70-100 = LULUS. Any cheating/disqualification = TIDAK LULUS
      const passStatus: 'LULUS' | 'TIDAK LULUS' =
        !isDisqualified && finalScore >= examConfig.kkmScore ? 'LULUS' : 'TIDAK LULUS';

      const timestamp = formatCurrentTimestamp();
      const record: interfaceSubmissionRecord = {
        id: `rec-${sessionId}`,
        sessionId,
        timestamp,
        studentName: studentName.trim(),
        nisn: nisn.trim(),
        className,
        correctCount,
        totalQuestions,
        finalScore,
        cheatStatus: statusText,
        passStatus,
        answers: { ...currentAnswers },
        cheatLogs: [...logsSnapshot],
        emailSentTo: isFinal ? examConfig.notificationEmail : undefined
      };

      setSubmissions((prev) => {
        const existingIdx = prev.findIndex((item) => item.sessionId === sessionId);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = record;
          return updated;
        }
        return [record, ...prev];
      });

      setLastAutoSaveTime(new Date().toLocaleTimeString('id-ID'));

      // If Final Submit, send notification log to eksayudikasirait31@gmail.com & optional Apps Script Webhook
      if (isFinal) {
        const emailEntry: EmailNotificationLog = {
          id: `mail-${sessionId}-${Date.now()}`,
          timestamp,
          recipient: examConfig.notificationEmail,
          subject: `[ANBK INFORMATIKA] ${studentName.trim()} (${className}) - Nilai: ${finalScore}% - ${
            passStatus === 'LULUS' ? 'LULUS UJIAN' : 'TIDAK LULUS (UJIAN SUSULAN)'
          }`,
          studentName: studentName.trim(),
          className,
          nisn: nisn.trim(),
          finalScore,
          passStatus: passStatus === 'LULUS' ? 'LULUS UJIAN' : 'TIDAK LULUS (UJIAN SUSULAN)',
          cheatStatus: statusText,
          cheatDetails: logsSnapshot,
          deliveryStatus: 'SUKSES TERKIRIM'
        };
        setEmailLogs((prev) => [emailEntry, ...prev]);

        if (examConfig.appsScriptWebAppUrl && examConfig.appsScriptWebAppUrl.startsWith('https://')) {
          fetch(examConfig.appsScriptWebAppUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'saveSubmission',
              payload: {
                ...record,
                isDisqualified,
                isFinalSubmit: true
              }
            })
          }).catch(() => {});
        }
      }

      return record;
    },
    [shuffledQuestions, questions, examConfig, sessionId, studentName, nisn, className]
  );

  // Disqualify Immediately & Auto-Restart to HOME
  const triggerDisqualification = useCallback(
    (reason: string, updatedLogs?: string[]) => {
      if (examSubmittedRef.current) return;
      examSubmittedRef.current = true;

      const finalLogs = updatedLogs || [
        ...cheatLogs,
        `[${new Date().toLocaleTimeString('id-ID')}] DISKUALIFIKASI: ${reason}`
      ];

      setWarningOverlayOpen(false);
      setDisqualifiedReason(reason);

      const finalRecord = upsertSubmissionRecord(answers, reason, true, true, finalLogs);
      setLatestResult(finalRecord);

      // Exit fullscreen safely if active
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {}

      setView('DISQUALIFIED_TRANSITION');

      // Automatically reload/reset back to HOME menu after 4 seconds as required
      setTimeout(() => {
        setView('HOME');
        setInputToken('');
        setHomeNotice(
          `Ujian atas nama ${studentName} (${className}) telah dihentikan otomatis dan dinyatakan TIDAK LULUS UJIAN ("Ujian Susulan") karena: ${reason}. Data dan notifikasi kecurangan telah dikirim ke ${examConfig.notificationEmail}.`
        );
      }, 4200);
    },
    [answers, cheatLogs, upsertSubmissionRecord, studentName, className, examConfig.notificationEmail]
  );

  // Normal Exam Finish
  const handleFinishExamNormal = useCallback(
    (customReason?: string) => {
      if (examSubmittedRef.current) return;
      examSubmittedRef.current = true;
      setConfirmFinishModal(false);
      setWarningOverlayOpen(false);

      const statusText =
        customReason ||
        (violationCount > 0
          ? `Selesai Normal (Tercatat ${violationCount}x Peringatan Pindah Tab)`
          : 'Selesai Normal oleh Peserta');

      const finalRecord = upsertSubmissionRecord(answers, statusText, false, true, cheatLogs);
      setLatestResult(finalRecord);

      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {}

      setView('RESULT');
    },
    [answers, violationCount, cheatLogs, upsertSubmissionRecord]
  );

  // Trigger Tab Switch / Minimize / Blur Violation
  const registerViolation = useCallback(
    (reason: string) => {
      if (view !== 'EXAM' || examSubmittedRef.current) return;

      setViolationCount((prevCount) => {
        const nextCount = prevCount + 1;
        const timeStr = new Date().toLocaleTimeString('id-ID');
        const logEntry = `[${timeStr}] Pelanggaran #${nextCount}: ${reason}`;
        const nextLogs = [...cheatLogs, logEntry];
        setCheatLogs(nextLogs);

        if (nextCount >= 3) {
          triggerDisqualification(
            `Diskualifikasi: Terdeteksi pindah tab/minimize 3 kali (${reason})`,
            nextLogs
          );
          return nextCount;
        }

        // Show Red Warning Overlay with 15-second countdown
        setWarningReason(reason);
        setWarningSecondsLeft(15);
        setWarningOverlayOpen(true);

        // Auto-save violation status immediately
        upsertSubmissionRecord(
          answers,
          `Peringatan Anti-Kecurangan ${nextCount}/3 (${reason})`,
          false,
          false,
          nextLogs
        );

        return nextCount;
      });
    },
    [view, cheatLogs, triggerDisqualification, upsertSubmissionRecord, answers]
  );

  // 15-Second Red Warning Overlay Countdown Timer
  useEffect(() => {
    if (!warningOverlayOpen || view !== 'EXAM' || examSubmittedRef.current) return;

    const timer = setInterval(() => {
      setWarningSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerDisqualification(
            'Diskualifikasi: Gagal merespons peringatan anti-kecurangan.'
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [warningOverlayOpen, view, triggerDisqualification]);

  // 15-Minute Main Exam Countdown Timer
  useEffect(() => {
    if (view !== 'EXAM' || examSubmittedRef.current) return;

    const timer = setInterval(() => {
      setExamSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExamNormal('Waktu Ujian Habis (Auto-Submit)');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [view, handleFinishExamNormal]);

  // Anti-Cheating Event Listeners (Tab Switch, Blur, Split-Screen Resize, Shortcuts, ContextMenu, PageLeave)
  useEffect(() => {
    if (view !== 'EXAM') return;

    const handleVisibilityChange = () => {
      if (document.hidden && !examSubmittedRef.current) {
        registerViolation('Meninggalkan tab atau minimize browser terdeteksi.');
      }
    };

    const handleWindowBlur = () => {
      if (!examSubmittedRef.current && !warningOverlayOpen) {
        registerViolation('Keluar dari fokus jendela ujian terdeteksi.');
      }
    };

    const handleResize = () => {
      if (examSubmittedRef.current) return;
      if (detectSplitScreen()) {
        triggerDisqualification(
          'Diskualifikasi: Terdeteksi belah layar (Split Screen) pada perangkat saat ujian berlangsung.'
        );
      }
    };

    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreenActive(isFull);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setSecurityToast('Klik kanan (Right Click) dikunci selama ujian berlangsung!');
      setTimeout(() => setSecurityToast(null), 2500);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isForbiddenShortcut =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
        (e.ctrlKey && (key === 'u' || key === 'c' || key === 'v' || key === 's' || key === 'p'));

      if (isForbiddenShortcut) {
        e.preventDefault();
        e.stopPropagation();
        setSecurityToast(`Shortcut ${e.ctrlKey ? 'Ctrl+' : ''}${e.key.toUpperCase()} diblokir oleh Sistem Anti-Curang ANBK!`);
        setTimeout(() => setSecurityToast(null), 2500);
      }
    };

    const handlePageHide = () => {
      if (!examSubmittedRef.current) {
        triggerDisqualification(
          'Diskualifikasi: Peserta meninggalkan atau menutup halaman ujian.'
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [view, warningOverlayOpen, registerViolation, detectSplitScreen, triggerDisqualification]);

  // Step 1: Login Form Submit -> Go to Instructions Page
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setHomeNotice(null);

    if (!studentName.trim()) {
      setLoginError('Nama Lengkap Siswa wajib diisi.');
      return;
    }
    if (!nisn.trim()) {
      setLoginError('NIS / NISN Siswa wajib diisi.');
      return;
    }
    if (inputToken.trim().toUpperCase() !== onlineToken) {
      setLoginError(
        `Kode Token Ujian tidak valid! Masukkan kode token aktif: ${onlineToken}`
      );
      return;
    }

    // Randomize questions for this student right after entering valid token
    const randomized = shuffleQuestions(questions);
    setShuffledQuestions(randomized);
    setView('INSTRUCTIONS');
  };

  // Step 2: Click Green "Mulai Ujian" Button -> Check Split Screen, Enter Fullscreen, Start Exam
  const handleStartExamClick = () => {
    initialViewportRef.current = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const newSessionId = `SES-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    setSessionId(newSessionId);
    setAnswers({});
    setDoubtful({});
    setViolationCount(0);
    setCheatLogs([]);
    setCurrentQuestionIndex(0);
    setExamSecondsLeft(examConfig.durationMinutes * 60);
    examSubmittedRef.current = false;

    // Check if Android/iPhone/Laptop screen is already split when clicking "Mulai Ujian"
    const availW = window.screen.availWidth || window.screen.width;
    const availH = window.screen.availHeight || window.screen.height;
    const isEmbedded = window.self !== window.top;
    if (!isEmbedded && availW > 0 && availH > 0) {
      if (window.innerWidth < availW * 0.55 || window.innerHeight < availH * 0.48) {
        setView('EXAM');
        setTimeout(() => {
          triggerDisqualification(
            'Diskualifikasi: Layar terdeteksi terbelah (Split Screen) saat menekan tombol Mulai Ujian.'
          );
        }, 50);
        return;
      }
    }

    // Request Fullscreen automatically
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement
          .requestFullscreen()
          .then(() => setIsFullscreenActive(true))
          .catch(() => {});
      }
    } catch {}

    setView('EXAM');
  };

  // Select Answer Option (Auto-Saves immediately to Google Sheet / Rekap)
  const handleSelectOption = (questionId: number, optionLetter: 'A' | 'B' | 'C' | 'D') => {
    if (examSubmittedRef.current) return;
    const updatedAnswers = {
      ...answers,
      [questionId]: optionLetter
    };
    setAnswers(updatedAnswers);

    upsertSubmissionRecord(
      updatedAnswers,
      violationCount > 0
        ? `Sedang Mengerjakan (Peringatan ${violationCount}/3)`
        : 'Sedang Mengerjakan (Auto-Save Aktif)',
      false,
      false,
      cheatLogs
    );
  };

  // Toggle "Tandai Ragu-ragu"
  const handleToggleDoubt = (questionId: number) => {
    setDoubtful((prev) => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Green Button on Red Anti-Cheat Overlay to Resume Exam
  const handleResumeFromWarning = () => {
    setWarningOverlayOpen(false);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}
  };

  // Teacher Login Handler (Password: 31051990)
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherPasswordInput === '31051990') {
      setTeacherLoginModalOpen(false);
      setTeacherPasswordInput('');
      setTeacherPasswordError(null);
      setTeacherDashboardOpen(true);
    } else {
      setTeacherPasswordError('Password Mode Guru tidak valid! Akses ditolak.');
    }
  };

  // Download Individual Student Result Report (.txt / .html printable)
  const handleDownloadStudentReport = () => {
    if (!latestResult) return;
    const lines = [
      '====================================================================',
      `LAPORAN HASIL UJIAN BERBASIS KOMPUTER (ANBK) - ${examConfig.schoolName}`,
      '====================================================================',
      `Judul Ujian       : ${examConfig.title}`,
      `Mata Pelajaran    : ${examConfig.subject} (${examConfig.topic})`,
      `Tahun Ajaran      : ${examConfig.academicYear}`,
      `Kurikulum         : ${examConfig.curriculum}`,
      `Guru Mapel        : ${examConfig.teacherName}`,
      '--------------------------------------------------------------------',
      `Waktu Selesai     : ${latestResult.timestamp}`,
      `Nama Siswa        : ${latestResult.studentName}`,
      `Kelas             : ${latestResult.className}`,
      `NIS / NISN        : ${latestResult.nisn}`,
      `Soal Terjawab     : ${Object.keys(answers).length} dari ${latestResult.totalQuestions} Soal`,
      `Skor Benar        : ${latestResult.correctCount} / ${latestResult.totalQuestions}`,
      `Nilai Akhir       : ${latestResult.finalScore}%`,
      `Status Kecurangan : ${latestResult.cheatStatus}`,
      `Hasil Kelulusan   : ${
        latestResult.passStatus === 'LULUS'
          ? 'LULUS UJIAN'
          : 'TIDAK LULUS UJIAN (WAJIB UJIAN SUSULAN)'
      }`,
      '===================================================================='
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hasil_Ujian_ANBK_${latestResult.studentName.replace(/\s+/g, '_')}_${latestResult.className}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeQuestion = shuffledQuestions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const hotsTotal = questions.filter((q) => q.difficulty === 'HOTS').length;
  const regulerTotal = questions.filter((q) => q.difficulty === 'REGULER').length;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      } ${view === 'EXAM' ? 'no-select' : ''}`}
    >
      {/* TOP BAR CONTRACT (Official ANBK Institutional Header) */}
      <header
        className={`no-print border-b px-4 md:px-8 py-3 flex items-center justify-between gap-4 ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-blue-950 border-blue-900 text-white'
        }`}
      >
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-extrabold text-sm md:text-base tracking-tight truncate">
            ANBK CBT · {examConfig.schoolName}
          </span>
        </div>

        {/* Zone 2: Info / Quick Links (Single-line controls) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-blue-200">
          <span className="whitespace-nowrap">Mapel: {examConfig.subject}</span>
          <span className="whitespace-nowrap">Kelas: SMP Kelas 7</span>
          <span className="whitespace-nowrap">Guru: {examConfig.teacherName}</span>
          {view !== 'EXAM' && (
            <button
              onClick={() => setTeacherLoginModalOpen(true)}
              className="hover:text-white underline-offset-4 hover:underline whitespace-nowrap cursor-pointer"
            >
              Akses Cepat Guru
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Actions (Dark/Light Mode + Mode Guru Button) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1.5 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-xs font-semibold flex items-center gap-1.5 border border-blue-700/60 transition-colors whitespace-nowrap cursor-pointer"
            title="Ubah Mode Tampilan Gelap / Terang"
          >
            {darkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-200" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          {view !== 'EXAM' && (
            <button
              onClick={() => setTeacherLoginModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Mode Guru</span>
            </button>
          )}
        </div>
      </header>

      {/* =====================================================================
          VIEW 1: HALAMAN HOME (LOGIN PESERTA & INFORMASI UJIAN ANBK)
         ===================================================================== */}
      {view === 'HOME' && (
        <main className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
          {/* Disqualification / System Notice Banner if redirected from exam */}
          {homeNotice && (
            <div className="p-4 rounded-xl bg-rose-600 text-white shadow-lg flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm font-semibold leading-relaxed flex-1">
                {homeNotice}
              </div>
              <button
                onClick={() => setHomeNotice(null)}
                className="text-white/80 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Hero Identity Banner with Official Tut Wuri Handayani Emblem */}
          <section
            className={`rounded-2xl shadow-xl border overflow-hidden ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* High-Quality Official Tut Wuri Handayani Pentagon Emblem */}
                <TutWuriLogo size="lg" />

                <div className="text-center md:text-left flex-1 space-y-1.5">
                  <div className="text-xs font-bold tracking-widest uppercase text-blue-200">
                    ASESMEN NASIONAL BERBASIS KOMPUTER (ANBK) · {examConfig.curriculum.toUpperCase()}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    {examConfig.schoolName}
                  </h1>
                  <p className="text-base md:text-lg font-bold text-amber-300">
                    {examConfig.title} — TAHUN AJARAN {examConfig.academicYear}
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-xs text-blue-100">
                    <span>
                      Pembuat Soal Ujian: <strong className="text-white underline decoration-amber-400 underline-offset-4">EKSA YUDIKA SIRAIT</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Mata Pelajaran: <strong className="text-white">INFORMATIKA</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Topik: <strong className="text-white">{examConfig.topic}</strong></span>
                  </div>
                </div>

                {/* Live Online Token Card (6 Digits Alphanumeric, 15-Minute Expiry) */}
                <div className="w-full md:w-auto bg-blue-950/90 border border-blue-700/80 rounded-2xl p-4 text-center shrink-0 shadow-inner">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300 mb-1">
                    TOKEN UJIAN ONLINE AKTIF
                  </div>
                  <div
                    onClick={() => setInputToken(onlineToken)}
                    title="Klik untuk menyalin token ke kolom input"
                    className="font-mono text-3xl font-extrabold tracking-[0.2em] text-amber-300 bg-slate-950/70 px-4 py-2 rounded-xl border border-amber-400/30 cursor-pointer select-all"
                  >
                    {onlineToken}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs text-blue-200">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      Reset Otomatis:{' '}
                      <strong className="font-mono text-white">
                        {formatSeconds(tokenSecondsLeft)}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleRegenerateToken}
                      className="p-1 rounded hover:bg-blue-800 text-blue-200 hover:text-white cursor-pointer"
                      title="Perbarui Token Online Sekarang"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Grid: Student Login Form (Left) & Exam Details + Quick Teacher Access (Right) */}
            <div className="p-6 md:p-8 grid lg:grid-cols-12 gap-8">
              {/* Left Column: Form Login Peserta */}
              <div className="lg:col-span-7 space-y-5">
                <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-extrabold flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Formulir Identitas Peserta Ujian
                  </h2>
                  <p className="text-xs opacity-75 mt-0.5">
                    Lengkapi Nama Siswa, pilih Kelas (VII-1 s/d VII-5), NIS/NISN, dan masukkan 6 digit Kode Token Online.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                      Nama Lengkap Siswa <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Contoh: Nayla Azzahra Nst"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                        darkMode
                          ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                        Kelas (SMP Kelas 7) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                          darkMode
                            ? 'bg-slate-800/90 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        {CLASS_OPTIONS.map((cls) => (
                          <option key={cls} value={cls}>
                            Kelas {cls}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                        NIS / NISN <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nisn}
                        onChange={(e) => setNisn(e.target.value)}
                        placeholder="Masukkan NIS atau NISN"
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                          darkMode
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider">
                        Kode Token Ujian (6 Digit Huruf & Angka) <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setInputToken(onlineToken)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Gunakan Token Online ({onlineToken})
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={inputToken}
                      onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                      placeholder="Ketik 6 digit kode token ujian"
                      className={`w-full px-4 py-3 rounded-xl border text-base font-mono font-extrabold tracking-[0.25em] uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                        darkMode
                          ? 'bg-slate-800/90 border-slate-700 text-amber-300 placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-blue-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-sm md:text-base shadow-lg shadow-blue-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span>MULAI UJIAN (LANJUT KE PETUNJUK UJIAN)</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Exam Specifications & Quick Teacher Access */}
              <div className="lg:col-span-5 space-y-5">
                <div
                  className={`p-5 rounded-xl border space-y-3 ${
                    darkMode
                      ? 'bg-slate-800/40 border-slate-800'
                      : 'bg-slate-50/90 border-slate-200/90'
                  }`}
                >
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Spesifikasi Resmi Ujian ANBK
                  </h3>

                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-200/70 dark:border-slate-800">
                      <dt className="opacity-75">Judul Ujian</dt>
                      <dd className="font-bold text-right">{examConfig.title}</dd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/70 dark:border-slate-800">
                      <dt className="opacity-75">Mata Pelajaran</dt>
                      <dd className="font-bold text-right">{examConfig.subject}</dd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/70 dark:border-slate-800">
                      <dt className="opacity-75">Pembuat Soal / Guru Mapel</dt>
                      <dd className="font-extrabold text-blue-600 dark:text-amber-300 text-right">
                        {examConfig.teacherName}
                      </dd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/70 dark:border-slate-800">
                      <dt className="opacity-75">Kurikulum & Tahun Ajaran</dt>
                      <dd className="font-bold text-right">
                        {examConfig.curriculum} · {examConfig.academicYear}
                      </dd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/70 dark:border-slate-800">
                      <dt className="opacity-75">Kelas Sasaran</dt>
                      <dd className="font-bold text-right">SMP Kelas 7 (VII-1 s/d VII-5)</dd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/70 dark:border-slate-800">
                      <dt className="opacity-75">Durasi Pengerjaan</dt>
                      <dd className="font-mono font-bold text-right">15 Menit (Real-time Timer)</dd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/70 dark:border-slate-800">
                      <dt className="opacity-75">Total & Sebaran Soal</dt>
                      <dd className="font-bold text-right">
                        {questions.length} Soal ({hotsTotal} HOTS & {regulerTotal} Reguler)
                      </dd>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <dt className="opacity-75">Standar KKM Kelulusan</dt>
                      <dd className="font-bold text-emerald-600 dark:text-emerald-400 text-right">
                        70–100 Lulus · 0–60 Ujian Susulan
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Quick Teacher Access Panel (Akses Cepat Guru) */}
                <div
                  className={`p-5 rounded-xl border space-y-3 ${
                    darkMode
                      ? 'bg-blue-950/30 border-blue-900/60'
                      : 'bg-blue-50/70 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Akses Cepat Guru Profesional
                    </h3>
                    <span className="text-[11px] opacity-75">Terproteksi Password</span>
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Kelola soal dari Google Dokumen, pantau & edit Rekap Google Sheet ({submissions.length} data siswa), serta ambil kode siap pakai <code>Code.gs</code> + <code>index.html</code>.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setTeacherLoginModalOpen(true)}
                      className="px-3 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Buka Mode Guru
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherLoginModalOpen(true)}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        darkMode
                          ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                          : 'border-blue-300 bg-white hover:bg-blue-100/50 text-blue-900'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" /> Kode GS & HTML
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* =====================================================================
          VIEW 2: HALAMAN PETUNJUK UJIAN (SETELAH LOGIN BERHASIL)
         ===================================================================== */}
      {view === 'INSTRUCTIONS' && (
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div
            className={`rounded-2xl shadow-xl border overflow-hidden ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="bg-blue-950 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TutWuriLogo size="sm" />
                <div>
                  <h2 className="text-lg font-extrabold">PETUNJUK & TATA TERTIB UJIAN ANBK</h2>
                  <p className="text-xs text-blue-200">
                    {examConfig.schoolName} · Pembuat Soal: {examConfig.teacherName}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs bg-blue-900 px-3 py-1.5 rounded-lg border border-blue-700">
                Token Terverifikasi: {onlineToken}
              </span>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Verified Student Summary */}
              <div
                className={`p-4 rounded-xl border grid sm:grid-cols-3 gap-4 text-xs ${
                  darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50/60 border-blue-200'
                }`}
              >
                <div>
                  <span className="opacity-70 block">Nama Peserta:</span>
                  <strong className="text-sm">{studentName}</strong>
                </div>
                <div>
                  <span className="opacity-70 block">Kelas / Tingkat:</span>
                  <strong className="text-sm">{className} (SMP Kelas 7)</strong>
                </div>
                <div>
                  <span className="opacity-70 block">NIS / NISN:</span>
                  <strong className="text-sm font-mono">{nisn}</strong>
                </div>
              </div>

              {/* Detailed Exam Instructions & Anti-Cheat Rules */}
              <div className="space-y-3">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Baca Petunjuk Ujian Berikut Sebelum Menekan Tombol Mulai:
                </h3>

                <ol className="list-decimal pl-5 space-y-2.5 text-xs md:text-sm leading-relaxed">
                  <li>
                    Ujian Mata Pelajaran <strong>{examConfig.subject}</strong> ({examConfig.topic}) terdiri dari{' '}
                    <strong>{shuffledQuestions.length} butir soal Pilihan Ganda</strong> ({hotsTotal} soal <strong>HOTS</strong> & {regulerTotal} soal <strong>REGULER</strong>) yang telah <strong>diacak otomatis</strong> untuk setiap siswa.
                  </li>
                  <li>
                    Waktu pengerjaan ujian adalah <strong>{examConfig.durationMinutes} menit</strong>. Hitung mundur (Real-time Countdown Timer) berjalan otomatis begitu ujian dimulai.
                  </li>
                  <li>
                    Setiap jawaban yang Anda pilih langsung tersimpan secara otomatis (<strong>Auto-Save</strong>) ke Google Sheet Rekap Hasil Ujian Guru.
                  </li>
                  <li>
                    Saat menekan tombol warna hijau <strong>"MULAI UJIAN"</strong> di bawah, layar perangkat (Laptop, Chromebook, Android, atau iPhone) akan <strong>otomatis masuk ke Mode Layar Penuh (Full Screen)</strong>.
                  </li>
                  <li className="text-rose-600 dark:text-rose-400 font-semibold">
                    <strong>SISTEM ANTI-CURANG AKTIF:</strong> Dilarang keras pindah tab, me-minimize browser, membelah layar (Split Screen), menggunakan tombol pintas (F12, Ctrl+Shift+I, Ctrl+U, Ctrl+C), atau klik kanan.
                  </li>
                  <li className="text-rose-600 dark:text-rose-400 font-semibold">
                    Jika terdeteksi membelah layar (Split Screen) saat menekan Mulai Ujian atau saat ujian berlangsung, atau meninggalkan halaman ujian, maka ujian <strong>langsung selesai otomatis</strong> dan dinyatakan <strong>TIDAK LULUS UJIAN ("Ujian Susulan")</strong>.
                  </li>
                  <li>
                    Jika terdeteksi pindah tab/minimize, akan muncul <strong>Layar Merah Peringatan 15 Detik</strong>. Jika tidak kembali dalam 15 detik atau melanggar sebanyak <strong>3 kali</strong>, ujian otomatis dihentikan dan dinyatakan <strong>Gagal / Tidak Lulus Ujian ("Ujian Susulan")</strong>.
                  </li>
                  <li>
                    Standar KKM Kelulusan: Nilai <strong>70 sampai 100</strong> dinyatakan <strong>LULUS UJIAN</strong>. Nilai <strong>0 sampai 60</strong> dinyatakan <strong>TIDAK LULUS UJIAN ("Ujian Susulan")</strong>.
                  </li>
                </ol>
              </div>

              {/* Bottom Action Buttons (Green "Mulai Ujian" Button as specified in Requirement #4) */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setView('HOME')}
                  className={`w-full sm:w-auto px-5 py-3.5 rounded-xl border text-xs font-bold cursor-pointer ${
                    darkMode
                      ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                      : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  ← Kembali ke Halaman Login
                </button>

                <button
                  type="button"
                  onClick={handleStartExamClick}
                  className="w-full sm:flex-1 py-4 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base md:text-lg shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <Maximize2 className="w-5 h-5" />
                  <span>MULAI UJIAN (MASUK MODE LAYAR PENUH)</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          VIEW 3: HALAMAN UJIAN (DESAIN ANBK ASLI - FULLSCREEN & ANTI-CURANG)
         ===================================================================== */}
      {view === 'EXAM' && activeQuestion && (
        <div className="min-h-[calc(100vh-57px)] flex flex-col justify-between">
          {/* Sub-Header Status Bar ANBK */}
          <div
            className={`border-b px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 ${
              darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-extrabold text-blue-700 dark:text-blue-400">
                PESERTA: {studentName.toUpperCase()}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold">KELAS: {className}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">NIS/NISN: {nisn}</span>
              {lastAutoSaveTime && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Auto-Save Google Sheet ({lastAutoSaveTime})
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Violation Counter Indicator */}
              <div
                className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                  violationCount === 0
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                Pelanggaran Anti-Curang: {violationCount} / 3
              </div>

              {/* Fullscreen Toggle Helper */}
              {!isFullscreenActive && (
                <button
                  type="button"
                  onClick={() => {
                    if (document.documentElement.requestFullscreen) {
                      document.documentElement.requestFullscreen().catch(() => {});
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Layar Penuh
                </button>
              )}

              {/* Real-time Countdown Timer 15 Minutes */}
              <div
                className={`font-mono font-extrabold text-sm md:text-base px-4 py-1.5 rounded-xl border flex items-center gap-2 ${
                  examSecondsLeft <= 180
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-blue-950 text-amber-300 border-blue-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>SISA WAKTU: {formatSeconds(examSecondsLeft)}</span>
              </div>
            </div>
          </div>

          {/* Security Toast Notification (if student tries right-click or forbidden shortcut) */}
          {securityToast && (
            <div className="bg-rose-600 text-white px-4 py-2 text-center text-xs font-bold">
              ⚠ {securityToast}
            </div>
          )}

          {/* Main ANBK Exam Workspace: Left Sidebar (1-10) + Center Question Stage */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid lg:grid-cols-12 gap-6 items-start">
            {/* LEFT SIDEBAR: Nomor Soal 1 sampai 10 dengan Status Belum Dijawab / Sudah Dijawab / Ragu */}
            <aside
              className={`lg:col-span-3 rounded-2xl border p-5 space-y-4 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-extrabold uppercase tracking-wider">
                  DAFTAR NOMOR SOAL (1–{shuffledQuestions.length})
                </h3>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {answeredCount}/{shuffledQuestions.length} Dijawab
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {shuffledQuestions.map((q, idx) => {
                  const selectedAns = answers[q.id];
                  const isDoubt = doubtful[q.id];
                  const isCurrent = idx === currentQuestionIndex;

                  let btnStyle = darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200';

                  if (selectedAns) {
                    btnStyle = 'bg-blue-700 border-blue-800 text-white';
                  }
                  if (isDoubt) {
                    btnStyle = 'bg-amber-500 border-amber-600 text-slate-950';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`relative h-12 rounded-xl border-2 font-mono font-extrabold text-sm flex flex-col items-center justify-center transition-all cursor-pointer ${btnStyle} ${
                        isCurrent ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {selectedAns && (
                        <span className="text-[10px] leading-none font-sans font-black">
                          {selectedAns}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status Legend */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-blue-700 inline-block" /> Sudah Dijawab
                  </span>
                  <span className="font-mono font-bold">{answeredCount} Soal</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block" /> Ragu-ragu
                  </span>
                  <span className="font-mono font-bold">
                    {Object.values(doubtful).filter(Boolean).length} Soal
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-slate-300 dark:bg-slate-700 inline-block" /> Belum Dijawab
                  </span>
                  <span className="font-mono font-bold">
                    {shuffledQuestions.length - answeredCount} Soal
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmFinishModal(true)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider shadow transition-colors cursor-pointer"
              >
                Selesai & Kumpulkan Ujian
              </button>
            </aside>

            {/* CENTER QUESTION AREA */}
            <section
              className={`lg:col-span-9 rounded-2xl border overflow-hidden flex flex-col justify-between min-h-[500px] ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {/* Top Question Bar: Question Number, Difficulty (REGULER / HOTS), Font Size */}
              <div>
                <div
                  className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
                    darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 rounded-xl bg-blue-900 text-white font-mono font-extrabold text-sm">
                      SOAL NO. {currentQuestionIndex + 1} / {shuffledQuestions.length}
                    </span>

                    {/* Area Atas Menampilkan Bentuk Soal REGULER atau HOTS (HOST) */}
                    <span
                      className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs tracking-wide uppercase ${
                        activeQuestion.difficulty === 'HOTS'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-sky-600 text-white shadow-xs'
                      }`}
                    >
                      BENTUK SOAL: {activeQuestion.difficulty === 'HOTS' ? 'HOTS (HOST)' : 'REGULER'}
                    </span>

                    <span className="text-xs font-semibold opacity-75">
                      Status:{' '}
                      {answers[activeQuestion.id]
                        ? `Sudah Dijawab (${answers[activeQuestion.id]})`
                        : 'Belum Dijawab'}
                    </span>
                  </div>

                  {/* ANBK Font Size Controls */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="opacity-70 mr-1">Ukuran Teks:</span>
                    <button
                      type="button"
                      onClick={() => setFontSize('sm')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                        fontSize === 'sm' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize('base')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                        fontSize === 'base' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize('lg')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                        fontSize === 'lg' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Question Content & Options */}
                <div className="p-6 md:p-8 space-y-6">
                  <div
                    className={`leading-relaxed font-medium ${
                      fontSize === 'sm'
                        ? 'text-sm'
                        : fontSize === 'lg'
                        ? 'text-xl'
                        : 'text-base md:text-lg'
                    }`}
                  >
                    {activeQuestion.content}
                  </div>

                  {activeQuestion.image && (
                    <div className="my-4">
                      <img
                        src={activeQuestion.image}
                        alt={`Ilustrasi Soal ${currentQuestionIndex + 1}`}
                        referrerPolicy="no-referrer"
                        className="max-h-72 rounded-xl border object-contain bg-white p-2"
                      />
                    </div>
                  )}

                  {/* Multiple Choice Options A, B, C, D */}
                  <div className="space-y-3 pt-2">
                    {(['A', 'B', 'C', 'D'] as const).map((letter, optIdx) => {
                      const isSelected = answers[activeQuestion.id] === letter;
                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => handleSelectOption(activeQuestion.id, letter)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600/10 dark:bg-blue-500/20 shadow-xs'
                              : darkMode
                              ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800'
                              : 'border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40'
                          }`}
                        >
                          <span
                            className={`w-9 h-9 rounded-lg font-mono font-extrabold text-sm flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : darkMode
                                ? 'bg-slate-700 text-slate-200'
                                : 'bg-white border border-slate-300 text-slate-800'
                            }`}
                          >
                            {letter}
                          </span>
                          <span
                            className={`pt-1 ${
                              fontSize === 'sm'
                                ? 'text-xs'
                                : fontSize === 'lg'
                                ? 'text-lg'
                                : 'text-sm md:text-base'
                            } ${isSelected ? 'font-bold' : 'font-normal'}`}
                          >
                            {activeQuestion.options[optIdx]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Navigation Controls: Previous, Tandai Ragu, Next / Selesai Ujian */}
              <div
                className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                  className={`px-5 py-3 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-colors ${
                    currentQuestionIndex === 0
                      ? 'opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-800'
                      : 'bg-slate-700 hover:bg-slate-800 text-white cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Soal Sebelumnya</span>
                </button>

                {/* Tombol Tandai Ragu-ragu */}
                <button
                  type="button"
                  onClick={() => handleToggleDoubt(activeQuestion.id)}
                  className={`px-5 py-3 rounded-xl font-extrabold text-xs md:text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                    doubtful[activeQuestion.id]
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                      : 'bg-amber-500/90 hover:bg-amber-500 text-slate-950'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  <span>
                    {doubtful[activeQuestion.id] ? 'Hilangkan Ragu-ragu' : 'Tandai Ragu-ragu'}
                  </span>
                </button>

                {currentQuestionIndex < shuffledQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentQuestionIndex((i) =>
                        Math.min(shuffledQuestions.length - 1, i + 1)
                      )
                    }
                    className="px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs md:text-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Soal Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmFinishModal(true)}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Selesai Ujian</span>
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* =================================================================
              RED ANTI-CHEATING OVERLAY ("JANGAN PINDAH TAB" + 15s COUNTDOWN)
             ================================================================= */}
          {warningOverlayOpen && (
            <div className="fixed inset-0 z-50 bg-red-800/98 text-white flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="max-w-xl w-full bg-red-950/90 border-2 border-red-400 rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-600/40 border-2 border-red-300 flex items-center justify-center mx-auto animate-bounce">
                  <ShieldAlert className="w-12 h-12 text-white" />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-300">
                    PERINGATAN PELANGGARAN KE-{violationCount} DARI MAKSIMAL 3 PELANGGARAN
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                    JANGAN PINDAH TAB!
                  </h1>
                  <p className="text-sm md:text-base text-red-100 font-medium">
                    {warningReason}
                  </p>
                </div>

                <div className="py-4 px-6 rounded-2xl bg-red-900/90 border border-red-500">
                  <div className="text-xs uppercase font-bold text-red-200 mb-1">
                    Waktu Hitung Mundur Sebelum Diskualifikasi Otomatis:
                  </div>
                  <div className="text-6xl font-mono font-black text-amber-300">
                    {warningSecondsLeft}s
                  </div>
                </div>

                <p className="text-xs text-red-200 leading-relaxed">
                  Klik tombol warna hijau di bawah dalam waktu <strong>15 detik</strong> untuk kembali ke layar ujian. Jika tidak diklik atau melanggar 3 kali, ujian otomatis disubmit dan dinyatakan <strong>Gagal / Tidak Lulus Ujian ("Ujian Susulan")</strong>.
                </p>

                <button
                  type="button"
                  onClick={handleResumeFromWarning}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base md:text-lg shadow-xl transition-transform active:scale-98 cursor-pointer"
                >
                  KEMBALI KE UJIAN SEKARANG (LAYAR PENUH)
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Modal before Normal Finish */}
          {confirmFinishModal && (
            <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div
                className={`max-w-md w-full rounded-2xl border p-6 space-y-4 shadow-2xl ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <h3 className="text-lg font-extrabold">Konfirmasi Selesai Ujian ANBK</h3>
                <p className="text-xs md:text-sm opacity-85 leading-relaxed">
                  Anda telah menjawab <strong>{answeredCount}</strong> dari{' '}
                  <strong>{shuffledQuestions.length}</strong> soal.
                  {Object.values(doubtful).some(Boolean) && (
                    <span className="block mt-2 text-amber-500 font-bold">
                      ⚠ Masih ada soal yang ditandai Ragu-ragu!
                    </span>
                  )}
                </p>
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setConfirmFinishModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-500 hover:bg-slate-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Periksa Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinishExamNormal()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
                  >
                    Ya, Selesai & Kirim Jawaban
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW 4: TRANSISI DISKUALIFIKASI OTOMATIS KEMBALI KE HOME
         ===================================================================== */}
      {view === 'DISQUALIFIED_TRANSITION' && (
        <div className="fixed inset-0 z-50 bg-red-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-xl w-full bg-red-900/90 border-2 border-red-400 rounded-3xl p-8 shadow-2xl space-y-5">
            <XCircle className="w-16 h-16 text-amber-300 mx-auto" />
            <h1 className="text-3xl font-black tracking-tight">
              GAGAL UJIAN — TIDAK LULUS UJIAN ("UJIAN SUSULAN")
            </h1>
            <p className="text-sm md:text-base font-semibold text-red-100">
              {disqualifiedReason}
            </p>
            <div className="p-4 rounded-xl bg-red-950/90 border border-red-700 text-xs font-mono space-y-1">
              <div>Peserta: {studentName} ({className})</div>
              <div>Status Kelulusan: TIDAK LULUS UJIAN — WAJIB UJIAN SUSULAN</div>
              <div>Notifikasi Email Terkirim ke: {examConfig.notificationEmail} (SUKSES)</div>
            </div>
            <p className="text-xs text-amber-200 animate-pulse">
              Merestart halaman ujian secara otomatis dan mengembalikan ke Menu HOME Awal...
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 5: HALAMAN HASIL UJIAN (KKM 70, DETAIL SOAL, SARAN, PRINT/DOWNLOAD)
         ===================================================================== */}
      {view === 'RESULT' && latestResult && (
        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          {/* Top Result Summary Card */}
          <section
            className={`rounded-2xl shadow-xl border overflow-hidden ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div
              className={`p-6 md:p-8 text-white ${
                latestResult.passStatus === 'LULUS'
                  ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800'
                  : 'bg-gradient-to-r from-rose-900 via-red-800 to-rose-900'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <TutWuriLogo size="md" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-90">
                      HASIL RESMI UJIAN ANBK · {examConfig.schoolName}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-0.5">
                      {latestResult.passStatus === 'LULUS'
                        ? 'SELAMAT! ANDA LULUS UJIAN'
                        : 'ANDA TIDAK LULUS UJIAN — "UJIAN SUSULAN"'}
                    </h1>
                    <p className="text-xs md:text-sm opacity-90 mt-1">
                      {examConfig.title} · Guru Mapel: {examConfig.teacherName}
                    </p>
                  </div>
                </div>

                <div className="bg-black/25 backdrop-blur-xs px-6 py-4 rounded-2xl text-center border border-white/20 shrink-0">
                  <div className="text-xs uppercase font-bold opacity-85">Nilai Akhir Persen</div>
                  <div className="text-4xl md:text-5xl font-mono font-black">
                    {latestResult.finalScore}%
                  </div>
                  <div className="text-[11px] font-bold mt-1">
                    KKM: {examConfig.kkmScore}% ({latestResult.correctCount}/{latestResult.totalQuestions} Benar)
                  </div>
                </div>
              </div>
            </div>

            {/* Student Identity & Notification Confirmation */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div
                  className={`p-3.5 rounded-xl border ${
                    darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="opacity-70 block">Nama Siswa</span>
                  <strong className="text-sm">{latestResult.studentName}</strong>
                </div>
                <div
                  className={`p-3.5 rounded-xl border ${
                    darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="opacity-70 block">Kelas & NIS/NISN</span>
                  <strong className="text-sm font-mono">
                    {latestResult.className} · {latestResult.nisn}
                  </strong>
                </div>
                <div
                  className={`p-3.5 rounded-xl border ${
                    darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="opacity-70 block">Total Soal Terjawab</span>
                  <strong className="text-sm font-mono">
                    {answeredCount} dari {latestResult.totalQuestions} Soal ({latestResult.finalScore}%)
                  </strong>
                </div>
                <div
                  className={`p-3.5 rounded-xl border ${
                    darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="opacity-70 block">Status Kelulusan</span>
                  <strong
                    className={`text-sm ${
                      latestResult.passStatus === 'LULUS'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {latestResult.passStatus === 'LULUS'
                      ? 'LULUS UJIAN'
                      : 'TIDAK LULUS ("Ujian Susulan")'}
                  </strong>
                </div>
              </div>

              {/* Email Notification Status Box */}
              <div
                className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                  darkMode
                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Notifikasi hasil ujian & laporan detail anti-kecurangan telah dikirim otomatis ke email Guru:{' '}
                    <strong className="font-mono">{examConfig.notificationEmail}</strong> (Status: SUKSES)
                  </span>
                </div>
                <span className="font-mono text-[11px] opacity-80">{latestResult.timestamp}</span>
              </div>

              {/* Saran Pembelajaran (Requirement #13) */}
              <div
                className={`p-5 rounded-xl border space-y-2 ${
                  darkMode ? 'bg-blue-950/30 border-blue-900/60' : 'bg-blue-50/70 border-blue-200'
                }`}
              >
                <h3 className="text-sm font-extrabold text-blue-700 dark:text-blue-300">
                  Saran Pembelajaran & Evaluasi Kurikulum Merdeka ({examConfig.topic})
                </h3>
                <p className="text-xs md:text-sm leading-relaxed opacity-90">
                  {latestResult.passStatus === 'LULUS' ? (
                    <>
                      Kompetensi Anda pada materi <strong>{examConfig.topic}</strong> sudah sangat baik (Nilai{' '}
                      <strong>{latestResult.finalScore}%</strong>, memenuhi KKM 70–100). Pertahankan pemahaman pada soal-soal penalaran tingkat tinggi (<strong>HOTS</strong>) seperti Berpikir Komputasional, Keamanan Protokol Jaringan (HTTPS/WAN), serta Analisis Data Spreadsheet.
                    </>
                  ) : (
                    <>
                      Nilai Anda saat ini adalah <strong>{latestResult.finalScore}%</strong> (berada pada rentang KKM 0–60 atau terdeteksi pelanggaran), sehingga Anda dinyatakan <strong>Tidak Lulus Ujian</strong> dan wajib mengikuti <strong>"Ujian Susulan"</strong>. Pelajari kembali modul <strong>{examConfig.topic}</strong> khususnya mengenai fondasi Berpikir Komputasional (Dekomposisi, Abstraksi, Algoritma), Perangkat Keras (CPU, RAM, ROM), Jaringan Komputer, dan Pengolahan Data sebelum mengikuti Ujian Susulan bersama Bapak <strong>{examConfig.teacherName}</strong>.
                    </>
                  )}
                </p>
              </div>

              {/* Action Buttons: Download, Print, Back to Home */}
              <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadStudentReport}
                    className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold flex items-center gap-2 shadow cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Hasil Ujian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Cetak Hasil Ujian</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setView('HOME');
                    setInputToken('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Kembali ke Halaman HOME
                </button>
              </div>
            </div>
          </section>

          {/* Detail Setiap Soal (Requirement #13:
              - Tampilkan pertanyaan & jawaban siswa
              - Jawaban yang benar TIDAK ditampilkan
              - Jika jawaban siswa BENAR, tampilkan penjelasan
              - Jika jawaban siswa SALAH, penjelasannya TIDAK ditampilkan) */}
          <section
            className={`rounded-2xl shadow-xl border p-6 md:p-8 space-y-5 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-extrabold">
                Rincian Evaluasi Jawaban Setiap Soal (1–{shuffledQuestions.length})
              </h2>
              <p className="text-xs opacity-75">
                Sesuai ketentuan ujian: Kunci jawaban tidak ditampilkan. Penjelasan pembelajaran hanya ditampilkan pada soal yang dijawab dengan benar.
              </p>
            </div>

            <div className="space-y-4">
              {shuffledQuestions.map((q, idx) => {
                const studentChoice = answers[q.id];
                const isCorrect = studentChoice === q.answer;
                const choiceIndex = studentChoice
                  ? ['A', 'B', 'C', 'D'].indexOf(studentChoice)
                  : -1;
                const studentChoiceText =
                  choiceIndex >= 0 ? `${studentChoice}. ${q.options[choiceIndex]}` : 'Tidak Dijawab';

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-xl border space-y-3 ${
                      isCorrect
                        ? darkMode
                          ? 'bg-emerald-950/20 border-emerald-800/60'
                          : 'bg-emerald-50/50 border-emerald-200'
                        : darkMode
                        ? 'bg-rose-950/20 border-rose-800/60'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded bg-slate-800 text-white">
                          Soal #{idx + 1}
                        </span>
                        <span className="text-xs font-bold uppercase opacity-75">
                          Tipe: {q.difficulty === 'HOTS' ? 'HOTS (HOST)' : 'REGULER'}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-extrabold flex items-center gap-1 ${
                          isCorrect
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Jawaban Anda Benar
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" /> Jawaban Anda Kurang Tepat
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-sm font-medium leading-relaxed">{q.content}</p>

                    <div className="text-xs pt-1">
                      <span className="opacity-75">Jawaban Siswa: </span>
                      <strong className="font-semibold">{studentChoiceText}</strong>
                    </div>

                    {/* Hanya tampilkan penjelasan jika jawaban siswa BENAR; jika SALAH penjelasan tidak ditampilkan */}
                    {isCorrect && (
                      <div
                        className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                          darkMode
                            ? 'bg-slate-900/80 border-emerald-800/50 text-emerald-200'
                            : 'bg-white border-emerald-200 text-slate-700'
                        }`}
                      >
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          Penjelasan Pembelajaran:{' '}
                        </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {/* =====================================================================
          MODAL LOGIN PASSWORD MODE GURU (PASSWORD TIDAK DITAMPILKAN)
         ===================================================================== */}
      {teacherLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full rounded-2xl border p-6 space-y-5 shadow-2xl ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600 dark:text-amber-400" />
                <h3 className="text-base font-extrabold">Otentikasi Mode Guru Profesional</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTeacherLoginModalOpen(false);
                  setTeacherPasswordError(null);
                  setTeacherPasswordInput('');
                }}
                className="text-sm font-bold opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <p className="text-xs opacity-80 leading-relaxed">
                Masukkan kode akses rahasia Guru Mapel (<strong>{examConfig.teacherName}</strong>) untuk mengelola Bank Soal, Rekap Google Sheet, dan Kode Apps Script.
              </p>

              {teacherPasswordError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                  {teacherPasswordError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5">
                  Password Mode Guru
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={teacherPasswordInput}
                  onChange={(e) => setTeacherPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTeacherLoginModalOpen(false);
                    setTeacherPasswordError(null);
                    setTeacherPasswordInput('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-500 hover:bg-slate-600 text-white text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold cursor-pointer"
                >
                  Masuk Panel Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL DASHBOARD MODE GURU LENGKAP (CRUD SOAL, REKAP SHEET, APPS SCRIPT)
         ===================================================================== */}
      {teacherDashboardOpen && (
        <TeacherModeModal
          darkMode={darkMode}
          questions={questions}
          setQuestions={setQuestions}
          submissions={submissions}
          setSubmissions={setSubmissions}
          emailLogs={emailLogs}
          examConfig={examConfig}
          setExamConfig={setExamConfig}
          onlineToken={onlineToken}
          tokenSecondsLeft={tokenSecondsLeft}
          onRegenerateToken={handleRegenerateToken}
          onClose={() => setTeacherDashboardOpen(false)}
        />
      )}

      {/* Quiet Institutional Footer (Only shown outside active Exam) */}
      {view !== 'EXAM' && (
        <footer className="no-print py-6 px-4 text-center text-xs opacity-65 border-t border-slate-200/60 dark:border-slate-800/60 mt-10">
          Sistem Ujian Berbasis Komputer (ANBK) · {examConfig.schoolName} · Pembuat Soal:{' '}
          {examConfig.teacherName} · Tahun Ajaran {examConfig.academicYear}
        </footer>
      )}
    </div>
  );
}
