export interface Question {
  id: number;
  content: string;
  image: string | null;
  options: [string, string, string, string];
  answer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'REGULER' | 'HOTS';
  explanation: string;
}

export interface interfaceSubmissionRecord {
  id: string;
  sessionId: string;
  timestamp: string;
  studentName: string;
  nisn: string;
  className: string;
  correctCount: number;
  totalQuestions: number;
  finalScore: number;
  cheatStatus: string;
  passStatus: 'LULUS' | 'TIDAK LULUS';
  answers?: Record<number, string>;
  cheatLogs?: string[];
  emailSentTo?: string;
}

export interface EmailNotificationLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  studentName: string;
  className: string;
  nisn: string;
  finalScore: number;
  passStatus: string;
  cheatStatus: string;
  cheatDetails: string[];
  deliveryStatus: 'SUKSES TERKIRIM';
}

export interface ExamConfig {
  title: string;
  subject: string;
  academicYear: string;
  teacherName: string;
  curriculum: string;
  gradeLevel: string;
  schoolName: string;
  topic: string;
  durationMinutes: number;
  kkmScore: number;
  notificationEmail: string;
  googleDocUrl: string;
  googleSheetUrl: string;
  appsScriptWebAppUrl: string;
}

export const DEFAULT_EXAM_CONFIG: ExamConfig = {
  title: 'SOAL INFORMATIKA KELAS VII',
  subject: 'INFORMATIKA',
  academicYear: '2026/2027',
  teacherName: 'Eksa Yudika Sirait',
  curriculum: 'Kurikulum Merdeka',
  gradeLevel: 'SMP Kelas 7',
  schoolName: 'UPTD SMP NEGERI 7 KISARAN',
  topic: 'SISTEM INFORMATIKA BAB 4 KELAS VII',
  durationMinutes: 15,
  kkmScore: 70,
  notificationEmail: 'eksayudikasirait31@gmail.com',
  googleDocUrl: 'https://docs.google.com/document/d/1ANBK_Informatika_Kelas7_SMPN7Kisaran/edit',
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1Rekap_ANBK_Informatika_SMPN7Kisaran/edit',
  appsScriptWebAppUrl: ''
};

export const CLASS_OPTIONS = ['VII-1', 'VII-2', 'VII-3', 'VII-4', 'VII-5'];

