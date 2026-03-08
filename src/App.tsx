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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Category, EventType, Event } from './types';
import { generateEventChecklist } from './services/geminiService';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
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
    addEventTooltip: 'Tambah acara baru',
    deleteEvent: 'Hapus Acara',
    completeEvent: 'Selesaikan Acara',
    uncompleteEvent: 'Buka Kembali Acara',
    confirmDeleteEvent: 'Apakah Anda yakin ingin menghapus acara ini? Semua tugas akan dihapus selamanya.',
    createPrivateChecklist: 'Buat Checklist Pribadiku',
    dueDate: 'Tenggat Waktu',
    noDueDate: 'Tanpa Tenggat',
    addedBy: 'Ditambahkan oleh',
    at: 'pada',
    notificationsEnabled: 'Notifikasi Aktif',
    enableNotifications: 'Aktifkan Notifikasi',
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
    nickname: 'Nickname',
    save: 'Save',
    editNickname: 'Edit Nickname',
    ownerColor: 'Owner Color',
    memberColor: 'Member Color',
    reload: 'Reload',
    addEventTooltip: 'Add new event',
    deleteEvent: 'Delete Event',
    completeEvent: 'Complete Event',
    uncompleteEvent: 'Reopen Event',
    confirmDeleteEvent: 'Are you sure you want to delete this event? All tasks will be permanently removed.',
    createPrivateChecklist: 'Create My Private Checklist',
    dueDate: 'Due Date',
    noDueDate: 'No Due Date',
    addedBy: 'Added by',
    at: 'at',
    notificationsEnabled: 'Notifications Enabled',
    enableNotifications: 'Enable Notifications',
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
      try {
        const parsed = JSON.parse(errorInfo || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          displayMessage = t.permissionError;
        }
      } catch (e) {}

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-bold mb-2">{t.errorTitle}</h2>
            <p className="text-slate-600 mb-6 text-sm">{displayMessage}</p>
          </div>
        </div>
      );
    }
    return children;
  }
}

