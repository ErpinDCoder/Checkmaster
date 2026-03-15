/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Calendar, 
  LayoutGrid,
  ClipboardCheck,
  Pencil,
  Loader2,
  X,
  FileText,
  Save,
  LogIn,
  LogOut,
  User as UserIcon,
  AlertCircle,
  Languages,
  Users,
  Clock,
  Star,
  CheckCircle,
  MapPin,
  Utensils,
  Megaphone,
  Truck,
  Music,
  CreditCard,
  MoreVertical,
  Settings,
  Shield,
  Briefcase,
  RefreshCw,
  Copy,
  Check,
  Wifi,
  MessageSquare,
  Send,
  Paperclip,
  Camera,
  File,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Category, EventType, Event, ChatMessage } from './types';
import { generateEventChecklist } from './services/geminiService';
import { auth, db, storage, handleFirestoreError, OperationType } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  serverTimestamp,
  where,
  getDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';

type Language = 'id' | 'en';

const TRANSLATIONS = {
  id: {
    appName: 'Checkmaster',
    tagline: 'Personal & Tim',
    aiSuggest: 'Saran AI',
    overallProgress: 'Progres Keseluruhan',
    tasks: 'tugas',
    categories: 'Kategori',
    addTaskPlaceholder: 'Tambah tugas baru...',
    noTasks: 'Belum ada tugas di kategori ini.',
    addNotes: 'Tambahkan catatan detail...',
    saveNotes: 'Simpan Catatan',
    aiGeneratorTitle: 'Generator Tugas AI',
    eventType: 'Jenis Checklist',
    eventDescPlaceholder: 'Contoh: Persiapan pindah rumah, daftar belanja bulanan, atau rencana pernikahan...',
    generating: 'Menghasilkan Checklist...',
    generateBtn: 'Hasilkan Checklist Pintar',
    aiDisclaimer: 'Gemini akan menganalisis kebutuhan Anda dan menyarankan daftar tugas yang komprehensif.',
    loginTitle: 'Checkmaster',
    loginDesc: 'Kelola tugas pribadi atau checklist acara secara realtime. Masuk untuk memulai.',
    loginBtn: 'Masuk dengan Google',
    personalMode: 'Mode Pribadi',
    personalModeDesc: 'Data tersimpan secara lokal di perangkat ini (Offline).',
    orgMode: 'Mode Organisasi',
    orgModeDesc: 'Sinkronisasi realtime dengan tim (Online).',
    startPersonal: 'Mulai Mode Pribadi',
    startOrg: 'Masuk Mode Organisasi',
    offlineStartText: 'buat checklist personal baru anda untuk mulai mengelola persiapan anda',
    errorTitle: 'Ups! Terjadi Kesalahan',
    errorReload: 'Muat Ulang Halaman',
    permissionError: 'Anda tidak memiliki izin untuk melakukan aksi ini. Silakan login kembali.',
    defaultEventName: 'Acara Baru Saya',
    confirmDeleteCategory: 'Hapus semua tugas di kategori ini?',
    cancel: 'Batal',
    delete: 'Hapus',
    addCategory: 'Tambah Kategori',
    newCategoryPlaceholder: 'Nama kategori baru...',
    catPreEvent: 'Persiapan Pra-Acara',
    catLogistics: 'Logistik Selama Acara',
    catGuestMgmt: 'Manajemen Tamu',
    catCoreEvent: 'Acara Inti',
    catPostEvent: 'Pasca-Acara & Evaluasi',
    ledBy: 'Diketuai oleh',
    myEvents: 'Acara Saya',
    createEvent: 'Buat Acara Baru',
    joinEvent: 'Gabung Acara',
    enterEventId: 'Masukkan ID Acara',
    profile: 'Profil',
    role: 'Peran',
    owner: 'Pemilik',
    member: 'Anggota',
    members: 'Anggota Tim',
    copyId: 'Salin ID',
    idCopied: 'ID Disalin!',
    nickname: 'Nama Panggilan',
    save: 'Simpan',
    editNickname: 'Ubah Nama Panggilan',
    ownerColor: 'Warna Pemilik',
    memberColor: 'Warna Anggota',
    reload: 'Muat Ulang',
    loading: 'Memuat...',
    addEventTooltip: 'Tambah acara baru',
    deleteEvent: 'Hapus Acara',
    completeEvent: 'Selesaikan Acara',
    uncompleteEvent: 'Buka Kembali Acara',
    confirmDeleteEvent: 'Apakah Anda yakin ingin menghapus acara ini? Semua tugas akan dihapus selamanya.',
    leaveEvent: 'Keluar dari Acara',
    confirmLeaveEvent: 'Apakah Anda yakin ingin keluar dari acara ini?',
    yes: 'Ya',
    no: 'Tidak',
    confirmDeleteChat: 'Hapus pesan ini untuk semua orang?',
    createPrivateChecklist: 'Buat Checklist Pribadiku',
    dueDate: 'Tenggat Waktu',
    noDueDate: 'Tanpa Tenggat',
    addedBy: 'Ditambahkan oleh',
    at: 'pada',
    notificationsEnabled: 'Notifikasi Aktif',
    enableNotifications: 'Aktifkan Notifikasi',
    noCategories: 'Belum ada kategori yang dibuat',
    networkWarning: 'Pastikan data seluler atau WiFi Anda aktif agar dapat terhubung.',
    featureUnderRepair: 'Fitur ini sedang dalam perbaikan',
    quotaExceeded: 'Kuota harian Firestore telah habis. Fitur database akan kembali normal besok (Reset setiap jam 2 siang WIB).',
  },
  en: {
    appName: 'Checkmaster',
    tagline: 'Personal & Team',
    aiSuggest: 'AI Suggest',
    overallProgress: 'Overall Progress',
    tasks: 'tasks',
    categories: 'Categories',
    addTaskPlaceholder: 'Add a new task...',
    noTasks: 'No tasks in this category yet.',
    addNotes: 'Add detailed notes...',
    saveNotes: 'Save Notes',
    aiGeneratorTitle: 'AI Task Generator',
    eventType: 'Checklist Type',
    eventDescPlaceholder: 'e.g. Moving house preparation, monthly grocery list, or wedding plan...',
    generating: 'Generating Checklist...',
    generateBtn: 'Generate Smart Checklist',
    aiDisclaimer: 'Gemini will analyze your needs and suggest a comprehensive list of tasks.',
    loginTitle: 'Checkmaster',
    loginDesc: 'Manage personal tasks or event checklists in real-time. Sign in to start.',
    loginBtn: 'Sign in with Google',
    personalMode: 'Personal Mode',
    personalModeDesc: 'Data saved locally on this device (Offline).',
    orgMode: 'Organization Mode',
    orgModeDesc: 'Real-time sync with team (Online).',
    startPersonal: 'Start Personal Mode',
    startOrg: 'Sign in Organization Mode',
    offlineStartText: 'create your new personal checklist to start managing your preparations',
    errorTitle: 'Oops! Something went wrong',
    errorReload: 'Reload Page',
    permissionError: 'You do not have permission to perform this action. Please sign in again.',
    defaultEventName: 'My New Event',
    confirmDeleteCategory: 'Delete all tasks in this category?',
    cancel: 'Cancel',
    delete: 'Delete',
    addCategory: 'Add Category',
    newCategoryPlaceholder: 'New category name...',
    catPreEvent: 'Pre-Event Preparation',
    catLogistics: 'On-Site Logistics',
    catGuestMgmt: 'Guest Management',
    catCoreEvent: 'Core Event',
    catPostEvent: 'Post-Event & Evaluation',
    ledBy: 'Led by',
    myEvents: 'My Events',
    createEvent: 'Create New Event',
    joinEvent: 'Join Event',
    enterEventId: 'Enter Event ID',
    profile: 'Profile',
    role: 'Role',
    owner: 'Owner',
    member: 'Member',
    members: 'Team Members',
    copyId: 'Copy ID',
    idCopied: 'ID Copied!',
    noCategories: 'No categories created yet',
    networkWarning: 'Ensure your cellular data or WiFi is active to connect.',
    nickname: 'Nickname',
    save: 'Save',
    editNickname: 'Edit Nickname',
    ownerColor: 'Owner Color',
    memberColor: 'Member Color',
    reload: 'Reload',
    loading: 'Loading...',
    addEventTooltip: 'Add new event',
    deleteEvent: 'Delete Event',
    completeEvent: 'Complete Event',
    uncompleteEvent: 'Reopen Event',
    confirmDeleteEvent: 'Are you sure you want to delete this event? All tasks will be permanently removed.',
    leaveEvent: 'Leave Event',
    confirmLeaveEvent: 'Are you sure you want to leave this event?',
    yes: 'Yes',
    no: 'No',
    confirmDeleteChat: 'Delete this message for everyone?',
    createPrivateChecklist: 'Create My Private Checklist',
    dueDate: 'Due Date',
    noDueDate: 'No Due Date',
    addedBy: 'Added by',
    at: 'at',
    notificationsEnabled: 'Notifications Enabled',
    enableNotifications: 'Enable Notifications',
    featureUnderRepair: 'This feature is under repair',
    quotaExceeded: 'Firestore daily quota exceeded. Database features will return to normal tomorrow (Resets at midnight PT).',
  }
};

const getCategories = (lang: Language): Category[] => [
  { id: 'pre-event', name: TRANSLATIONS[lang].catPreEvent, icon: 'Clock' },
  { id: 'logistics', name: TRANSLATIONS[lang].catLogistics, icon: 'Truck' },
  { id: 'guests', name: TRANSLATIONS[lang].catGuestMgmt, icon: 'Users' },
  { id: 'core', name: TRANSLATIONS[lang].catCoreEvent, icon: 'Star' },
  { id: 'post-event', name: TRANSLATIONS[lang].catPostEvent, icon: 'CheckCircle' },
];

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  lang: Language;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    const { children, lang } = (this as any).props;
    const { hasError, errorInfo } = (this as any).state;
    const t = TRANSLATIONS[lang as Language];
    
    if (hasError) {
      let displayMessage = "An error occurred.";
      let isQuotaError = false;
      try {
        const parsed = JSON.parse(errorInfo || "");
        if (parsed.error) {
          if (parsed.error.toLowerCase().includes("insufficient permissions")) {
            displayMessage = t.permissionError;
          } else if (parsed.error.toLowerCase().includes("quota exceeded")) {
            displayMessage = t.quotaExceeded;
            isQuotaError = true;
          } else {
            displayMessage = parsed.error;
          }
        }
      } catch (e) {
        if (errorInfo?.toLowerCase().includes("quota exceeded")) {
          displayMessage = t.quotaExceeded;
          isQuotaError = true;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            {isQuotaError ? (
              <Clock className="mx-auto text-amber-500 mb-4" size={48} />
            ) : (
              <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            )}
            <h2 className="text-xl font-bold mb-2">{isQuotaError ? (lang === 'id' ? 'Batas Kuota Tercapai' : 'Quota Limit Reached') : t.errorTitle}</h2>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
            >
              {t.reload}
            </button>
          </div>
        </div>
      );
    }
    return children;
  }
}