// 10 Soal Ujian dari Dokumen Word / Google Docs (5 Soal HOTS & 5 Soal REGULER)
export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 1,
    content: "Berpikir komputasional (Computational Thinking) memiliki empat fondasi utama. Manakah di bawah ini yang BUKAN merupakan fondasi berpikir komputasional?",
    image: null,
    options: [
      "Dekomposisi (Decomposition)",
      "Pengenalan Pola (Pattern Recognition)",
      "Abstraksi (Abstraction)",
      "Memorisasi (Memorization)"
    ],
    answer: "D",
    difficulty: "HOTS",
    explanation: "Empat fondasi utama berpikir komputasional adalah Dekomposisi, Pengenalan Pola, Abstraksi, dan Algoritma. Memorisasi (menghafal) bukanlah bagian dari fondasi tersebut."
  },
  {
    id: 2,
    content: "Proses memecah masalah yang kompleks menjadi bagian-bagian kecil yang lebih mudah dikelola disebut...",
    image: null,
    options: [
      "Abstraksi",
      "Dekomposisi",
      "Algoritma",
      "Pengenalan pola"
    ],
    answer: "B",
    difficulty: "REGULER",
    explanation: "Dekomposisi adalah kemampuan memecah struktur masalah yang rumit atau besar menjadi bagian-bagian kecil agar lebih mudah dianalisis."
  },
  {
    id: 3,
    content: "Perhatikan perangkat keras berikut yang berfungsi untuk memproses data dan menjalankan instruksi dari program adalah...",
    image: null,
    options: [
      "Hard Disk",
      "RAM",
      "CPU (Central Processing Unit)",
      "Flashdisk"
    ],
    answer: "C",
    difficulty: "REGULER",
    explanation: "CPU sering disebut sebagai 'otak' komputer karena berfungsi memproses instruksi dan mengontrol seluruh operasi sistem komputer."
  },
  {
    id: 4,
    content: "Jaringan komputer yang mencakup area geografis yang sangat luas, misalnya antar negara atau antar benua, disebut...",
    image: null,
    options: [
      "LAN (Local Area Network)",
      "MAN (Metropolitan Area Network)",
      "WAN (Wide Area Network)",
      "PAN (Personal Area Network)"
    ],
    answer: "C",
    difficulty: "REGULER",
    explanation: "WAN adalah jaringan komputer yang mencakup area yang sangat luas secara geografis, seperti menghubungkan jaringan antar kota, negara, atau bahkan benua (contoh utama adalah Internet)."
  },
  {
    id: 5,
    content: "Protokol yang digunakan untuk pertukaran data di World Wide Web (WWW) secara aman dengan enkripsi adalah...",
    image: null,
    options: [
      "HTTP",
      "HTTPS",
      "FTP",
      "SMTP"
    ],
    answer: "B",
    difficulty: "HOTS",
    explanation: "HTTPS (Hypertext Transfer Protocol Secure) merupakan versi aman dari HTTP yang menggunakan protokol SSL/TLS untuk mengenkripsi komunikasi data di web."
  },
  {
    id: 6,
    content: "Sebuah algoritma harus disusun secara logis dan runtut. Urutan langkah-langkah logis untuk menyelesaikan suatu masalah secara sistematis disebut...",
    image: null,
    options: [
      "Pseudocode",
      "Flowchart",
      "Algoritma",
      "Sintaks"
    ],
    answer: "C",
    difficulty: "REGULER",
    explanation: "Algoritma adalah urutan langkah-langkah logis penyelesaian masalah yang disusun secara sistematis dan terstruktur."
  },
  {
    id: 7,
    content: "Dalam pembuatan program komputer, representasi visual atau diagram alir yang menggunakan simbol-simbol standar untuk menunjukkan alur logika disebut...",
    image: null,
    options: [
      "Flowchart",
      "Pseudocode",
      "Block Diagram",
      "Source Code"
    ],
    answer: "A",
    difficulty: "HOTS",
    explanation: "Flowchart (bagan alur) adalah diagram yang menampilkan langkah-langkah dan keputusan untuk melakukan sebuah proses dari suatu program menggunakan simbol grafis."
  },
  {
    id: 8,
    content: "Perangkat lunak (software) sistem operasi yang paling banyak digunakan pada komputer pribadi (PC) saat ini adalah...",
    image: null,
    options: [
      "Microsoft Word",
      "Google Chrome",
      "Microsoft Windows",
      "Adobe Photoshop"
    ],
    answer: "C",
    difficulty: "REGULER",
    explanation: "Microsoft Windows adalah sistem operasi utama untuk komputer pribadi, sedangkan Word adalah aplikasi pengolah kata, Chrome adalah peramban, dan Photoshop adalah aplikasi pengolah gambar."
  },
  {
    id: 9,
    content: "Dalam pengolahan data menggunakan perangkat spreadsheet (seperti Microsoft Excel), fungsi yang digunakan untuk mencari nilai rata-rata dari sekumpulan data adalah...",
    image: null,
    options: [
      "SUM",
      "AVERAGE",
      "MAX",
      "COUNT"
    ],
    answer: "B",
    difficulty: "HOTS",
    explanation: "Fungsi AVERAGE digunakan untuk menghitung rata-rata aritmatika dari rentang sel tertentu, sedangkan SUM untuk penjumlahan, MAX untuk nilai tertinggi, dan COUNT untuk menghitung jumlah sel berisi angka."
  },
  {
    id: 10,
    content: "Dampak positif dari perkembangan teknologi informasi dan komunikasi (TIK) dalam bidang pendidikan adalah...",
    image: null,
    options: [
      "Meningkatnya kecanduan gadget pada anak",
      "Terbukanya akses sumber belajar digital dan e-learning yang luas",
      "Maraknya penyebaran berita palsu (hoaks)",
      "Berkurangnya interaksi sosial secara langsung"
    ],
    answer: "B",
    difficulty: "HOTS",
    explanation: "Akses belajar yang mudah, materi digital, perpustakaan online, dan kelas virtual merupakan dampak positif utama TIK di bidang pendidikan."
  }
];

