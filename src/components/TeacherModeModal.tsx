import React, { useState } from 'react';
import {
  Question,
  interfaceSubmissionRecord,
  EmailNotificationLog,
  ExamConfig,
  INITIAL_QUESTIONS,
  BAB4_SISTEM_KOMPUTER_QUESTIONS,
  CLASS_OPTIONS
} from '../data/examData';
import { generateCodeGs, generateSingleFileIndexHtml } from '../data/appsScriptTemplate';
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Download,
  Copy,
  FileText,
  Table,
  Code2,
  Mail,
  ExternalLink,
  Image as ImageIcon,
  RefreshCw,
  BookOpen,
  ShieldAlert,
  Save
} from 'lucide-react';

interface TeacherModeModalProps {
  darkMode: boolean;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  submissions: interfaceSubmissionRecord[];
  setSubmissions: React.Dispatch<React.SetStateAction<interfaceSubmissionRecord[]>>;
  emailLogs: EmailNotificationLog[];
  examConfig: ExamConfig;
  setExamConfig: React.Dispatch<React.SetStateAction<ExamConfig>>;
  onlineToken: string;
  tokenSecondsLeft: number;
  onRegenerateToken: () => void;
  onClose: () => void;
}

export const TeacherModeModal: React.FC<TeacherModeModalProps> = ({
  darkMode,
  questions,
  setQuestions,
  submissions,
  setSubmissions,
  emailLogs,
  examConfig,
  setExamConfig,
  onlineToken,
  tokenSecondsLeft,
  onRegenerateToken,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'rekap' | 'emails' | 'appscript' | 'links'>('questions');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Inline editing state for Rekap Spreadsheet table
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowDraft, setEditRowDraft] = useState<interfaceSubmissionRecord | null>(null);
  const [classFilter, setClassFilter] = useState<string>('ALL');

  // Word / Google Doc parser modal state
  const [rawDocText, setRawDocText] = useState('');
  const [showDocImporter, setShowDocImporter] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const showTempBanner = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 3500);
  };

  const handleStartAddQuestion = () => {
    const nextId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    setEditingQuestion({
      id: nextId,
      content: '',
      image: null,
      options: ['', '', '', ''],
      answer: 'A',
      difficulty: 'HOTS',
      explanation: ''
    });
    setIsAddingNew(true);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;
    if (!editingQuestion.content.trim()) {
      showTempBanner('Pertanyaan soal tidak boleh kosong!');
      return;
    }
    if (isAddingNew) {
      setQuestions((prev) => [...prev, editingQuestion]);
      showTempBanner(`Soal #${editingQuestion.id} berhasil ditambahkan.`);
    } else {
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestion.id ? editingQuestion : q))
      );
      showTempBanner(`Soal #${editingQuestion.id} berhasil diperbarui.`);
    }
    setEditingQuestion(null);
    setIsAddingNew(false);
  };

  const handleDeleteQuestion = (id: number) => {
    setQuestions((prev) =>
      prev.filter((q) => q.id !== id).map((q, index) => ({ ...q, id: index + 1 }))
    );
    showTempBanner(`Soal #${id} telah dihapus dan nomor diurutkan ulang.`);
  };

  const handleParseWordDocText = () => {
    if (!rawDocText.trim()) return;
    const lines = rawDocText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsedQuestions: Question[] = [];
    let currentQ: Partial<Question> | null = null;
    let currentOptions: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^KUNCI JAWABAN/i.test(line)) break;
      const optMatch = line.match(/^([A-D])[\.\)]\s*(.+)$/i);
      if (optMatch) {
        currentOptions.push(optMatch[2].trim());
        if (currentOptions.length === 4 && currentQ) {
          parsedQuestions.push({
            id: parsedQuestions.length + 1,
            content: currentQ.content || 'Pertanyaan Soal',
            image: null,
            options: [
              currentOptions[0] || 'Pilihan A',
              currentOptions[1] || 'Pilihan B',
              currentOptions[2] || 'Pilihan C',
              currentOptions[3] || 'Pilihan D'
            ],
            answer: 'A',
            difficulty: parsedQuestions.length % 2 === 0 ? 'HOTS' : 'REGULER',
            explanation: 'Pembahasan sesuai materi Kurikulum Merdeka Informatika SMP.'
          });
          currentQ = null;
          currentOptions = [];
        }
      } else if (!/^(SOAL UJIAN|PENILAIAN|MATA PELAJARAN|E\.)/i.test(line)) {
        const cleanQuestion = line.replace(/^\d+[\.\)]\s*/, '');
        currentQ = { content: cleanQuestion };
        currentOptions = [];
      }
    }

    if (parsedQuestions.length > 0) {
      setQuestions(parsedQuestions);
      setShowDocImporter(false);
      setRawDocText('');
      showTempBanner(`Berhasil mengimpor ${parsedQuestions.length} soal dari teks Google Dokumen / Word!`);
    } else {
      showTempBanner('Format teks belum terdeteksi. Pastikan setiap soal memiliki pilihan A. B. C. D.');
    }
  };

  // Spreadsheet Rekap Inline Edit Handlers
  const handleStartEditRow = (rec: interfaceSubmissionRecord) => {
    setEditingRowId(rec.id);
    setEditRowDraft({ ...rec });
  };

  const handleSaveRowEdit = () => {
    if (!editRowDraft) return;
    setSubmissions((prev) =>
      prev.map((item) => (item.id === editRowDraft.id ? editRowDraft : item))
    );
    setEditingRowId(null);
    setEditRowDraft(null);
    showTempBanner('Data jawaban siswa di Rekap Google Sheet berhasil diperbarui.');
  };

  const handleDeleteRow = (id: string) => {
    setSubmissions((prev) => prev.filter((r) => r.id !== id));
    showTempBanner('Baris data rekap siswa berhasil dihapus.');
  };

  const handleExportCsv = () => {
    const headers = [
      'Timestamp',
      'Nama Siswa',
      'NIS/NISN',
      'Kelas',
      'Skor Benar',
      'Total Soal',
      'Nilai Akhir',
      'Status Kecurangan',
      'Lulus/Tidak Lulus'
    ];
    const rows = submissions.map((s) => [
      `"${s.timestamp}"`,
      `"${s.studentName.replace(/"/g, '""')}"`,
      `"${s.nisn.replace(/"/g, '""')}"`,
      `"${s.className}"`,
      s.correctCount,
      s.totalQuestions,
      s.finalScore,
      `"${s.cheatStatus.replace(/"/g, '""')}"`,
      `"${s.passStatus}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Hasil_Ujian_ANBK_Informatika_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = (type: 'gs' | 'html') => {
    const code =
      type === 'gs'
        ? generateCodeGs(questions, examConfig)
        : generateSingleFileIndexHtml(questions, examConfig);
    navigator.clipboard.writeText(code);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSubmissions =
    classFilter === 'ALL'
      ? submissions
      : submissions.filter((s) => s.className === classFilter);

  const hotsCount = questions.filter((q) => q.difficulty === 'HOTS').length;
  const regulerCount = questions.filter((q) => q.difficulty === 'REGULER').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-6 overflow-y-auto">
      <div
        className={`w-full max-w-7xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[94vh] ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header */}
        <div className="bg-blue-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-blue-900">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-lg tracking-tight">
                PANEL ADMINISTRATOR MODE GURU — ANBK INFORMATIKA
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              {examConfig.schoolName} · Pembuat Soal: {examConfig.teacherName} · Token Aktif:{' '}
              <span className="font-mono font-bold text-amber-300">{onlineToken}</span> ({Math.floor(tokenSecondsLeft / 60)}m {tokenSecondsLeft % 60}s)
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onRegenerateToken}
              className="px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Acak Token Baru
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" /> Tutup Mode Guru
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusBanner && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between">
            <span>✓ {statusBanner}</span>
            <button onClick={() => setStatusBanner(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div
          className={`px-6 py-3 border-b flex flex-wrap items-center gap-2 ${
            darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-blue-700 text-white shadow-sm'
                : darkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Kelola Bank Soal ({questions.length} Soal: {hotsCount} HOTS · {regulerCount} Reguler)
          </button>

          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'rekap'
                ? 'bg-blue-700 text-white shadow-sm'
                : darkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Table className="w-4 h-4" />
            Rekap Hasil Ujian & Google Sheet ({submissions.length} Data)
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'links'
                ? 'bg-blue-700 text-white shadow-sm'
                : darkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <FileText className="w-4 h-4" />
            Link Google Dokumen & Spreadsheet
          </button>

          <button
            onClick={() => setActiveTab('emails')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'emails'
                ? 'bg-blue-700 text-white shadow-sm'
                : darkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Mail className="w-4 h-4" />
            Notifikasi Email ({emailLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('appscript')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'appscript'
                ? 'bg-emerald-700 text-white shadow-sm'
                : darkMode
                ? 'text-emerald-400 hover:bg-slate-800'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Kode Siap Pakai (Code.gs + 1 index.html) & Petunjuk
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: KELOLA SOAL */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">
                    Daftar Soal Ujian Informatika (Mendukung Gambar URL, Pilihan A-D, Kunci & Penjelasan)
                  </h3>
                  <p className="text-xs opacity-75">
                    Komposisi saat ini: {hotsCount} Soal HOTS & {regulerCount} Soal REGULER · Total {questions.length} Soal
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setQuestions(INITIAL_QUESTIONS);
                      showTempBanner('Paket Soal Google Dokumen (10 Soal: 5 HOTS & 5 Reguler) berhasil dimuat.');
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                      darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Muat Soal Dokumen Utama
                  </button>
                  <button
                    onClick={() => {
                      setQuestions(BAB4_SISTEM_KOMPUTER_QUESTIONS);
                      showTempBanner('Paket Soal Sistem Informatika Bab 4 Kelas VII (5 HOTS & 5 Reguler) berhasil dimuat.');
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                      darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Muat Soal Bab 4 Sistem Komputer VII
                  </button>
                  <button
                    onClick={() => setShowDocImporter(!showDocImporter)}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Impor Teks dari Word / Google Docs
                  </button>
                  <button
                    onClick={handleStartAddQuestion}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Tambah Soal Baru
                  </button>
                </div>
              </div>

              {/* Importer Box */}
              {showDocImporter && (
                <div
                  className={`p-4 rounded-xl border ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-indigo-50/60 border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">
                      Salin & Tempel (Copy-Paste) Naskah Soal dari Microsoft Word / Google Dokumen:
                    </span>
                    <button
                      onClick={() => setShowDocImporter(false)}
                      className="text-xs font-semibold opacity-70 hover:opacity-100"
                    >
                      Tutup
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={rawDocText}
                    onChange={(e) => setRawDocText(e.target.value)}
                    placeholder="Tempel soal beserta opsi A. B. C. D. dari Google Dokumen atau Microsoft Word di sini..."
                    className={`w-full p-3 rounded-lg border text-xs font-mono mb-3 ${
                      darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                    }`}
                  />
                  <button
                    onClick={handleParseWordDocText}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Proses & Masukkan ke Bank Soal
                  </button>
                </div>
              )}

              {/* Question Form Modal / Editor */}
              {editingQuestion && (
                <div
                  className={`p-6 rounded-xl border-2 border-blue-600 space-y-4 ${
                    darkMode ? 'bg-slate-800/90' : 'bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">
                      {isAddingNew ? `Tambah Soal Baru (#${editingQuestion.id})` : `Edit Soal Nomor #${editingQuestion.id}`}
                    </h4>
                    <button
                      onClick={() => {
                        setEditingQuestion(null);
                        setIsAddingNew(false);
                      }}
                      className="text-xs font-bold text-rose-500 hover:underline"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold mb-1">Pertanyaan Soal</label>
                      <textarea
                        rows={3}
                        value={editingQuestion.content}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion, content: e.target.value })
                        }
                        className={`w-full p-3 rounded-lg border text-sm ${
                          darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                        }`}
                        placeholder="Tuliskan isi pertanyaan soal dengan jelas..."
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">
                          Bentuk / Tingkat Kesulitan Soal
                        </label>
                        <select
                          value={editingQuestion.difficulty}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              difficulty: e.target.value as 'REGULER' | 'HOTS'
                            })
                          }
                          className={`w-full p-2.5 rounded-lg border text-sm font-bold ${
                            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                          }`}
                        >
                          <option value="REGULER">REGULER</option>
                          <option value="HOTS">HOTS (Higher Order Thinking Skills)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Kunci Jawaban Benar</label>
                        <select
                          value={editingQuestion.answer}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              answer: e.target.value as 'A' | 'B' | 'C' | 'D'
                            })
                          }
                          className={`w-full p-2.5 rounded-lg border text-sm font-bold ${
                            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                          }`}
                        >
                          <option value="A">Pilihan A</option>
                          <option value="B">Pilihan B</option>
                          <option value="C">Pilihan C</option>
                          <option value="D">Pilihan D</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Image URL Input */}
                  <div>
                    <label className="block text-xs font-bold mb-1 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> Link URL Gambar Soal (Opsional - kosongkan jika tanpa gambar)
                    </label>
                    <input
                      type="url"
                      value={editingQuestion.image || ''}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          image: e.target.value.trim() ? e.target.value : null
                        })
                      }
                      placeholder="https://contoh.com/gambar-perangkat-keras.png"
                      className={`w-full p-2.5 rounded-lg border text-sm ${
                        darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                      }`}
                    />
                    {editingQuestion.image && (
                      <div className="mt-2">
                        <img
                          src={editingQuestion.image}
                          alt="Preview Soal"
                          referrerPolicy="no-referrer"
                          className="max-h-36 rounded-lg border object-contain bg-white p-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* Options A, B, C, D */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => (
                      <div key={letter}>
                        <label className="block text-xs font-bold mb-1">Pilihan {letter}</label>
                        <input
                          type="text"
                          value={editingQuestion.options[idx]}
                          onChange={(e) => {
                            const updated: [string, string, string, string] = [
                              ...editingQuestion.options
                            ] as [string, string, string, string];
                            updated[idx] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: updated });
                          }}
                          className={`w-full p-2.5 rounded-lg border text-sm ${
                            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                          }`}
                          placeholder={`Teks Pilihan ${letter}`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Penjelasan Jawaban (Untuk Pembelajaran Siswa)
                    </label>
                    <textarea
                      rows={2}
                      value={editingQuestion.explanation}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                      }
                      className={`w-full p-2.5 rounded-lg border text-sm ${
                        darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                      }`}
                      placeholder="Tuliskan penjelasan mengapa kunci jawaban tersebut benar..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleSaveQuestion}
                      className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Simpan Soal
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`p-5 rounded-xl border transition-colors ${
                      darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold">
                          Tipe Soal:{' '}
                          <span
                            className={
                              q.difficulty === 'HOTS' ? 'text-rose-500 font-extrabold' : 'text-blue-500 font-extrabold'
                            }
                          >
                            {q.difficulty === 'HOTS' ? 'HOTS (HOST)' : 'REGULER'}
                          </span>
                        </span>
                        <span className="text-xs opacity-40">·</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Kunci Jawaban: {q.answer}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingQuestion({ ...q });
                            setIsAddingNew(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>

                    <p className="text-sm font-medium mb-3 leading-relaxed">{q.content}</p>

                    {q.image && (
                      <div className="mb-3">
                        <img
                          src={q.image}
                          alt={`Soal ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="max-h-40 rounded-lg border object-contain bg-white p-1"
                        />
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-2 mb-3 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map((letter, oIdx) => {
                        const isCorrect = q.answer === letter;
                        return (
                          <div
                            key={letter}
                            className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300'
                                : darkMode
                                ? 'border-slate-800 bg-slate-900/50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <span className="font-mono font-bold">{letter}.</span>
                            <span>{q.options[oIdx]}</span>
                            {isCorrect && <Check className="w-4 h-4 ml-auto shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    <div
                      className={`text-xs p-3 rounded-lg border ${
                        darkMode
                          ? 'bg-slate-900/70 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <strong className="text-slate-900 dark:text-white">Penjelasan Pembelajaran: </strong>
                      {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: REKAP HASIL UJIAN (GOOGLE SHEET EDITOR) */}
          {activeTab === 'rekap' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">
                    Rekap Hasil Ujian Siswa (Sinkronisasi Struktur Kolom Google Sheet)
                  </h3>
                  <p className="text-xs opacity-75">
                    Header Kolom Persis: Timestamp, Nama Siswa, NIS/NISN, Kelas, Skor Benar, Total Soal, Nilai Akhir, Status Kecurangan, Lulus/Tidak Lulus
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                    }`}
                  >
                    <option value="ALL">Semua Kelas ({submissions.length})</option>
                    {CLASS_OPTIONS.map((cls) => (
                      <option key={cls} value={cls}>
                        Kelas {cls}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleExportCsv}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download CSV / Google Sheet
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-blue-950 text-white font-bold">
                      <th className="p-3 border-r border-blue-900">Timestamp</th>
                      <th className="p-3 border-r border-blue-900">Nama Siswa</th>
                      <th className="p-3 border-r border-blue-900">NIS/NISN</th>
                      <th className="p-3 border-r border-blue-900">Kelas</th>
                      <th className="p-3 border-r border-blue-900 text-center">Skor Benar</th>
                      <th className="p-3 border-r border-blue-900 text-center">Total Soal</th>
                      <th className="p-3 border-r border-blue-900 text-center">Nilai Akhir</th>
                      <th className="p-3 border-r border-blue-900">Status Kecurangan</th>
                      <th className="p-3 border-r border-blue-900">Lulus/Tidak Lulus</th>
                      <th className="p-3 text-center">Aksi Guru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {filteredSubmissions.map((rec) => {
                      const isEditing = editingRowId === rec.id && editRowDraft;
                      return (
                        <tr
                          key={rec.id}
                          className={
                            darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                          }
                        >
                          <td className="p-2.5 whitespace-nowrap">{rec.timestamp}</td>
                          <td className="p-2.5 font-sans font-semibold">
                            {isEditing ? (
                              <input
                                value={editRowDraft.studentName}
                                onChange={(e) =>
                                  setEditRowDraft({ ...editRowDraft, studentName: e.target.value })
                                }
                                className="w-full px-2 py-1 rounded border text-xs"
                              />
                            ) : (
                              rec.studentName
                            )}
                          </td>
                          <td className="p-2.5">
                            {isEditing ? (
                              <input
                                value={editRowDraft.nisn}
                                onChange={(e) =>
                                  setEditRowDraft({ ...editRowDraft, nisn: e.target.value })
                                }
                                className="w-24 px-2 py-1 rounded border text-xs"
                              />
                            ) : (
                              rec.nisn
                            )}
                          </td>
                          <td className="p-2.5">
                            {isEditing ? (
                              <select
                                value={editRowDraft.className}
                                onChange={(e) =>
                                  setEditRowDraft({ ...editRowDraft, className: e.target.value })
                                }
                                className="px-2 py-1 rounded border text-xs"
                              >
                                {CLASS_OPTIONS.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              rec.className
                            )}
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                max={editRowDraft.totalQuestions}
                                value={editRowDraft.correctCount}
                                onChange={(e) => {
                                  const cc = Number(e.target.value);
                                  const fs = Math.round((cc / editRowDraft.totalQuestions) * 100);
                                  setEditRowDraft({
                                    ...editRowDraft,
                                    correctCount: cc,
                                    finalScore: fs,
                                    passStatus: fs >= 70 ? 'LULUS' : 'TIDAK LULUS'
                                  });
                                }}
                                className="w-14 px-1 py-1 rounded border text-center text-xs"
                              />
                            ) : (
                              rec.correctCount
                            )}
                          </td>
                          <td className="p-2.5 text-center">{rec.totalQuestions}</td>
                          <td className="p-2.5 text-center font-extrabold">
                            {isEditing ? editRowDraft.finalScore : rec.finalScore}
                          </td>
                          <td className="p-2.5 font-sans max-w-xs">
                            {isEditing ? (
                              <input
                                value={editRowDraft.cheatStatus}
                                onChange={(e) =>
                                  setEditRowDraft({ ...editRowDraft, cheatStatus: e.target.value })
                                }
                                className="w-full px-2 py-1 rounded border text-xs"
                              />
                            ) : (
                              <span
                                className={
                                  rec.cheatStatus.toLowerCase().includes('diskualifikasi')
                                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }
                              >
                                {rec.cheatStatus}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-sans font-bold whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={editRowDraft.passStatus}
                                onChange={(e) =>
                                  setEditRowDraft({
                                    ...editRowDraft,
                                    passStatus: e.target.value as 'LULUS' | 'TIDAK LULUS'
                                  })
                                }
                                className="px-2 py-1 rounded border text-xs"
                              >
                                <option value="LULUS">LULUS</option>
                                <option value="TIDAK LULUS">TIDAK LULUS</option>
                              </select>
                            ) : (
                              <span
                                className={
                                  rec.passStatus === 'LULUS'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }
                              >
                                {rec.passStatus === 'LULUS' ? 'LULUS' : 'TIDAK LULUS (Ujian Susulan)'}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap font-sans">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={handleSaveRowEdit}
                                  className="p-1.5 rounded bg-emerald-600 text-white"
                                  title="Simpan"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingRowId(null);
                                    setEditRowDraft(null);
                                  }}
                                  className="p-1.5 rounded bg-slate-500 text-white"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleStartEditRow(rec)}
                                  className="p-1.5 rounded bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white"
                                  title="Edit Data Siswa"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRow(rec.id)}
                                  className="p-1.5 rounded bg-rose-600/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white"
                                  title="Hapus Baris"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LINK GOOGLE DOKUMEN & GOOGLE SHEET */}
          {activeTab === 'links' && (
            <div className="max-w-3xl space-y-5">
              <h3 className="text-base font-bold">
                Konfigurasi Integrasi Google Dokumen, Google Sheet & Apps Script Data SDK
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Link Google Dokumen (Sumber Soal Ujian Informatika)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={examConfig.googleDocUrl}
                      onChange={(e) =>
                        setExamConfig({ ...examConfig, googleDocUrl: e.target.value })
                      }
                      placeholder="https://docs.google.com/document/d/.../edit"
                      className={`flex-1 p-2.5 rounded-lg border text-sm ${
                        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                      }`}
                    />
                    <a
                      href={examConfig.googleDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" /> Buka Google Doc
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Link Google Sheet (Rekap Hasil Ujian Siswa)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={examConfig.googleSheetUrl}
                      onChange={(e) =>
                        setExamConfig({ ...examConfig, googleSheetUrl: e.target.value })
                      }
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      className={`flex-1 p-2.5 rounded-lg border text-sm ${
                        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                      }`}
                    />
                    <a
                      href={examConfig.googleSheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" /> Buka Google Sheet
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    URL Web App Google Apps Script (Opsional - Untuk Auto-Sync Langsung dari Web Ini ke Sheet Anda)
                  </label>
                  <input
                    type="url"
                    value={examConfig.appsScriptWebAppUrl}
                    onChange={(e) =>
                      setExamConfig({ ...examConfig, appsScriptWebAppUrl: e.target.value })
                    }
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className={`w-full p-2.5 rounded-lg border text-sm font-mono ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Email Penerima Notifikasi Otomatis Hasil & Kecurangan
                  </label>
                  <input
                    type="email"
                    value={examConfig.notificationEmail}
                    onChange={(e) =>
                      setExamConfig({ ...examConfig, notificationEmail: e.target.value })
                    }
                    className={`w-full p-2.5 rounded-lg border text-sm font-mono ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>

                <button
                  onClick={() => showTempBanner('Pengaturan Link Google Dokumen, Google Sheet & Email Notifikasi berhasil disimpan!')}
                  className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer"
                >
                  Simpan Konfigurasi Integrasi
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: EMAIL NOTIFICATIONS LOG */}
          {activeTab === 'emails' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold">
                  Log Pengiriman Notifikasi Email ke {examConfig.notificationEmail}
                </h3>
                <p className="text-xs opacity-75">
                  Setiap siswa yang menyelesaikan ujian atau terkena diskualifikasi kecurangan otomatis mengirimkan laporan lengkap ke{' '}
                  <span className="font-mono font-bold">{examConfig.notificationEmail}</span>.
                </p>
              </div>

              {emailLogs.length === 0 ? (
                <div className="p-8 rounded-xl border text-center text-sm opacity-75">
                  Belum ada pengiriman notifikasi pada sesi baru ini. Notifikasi akan langsung tercatat dan terkirim otomatis saat ujian selesai.
                </div>
              ) : (
                <div className="space-y-3">
                  {emailLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-xl border ${
                        darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ {log.deliveryStatus} KE: {log.recipient} · {log.timestamp}
                        </div>
                        <span className="text-xs font-mono font-bold">
                          Nilai: {log.finalScore}% ({log.passStatus})
                        </span>
                      </div>
                      <div className="text-sm font-bold mb-1">{log.subject}</div>
                      <div className="text-xs opacity-80 mb-2">
                        Peserta: <b>{log.studentName}</b> · Kelas: <b>{log.className}</b> · NIS/NISN: <b>{log.nisn}</b> · Status Keamanan: <b>{log.cheatStatus}</b>
                      </div>
                      {log.cheatDetails.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 space-y-1">
                          <div className="font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Rincian Log Pelanggaran Anti-Kecurangan:
                          </div>
                          {log.cheatDetails.map((d, i) => (
                            <div key={i} className="font-mono">
                              • {d}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GOOGLE APPS SCRIPT GENERATOR & STEP-BY-STEP GUIDE */}
          {activeTab === 'appscript' && (
            <div className="space-y-6">
              <div
                className={`p-5 rounded-xl border ${
                  darkMode ? 'bg-blue-950/40 border-blue-800' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <h3 className="text-base font-extrabold mb-2">
                  Petunjuk Cara Pemasangan di Google Apps Script & Google Sheet (Production Ready)
                </h3>
                <ol className="list-decimal pl-5 text-xs space-y-1.5 leading-relaxed">
                  <li>
                    Buka <b>Google Spreadsheet</b> rekap ujian Anda, lalu klik menu <b>Ekstensi (Extensions) &rarr; Apps Script</b>.
                  </li>
                  <li>
                    Pada file <code>Code.gs</code>, hapus kode lama lalu tempelkan (Paste) kode <b>Code.gs</b> di bawah ini. Kode ini sudah dilengkapi <b>Anti-Spam LockService</b> (mencegah pengiriman data berulang tiap detik) dan otomatis mengirim email ke <code>eksayudikasirait31@gmail.com</code>.
                  </li>
                  <li>
                    Klik tanda tambah (<b>+</b>) di sebelah <b>Files &rarr; HTML</b>, beri nama persis <code>index</code> (sehingga menjadi <code>index.html</code>), lalu tempelkan kode <b>index.html</b> tunggal di bawah ini.
                  </li>
                  <li>
                    Klik tombol <b>Terapkan (Deploy) &rarr; Deployment Baru (New deployment)</b>, pilih jenis <b>Aplikasi Web (Web app)</b>, atur <i>Execute as</i>: <b>Me (Saya)</b> dan <i>Who has access</i>: <b>Anyone (Siapa saja)</b>, lalu klik <b>Deploy</b> dan berikan izin akses (Authorize).
                  </li>
                </ol>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Code.gs Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono">1. File: Code.gs (Google Apps Script)</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyCode('gs')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedType === 'gs' ? 'Tersalin!' : 'Salin Code.gs'}
                      </button>
                      <button
                        onClick={() =>
                          handleDownloadFile('Code.gs', generateCodeGs(questions, examConfig))
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Unduh
                      </button>
                    </div>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto max-h-96 border border-slate-800">
                    {generateCodeGs(questions, examConfig)}
                  </pre>
                </div>

                {/* index.html Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono">
                      2. File: index.html (1 File Lengkap HTML + CSS + JS)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyCode('html')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedType === 'html' ? 'Tersalin!' : 'Salin index.html'}
                      </button>
                      <button
                        onClick={() =>
                          handleDownloadFile(
                            'index.html',
                            generateSingleFileIndexHtml(questions, examConfig)
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Unduh
                      </button>
                    </div>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto max-h-96 border border-slate-800">
                    {generateSingleFileIndexHtml(questions, examConfig)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