function AppLogo({ size = 40, className = "" }: { size?: number, className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Circular Background - Dark Slate */}
      <div className="absolute inset-0 bg-slate-900 rounded-full shadow-lg" />
      
      {/* Clipboard - White with Emerald border */}
      <div className="relative w-[58%] h-[72%] bg-white rounded-md border-[2px] border-emerald-600 flex flex-col p-[10%] gap-[8%] overflow-hidden shadow-sm">
        {/* Clipboard Clip - Grey */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[45%] h-[14%] bg-slate-400 rounded-b-md shadow-inner" />
        
        {/* Checklist items */}
        <div className="mt-[20%] space-y-[15%]">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-[12%]">
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
      
      <div className="absolute bottom-12 text-emerald-100/60 text-xs font-medium tracking-[0.2em] uppercase">
        Check. Track. Done.
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
  const [eventType, setEventType] = useState<EventType>(lang === 'id' ? 'Perusahaan' : 'Pernikahan');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [activeCategory, setActiveCategory] = useState(t.catPreEvent);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
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
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom-categories');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('custom-categories', JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  // Splash Screen Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

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
        if (!currentEventId && parsedEvents.length > 0) {
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
    const q = query(collection(db, 'events'), where(`members.${user.uid}`, '!=', null));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(newEvents);
      
      // Only auto-select if no event is currently selected
      if (newEvents.length > 0 && !currentEventId) {
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
    const uniqueCats = Array.from(new Set(tasks.map(t => t.category)));
    const base = getCategories(lang).map(c => c.name);
    return Array.from(new Set([...base, ...uniqueCats, ...customCategories]));
  }, [tasks, lang, customCategories]);

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
    if (!user) return;
    
    const newEventData = {
      name,
      ownerId: user.uid,
      ownerName: user.displayName || 'User',
      ownerEmail: user.email || '',
      members: { [user.uid]: 'owner' },
      nicknames: { [user.uid]: user.displayName || 'User' },
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
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'events'), newEventData);
      setCurrentEventId(docRef.id);
      setShowCreateEventModal(false);
      setNewEventName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'events');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  const joinEvent = async (id: string) => {
    if (!user || !id.trim()) return;
    
    if (appMode === 'offline') {
      alert(lang === 'id' ? 'Gabung acara hanya tersedia dalam Mode Organisasi (Online)' : 'Joining events is only available in Organization Mode (Online)');
      return;
    }

    try {
      const eventRef = doc(db, 'events', id.trim());
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) {
        alert(lang === 'id' ? 'Acara tidak ditemukan. Pastikan ID benar.' : 'Event not found. Please check the ID.');
        return;
      }

      const eventData = eventSnap.data();
      if (eventData.members && eventData.members[user.uid]) {
        alert(lang === 'id' ? 'Anda sudah bergabung dalam acara ini.' : 'You are already a member of this event.');
        setCurrentEventId(id.trim());
        setShowCreateEventModal(false);
        setJoinEventId('');
        return;
      }

      await updateDoc(eventRef, {
        [`members.${user.uid}`]: 'member',
        [`nicknames.${user.uid}`]: user.displayName || 'User',
        updatedAt: serverTimestamp()
      });
      setCurrentEventId(id.trim());
      setShowCreateEventModal(false);
      setJoinEventId('');
      alert(lang === 'id' ? 'Berhasil bergabung ke acara!' : 'Successfully joined the event!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'events');
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
      const q = query(collection(db, 'tasks'), where('category', '==', catName));
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
      
      if (appMode === 'offline') {
        const newTasks: Task[] = [];
        for (const group of result) {
          for (const taskText of group.tasks) {
            newTasks.push({
              id: Math.random().toString(36).substr(2, 9),
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
      return;
    }

    try {
      await updateDoc(doc(db, 'events', currentEventId), {
        [`nicknames.${user.uid}`]: tempNickname
      });
      setIsEditingNickname(false);
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

  const currentEvent = useMemo(() => events.find(e => e.id === currentEventId), [events, currentEventId]);

  const progress = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
    : 0;

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
          <DiscussionBackground />
          
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
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 text-emerald-900 font-sans selection:bg-emerald-200 pb-12">
          {/* Header */}
          <header className="bg-emerald-600 border-b border-emerald-700 sticky top-0 z-30 text-white shadow-lg">
            <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AppLogo size={44} />
                <div className="max-w-[180px] sm:max-w-none">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white truncate leading-tight">
                      {currentEvent?.name || t.appName}
                    </h1>
                    {currentEvent && (
                      <button 
                        onClick={() => copyToClipboard(currentEvent.id)}
                        className="p-1 hover:bg-emerald-500 rounded-md transition-colors"
                        title={t.copyId}
                      >
                        <Copy size={14} className="text-emerald-100" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-emerald-100 uppercase tracking-[0.15em] font-bold opacity-80 leading-relaxed">
                    {currentEvent ? (appMode === 'offline' ? 'Mode Offline' : `${t.ledBy} ${currentEvent.nicknames?.[currentEvent.ownerId] || currentEvent.ownerName}`) : t.tagline}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => setShowAiModal(true)}
                  className="flex items-center gap-2 bg-slate-900 text-emerald-400 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                  <Sparkles size={16} className="text-emerald-400" />
                  <span>{t.aiSuggest}</span>
                </button>
                
                <div className="h-8 w-px bg-emerald-500/50 mx-1" />
                
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <div className="relative">
                      <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-10 h-10 rounded-full border-2 border-emerald-300 shadow-md" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
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
                              {currentEvent && (
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
                                      <span className={`truncate ${ev.completed ? 'line-through opacity-50' : ''}`}>{ev.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {/* Action Buttons */}
                                      <div className="flex items-center gap-1 opacity-0 group-hover/ev:opacity-100 transition-opacity">
                                        {ev.ownerId === user.uid && (
                                          <>
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
                                      </div>

                                      {currentEventId === ev.id && (
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
                                      {ev.ownerId === user.uid && <Star size={12} className={currentEventId === ev.id ? 'text-emerald-200' : 'text-emerald-400'} />}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {currentEvent && (
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
                                  {Object.entries(currentEvent.members).map(([uid, role]) => (
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
                  {lang === 'id' 
                    ? 'Buat checklist baru atau bergabung ke acara tim untuk mulai mengelola persiapan Anda.' 
                    : 'Create a new checklist or join a team event to start managing your preparations.'}
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setIsJoining(false);
                      setShowCreateEventModal(true);
                    }}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                  >
                    <Plus size={24} />
                    {t.createEvent}
                  </button>
                  <button
                    onClick={() => {
                      setIsJoining(true);
                      setShowCreateEventModal(true);
                    }}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                  >
                    <Users size={24} />
                    {t.joinEvent}
                  </button>
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
              <span className="text-sm text-emerald-600 mb-1">{tasks.filter(t => t.completed).length}/{tasks.length} {t.tasks}</span>
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
              {categories.map(cat => (
                <div key={cat} className="group flex items-center gap-1">
                  <button
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === cat ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-emerald-800/60 hover:bg-emerald-50/50'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-xs bg-emerald-50 px-2 py-0.5 rounded-full text-emerald-500">
                      {tasks.filter(t => t.category === cat).length}
                    </span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCategoryToDelete(cat); }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-emerald-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title={lang === 'id' ? 'Hapus Kategori' : 'Delete Category'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
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
                    onClick={handleAddCategory}
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
                onClick={() => setIsAddingCategory(true)}
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
                        onClick={() => setShowAiModal(true)}
                        className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all"
                      >
                        <Sparkles size={16} />
                        {t.aiSuggest}
                      </button>
                    </motion.div>
                  ) : (
                    tasks
                      .filter(t => t.category === activeCategory)
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
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <div className="relative group/date">
                                <button 
                                  className={`p-1.5 rounded-lg transition-colors ${task.dueDate ? 'bg-amber-100 text-amber-600' : 'text-emerald-300 hover:bg-emerald-50'}`}
                                  title={t.dueDate}
                                >
                                  <Calendar size={18} />
                                </button>
                                <input 
                                  type="datetime-local"
                                  value={task.dueDate ? task.dueDate.slice(0, 16) : ''}
                                  onChange={(e) => updateDueDate(task.id, e.target.value ? new Date(e.target.value).toISOString() : '')}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
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
                                {new Date(task.dueDate).toLocaleString()}
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
                                            {task.noteUpdatedAt && ` ${t.at} ${new Date(task.noteUpdatedAt).toLocaleString()}`}
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
          {/* AI Suggest FAB (Mobile only) */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAiModal(true)}
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
                  <button onClick={() => setShowCreateEventModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

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
                        onClick={() => createEvent(newEventName || t.defaultEventName)}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-700 transition-all shadow-lg"
                      >
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
                            if (e.key === 'Enter') {
                              joinEvent(joinEventId);
                            }
                          }}
                        />
                      </div>

                      <button
                        onClick={() => joinEvent(joinEventId)}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold hover:bg-slate-800 transition-all shadow-lg"
                      >
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
                  onClick={() => setCategoryToDelete(null)}
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
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-400">
                      <Sparkles size={20} />
                    </div>
                    <h2 className="text-xl font-bold">{t.aiGeneratorTitle}</h2>
                  </div>
                  <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.eventType}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(lang === 'id' ? ['Perusahaan', 'Pernikahan', 'Ulang Tahun', 'Konferensi', 'Konser', 'Lainnya'] : ['Corporate', 'Wedding', 'Birthday', 'Conference', 'Concert', 'Other']).map(type => (
                        <button
                          key={type}
                          onClick={() => setEventType(type as EventType)}
                          className={`px-3 py-2 rounded-xl text-sm border transition-all ${
                            eventType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
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
                    onClick={handleAiGenerate}
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
      </AnimatePresence>
    </div>
    )}
    </>
  );
}

function DiscussionBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 to-white opacity-50" />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] flex items-center justify-center"
      >
        {/* The Table - Central Anchor */}
        <div className="absolute bottom-32 w-[500px] h-[140px] bg-emerald-100/80 rounded-[100%] border-b-8 border-emerald-200/50 z-10 shadow-2xl flex items-center justify-center">
          {/* Papers on table */}
          <motion.div 
            animate={{ rotate: [5, 7, 5] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-20 h-24 bg-white/40 rounded-sm shadow-sm mr-16 -mt-4 rotate-[5deg]" 
          />
          <motion.div 
            animate={{ rotate: [-10, -8, -10] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="w-24 h-16 bg-white/30 rounded-sm shadow-sm ml-12 mt-2 -rotate-[10deg]" 
          />
        </div>
        
        {/* Person 1 - Left (Pointing & Explaining) */}
        <div className="absolute bottom-36 left-[5%] z-20">
           <svg width="140" height="200" viewBox="0 0 140 200">
             <circle cx="70" cy="40" r="20" fill="#4ade80" />
             <path d="M40 200C40 150 55 100 70 100C85 100 100 150 100 200H40Z" fill="#4ade80" />
             {/* Arm Pointing at Table */}
             <motion.path 
               d="M90 120 L130 110" 
               stroke="#4ade80" 
               strokeWidth="12" 
               strokeLinecap="round"
               animate={{ 
                 rotate: [0, -15, 0],
                 x: [0, 10, 0],
                 y: [0, -5, 0]
               }}
               transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
               style={{ transformOrigin: '90px 120px' }}
             />
             {/* Speech Bubble */}
             <motion.g
               initial={{ opacity: 0, scale: 0 }}
               animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }}
               transition={{ duration: 5, repeat: Infinity, times: [0.1, 0.3, 0.7, 0.9] }}
             >
               <path d="M100 20 Q130 20 130 45 Q130 70 100 70 L90 85 L90 70 Q70 70 70 45 Q70 20 100 20" fill="#bbf7d0" />
               <circle cx="90" cy="45" r="2" fill="#4ade80" />
               <circle cx="100" cy="45" r="2" fill="#4ade80" />
               <circle cx="110" cy="45" r="2" fill="#4ade80" />
             </motion.g>
           </svg>
        </div>

        {/* Person 2 - Back Left (Listening & Nodding) */}
        <div className="absolute bottom-48 left-[25%] z-0">
           <motion.svg 
             width="100" height="150" viewBox="0 0 100 150"
             animate={{ y: [0, 3, 0] }}
             transition={{ duration: 3, repeat: Infinity }}
           >
             <circle cx="50" cy="30" r="16" fill="#bbf7d0" />
             <path d="M30 150C30 110 40 80 50 80C60 80 70 110 70 150H30Z" fill="#bbf7d0" />
           </motion.svg>
        </div>

        {/* Person 3 - Back Right (Taking Notes) */}
        <div className="absolute bottom-48 right-[25%] z-0">
           <svg width="100" height="150" viewBox="0 0 100 150">
             <circle cx="50" cy="30" r="16" fill="#bbf7d0" />
             <path d="M30 150C30 110 40 80 50 80C60 80 70 110 70 150H30Z" fill="#bbf7d0" />
             {/* Arm Writing */}
             <motion.path 
               d="M40 110 L20 130" 
               stroke="#4ade80" 
               strokeWidth="8" 
               strokeLinecap="round"
               animate={{ 
                 x: [-2, 4, -2],
                 y: [-1, 2, -1]
               }}
               transition={{ duration: 0.4, repeat: Infinity }}
             />
             {/* Small Pen */}
             <motion.line 
               x1="20" y1="130" x2="15" y2="135" 
               stroke="#10b981" 
               strokeWidth="2"
               animate={{ x: [-2, 4, -2], y: [-1, 2, -1] }}
               transition={{ duration: 0.4, repeat: Infinity }}
             />
           </svg>
        </div>

        {/* Person 4 - Right (Pointing Back & Disagreeing/Commenting) */}
        <div className="absolute bottom-36 right-[5%] z-20">
           <svg width="140" height="200" viewBox="0 0 140 200">
             <circle cx="70" cy="40" r="20" fill="#4ade80" />
             <path d="M40 200C40 150 55 100 70 100C85 100 100 150 100 200H40Z" fill="#4ade80" />
             {/* Arm Pointing Back */}
             <motion.path 
               d="M50 120 L10 110" 
               stroke="#4ade80" 
               strokeWidth="12" 
               strokeLinecap="round"
               animate={{ 
                 rotate: [0, 15, 0],
                 x: [0, -10, 0],
                 y: [0, -5, 0]
               }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               style={{ transformOrigin: '50px 120px' }}
             />
             {/* Speech Bubble */}
             <motion.g
               initial={{ opacity: 0, scale: 0 }}
               animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }}
               transition={{ duration: 4, repeat: Infinity, times: [0.2, 0.4, 0.8, 1], delay: 2 }}
             >
               <path d="M40 20 Q10 20 10 45 Q10 70 40 70 L50 85 L50 70 Q70 70 70 45 Q70 20 40 20" fill="#bbf7d0" />
               <path d="M25 45 L55 45" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
             </motion.g>
           </svg>
        </div>
      </motion.div>

      {/* Floating Decorative Elements */}
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={`circle-${i}`}
          animate={{ 
            y: [-30, 30, -30],
            x: [-20, 20, -20],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full blur-[60px]"
          style={{
            width: 150 + i * 80,
            height: 150 + i * 80,
            left: `${i * 25 - 15}%`,
            top: `${i * 15}%`,
            backgroundColor: i % 2 === 0 ? '#4ade80' : '#bbf7d0',
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