// Paket Soal Tambahan Khusus Sistem Komputer Bab 4 Kelas VII (Dapat dimuat cepat dari Mode Guru)
export const BAB4_SISTEM_KOMPUTER_QUESTIONS: Question[] = [
  {
    id: 1,
    content: "Komponen sistem komputer dibagi menjadi tiga elemen utama yang saling berkaitan dan tidak dapat dipisahkan agar komputer dapat berfungsi. Ketiga komponen tersebut adalah...",
    image: null,
    options: [
      "Hardware, Software, dan Brainware",
      "Input, Process, dan Output",
      "ALU, CU, dan Register",
      "RAM, ROM, dan Harddisk"
    ],
    answer: "A",
    difficulty: "REGULER",
    explanation: "Sistem komputer terdiri dari tiga komponen utama: Perangkat Keras (Hardware), Perangkat Lunak (Software), dan Pengguna (Brainware)."
  },
  {
    id: 2,
    content: "Saat siswa mengetik tugas di aplikasi pengolah kata lalu tiba-tiba listrik padam sebelum file disimpan, data ketikan tersebut hilang. Hal ini terjadi karena data sedang berada di memori...",
    image: null,
    options: [
      "ROM (Read Only Memory)",
      "RAM (Random Access Memory)",
      "SSD (Solid State Drive)",
      "Flashdisk"
    ],
    answer: "B",
    difficulty: "HOTS",
    explanation: "RAM bersifat volatile (sementara), artinya data di dalamnya akan hilang jika aliran listrik terputus sebelum disimpan ke penyimpanan sekunder (SSD/HDD)."
  },
  {
    id: 3,
    content: "Perhatikan bagian-bagian di dalam CPU (Central Processing Unit). Bagian yang bertugas melakukan perhitungan aritmatika (penjumlahan, pengurangan) dan perbandingan logika adalah...",
    image: null,
    options: [
      "Control Unit (CU)",
      "Arithmetic Logic Unit (ALU)",
      "Memory Register",
      "Motherboard Bus"
    ],
    answer: "B",
    difficulty: "REGULER",
    explanation: "ALU (Arithmetic Logic Unit) berfungsi khusus untuk melakukan operasi perhitungan aritmatika dan pengambilan keputusan logika."
  },
  {
    id: 4,
    content: "Seorang kasir swalayan menggunakan alat pemindai kode batang (Barcode Scanner) untuk membaca harga barang secara cepat. Dalam siklus pemrosesan informasi komputer, Barcode Scanner termasuk perangkat...",
    image: null,
    options: [
      "Perangkat Keluaran (Output Device)",
      "Perangkat Pemrosesan (Processing Device)",
      "Perangkat Masukan (Input Device)",
      "Perangkat Penyimpanan (Storage Device)"
    ],
    answer: "C",
    difficulty: "HOTS",
    explanation: "Barcode Scanner memindai kode fisik menjadi data digital yang dimasukkan ke dalam komputer, sehingga termasuk perangkat masukan (Input Device)."
  },
  {
    id: 5,
    content: "Perangkat lunak yang berfungsi mengelola seluruh sumber daya perangkat keras komputer dan menyediakan layanan umum bagi aplikasi lain disebut...",
    image: null,
    options: [
      "Program Aplikasi Perkantoran",
      "Sistem Operasi (Operating System)",
      "Bahasa Pemrograman",
      "Peramban Web (Web Browser)"
    ],
    answer: "B",
    difficulty: "REGULER",
    explanation: "Sistem Operasi (seperti Windows, Linux, macOS, Android) menjembatani perangkat keras dengan program aplikasi dan pengguna."
  },
  {
    id: 6,
    content: "Komputer hanya memahami bahasa mesin berupa bilangan biner yang terdiri dari angka 0 dan 1. Jika bilangan desimal 13 dikonversikan ke dalam bilangan biner 4-bit, maka hasilnya adalah...",
    image: null,
    options: [
      "1011",
      "1101",
      "1110",
      "1001"
    ],
    answer: "B",
    difficulty: "HOTS",
    explanation: "Konversi 13 ke biner: 8 + 4 + 0 + 1 = (1×2³) + (1×2²) + (0×2¹) + (1×2⁰) = 1101."
  },
  {
    id: 7,
    content: "Manakah di bawah ini kelompok perangkat keras yang SELURUHNYA merupakan perangkat keluaran (Output Device)?",
    image: null,
    options: [
      "Monitor, Printer, Proyektor, dan Speaker",
      "Monitor, Keyboard, Mouse, dan Printer",
      "Speaker, Microphone, Webcam, dan Plotter",
      "Scanner, Proyektor, Joystick, dan Monitor"
    ],
    answer: "A",
    difficulty: "REGULER",
    explanation: "Monitor, Printer, Proyektor, dan Speaker semuanya berfungsi menampilkan atau mengeluarkan hasil pemrosesan data komputer."
  },
  {
    id: 8,
    content: "Andi ingin merakit komputer yang mampu membuka sistem operasi dan aplikasi berat dengan sangat cepat, serta tahan terhadap guncangan fisik karena tidak memiliki piringan berputar. Media penyimpanan yang paling tepat dipilih Andi adalah...",
    image: null,
    options: [
      "Hard Disk Drive (HDD)",
      "Solid State Drive (SSD)",
      "Compact Disc (CD-ROM)",
      "Floppy Disk"
    ],
    answer: "B",
    difficulty: "HOTS",
    explanation: "SSD menggunakan chip memori flash tanpa komponen mekanik berputar, sehingga jauh lebih cepat dan tahan guncangan dibanding HDD."
  },
  {
    id: 9,
    content: "Istilah 'Brainware' dalam sistem informatika merujuk pada...",
    image: null,
    options: [
      "Kecerdasan buatan yang tertanam di dalam prosesor",
      "Manusia yang mengoperasikan, mengelola, atau mengembangkan sistem komputer",
      "Program antivirus yang melindungi sistem operasi",
      "Memori cadangan yang tersimpan di penyimpanan awan (Cloud)"
    ],
    answer: "B",
    difficulty: "REGULER",
    explanation: "Brainware adalah manusia/pengguna (seperti programmer, operator, teknisi, siswa) yang menggunakan dan mengendalikan sistem komputer."
  },
  {
    id: 10,
    content: "Ketika kamu menyalakan komputer, sebelum sistem operasi Windows atau Linux tampil, terdapat program dasar yang tersimpan permanen di chip motherboard untuk mengecek kesiapan perangkat keras. Program tersebut disimpan di dalam...",
    image: null,
    options: [
      "RAM (Random Access Memory)",
      "ROM / BIOS (Read Only Memory)",
      "Cache Memory L1",
      "Virtual Memory"
    ],
    answer: "B",
    difficulty: "HOTS",
    explanation: "ROM menyimpan instruksi BIOS/UEFI secara permanen (non-volatile) yang dijalankan pertama kali saat komputer dinyalakan (booting)."
  }
];