function AppLogo({ size = 40, className = "" }: { size?: number, className?: string }) {
  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 aspect-square ${className}`} style={{ width: size, height: size }}>
      {/* Circular Background - Dark Slate */}
      <div className="absolute inset-0 bg-slate-900 rounded-full shadow-lg" />
      
      {/* Clipboard - White with Emerald border */}
      <div className="relative w-[58%] h-[72%] bg-white rounded-md border-[2px] border-emerald-600 flex flex-col p-[10%] gap-[8%] overflow-hidden shadow-sm">
        {/* Clipboard Clip - Grey */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[45%] h-[14%] bg-slate-400 rounded-b-md shadow-inner" />
        
        {/* Checklist items */}
        <div className="mt-[20%] space-y-[15%]">
          {[1, 2, 3, 4].map(i => (
            <div key={`logo-item-${i}`} className="flex items-center gap-[12%]">
              <div className="w-[22%] aspect-square border-[1.5px] border-emerald-200 rounded-[2px] flex items-center justify-center bg-emerald-50/30">
                {i < 4 && (
                  <div className="w-[70%] h-[70%] bg-emerald-500 rounded-[1px]" />
                )}
              </div>
              <div className="flex-1 h-[2px] bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Pencil - Emerald body, Slate tip, Crossing over */}
      <motion.div 
        initial={{ x: 10, y: -10, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        className="absolute top-[35%] right-[-5%] w-[75%] h-[10%] rotate-[-40deg] drop-shadow-md"
        style={{ transformOrigin: 'center' }}
      >
        <div className="relative w-full h-full flex items-center">
          {/* Eraser - Slate-300 */}
          <div className="w-[15%] h-full bg-slate-300 rounded-l-sm" />
          {/* Body - Emerald-500 */}
          <div className="flex-1 h-full bg-emerald-500" />
          {/* Tip - Slate-800 */}
          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[10px] border-l-slate-800" />
        </div>
      </motion.div>
    </div>
  );
}

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[100] bg-emerald-600 flex flex-col items-center justify-center text-white"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: "easeOut",
          scale: { type: "spring", damping: 12, stiffness: 100 }
        }}
        className="flex flex-col items-center"
      >
        <AppLogo size={120} className="mb-8" />
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold tracking-tight"
        >
          Checkmaster
        </motion.h1>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: 40 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="h-1 bg-emerald-400/50 rounded-full mt-2"
        />
      </motion.div>
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-emerald-100/60 text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase whitespace-nowrap">
        Check. Track. Celebrate.
      </div>
    </motion.div>
  );
}

const MOCK_USER = {
  uid: 'offline-user',
  displayName: 'Personal User',
  photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=personal',
  email: 'personal@local'
} as any;

function ChecklistApp() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('lang') as Language;
    if (saved) return saved;
    const browserLang = navigator.language.split('-')[0];
    return (browserLang === 'id' ? 'id' : 'en') as Language;
  });
  const t = TRANSLATIONS[lang];
  
  const [appMode, setAppMode] = useState<'online' | 'offline' | null>(() => {
    return localStorage.getItem('app-mode') as 'online' | 'offline' | null;
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(() => localStorage.getItem('current-event-id'));
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [eventName, setEventName] = useState(() => localStorage.getItem('event-name') || t.defaultEventName);
  const [eventType, setEventType] = useState<EventType>(lang === 'id' ? 'Perjalanan' : 'Travel');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [activeCategory, setActiveCategory] = useState(t.catPreEvent);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [eventToLeave, setEventToLeave] = useState<string | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPlayedProgress, setLastPlayedProgress] = useState(0);
  const [isEditingEventName, setIsEditingEventName] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [tempEventName, setTempEventName] = useState('');

  const playSound = (type: 'click' | 'chat' | 'success' | 'reverse-click' | 'loading' | 'copy' | 'create' | 'vocal') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      if (type === 'vocal') {
        // "CheckMaster, Check Track, Celebrate" - Rhythmic sequence
        const playNote = (freq: number, start: number, duration: number, vol = 0.1) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0, now + start);
          gain.gain.linearRampToValueAtTime(vol, now + start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + duration);
        };

        // Check-Mas-Ter
        playNote(440, 0, 0.2);     // Check
        playNote(554.37, 0.2, 0.2); // Mas
        playNote(659.25, 0.4, 0.4); // Ter

        // Check-Track
        playNote(440, 0.8, 0.2);    // Check
        playNote(659.25, 1.0, 0.4); // Track

        // Cel-e-brate
        playNote(523.25, 1.5, 0.2); // Cel
        playNote(659.25, 1.7, 0.2); // e
        playNote(783.99, 1.9, 0.6); // brate
        return;
      }

      if (type === 'loading') {
        // "Cling" star sound - high pitched sparkling
        [1500, 2000, 2500].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          gain.gain.setValueAtTime(0, now + i * 0.05);
          gain.gain.linearRampToValueAtTime(0.05, now + i * 0.05 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.2);
        });
        return;
      }

      if (type === 'copy') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        return;
      }

      if (type === 'create') {
        [440, 554.37, 659.25, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.1, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.4);
        });
        return;
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'reverse-click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'chat') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'success') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + i * 0.1);
          g.gain.setValueAtTime(0.1, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.3);
        });
      }
    } catch (e) {
      console.warn('Audio not supported or blocked', e);
    }
  };

  const [newEventName, setNewEventName] = useState('');
  const [joinEventId, setJoinEventId] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [aiQuota, setAiQuota] = useState<number>(5);
  const [aiUsageCount, setAiUsageCount] = useState<number>(0);
  const [lastAiReset, setLastAiReset] = useState<string>('');
  const [showChat, setShowChat] = useState(false);

  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const getWIBDate = () => {
    const now = new Date();
    // WIB is UTC+7. Adjust UTC time to WIB.
    const wibOffset = 7 * 60 * 60 * 1000;
    const wibTime = new Date(now.getTime() + wibOffset);
    return wibTime.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!user || appMode === 'offline') return;

    const unsubscribe = onSnapshot(doc(db, 'ai_usage', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const today = getWIBDate();
        if (data.lastReset !== today) {
          // Reset count if it's a new day in WIB
          setAiUsageCount(0);
          setLastAiReset(today);
          updateDoc(snapshot.ref, { count: 0, lastReset: today });
        } else {
          setAiUsageCount(data.count || 0);
          setLastAiReset(data.lastReset);
        }
      } else {
        const today = getWIBDate();
        setDoc(doc(db, 'ai_usage', user.uid), { count: 0, lastReset: today });
        setAiUsageCount(0);
        setLastAiReset(today);
      }
    });

    return () => unsubscribe();
  }, [user, appMode]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (showChat) {
      setTimeout(scrollToBottom, 100);
    }
  }, [showChat, messages]);
  const [chatText, setChatText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);

  const currentEvent = useMemo(() => events.find(e => e.id === currentEventId), [events, currentEventId]);

  // Chat Notifications
  useEffect(() => {
    if (messages.length === 0 || !user || !currentEvent) return;
    
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderId === user.uid) return;

    const lastRead = currentEvent.lastReadAt?.[user.uid]?.toMillis ? currentEvent.lastReadAt[user.uid].toMillis() : 0;
    const msgTime = lastMsg.createdAt?.toMillis ? lastMsg.createdAt.toMillis() : Date.now();

    if (msgTime > lastRead && !showChat) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${lastMsg.senderName}: ${lastMsg.text || (lastMsg.fileUrl ? 'Sent a file' : '')}`, {
          body: currentEvent?.name,
          icon: '/favicon.ico'
        });
      }
    }
  }, [messages, showChat, user, currentEventId, currentEvent]);

  // FIX: Menggunakan pesan sebagai trigger, currentEvent dihapus agar tidak loop
  useEffect(() => {
    if (showChat && currentEventId && user && appMode !== 'offline') {
      updateDoc(doc(db, 'events', currentEventId), {
        [`lastReadAt.${user.uid}`]: serverTimestamp()
      }).catch((err: any) => {
        if (!err.message?.includes('permission')) {
          console.error('Error updating lastReadAt:', err);
        }
      });
    }
  }, [showChat, currentEventId, user, appMode, messages.length]); 

  useEffect(() => {
    localStorage.setItem('custom-categories', JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Splash Screen Timeout
  useEffect(() => {
    playSound('loading');
    const timer = setTimeout(() => {
      setShowSplash(false);
      playSound('vocal');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthReady && user && appMode === 'online') {
      const lastId = localStorage.getItem('current-event-id');
      if (lastId && !currentEventId) {
        setCurrentEventId(lastId);
      }
    }
  }, [isAuthReady, user, appMode]);

  // FIX: currentEvent dihapus dari trigger fetch pesan agar tidak loop
  useEffect(() => {
    if (!currentEventId || appMode === 'offline') {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('eventId', '==', currentEventId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
    }, (error: any) => {
      if (user) {
        if (error.message?.includes('permission')) {
          console.warn('Firestore permission denied for messages:', error);
        } else {
          handleFirestoreError(error, OperationType.LIST, 'messages');
        }
      }
    });

    return () => unsubscribe();
  }, [currentEventId, appMode, user]);

  // Auth Listener
  useEffect(() => {
    if (appMode === 'offline') {
      setUser(MOCK_USER);
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (appMode === 'online') {
        setUser(u);
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [appMode]);

  useEffect(() => {
    if (appMode) {
      localStorage.setItem('app-mode', appMode);
    } else {
      localStorage.removeItem('app-mode');
    }
  }, [appMode]);

  // Offline Mode Tasks Sync
  useEffect(() => {
    if (appMode === 'offline') {
      const savedTasks = localStorage.getItem('offline-tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      
      const savedEvents = localStorage.getItem('offline-events');
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        setEvents(parsedEvents);
        
        const lastId = localStorage.getItem('current-event-id');
        if (lastId && parsedEvents.some((e: any) => e.id === lastId)) {
          setCurrentEventId(lastId);
        } else if (!currentEventId && parsedEvents.length > 0) {
          setCurrentEventId(parsedEvents[0].id);
        }
      }
    }
  }, [appMode]);

  useEffect(() => {
    if (appMode === 'offline') {
      localStorage.setItem('offline-tasks', JSON.stringify(tasks));
      localStorage.setItem('offline-events', JSON.stringify(events));
    }
  }, [tasks, events, appMode]);

  useEffect(() => {
    if (currentEventId) {
      localStorage.setItem('current-event-id', currentEventId);
    } else {
      localStorage.removeItem('current-event-id');
    }
  }, [currentEventId]);

  // Firestore Sync - Events
  useEffect(() => {
    if (appMode !== 'online' || !isAuthReady || !user) {
      if (appMode !== 'offline') setEvents([]);
      return;
    }

    // Query events where user is a member
    const q = query(collection(db, 'events'), where(`members.${user.uid}`, 'in', ['owner', 'member']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(newEvents);
      
      // Auto-select last opened event if it exists in the new list
      const lastId = localStorage.getItem('current-event-id');
      if (lastId && newEvents.some(e => e.id === lastId)) {
        setCurrentEventId(lastId);
      } else if (newEvents.length > 0 && !currentEventId) {
        setCurrentEventId(newEvents[0].id);
      } else if (newEvents.length === 0) {
        setCurrentEventId(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });

    return () => unsubscribe();
  }, [isAuthReady, user, appMode]);

  // Firestore Sync - Tasks
  useEffect(() => {
    if (appMode !== 'online' || !isAuthReady || !user || !currentEventId) {
      if (appMode !== 'offline') setTasks([]);
      return;
    }

    const q = query(
      collection(db, 'tasks'), 
      where('eventId', '==', currentEventId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(newTasks);
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Permission denied for tasks, user might not be a member yet or was removed");
      } else {
        handleFirestoreError(error, OperationType.LIST, 'tasks');
      }
    });

    return () => unsubscribe();
  }, [isAuthReady, user, currentEventId, appMode]);

  useEffect(() => {
    localStorage.setItem('event-name', eventName);
  }, [eventName]);

  const categories = useMemo(() => {
    const filteredTasks = tasks.filter(t => t.eventId === currentEventId);
    const uniqueCats = Array.from(new Set(filteredTasks.map(t => t.category)));
    // In offline mode, we only show categories that have tasks or are custom
    let allCats: string[] = [];
    if (appMode === 'offline') {
      allCats = [...uniqueCats, ...customCategories];
    } else {
      const base = getCategories(lang).map(c => c.name);
      allCats = [...base, ...uniqueCats, ...customCategories];
    }
    // Final unique check (case-insensitive) and filter out empty strings
    const seen = new Set<string>();
    return allCats
      .map(c => c.trim())
      .filter(c => {
        if (!c) return false;
        const lower = c.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });
  }, [tasks, lang, customCategories, appMode, currentEventId]);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setAppMode('online');
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    if (appMode === 'online') {
      await signOut(auth);
    }
    setAppMode(null);
    setUser(null);
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (appMode === 'offline') {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() } : t));
      return;
    }

    try {
      await updateDoc(doc(db, 'tasks', id), { 
        completed: !task.completed,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const deleteTask = async (id: string) => {
    if (appMode === 'offline') {
      setTasks(prev => prev.filter(t => t.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const addTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskText.trim() || !user || !currentEventId) return;
    
    if (appMode === 'offline') {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        text: newTaskText,
        completed: false,
        category: activeCategory,
        notes: '',
        uid: user.uid,
        eventId: currentEventId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTasks(prev => [newTask, ...prev]);
      setNewTaskText('');
      return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        text: newTaskText,
        completed: false,
        category: activeCategory,
        notes: '',
        uid: user.uid,
        eventId: currentEventId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewTaskText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const createEvent = async (name: string) => {
    if (!user || !name.trim()) return;
    setIsProcessing(true);
    try {
      const newEventData = {
        name: name.trim(),
        ownerId: user.uid,
        ownerName: user.displayName || 'User',
        ownerEmail: user.email || '',
        members: { [user.uid]: 'owner' },
        nicknames: { [user.uid]: user.displayName || 'User' },
        memberJoinedAt: { [user.uid]: appMode === 'offline' ? new Date().toISOString() : serverTimestamp() },
        lastReadAt: { [user.uid]: appMode === 'offline' ? new Date().toISOString() : serverTimestamp() },
        ownerColor: '#f59e0b', // Amber 500
        memberColor: '#10b981', // Emerald 500
        createdAt: appMode === 'offline' ? new Date().toISOString() : serverTimestamp(),
        updatedAt: appMode === 'offline' ? new Date().toISOString() : serverTimestamp()
      };

      if (appMode === 'offline') {
        const newEvent: Event = {
          id: Math.random().toString(36).substr(2, 9),
          ...newEventData
        } as Event;
        setEvents(prev => [newEvent, ...prev]);
        setCurrentEventId(newEvent.id);
        setShowCreateEventModal(false);
        setNewEventName('');
        playSound('create');
      } else {
        const docRef = await addDoc(collection(db, 'events'), newEventData);
        setCurrentEventId(docRef.id);
        setShowCreateEventModal(false);
        setNewEventName('');
        playSound('create');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'events');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopySuccess(true);
    playSound('copy');
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  const joinEvent = async (id: string) => {
    if (!user || !id.trim()) return;
    
    if (appMode === 'offline') {
      alert(lang === 'id' ? 'Gabung acara hanya tersedia dalam Mode Organisasi (Online)' : 'Joining events is only available in Organization Mode (Online)');
      return;
    }

    setIsProcessing(true);
    try {
      const cleanId = id.trim();
      const eventRef = doc(db, 'events', cleanId);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) {
        alert(lang === 'id' ? 'Acara tidak ditemukan. Pastikan ID benar.' : 'Event not found. Please check the ID.');
        return;
      }

      const eventData = eventSnap.data();
      if (eventData.members && eventData.members[user.uid]) {
        alert(lang === 'id' ? 'Anda sudah bergabung dalam acara ini.' : 'You are already a member of this event.');
        setCurrentEventId(cleanId);
        setShowCreateEventModal(false);
        setJoinEventId('');
        return;
      }

      await updateDoc(eventRef, {
        [`members.${user.uid}`]: 'member',
        [`nicknames.${user.uid}`]: user.displayName || 'User',
        [`memberJoinedAt.${user.uid}`]: serverTimestamp(),
        [`lastReadAt.${user.uid}`]: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setCurrentEventId(cleanId);
      setShowCreateEventModal(false);
      setJoinEventId('');
      playSound('click');
      alert(lang === 'id' ? 'Berhasil bergabung ke acara!' : 'Successfully joined the event!');
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('quota exceeded')) {
        alert(t.quotaExceeded);
      } else {
        handleFirestoreError(error, OperationType.UPDATE, 'events');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleString();
    }
    // Handle Firestore Timestamp-like object
    if (date && typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000).toLocaleString();
    }
    if (date instanceof Date) {
      return date.toLocaleString();
    }
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString();
    } catch (e) {
      return '';
    }
  };

  const updateNotes = async (id: string) => {
    if (!user) return;
    const noteData = {
      notes: tempNotes,
      noteAuthorId: user.uid,
      noteAuthorName: currentEvent?.nicknames?.[user.uid] || user.displayName || 'User',
      noteUpdatedAt: appMode === 'offline' ? new Date().toISOString() : serverTimestamp(),
      updatedAt: appMode === 'offline' ? new Date().toISOString() : serverTimestamp()
    };

    if (appMode === 'offline') {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...noteData } : t));
      setEditingNotesId(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'tasks', id), noteData);
      setEditingNotesId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const updateDueDate = async (id: string, date: string) => {
    if (!user) return;
    const updateData = {
      dueDate: date,
      updatedAt: appMode === 'offline' ? new Date().toISOString() : serverTimestamp()
    };

    if (appMode === 'offline') {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updateData } : t));
      return;
    }

    try {
      await updateDoc(doc(db, 'tasks', id), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(t.notificationsEnabled);
    }
  };

  const deleteCategory = async (catName: string) => {
    if (appMode === 'offline') {
      setTasks(prev => prev.filter(t => t.category !== catName));
      setCustomCategories(prev => prev.filter(c => c !== catName));
      if (activeCategory === catName) {
        const remaining = categories.filter(c => c !== catName);
        setActiveCategory(remaining[0] || t.catVenue);
      }
      setCategoryToDelete(null);
      return;
    }

    try {
      const q = query(
        collection(db, 'tasks'), 
        where('eventId', '==', currentEventId),
        where('category', '==', catName)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      setCustomCategories(prev => prev.filter(c => c !== catName));
      
      if (activeCategory === catName) {
        const remaining = categories.filter(c => c !== catName);
        setActiveCategory(remaining[0] || t.catVenue);
      }
      setCategoryToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks (category: ${catName})`);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (!customCategories.includes(newCategoryName.trim())) {
      setCustomCategories(prev => [...prev, newCategoryName.trim()]);
    }
    setActiveCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleAiGenerate = async () => {
    if (!user) return;
    
    if (appMode !== 'offline') {
      if (aiUsageCount >= 5) {
        alert(lang === 'id' ? 'Kuota harian AI habis (Maks 5x/hari). Reset jam 12 malam WIB.' : 'AI daily quota reached (Max 5x/day). Resets at 12 AM WIB.');
        return;
      }
    }

    setIsGenerating(true);
    try {
      let targetEventId = currentEventId;
      
      // If no event selected, create a default one
      if (!targetEventId) {
        const name = lang === 'id' ? 'Checklist AI Saya' : 'My AI Checklist';
        const newEventData = {
          name,
          ownerId: user.uid,
          ownerName: user.displayName || 'User',
          ownerEmail: user.email || '',
          members: { [user.uid]: 'owner' },
          nicknames: { [user.uid]: user.displayName || 'User' },
          memberJoinedAt: { [user.uid]: appMode === 'offline' ? new Date().toISOString() : serverTimestamp() },
          lastReadAt: { [user.uid]: appMode === 'offline' ? new Date().toISOString() : serverTimestamp() },
          ownerColor: '#f59e0b',
          memberColor: '#10b981',
          createdAt: appMode === 'offline' ? new Date().toISOString() : serverTimestamp(),
          updatedAt: appMode === 'offline' ? new Date().toISOString() : serverTimestamp()
        };

        if (appMode === 'offline') {
          const newEvent = {
            id: Math.random().toString(36).substr(2, 9),
            ...newEventData
          } as Event;
          setEvents(prev => [newEvent, ...prev]);
          setCurrentEventId(newEvent.id);
          targetEventId = newEvent.id;
        } else {
          const docRef = await addDoc(collection(db, 'events'), newEventData);
          setCurrentEventId(docRef.id);
          targetEventId = docRef.id;
        }
      }

      const result = await generateEventChecklist(eventType, eventDesc || eventName, lang);
      
      if (appMode !== 'offline' && user) {
        await updateDoc(doc(db, 'ai_usage', user.uid), {
          count: aiUsageCount + 1,
          lastReset: getWIBDate()
        });
      }
      
      if (appMode === 'offline') {
        const newTasks: Task[] = [];
        let counter = 0;
        for (const group of result) {
          for (const taskText of group.tasks) {
            newTasks.push({
              id: `ai-${Date.now()}-${counter++}-${Math.random().toString(36).substr(2, 9)}`,
              text: taskText,
              completed: false,
              category: group.category,
              notes: '',
              uid: user.uid,
              eventId: targetEventId!,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
        setTasks(prev => [...newTasks, ...prev]);
        setShowAiModal(false);
        return;
      }

      for (const group of result) {
        for (const taskText of group.tasks) {
          await addDoc(collection(db, 'tasks'), {
            text: taskText,
            completed: false,
            category: group.category,
            notes: '',
            uid: user.uid,
            eventId: targetEventId!,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
      setShowAiModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Pull to Refresh Logic removed as requested
  useEffect(() => {
    // Logic removed
  }, []);

  const updateNickname = async () => {
    if (!user || !currentEventId || !tempNickname.trim()) return;
    
    if (appMode === 'offline') {
      setEvents(prev => prev.map(e => e.id === currentEventId ? {
        ...e,
        nicknames: { ...(e.nicknames || {}), [user.uid]: tempNickname }
      } : e));
      setIsEditingNickname(false);
      playSound('success');
      return;
    }

    try {
      await updateDoc(doc(db, 'events', currentEventId), {
        [`nicknames.${user.uid}`]: tempNickname
      });
      setIsEditingNickname(false);
      playSound('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'events');
    }
  };

  const updateEventName = async () => {
    const targetId = editingEventId || currentEventId;
    if (!user || !targetId || !tempEventName.trim()) return;
    
    if (appMode === 'offline') {
      setEvents(prev => prev.map(e => e.id === targetId ? {
        ...e,
        name: tempEventName
      } : e));
      setIsEditingEventName(false);
      setEditingEventId(null);
      playSound('success');
      return;
    }

    try {
      await updateDoc(doc(db, 'events', targetId), {
        name: tempEventName,
        updatedAt: serverTimestamp()
      });
      setIsEditingEventName(false);
      setEditingEventId(null);
      playSound('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'events');
    }
  };

  const updateEventColors = async (ownerColor: string, memberColor: string) => {
    if (!user || !currentEventId || appMode === 'offline') return;
    
    try {
      await updateDoc(doc(db, 'events', currentEventId), {
        ownerColor,
        memberColor
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'events');
    }
  };

  const leaveEvent = async (eventId: string) => {
    if (!user || appMode === 'offline') return;

    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) return;

      const eventData = eventSnap.data() as Event;
      const newMembers = { ...eventData.members };
      delete newMembers[user.uid];

      await updateDoc(eventRef, {
        members: newMembers,
        updatedAt: serverTimestamp()
      });

      if (currentEventId === eventId) {
        setCurrentEventId(null);
      }
      setShowLeaveConfirm(false);
      setEventToLeave(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'events');
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return;
    
    if (appMode === 'offline') {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setTasks(prev => prev.filter(t => t.eventId !== eventId));
      if (currentEventId === eventId) {
        setCurrentEventId(null);
      }
      return;
    }

    try {
      // Delete all tasks associated with the event
      const q = query(collection(db, 'tasks'), where('eventId', '==', eventId));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the event itself
      await deleteDoc(doc(db, 'events', eventId));
      
      if (currentEventId === eventId) {
        setCurrentEventId(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'events');
    }
  };

  const toggleEventCompletion = async (eventId: string, currentStatus: boolean) => {
    if (!user) return;

    if (appMode === 'offline') {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, completed: !currentStatus, updatedAt: new Date().toISOString() } : e));
      return;
    }

    try {
      await updateDoc(doc(db, 'events', eventId), {
        completed: !currentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'events');
    }
  };

  const deleteChatMessage = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', msgId));
      playSound('reverse-click');
      setChatToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'messages');
    }
  };

  const sendChatMessage = async (text?: string, fileData?: { url: string, name: string, type: string }) => {
    if (!user || !currentEventId || appMode === 'offline') return;
    if (!text?.trim() && !fileData) return;

    playSound('chat');
    try {
      await addDoc(collection(db, 'messages'), {
        eventId: currentEventId,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        text: text || null,
        fileUrl: fileData?.url || null,
        fileName: fileData?.name || null,
        fileType: fileData?.type || null,
        createdAt: serverTimestamp()
      });
      setChatText('');
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('quota exceeded')) {
        alert(t.quotaExceeded);
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'messages');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCamera = false) => {
    const file = e.target.files?.[0];
    if (!file || !user || !currentEventId) return;

    if (appMode === 'offline') {
      alert(lang === 'id' ? 'Fitur ini tidak tersedia dalam mode offline' : 'This feature is not available in offline mode');
      e.target.value = '';
      return;
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert(lang === 'id' ? 'Ukuran file terlalu besar (maks 10MB)' : 'File size too large (max 10MB)');
      e.target.value = '';
      return;
    }

    console.log('Starting upload for:', file.name, 'size:', file.size);
    console.log('Current user:', user?.uid);
    console.log('Current event:', currentEventId);
    console.log('Storage object:', !!storage);

    if (!storage) {
      alert(lang === 'id' ? 'Firebase Storage tidak terinisialisasi' : 'Firebase Storage not initialized');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    
    // Create a timeout to prevent infinite buffering
    const timeoutId = setTimeout(() => {
      setIsUploading(prev => {
        if (prev) {
          alert(lang === 'id' ? 'Unggahan terlalu lama. Silakan coba lagi.' : 'Upload took too long. Please try again.');
          return false;
        }
        return prev;
      });
    }, 60000); // 1 minute timeout

    try {
      const storageRef = ref(storage, `events/${currentEventId}/chat/${Date.now()}_${file.name}`);
      console.log('Storage ref created:', storageRef.fullPath);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        }, 
        (error) => {
          console.error('Upload task error:', error);
          clearTimeout(timeoutId);
          setIsUploading(false);
          alert(lang === 'id' ? `Gagal mengunggah: ${error.message}` : `Upload failed: ${error.message}`);
        }, 
        async () => {
          console.log('Upload successful, getting download URL...');
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL obtained:', url);
            
            await sendChatMessage(undefined, {
              url,
              name: file.name,
              type: file.type
            });
            console.log('Chat message sent with file');
          } catch (err) {
            console.error('Error after upload:', err);
            alert(lang === 'id' ? 'Gagal memproses file setelah unggah' : 'Failed to process file after upload');
          } finally {
            clearTimeout(timeoutId);
            setIsUploading(false);
          }
        }
      );
    } catch (error) {
      console.error('Outer upload error:', error);
      clearTimeout(timeoutId);
      setIsUploading(false);
      alert(lang === 'id' ? 'Gagal menginisialisasi unggahan' : 'Failed to initialize upload');
    } finally {
      // Clear the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.dueDate && !task.completed && !notifiedTasks.has(task.id)) {
          const dueDate = new Date(task.dueDate);
          // Notify if due date is within the next 5 minutes or already passed
          if (dueDate <= new Date(now.getTime() + 5 * 60 * 1000)) {
            new Notification(`${t.appName}: ${task.text}`, {
              body: `${t.dueDate}: ${dueDate.toLocaleString()}`,
              icon: '/favicon.ico'
            });
            setNotifiedTasks(prev => new Set(prev).add(task.id));
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks, notifiedTasks, t.appName, t.dueDate]);

  const currentEventTasks = tasks.filter(t => t.eventId === currentEventId);
  const progress = currentEventTasks.length > 0 
    ? Math.round((currentEventTasks.filter(t => t.completed).length / currentEventTasks.length) * 100) 
    : 0;

  useEffect(() => {
    if (progress === 100 && lastPlayedProgress !== 100 && currentEventTasks.length > 0) {
      playSound('success');
    }
    setLastPlayedProgress(progress);
  }, [progress, currentEventTasks.length]);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      {/* Repair Modal */}
      <AnimatePresence>
        {showRepairModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Settings size={32} className="animate-spin-slow" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t.featureUnderRepair}
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                {lang === 'id' 
                  ? 'Kami sedang meningkatkan sistem penyimpanan. Mohon maaf atas ketidaknyamanannya.' 
                  : 'We are currently upgrading our storage system. Sorry for the inconvenience.'}
              </p>
              <button 
                onClick={() => setShowRepairModal(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pull to Refresh Indicator removed */}

      {isRefreshing && (
        <div className="fixed inset-0 z-[110] bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={48} />
        </div>
      )}

      {!isAuthReady ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-emerald-600" size={48} />
        </div>
      ) : (!user || !appMode || (appMode === 'online' && user.uid === 'mock-user')) ? (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
          <WorkshopBackground />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/30 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 max-w-lg w-full text-center relative z-10 border border-white/50"
          >
            <AppLogo size={80} className="mx-auto mb-8" />
            <h1 className="text-3xl font-bold mb-3 text-slate-900">{t.loginTitle}</h1>
            <p className="text-slate-600 mb-10 leading-relaxed">
              {t.loginDesc}
            </p>

            <div className="space-y-4 mb-8">
              <button 
                onClick={() => {
                  setAppMode('offline');
                  setUser(MOCK_USER);
                }}
                className="w-full bg-white border-2 border-emerald-100 text-emerald-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-50 hover:border-emerald-500 transition-all shadow-lg shadow-emerald-50 active:scale-95"
              >
                <div className="w-6 h-6 bg-emerald-500 text-white rounded-md flex items-center justify-center">
                  <Check size={14} strokeWidth={4} />
                </div>
                {t.createPrivateChecklist}
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="h-px bg-slate-100 flex-1" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{lang === 'id' ? 'Atau Masuk Tim' : 'Or Join Team'}</span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              <button 
                onClick={() => {
                  playSound('click');
                  if (user?.uid === 'mock-user') setUser(null);
                  setAppMode('online');
                  login();
                }}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t.loginBtn}
              </button>
              
              <div className="mt-6 bg-amber-50/50 border border-amber-100/50 p-4 rounded-2xl flex items-start gap-3">
                <Wifi size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed text-left">
                  {t.networkWarning}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 text-emerald-900 font-sans selection:bg-emerald-200 pb-12">
          {/* Header */}
          <header className="bg-emerald-600 border-b border-emerald-700 sticky top-0 z-30 text-white shadow-lg">
            <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <AppLogo size={44} className="flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  {isEditingEventName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempEventName}
                        onChange={(e) => setTempEventName(e.target.value)}
                        className="bg-emerald-700 text-white border-none rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-white/30 w-full max-w-[200px]"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && updateEventName()}
                        onBlur={() => setIsEditingEventName(false)}
                      />
                      <button onClick={updateEventName} className="p-1.5 hover:bg-emerald-500 rounded-lg transition-colors">
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/event">
                      <h1 className="text-xl font-bold text-white truncate leading-tight">
                        {currentEventId && currentEvent ? currentEvent.name : t.appName}
                      </h1>
                      {currentEvent?.ownerId === user?.uid && (
                        <button 
                          onClick={() => {
                            setTempEventName(currentEvent?.name || '');
                            setIsEditingEventName(true);
                          }}
                          className="p-1 text-white/50 hover:text-white opacity-0 group-hover/event:opacity-100 transition-opacity"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      {currentEvent && appMode !== 'offline' && (
                        <button 
                          onClick={() => copyToClipboard(currentEvent.id)}
                          className="p-1 hover:bg-emerald-500 rounded-md transition-colors shrink-0"
                          title={t.copyId}
                        >
                          <Copy size={14} className="text-emerald-100" />
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-emerald-100 uppercase tracking-[0.15em] font-bold opacity-80 leading-relaxed">
                    {currentEvent ? (appMode === 'offline' ? 'Offline Mode' : `${t.ledBy} ${currentEvent.nicknames?.[currentEvent.ownerId] || currentEvent.ownerName}`) : t.tagline}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => { playSound('click'); setShowAiModal(true); }}
                  className="hidden sm:flex items-center gap-2 bg-slate-900 text-emerald-400 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                  <Sparkles size={16} className="text-emerald-400" />
                  <span>{t.aiSuggest}</span>
                </button>
                
                <div className="h-8 w-px bg-emerald-500/50 mx-1" />
                
                <div className="relative">
                  <button 
                    onClick={() => { playSound('click'); setShowProfileMenu(!showProfileMenu); }}
                    className="flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <div className="relative flex-shrink-0 aspect-square">
                      <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-10 h-10 rounded-full border-2 border-emerald-300 shadow-md object-cover aspect-square" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => { playSound('reverse-click'); setShowProfileMenu(false); }} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden max-h-[85vh] overflow-y-auto"
                        >
                          <div className="p-6 bg-slate-50 border-b border-slate-100">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4 overflow-hidden">
                                <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-14 h-14 rounded-full border-2 border-white shadow-md shrink-0" />
                                <div className="overflow-hidden">
                                  {isEditingNickname ? (
                                    <div className="flex gap-2">
                                      <input 
                                        autoFocus
                                        type="text"
                                        value={tempNickname}
                                        onChange={(e) => setTempNickname(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        onKeyDown={(e) => e.key === 'Enter' && updateNickname()}
                                      />
                                      <button onClick={updateNickname} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md">
                                        <Check size={16} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 group/nick">
                                      <p className="font-bold text-slate-900 truncate text-lg">
                                        {currentEvent?.nicknames?.[user.uid] || user.displayName}
                                      </p>
                                      <button 
                                        onClick={() => {
                                          setTempNickname(currentEvent?.nicknames?.[user.uid] || user.displayName || '');
                                          setIsEditingNickname(true);
                                        }}
                                        className="p-1 text-slate-400 hover:text-emerald-600 opacity-0 group-hover/nick:opacity-100 transition-opacity"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                    </div>
                                  )}
                                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                              </div>
                              {currentEvent && appMode !== 'offline' && (
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full shrink-0 ${currentEvent.members[user.uid] === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {currentEvent.members[user.uid] === 'owner' ? t.owner : t.member}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-3">
                            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t.myEvents}</div>
                            <div className="max-h-40 overflow-y-auto space-y-1 px-1">
                              {events.length === 0 ? (
                                <p className="px-4 py-4 text-xs text-slate-400 italic text-center">Belum ada acara</p>
                              ) : (
                                events.map(ev => (
                                  <div
                                    key={ev.id}
                                    onClick={() => {
                                      setCurrentEventId(ev.id);
                                      setShowProfileMenu(false);
                                    }}
                                    className={`group/ev w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all cursor-pointer ${
                                      currentEventId === ev.id ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 truncate">
                                      <div className={`w-2 h-2 rounded-full ${ev.completed ? 'bg-slate-300' : (currentEventId === ev.id ? 'bg-white' : 'bg-emerald-400')}`} />
                                      {editingEventId === ev.id ? (
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                          <input
                                            type="text"
                                            value={tempEventName}
                                            onChange={(e) => setTempEventName(e.target.value)}
                                            className={`bg-white/20 text-white border-none rounded px-2 py-0.5 text-xs focus:ring-1 focus:ring-white/50 w-32`}
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && updateEventName()}
                                            onBlur={() => {
                                              setIsEditingEventName(false);
                                              setEditingEventId(null);
                                            }}
                                          />
                                          <button onClick={updateEventName} className="p-1 hover:bg-white/20 rounded">
                                            <Check size={12} />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className={`truncate ${ev.completed ? 'line-through opacity-50' : ''}`}>{ev.name}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {/* Action Buttons */}
                                      <div className="flex items-center gap-1 opacity-0 group-hover/ev:opacity-100 transition-opacity">
                                        {ev.ownerId === user.uid && (
                                          <>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setTempEventName(ev.name);
                                                setEditingEventId(ev.id);
                                                setIsEditingEventName(true);
                                              }}
                                              className={`p-1.5 rounded-lg transition-colors ${currentEventId === ev.id ? 'hover:bg-emerald-500 text-white' : 'hover:bg-emerald-50 text-emerald-600'}`}
                                              title={t.edit}
                                            >
                                              <Pencil size={14} />
                                            </button>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleEventCompletion(ev.id, !!ev.completed);
                                              }}
                                              className={`p-1.5 rounded-lg transition-colors ${currentEventId === ev.id ? 'hover:bg-emerald-500 text-white' : 'hover:bg-emerald-50 text-emerald-600'}`}
                                              title={ev.completed ? t.uncompleteEvent : t.completeEvent}
                                            >
                                              {ev.completed ? <RefreshCw size={14} /> : <CheckCircle size={14} />}
                                            </button>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                deleteEvent(ev.id);
                                              }}
                                              className={`p-1.5 rounded-lg transition-colors ${currentEventId === ev.id ? 'hover:bg-red-500 text-white' : 'hover:bg-red-50 text-red-600'}`}
                                              title={t.deleteEvent}
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </>
                                        )}
                                        {ev.ownerId !== user.uid && appMode !== 'offline' && (
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEventToLeave(ev.id);
                                              setShowLeaveConfirm(true);
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors ${currentEventId === ev.id ? 'hover:bg-red-500 text-white' : 'hover:bg-red-50 text-red-600'}`}
                                            title={t.leaveEvent}
                                          >
                                            <LogOut size={14} />
                                          </button>
                                        )}
                                      </div>

                                      {currentEventId === ev.id && appMode !== 'offline' && (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(ev.id);
                                          }}
                                          className="p-1 hover:bg-emerald-500 rounded-md transition-colors"
                                        >
                                          <Copy size={12} className={currentEventId === ev.id ? 'text-emerald-200' : 'text-emerald-400'} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {currentEvent && appMode !== 'offline' && (
                              <>
                                <div className="h-px bg-slate-100 my-3 mx-4" />
                                
                                {currentEvent.ownerId === user.uid && (
                                  <button 
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"
                                  >
                                    <span className="uppercase tracking-[0.2em]">{lang === 'id' ? 'Pengaturan Warna' : 'Color Settings'}</span>
                                    <ChevronDown size={14} className={`transition-transform ${showColorPicker ? 'rotate-180' : ''}`} />
                                  </button>
                                )}

                                {showColorPicker && currentEvent.ownerId === user.uid && (
                                  <div className="px-4 py-2 bg-slate-50 rounded-xl mx-2 mb-2 space-y-2">
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.ownerColor}</span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#0f172a'].map(color => (
                                          <button
                                            key={color}
                                            onClick={() => updateEventColors(color, currentEvent.memberColor || '#10b981')}
                                            className={`w-6 h-6 rounded-full border-2 transition-all ${currentEvent.ownerColor === color ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                          />
                                        ))}
                                        <input 
                                          type="color" 
                                          value={currentEvent.ownerColor || '#f59e0b'} 
                                          onChange={(e) => updateEventColors(e.target.value, currentEvent.memberColor || '#10b981')}
                                          className="w-6 h-6 rounded-full cursor-pointer border-2 border-white shadow-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.memberColor}</span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {['#10b981', '#06b6d4', '#6366f1', '#f43f5e', '#fbbf24', '#64748b'].map(color => (
                                          <button
                                            key={color}
                                            onClick={() => updateEventColors(currentEvent.ownerColor || '#f59e0b', color)}
                                            className={`w-6 h-6 rounded-full border-2 transition-all ${currentEvent.memberColor === color ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                          />
                                        ))}
                                        <input 
                                          type="color" 
                                          value={currentEvent.memberColor || '#10b981'} 
                                          onChange={(e) => updateEventColors(currentEvent.ownerColor || '#f59e0b', e.target.value)}
                                          className="w-6 h-6 rounded-full cursor-pointer border-2 border-white shadow-sm"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="px-2 py-2 space-y-1">
                                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{t.members}</div>
                                  {Object.entries(currentEvent.members)
                                    .sort(([uidA, roleA], [uidB, roleB]) => {
                                      if (roleA === 'owner') return -1;
                                      if (roleB === 'owner') return 1;
                                      const joinA = currentEvent.memberJoinedAt?.[uidA]?.toMillis ? currentEvent.memberJoinedAt[uidA].toMillis() : 0;
                                      const joinB = currentEvent.memberJoinedAt?.[uidB]?.toMillis ? currentEvent.memberJoinedAt[uidB].toMillis() : 0;
                                      return joinA - joinB || uidA.localeCompare(uidB);
                                    })
                                    .map(([uid, role]) => (
                                    <div key={uid} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <div 
                                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                                          style={{ backgroundColor: role === 'owner' ? (currentEvent.ownerColor || '#f59e0b') : (currentEvent.memberColor || '#10b981') }} 
                                        />
                                        <span className="text-sm text-slate-700 truncate font-medium">
                                          {currentEvent.nicknames?.[uid] || (uid === user.uid ? 'You' : (role === 'owner' ? t.owner : t.member))}
                                        </span>
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${role === 'owner' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {role === 'owner' ? t.owner : t.member}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                            
                            <div className="h-px bg-slate-100 my-3 mx-4" />
                            
                            <div className="grid grid-cols-1 gap-1">
                              <button 
                                onClick={() => {
                                  playSound('click');
                                  setShowCreateEventModal(true);
                                  setShowProfileMenu(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-emerald-600 font-bold hover:bg-emerald-50 transition-all"
                              >
                                <Plus size={20} />
                                {t.createEvent}
                              </button>

                              <button 
                                onClick={requestNotificationPermission}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-amber-600 font-bold hover:bg-amber-50 transition-all"
                              >
                                <Megaphone size={20} />
                                {t.enableNotifications}
                              </button>

                              <button 
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-red-600 font-bold hover:bg-red-50 transition-all"
                              >
                                <LogOut size={20} />
                                {lang === 'id' ? 'Keluar' : 'Sign Out'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </header>

          {!currentEventId ? (
            <main className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-md w-full"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-600 mx-auto mb-8">
                  <Calendar size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{lang === 'id' ? 'Mulai Acara Pertama Anda' : 'Start Your First Event'}</h2>
                <p className="text-slate-500 mb-10 leading-relaxed">
                  {t.offlineStartText}
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      playSound('click');
                      setIsJoining(false);
                      setShowCreateEventModal(true);
                    }}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                  >
                    <Plus size={24} />
                    {t.createEvent}
                  </button>
                  {appMode !== 'offline' && (
                    <button
                      onClick={() => {
                        playSound('click');
                        setIsJoining(true);
                        setShowCreateEventModal(true);
                      }}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                    >
                      <Users size={24} />
                      {t.joinEvent}
                    </button>
                  )}
                </div>
              </motion.div>
            </main>
          ) : (
            <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Progress */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-widest mb-4">{t.overallProgress}</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-4xl font-light text-emerald-900">{progress}%</span>
              <span className="text-sm text-emerald-600 mb-1">
                {currentEventTasks.filter(t => t.completed).length}/{currentEventTasks.length} {t.tasks}
              </span>
            </div>
            <div className="w-full h-2 bg-emerald-50 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-emerald-600"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-widest px-2 mb-3">{t.categories}</h3>
            <div className="space-y-1">
              {categories.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs text-emerald-800/40 font-medium mb-4">{t.noCategories}</p>
                  <button 
                    onClick={() => { playSound('click'); setShowAiModal(true); }}
                    className="flex items-center gap-2 bg-slate-900 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md mx-auto"
                  >
                    <Sparkles size={14} />
                    <span>{t.aiSuggest}</span>
                  </button>
                </div>
              ) : (
                categories.map(cat => (
                  <div key={cat} className="group flex items-center gap-1">
                    <button
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === cat ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-emerald-800/60 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-xs bg-emerald-50 px-2 py-0.5 rounded-full text-emerald-500">
                        {currentEventTasks.filter(t => t.category === cat).length}
                      </span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCategoryToDelete(cat); }}
                      className="sm:opacity-0 sm:group-hover:opacity-100 p-2 text-emerald-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title={lang === 'id' ? 'Hapus Kategori' : 'Delete Category'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {isAddingCategory ? (
              <div className="mt-4 px-2">
                <input
                  autoFocus
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder={t.newCategoryPlaceholder}
                  className="w-full px-3 py-2 bg-white border border-emerald-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { playSound('click'); handleAddCategory(); }}
                    className="flex-1 bg-emerald-600 text-white text-xs py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                  >
                    {t.addCategory}
                  </button>
                  <button
                    onClick={() => setIsAddingCategory(false)}
                    className="px-3 py-2 text-emerald-600 text-xs font-medium hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    X
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { playSound('click'); setIsAddingCategory(true); }}
                className="mt-4 w-full flex items-center gap-2 px-3 py-2 text-emerald-600/60 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm transition-all border border-dashed border-emerald-200"
              >
                <Plus size={14} />
                <span>{t.addCategory}</span>
              </button>
            )}
          </div>
        </aside>

        {/* Task List */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="p-6 border-b border-emerald-50 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-emerald-900">
                <LayoutGrid size={20} className="text-emerald-600" />
                {activeCategory}
              </h2>
            </div>

            <div className="p-6">
              <form onSubmit={addTask} className="flex gap-2 mb-8">
                <input 
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder={t.addTaskPlaceholder}
                  className="flex-1 bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-emerald-900 placeholder-emerald-300"
                />
                <button 
                  type="submit"
                  onClick={() => playSound('click')}
                  className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100/50"
                >
                  <Plus size={20} />
                </button>
              </form>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {tasks.filter(t => t.category === activeCategory).length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-emerald-300"
                    >
                      <ClipboardCheck size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="mb-4">{t.noTasks}</p>
                      <button 
                        onClick={() => { playSound('click'); setShowAiModal(true); }}
                        className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all"
                      >
                        <Sparkles size={16} />
                        {t.aiSuggest}
                      </button>
                    </motion.div>
                  ) : (
                    tasks
                      .filter(t => t.eventId === currentEventId && t.category === activeCategory)
                      .sort((a, b) => Number(a.completed) - Number(b.completed))
                      .map(task => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`group flex flex-col gap-2 p-4 rounded-xl border transition-all ${
                            task.completed ? 'bg-emerald-50/30 border-emerald-50' : 'bg-white border-emerald-100 hover:border-emerald-200'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleTask(task.id)}
                              className={`transition-colors ${task.completed ? 'text-emerald-500' : 'text-emerald-200 hover:text-emerald-400'}`}
                            >
                              {task.completed ? <CheckSquare size={24} /> : <Square size={24} />}
                            </button>
                            <span className={`flex-1 text-sm ${task.completed ? 'text-emerald-300 line-through' : 'text-emerald-900'}`}>
                              {task.text}
                            </span>
                            <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                              <div className="relative group/date flex items-center">
                                <button 
                                  onClick={(e) => {
                                    const input = e.currentTarget.nextElementSibling as HTMLInputElement | null;
                                    if (input) {
                                      if ('showPicker' in input) {
                                        (input as any).showPicker();
                                      } else {
                                        (input as any).click();
                                      }
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors ${task.dueDate ? 'bg-amber-100 text-amber-600' : 'text-emerald-300 hover:bg-emerald-50'}`}
                                  title={t.dueDate}
                                >
                                  <Calendar size={18} />
                                </button>
                                <input 
                                  type="datetime-local"
                                  value={task.dueDate ? task.dueDate.slice(0, 16) : ''}
                                  onChange={(e) => updateDueDate(task.id, e.target.value ? new Date(e.target.value).toISOString() : '')}
                                  className="absolute inset-0 opacity-0 pointer-events-none"
                                />
                                {task.dueDate && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateDueDate(task.id, '');
                                    }}
                                    className="ml-1 p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title={lang === 'id' ? 'Hapus Deadline' : 'Clear Deadline'}
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                              <button 
                                onClick={() => {
                                  setEditingNotesId(editingNotesId === task.id ? null : task.id);
                                  setTempNotes(task.notes || '');
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${editingNotesId === task.id ? 'bg-emerald-100 text-emerald-600' : 'text-emerald-300 hover:bg-emerald-50'}`}
                                title="Catatan"
                              >
                                <FileText size={18} />
                              </button>
                              <button 
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 text-emerald-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Hapus"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          {task.dueDate && (
                            <div className="flex items-center gap-1.5 px-10">
                              <Clock size={12} className={new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-amber-500'} />
                              <span className={`text-[10px] font-bold ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-amber-600'}`}>
                                {formatDate(task.dueDate)}
                              </span>
                            </div>
                          )}
                          
                          <AnimatePresence>
                            {(editingNotesId === task.id || (task.notes && editingNotesId !== task.id)) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-10 pt-2">
                                  {editingNotesId === task.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={tempNotes}
                                        onChange={(e) => setTempNotes(e.target.value)}
                                        placeholder={t.addNotes}
                                        className="w-full bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 h-24 resize-none text-emerald-900 placeholder-emerald-300"
                                      />
                                      <div className="flex justify-end">
                                        <button
                                          onClick={() => updateNotes(task.id)}
                                          className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                                        >
                                          <Save size={14} />
                                          {t.saveNotes}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-emerald-50/30 rounded-lg p-3 border border-emerald-50">
                                      <p className="text-xs text-emerald-900 whitespace-pre-wrap">
                                        {task.notes}
                                      </p>
                                      {(task.noteAuthorName || task.noteUpdatedAt) && (
                                        <div className="mt-2 pt-2 border-t border-emerald-100/50 flex items-center gap-2 text-[10px] text-emerald-400 font-medium">
                                          <UserIcon size={10} />
                                          <span>
                                            {t.addedBy} <span className="text-emerald-600 font-bold">{task.noteAuthorName}</span>
                                            {task.noteUpdatedAt && ` ${t.at} ${formatDate(task.noteUpdatedAt)}`}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      </main>
      )}

      {/* FABs */}
      {currentEventId && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-40">
          {/* Chat Button (Online only) */}
          {appMode !== 'offline' && (
            <div className="relative group">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { playSound('click'); setShowChat(true); }}
                className="w-16 h-16 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white"
              >
                <MessageSquare size={32} />
                {messages.filter(m => {
                  const lastRead = currentEvent?.lastReadAt?.[user?.uid || '']?.toMillis ? currentEvent.lastReadAt[user?.uid || ''].toMillis() : 0;
                  const msgTime = m.createdAt?.toMillis ? m.createdAt.toMillis() : Date.now();
                  return m.senderId !== user?.uid && msgTime > lastRead;
                }).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {messages.filter(m => {
                      const lastRead = currentEvent?.lastReadAt?.[user?.uid || '']?.toMillis ? currentEvent.lastReadAt[user?.uid || ''].toMillis() : 0;
                      const msgTime = m.createdAt?.toMillis ? m.createdAt.toMillis() : Date.now();
                      return m.senderId !== user?.uid && msgTime > lastRead;
                    }).length > 99 ? '99+' : messages.filter(m => {
                      const lastRead = currentEvent?.lastReadAt?.[user?.uid || '']?.toMillis ? currentEvent.lastReadAt[user?.uid || ''].toMillis() : 0;
                      const msgTime = m.createdAt?.toMillis ? m.createdAt.toMillis() : Date.now();
                      return m.senderId !== user?.uid && msgTime > lastRead;
                    }).length}
                  </span>
                )}
              </motion.button>
              {/* Tooltip */}
              <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                {lang === 'id' ? 'Chat Acara' : 'Event Chat'}
                <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-slate-900" />
              </div>
            </div>
          )}

          {/* AI Suggest FAB (Mobile only) */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { playSound('click'); setShowAiModal(true); }}
            className="sm:hidden w-16 h-16 bg-slate-900 text-emerald-400 rounded-full shadow-2xl flex items-center justify-center border-4 border-white"
          >
            <Sparkles size={32} />
          </motion.button>

          {/* Create Event FAB (Desktop/Tablet mostly) */}
          <div className="hidden sm:flex relative group">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                playSound('click');
                setIsJoining(false);
                setShowCreateEventModal(true);
              }}
              className="w-16 h-16 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white"
            >
              <Plus size={32} />
            </motion.button>
            {/* Tooltip */}
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
              {t.addEventTooltip}
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-slate-900" />
            </div>
          </div>
        </div>
      )}

      {/* Copy Success Toast */}
      <AnimatePresence>
        {showCopySuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check size={14} />
            </div>
            <span className="text-sm font-bold">{lang === 'id' ? 'ID Acara Berhasil Disalin!' : 'Event ID Copied Successfully!'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateEventModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">{isJoining ? t.joinEvent : t.createEvent}</h2>
                  <button onClick={() => { playSound('reverse-click'); setShowCreateEventModal(false); }} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                {appMode !== 'offline' && (
                  <div className="flex gap-4 mb-8 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    <button 
                      onClick={() => setIsJoining(false)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isJoining ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                    >
                      {t.createEvent}
                    </button>
                    <button 
                      onClick={() => setIsJoining(true)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isJoining ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                    >
                      {t.joinEvent}
                    </button>
                  </div>
                )}

                <div className="space-y-6">
                  {!isJoining ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{lang === 'id' ? 'Nama Acara' : 'Event Name'}</label>
                        <input 
                          key="create-event-input"
                          autoFocus
                          type="text"
                          value={newEventName}
                          onChange={(e) => setNewEventName(e.target.value)}
                          placeholder={t.defaultEventName}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              createEvent(newEventName || t.defaultEventName);
                            }
                          }}
                        />
                      </div>

                      <button
                        disabled={isProcessing}
                        onClick={() => { playSound('click'); createEvent(newEventName || t.defaultEventName); }}
                        className={`w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isProcessing && <Loader2 className="animate-spin" size={20} />}
                        {t.createEvent}
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.enterEventId}</label>
                        <input 
                          key="join-event-input"
                          autoFocus
                          type="text"
                          value={joinEventId}
                          onChange={(e) => setJoinEventId(e.target.value)}
                          placeholder="e.g. xYz123..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isProcessing) {
                              playSound('click');
                              joinEvent(joinEventId);
                            }
                          }}
                        />
                      </div>

                      <button
                        disabled={isProcessing}
                        onClick={() => { playSound('click'); joinEvent(joinEventId); }}
                        className={`w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isProcessing && <Loader2 className="animate-spin" size={20} />}
                        {t.joinEvent}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-emerald-100"
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold">{lang === 'id' ? 'Konfirmasi Hapus' : 'Confirm Delete'}</h3>
              </div>
              <p className="text-emerald-900/70 mb-6">
                {t.confirmDeleteCategory} <br/>
                <span className="font-bold text-emerald-900">"{categoryToDelete}"</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { playSound('reverse-click'); setCategoryToDelete(null); }}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => deleteCategory(categoryToDelete)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  {t.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-400">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{t.aiGeneratorTitle}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                            {lang === 'id' ? `Sisa Kuota Gratis: ${aiQuota}` : `Free Quota Left: ${aiQuota}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  <button onClick={() => { playSound('reverse-click'); setShowAiModal(false); }} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.eventType}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(lang === 'id' ? 
                        ['Pernikahan', 'Perusahaan', 'Ulang Tahun', 'Konferensi', 'Konser', 'Perjalanan', 'Hari Besar', 'Sekolah/Kampus', 'Lainnya'] : 
                        ['Wedding', 'Corporate', 'Birthday', 'Conference', 'Concert', 'Travel', 'Holiday', 'School/Campus', 'Other']
                      ).map(type => (
                        <button
                          key={type}
                          onClick={() => setEventType(type as EventType)}
                          className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                            eventType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                    <Wifi size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {t.networkWarning}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{lang === 'id' ? 'Deskripsi Singkat' : 'Short Description'}</label>
                    <textarea 
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      placeholder={t.eventDescPlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-32 resize-none"
                    />
                  </div>

                  <button
                    onClick={() => { playSound('click'); handleAiGenerate(); }}
                    disabled={isGenerating}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {t.generating}
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        {t.generateBtn}
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 p-6 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                  {t.aiDisclaimer}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t.leaveEvent}</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                {t.confirmLeaveEvent}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    setShowLeaveConfirm(false);
                    setEventToLeave(null);
                  }}
                  className="py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  {t.no}
                </button>
                <button 
                  onClick={() => eventToLeave && leaveEvent(eventToLeave)}
                  className="py-3 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  {t.yes}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Chat Modal */}
        <AnimatePresence>
          {showChat && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                className="bg-slate-50 w-full max-w-lg h-[90vh] sm:h-[600px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                {/* Chat Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{lang === 'id' ? 'Chat Acara' : 'Event Chat'}</h3>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{currentEvent?.name}</p>
                    </div>
                  </div>
                  <button onClick={() => { playSound('reverse-click'); setShowChat(false); }} className="text-slate-400 hover:text-slate-600 p-2">
                    <X size={24} />
                  </button>
                </div>

                {/* Chat Messages */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth bg-[#e5ddd5] dark:bg-slate-900/10" 
                  style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: 'overlay' }}
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <MessageSquare size={32} />
                      </div>
                      <p className="text-sm text-slate-500 font-medium">{lang === 'id' ? 'Belum ada pesan. Mulai percakapan!' : 'No messages yet. Start the conversation!'}</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.senderId === user?.uid;
                      const date = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
                      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const dayStr = date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' });
                      
                      const showDate = idx === 0 || (messages[idx-1].createdAt?.toDate ? messages[idx-1].createdAt.toDate().toDateString() : '') !== date.toDateString();

                      return (
                        <React.Fragment key={msg.id || `msg-temp-${idx}`}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <span className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider shadow-sm border border-white/50">
                                {dayStr}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm relative ${isMe ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                              {!isMe && (
                                <p className="text-[10px] font-black text-emerald-600 mb-1 uppercase tracking-tighter">
                                  {msg.senderName}
                                </p>
                              )}
                              
                              {msg.fileUrl && (
                                <div className="mb-2 rounded-xl overflow-hidden border border-black/5">
                                  {msg.fileType?.startsWith('image/') ? (
                                    <img src={msg.fileUrl} alt={msg.fileName} className="w-full h-auto max-h-64 object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className={`p-3 flex items-center gap-3 ${isMe ? 'bg-emerald-600' : 'bg-slate-50'}`}>
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMe ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                                        <FileText size={20} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate">{msg.fileName}</p>
                                        <p className="text-[10px] opacity-70 uppercase">{msg.fileType?.split('/')[1] || 'FILE'}</p>
                                      </div>
                                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`p-2 rounded-lg ${isMe ? 'hover:bg-emerald-500' : 'hover:bg-slate-200'}`}>
                                        <Paperclip size={16} />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}

                              {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                              
                              <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                                <span className="text-[9px] font-medium">{timeStr}</span>
                                {isMe && <Check size={10} />}
                              </div>

                              {/* Delete Button */}
                              {isMe && (
                                <button 
                                  onClick={() => setChatToDelete(msg.id)}
                                  className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover/msg:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                </div>

                {/* Chat Delete Confirmation */}
                <AnimatePresence>
                  {chatToDelete && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-sm">
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-3xl p-6 shadow-2xl max-w-xs w-full text-center"
                      >
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{t.confirmDeleteChat}</h3>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setChatToDelete(null)}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                          >
                            {t.cancel}
                          </button>
                          <button 
                            onClick={() => deleteChatMessage(chatToDelete)}
                            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                          >
                            {t.delete}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Chat Input */}
                <div className="bg-white p-4 border-t border-slate-100 shrink-0">
                  <div className="flex items-end gap-2">
                    <div className="flex gap-1 mb-1">
                      <button 
                        onClick={() => setShowRepairModal(true)}
                        className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        <Paperclip size={20} />
                      </button>
                      <button 
                        onClick={() => setShowRepairModal(true)}
                        className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        <Camera size={20} />
                      </button>
                    </div>
                    
                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-2 flex items-end">
                      <textarea 
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage(chatText);
                          }
                        }}
                        placeholder={lang === 'id' ? 'Ketik pesan...' : 'Type a message...'}
                        className="w-full bg-transparent border-none focus:outline-none text-sm py-1 max-h-32 resize-none"
                        rows={1}
                        style={{ height: 'auto' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                      />
                    </div>

                    <button 
                      onClick={() => sendChatMessage(chatText)}
                      disabled={(!chatText.trim() && !isUploading) || isUploading}
                      className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
                    >
                      {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
    )}
    </>
  );
}

function WorkshopBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40" />
      
      {/* Floor Perspective */}
      <div className="absolute bottom-0 left-0 w-full h-[40%] opacity-[0.05]">
        <svg width="100%" height="100%" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <path d="M0 400 L450 0 L550 0 L1000 400" fill="none" stroke="currentColor" className="text-slate-900" strokeWidth="1" />
          <line x1="200" y1="400" x2="470" y2="0" stroke="currentColor" className="text-slate-900" strokeWidth="0.5" />
          <line x1="800" y1="400" x2="530" y2="0" stroke="currentColor" className="text-slate-900" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="1000" y2="100" stroke="currentColor" className="text-slate-900" strokeWidth="0.5" />
          <line x1="0" y1="250" x2="1000" y2="250" stroke="currentColor" className="text-slate-900" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Left Shelves Silhouette */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 0.1, x: 0 }}
        transition={{ duration: 1.5 }}
        className="absolute left-0 bottom-0 w-[25%] h-[70%] text-slate-900"
      >
        <svg width="100%" height="100%" viewBox="0 0 200 600" preserveAspectRatio="xMinYMax meet">
          <rect x="20" y="50" width="10" height="550" fill="currentColor" />
          <rect x="160" y="50" width="10" height="550" fill="currentColor" />
          {[150, 250, 350, 450, 550].map(y => (
            <g key={y}>
              <rect x="20" y={y} width="150" height="8" fill="currentColor" />
              {/* Green Ornaments on Shelves */}
              <circle cx={40 + (y % 100)} cy={y - 10} r="4" fill="#10b981" opacity="0.8" />
            </g>
          ))}
          {/* Boxes on shelves */}
          <rect x="40" y="510" width="40" height="30" fill="currentColor" opacity="0.6" />
          <rect x="90" y="500" width="50" height="40" fill="currentColor" opacity="0.4" />
          <rect x="50" y="410" width="80" height="30" fill="currentColor" opacity="0.5" />
        </svg>
      </motion.div>

      {/* Right Workbench Silhouette */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.08, x: 0 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        className="absolute right-0 bottom-0 w-[30%] h-[60%] text-slate-900"
      >
        <svg width="100%" height="100%" viewBox="0 0 300 500" preserveAspectRatio="xMaxYMax meet">
          <rect x="0" y="300" width="280" height="15" fill="currentColor" />
          <rect x="20" y="315" width="10" height="185" fill="currentColor" />
          <rect x="250" y="315" width="10" height="185" fill="currentColor" />
          {/* Hanging tools */}
          <rect x="50" y="100" width="4" height="60" fill="currentColor" opacity="0.5" />
          <circle cx="52" cy="170" r="8" fill="currentColor" opacity="0.5" />
          <rect x="100" y="80" width="6" height="80" fill="currentColor" opacity="0.4" />
          <rect x="150" y="120" width="5" height="40" fill="currentColor" opacity="0.6" />
          {/* Green Ornaments on Workbench */}
          <circle cx="60" cy="285" r="5" fill="#10b981" opacity="0.6" />
          <circle cx="220" cy="285" r="5" fill="#10b981" opacity="0.6" />
        </svg>
      </motion.div>

      {/* Person Checking Checklist Silhouette */}
      <motion.div
        animate={{ 
          opacity: [0.04, 0.06, 0.04],
          x: [0, 3, 0],
          y: [0, -1, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[15%] left-[40%] w-32 h-64 text-emerald-900"
      >
        <svg viewBox="0 0 100 200" fill="currentColor">
          {/* Head */}
          <circle cx="50" cy="30" r="14" />
          {/* Body */}
          <path d="M35 50 Q50 45 65 50 L70 120 L60 120 L55 185 L45 185 L40 120 L30 120 Z" />
          
          {/* Left Arm holding Clipboard */}
          <path d="M35 60 L20 90 L30 100" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
          {/* Clipboard */}
          <rect x="10" y="95" width="25" height="35" rx="2" fill="currentColor" opacity="0.8" />
          <rect x="18" y="92" width="10" height="5" rx="1" fill="currentColor" />
          
          {/* Right Arm Checking (Animated) */}
          <motion.g
            animate={{ rotate: [0, -10, 0], x: [0, 2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M65 60 L85 85" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
            {/* Pen/Hand */}
            <path d="M85 85 L80 95" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Green Checkmark Effect */}
            <motion.path 
              d="M82 100 L85 105 L92 95" 
              stroke="#10b981" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none"
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.g>
        </svg>
      </motion.div>

      {/* Floating Green Particles (Ornaments) */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400 rounded-full"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%` 
            }}
            animate={{ 
              y: [0, -40, 0],
              opacity: [0, 0.4, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 5 + Math.random() * 5, 
              repeat: Infinity, 
              delay: Math.random() * 5,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Subtle Light Beams */}
      <div className="absolute inset-0">
        <motion.div 
          animate={{ opacity: [0.1, 0.2, 0.1], x: [-20, 20, -20] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-emerald-200/20 to-transparent rotate-12 blur-3xl" 
        />
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05], x: [20, -20, 20] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-0 right-1/3 w-48 h-full bg-gradient-to-b from-blue-200/10 to-transparent -rotate-12 blur-3xl" 
        />
      </div>
    </div>
  );
}

function CleanBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50/50" />
      
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/20 rounded-full blur-[120px]" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <div className="w-full max-w-4xl grid grid-cols-3 gap-8 p-12">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square border-2 border-slate-900 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function DiscussionBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 to-white opacity-50" />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[400px] sm:h-[500px] flex items-center justify-center"
      >
        {/* The Table - Central Anchor */}
        <div className="absolute bottom-24 sm:bottom-32 w-[300px] sm:w-[500px] h-[80px] sm:h-[140px] bg-emerald-100/80 rounded-[100%] border-b-8 border-emerald-200/50 z-10 shadow-2xl flex items-center justify-center">
          {/* Papers on table */}
          <motion.div 
            animate={{ rotate: [5, 10, 5], y: [0, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-12 h-16 sm:w-20 sm:h-24 bg-white/40 rounded-sm shadow-sm mr-10 sm:mr-16 -mt-4 rotate-[5deg]" 
          />
          <motion.div 
            animate={{ rotate: [-10, -15, -10], y: [0, 2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-10 sm:w-24 sm:h-16 bg-white/30 rounded-sm shadow-sm ml-8 sm:ml-12 mt-2 -rotate-[10deg]" 
          />
        </div>
        
        {/* Person 1 - Left (Pointing & Explaining) */}
        <div className="absolute bottom-28 sm:bottom-36 left-[2%] sm:left-[5%] z-20 scale-75 sm:scale-100">
           <svg width="220" height="200" viewBox="0 0 220 200">
             <circle cx="70" cy="40" r="20" fill="#059669" />
             <path d="M40 200C40 150 55 100 70 100C85 100 100 150 100 200H40Z" fill="#059669" />
             {/* Arm Pointing at Table */}
             <motion.path 
               d="M90 120 L165 105" 
               stroke="#059669" 
               strokeWidth="14" 
               strokeLinecap="round"
               animate={{ 
                 rotate: [0, -20, 0],
                 x: [0, 10, 0],
                 y: [0, -5, 0]
               }}
               transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
               style={{ transformOrigin: '90px 120px' }}
             />
             {/* Speech Bubble - Moved further right and up */}
             <motion.g
               initial={{ opacity: 0, scale: 0, y: 20 }}
               animate={{ 
                 opacity: [0, 1, 1, 0], 
                 scale: [0.5, 1.1, 1, 0.5],
                 y: [20, 0, 0, -20],
                 x: [30, 50, 50, 30]
               }}
               transition={{ duration: 4, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
             >
               <path d="M100 20 Q135 20 135 45 Q135 70 100 70 L90 85 L90 70 Q65 70 65 45 Q65 20 100 20" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
               <motion.path 
                 d="M85 45 L115 45 M85 55 L105 55" 
                 stroke="#10b981" 
                 strokeWidth="2" 
                 strokeLinecap="round"
                 animate={{ opacity: [0.3, 1, 0.3] }}
                 transition={{ duration: 1.5, repeat: Infinity }}
               />
             </motion.g>
           </svg>
        </div>

        {/* Person 2 - Back Left (Listening & Nodding) */}
        <div className="absolute bottom-40 sm:bottom-48 left-[20%] sm:left-[25%] z-0 scale-75 sm:scale-100">
           <motion.svg 
             width="100" height="150" viewBox="0 0 100 150"
             animate={{ 
               y: [0, 5, 0],
               rotate: [-1, 1, -1]
             }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
           >
             <circle cx="50" cy="30" r="16" fill="#6ee7b7" />
             <path d="M30 150C30 110 40 80 50 80C60 80 70 110 70 150H30Z" fill="#6ee7b7" />
           </motion.svg>
        </div>

        {/* Person 3 - Back Right (Taking Notes) */}
        <div className="absolute bottom-40 sm:bottom-48 right-[20%] sm:right-[25%] z-0 scale-75 sm:scale-100">
           <svg width="100" height="150" viewBox="0 0 100 150">
             <circle cx="50" cy="30" r="16" fill="#6ee7b7" />
             <path d="M30 150C30 110 40 80 50 80C60 80 70 110 70 150H30Z" fill="#6ee7b7" />
             {/* Arm Writing */}
             <motion.path 
               d="M40 110 L20 135" 
               stroke="#059669" 
               strokeWidth="10" 
               strokeLinecap="round"
               animate={{ 
                 x: [-3, 5, -3],
                 y: [-2, 3, -2],
                 rotate: [-5, 5, -5]
               }}
               transition={{ duration: 0.3, repeat: Infinity }}
               style={{ transformOrigin: '40px 110px' }}
             />
             {/* Small Pen */}
             <motion.line 
               x1="20" y1="135" x2="12" y2="142" 
               stroke="#064e3b" 
               strokeWidth="3"
               animate={{ x: [-3, 5, -3], y: [-2, 3, -2] }}
               transition={{ duration: 0.3, repeat: Infinity }}
             />
           </svg>
        </div>

        {/* Person 4 - Right (Pointing Back & Disagreeing/Commenting) */}
        <div className="absolute bottom-28 sm:bottom-36 right-[2%] sm:right-[5%] z-20 scale-75 sm:scale-100">
           <svg width="220" height="200" viewBox="0 0 220 200">
             <circle cx="150" cy="40" r="20" fill="#059669" />
             <path d="M120 200C120 150 135 100 150 100C165 100 180 150 180 200H120Z" fill="#059669" />
             {/* Arm Pointing Back */}
             <motion.path 
               d="M130 120 L50 115" 
               stroke="#059669" 
               strokeWidth="14" 
               strokeLinecap="round"
               animate={{ 
                 rotate: [0, 20, 0],
                 x: [0, -10, 0],
                 y: [0, -5, 0]
               }}
               transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
               style={{ transformOrigin: '130px 120px' }}
             />
             {/* Speech Bubble - Moved further left */}
             <motion.g
               initial={{ opacity: 0, scale: 0, x: -20 }}
               animate={{ 
                 opacity: [0, 1, 1, 0], 
                 scale: [0.5, 1, 1, 0.5],
                 x: [-100, -80, -80, -60]
               }}
               transition={{ duration: 4.5, repeat: Infinity, times: [0.2, 0.4, 0.8, 1], delay: 1.5 }}
             >
               <path d="M40 20 Q5 20 5 45 Q5 70 40 70 L50 85 L50 70 Q75 70 75 45 Q75 20 40 20" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
               <motion.path 
                 d="M20 45 L60 45" 
                 stroke="#10b981" 
                 strokeWidth="3" 
                 strokeLinecap="round"
                 animate={{ scaleX: [0.8, 1, 0.8] }}
                 transition={{ duration: 2, repeat: Infinity }}
               />
             </motion.g>
           </svg>
        </div>
      </motion.div>

      {/* Floating Decorative Elements */}
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={`bg-circle-${i}`}
          animate={{ 
            y: [-40, 40, -40],
            x: [-30, 30, -30],
            opacity: [0.05, 0.1, 0.05],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full blur-[80px]"
          style={{
            width: 200 + i * 100,
            height: 200 + i * 100,
            left: `${i * 25 - 20}%`,
            top: `${i * 20 - 10}%`,
            backgroundColor: i % 2 === 0 ? '#10b981' : '#6ee7b7',
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'id');
  return (
    <ErrorBoundary lang={lang}>
      <ChecklistApp />
    </ErrorBoundary>
  );
}