// Rekap Hasil Ujian Awal (Bersih dari duplikat spam, diambil dari log CSV Spreadsheet yang dilampirkan pengguna)
export const INITIAL_SUBMISSIONS: interfaceSubmissionRecord[] = [
  {
    id: "rec-1",
    sessionId: "hist-1",
    timestamp: "17/09/2026 15:18:43",
    studentName: "azzuka aprillio",
    nisn: "6281269529014",
    className: "VII-1",
    correctCount: 10,
    totalQuestions: 10,
    finalScore: 100,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-2",
    sessionId: "hist-2",
    timestamp: "17/09/2026 18:25:39",
    studentName: "M Rasya Habibie",
    nisn: "Apsen no 17",
    className: "VII-2",
    correctCount: 10,
    totalQuestions: 10,
    finalScore: 100,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-3",
    sessionId: "hist-3",
    timestamp: "17/09/2026 19:10:42",
    studentName: "Muhammad shaki Naufal farras",
    nisn: "19",
    className: "VII-1",
    correctCount: 10,
    totalQuestions: 10,
    finalScore: 100,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-4",
    sessionId: "hist-4",
    timestamp: "17/09/2026 19:41:33",
    studentName: "Halwa Nadirah Sirait",
    nisn: "2140/3138519837",
    className: "VII-3",
    correctCount: 0,
    totalQuestions: 10,
    finalScore: 0,
    cheatStatus: "Diskualifikasi: Terdeteksi pindah tab/minimize 3 kali (Keluar dari fokus jendela ujian terdeteksi.)",
    passStatus: "TIDAK LULUS"
  },
  {
    id: "rec-5",
    sessionId: "hist-5",
    timestamp: "17/09/2026 21:19:13",
    studentName: "AISYAH HAYA KHOLIS HRP",
    nisn: "009182731",
    className: "VII-2",
    correctCount: 10,
    totalQuestions: 10,
    finalScore: 100,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-6",
    sessionId: "hist-6",
    timestamp: "17/09/2026 21:26:40",
    studentName: "Dhita",
    nisn: "009812734",
    className: "VII-1",
    correctCount: 10,
    totalQuestions: 10,
    finalScore: 100,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-7",
    sessionId: "hist-7",
    timestamp: "17/09/2026 21:31:54",
    studentName: "Jihan almaira putri mrp",
    nisn: "009561238",
    className: "VII-4",
    correctCount: 4,
    totalQuestions: 10,
    finalScore: 40,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "TIDAK LULUS"
  },
  {
    id: "rec-8",
    sessionId: "hist-8",
    timestamp: "17/09/2026 21:46:46",
    studentName: "Fikrah hanafi",
    nisn: "009341827",
    className: "VII-3",
    correctCount: 8,
    totalQuestions: 10,
    finalScore: 80,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-9",
    sessionId: "hist-9",
    timestamp: "17/09/2026 22:30:25",
    studentName: "Halwa Nadirah Sirait",
    nisn: "2140/3138519837",
    className: "VII-3",
    correctCount: 10,
    totalQuestions: 10,
    finalScore: 100,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-10",
    sessionId: "hist-10",
    timestamp: "17/09/2026 22:37:27",
    studentName: "Rizky dede syahputra",
    nisn: "009412789",
    className: "VII-5",
    correctCount: 10,
    totalQuestions: 10,
    finalScore: 100,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-11",
    sessionId: "hist-11",
    timestamp: "17/09/2026 23:11:47",
    studentName: "Prisca AZ Zahra",
    nisn: "009771234",
    className: "VII-5",
    correctCount: 3,
    totalQuestions: 10,
    finalScore: 30,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "TIDAK LULUS"
  },
  {
    id: "rec-12",
    sessionId: "hist-12",
    timestamp: "18/09/2026 17:32:32",
    studentName: "Suci Ramadhani",
    nisn: "128133683",
    className: "VII-4",
    correctCount: 3,
    totalQuestions: 10,
    finalScore: 30,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "TIDAK LULUS"
  },
  {
    id: "rec-13",
    sessionId: "hist-13",
    timestamp: "18/09/2026 17:51:45",
    studentName: "Ardelia Dwi Adhari",
    nisn: "865362",
    className: "VII-4",
    correctCount: 7,
    totalQuestions: 10,
    finalScore: 70,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-14",
    sessionId: "hist-14",
    timestamp: "18/09/2026 18:58:13",
    studentName: "MHD.SULTAN ALIF",
    nisn: "009661290",
    className: "VII-2",
    correctCount: 10,
    totalQuestions: 10,
    finalScore: 100,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-15",
    sessionId: "hist-15",
    timestamp: "18/09/2026 20:27:36",
    studentName: "Firman Maulana",
    nisn: "5177/0136182858",
    className: "VII-5",
    correctCount: 9,
    totalQuestions: 10,
    finalScore: 90,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-16",
    sessionId: "hist-16",
    timestamp: "20/09/2026 20:35:27",
    studentName: "Revi afdinata",
    nisn: "27",
    className: "VII-4",
    correctCount: 10,
    totalQuestions: 10,
    finalScore: 100,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-17",
    sessionId: "hist-17",
    timestamp: "20/09/2026 21:03:32",
    studentName: "aqila azahra",
    nisn: "3",
    className: "VII-4",
    correctCount: 7,
    totalQuestions: 10,
    finalScore: 70,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-18",
    sessionId: "hist-18",
    timestamp: "20/09/2026 22:01:10",
    studentName: "Keyla cahya",
    nisn: "009881231",
    className: "VII-1",
    correctCount: 10,
    totalQuestions: 10,
    finalScore: 100,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  },
  {
    id: "rec-19",
    sessionId: "hist-19",
    timestamp: "20/09/2026 22:28:06",
    studentName: "Azka myza zahwan",
    nisn: "009112983",
    className: "VII-3",
    correctCount: 2,
    totalQuestions: 10,
    finalScore: 20,
    cheatStatus: "Diskualifikasi: Terdeteksi pindah tab/minimize 3 kali (Meninggalkan tab atau minimize browser terdeteksi.)",
    passStatus: "TIDAK LULUS"
  },
  {
    id: "rec-20",
    sessionId: "hist-20",
    timestamp: "24/09/2026 14:46:49",
    studentName: "Nayla azzahra nst",
    nisn: "313625",
    className: "VII-4",
    correctCount: 10,
    totalQuestions: 10,
    finalScore: 100,
    cheatStatus: "Selesai Normal oleh Peserta",
    passStatus: "LULUS"
  }
];
