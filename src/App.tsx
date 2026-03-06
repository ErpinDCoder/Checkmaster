/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Calendar, 
  LayoutGrid,
  ClipboardList,
  Loader2,
  X,
  FileText,
  Save,
  LogIn,
  LogOut,
  User as UserIcon,
  AlertCircle,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Category, EventType } from './types';
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
  serverTimestamp
} from 'firebase/firestore';

type Language = 'id' | 'en';

const TRANSLATIONS = {
  id: {
    appName: 'Checkmaster',
    tagline: 'Kolaborasi Realtime',
    aiSuggest: 'Saran AI',
    overallProgress: 'Progres Keseluruhan',
    tasks: 'tugas',
    categories: 'Kategori',
    addTaskPlaceholder: 'Tambah tugas baru...',
    noTasks: 'Belum ada tugas di kategori ini.',
    addNotes: 'Tambahkan catatan detail...',
    saveNotes: 'Simpan Catatan',
    aiGeneratorTitle: 'Generator Tugas AI',
    eventType: 'Jenis Acara',
    eventDescPlaceholder: 'Contoh: Konferensi teknologi untuk 200 orang di Jakarta...',
    generating: 'Menghasilkan Checklist...',
    generateBtn: 'Hasilkan Checklist Profesional',
    aiDisclaimer: 'Gemini akan menganalisis detail acara Anda dan menyarankan daftar tugas komprehensif.',
    loginTitle: 'Checkmaster',
    loginDesc: 'Kelola checklist acara Anda secara realtime bersama tim. Masuk untuk memulai kolaborasi.',
    loginBtn: 'Masuk dengan Google',
    errorTitle: 'Ups! Terjadi Kesalahan',
    errorReload: 'Muat Ulang Halaman',
    permissionError: 'Anda tidak memiliki izin untuk melakukan aksi ini. Silakan login kembali.',
    defaultEventName: 'Acara Baru Saya',
    catVenue: 'Lokasi & Tempat',
    catCatering: 'Konsumsi',
    catMarketing: 'Pemasaran & PR',
    catLogistics: 'Logistik & Teknis',
    catEntertainment: 'Hiburan',
    catAdmin: 'Admin & Keuangan',
  },
  en: {
    appName: 'Checkmaster',
    tagline: 'Real-time Collaboration',
    aiSuggest: 'AI Suggest',
    overallProgress: 'Overall Progress',
    tasks: 'tasks',
    categories: 'Categories',
    addTaskPlaceholder: 'Add a new task...',
    noTasks: 'No tasks in this category yet.',
    addNotes: 'Add detailed notes...',
    saveNotes: 'Save Notes',
    aiGeneratorTitle: 'AI Task Generator',
    eventType: 'Event Type',
    eventDescPlaceholder: 'e.g. A 200-person tech conference in Jakarta...',
    generating: 'Generating Checklist...',
    generateBtn: 'Generate Professional Checklist',
    aiDisclaimer: 'Gemini will analyze your event details and suggest a comprehensive list of tasks.',
    loginTitle: 'Checkmaster',
    loginDesc: 'Manage your event checklist in real-time with your team. Sign in to start collaborating.',
    loginBtn: 'Sign in with Google',
    errorTitle: 'Oops! Something went wrong',
    errorReload: 'Reload Page',
    permissionError: 'You do not have permission to perform this action. Please sign in again.',
    defaultEventName: 'My New Event',
    catVenue: 'Venue & Location',
    catCatering: 'Food & Beverage',
    catMarketing: 'Marketing & PR',
    catLogistics: 'Logistics & Tech',
    catEntertainment: 'Entertainment',
    catAdmin: 'Admin & Finance',
  }
};

const getCategories = (lang: Language): Category[] => [
  { id: 'venue', name: TRANSLATIONS[lang].catVenue, icon: 'MapPin' },
  { id: 'catering', name: TRANSLATIONS[lang].catCatering, icon: 'Utensils' },
  { id: 'marketing', name: TRANSLATIONS[lang].catMarketing, icon: 'Megaphone' },
  { id: 'logistics', name: TRANSLATIONS[lang].catLogistics, icon: 'Truck' },
  { id: 'entertainment', name: TRANSLATIONS[lang].catEntertainment, icon: 'Music' },
  { id: 'admin', name: TRANSLATIONS[lang].catAdmin, icon: 'CreditCard' },
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
            <button 
              onClick={() => window.location.reload()}
              className="bg-slate-900 text-white px-6 py-2 rounded-full font-medium"
            >
              {t.errorReload}
            </button>
          </div>
        </div>
      );
    }
    return children;
  }
}

function ChecklistApp() {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'id');
  const t = TRANSLATIONS[lang];
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [eventName, setEventName] = useState(() => localStorage.getItem('event-name') || t.defaultEventName);
  const [eventType, setEventType] = useState<EventType>(lang === 'id' ? 'Perusahaan' : 'Pernikahan');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [activeCategory, setActiveCategory] = useState(t.catVenue);
  const [showAiModal, setShowAiModal] = useState(false);
  const [eventDesc, setEventDesc] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!isAuthReady || !user) {
      setTasks([]);
      return;
    }

    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(newTasks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  useEffect(() => {
    localStorage.setItem('event-name', eventName);
  }, [eventName]);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(tasks.map(t => t.category)));
    const base = getCategories(lang).map(c => c.name);
    return Array.from(new Set([...base, ...uniqueCats]));
  }, [tasks, lang]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
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
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const addTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskText.trim() || !user) return;
    
    try {
      await addDoc(collection(db, 'tasks'), {
        text: newTaskText,
        completed: false,
        category: activeCategory,
        notes: '',
        uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewTaskText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const updateNotes = async (id: string) => {
    try {
      await updateDoc(doc(db, 'tasks', id), { 
        notes: tempNotes,
        updatedAt: serverTimestamp()
      });
      setEditingNotesId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const handleAiGenerate = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const result = await generateEventChecklist(eventType, eventDesc || eventName, lang);
      
      for (const group of result) {
        for (const taskText of group.tasks) {
          await addDoc(collection(db, 'tasks'), {
            text: taskText,
            completed: false,
            category: group.category,
            notes: '',
            uid: user.uid,
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

  const progress = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
    : 0;

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-100 mx-auto mb-8">
            <ClipboardList size={40} />
          </div>
          <h1 className="text-3xl font-bold mb-3">{t.loginTitle}</h1>
          <p className="text-slate-500 mb-10 leading-relaxed">
            {t.loginDesc}
          </p>
          <button 
            onClick={login}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <LogIn size={20} />
            {t.loginBtn}
          </button>
          
          <div className="mt-8 flex justify-center gap-2">
            <button onClick={() => setLang('id')} className={`text-xs px-3 py-1 rounded-full border ${lang === 'id' ? 'bg-slate-100 border-slate-300 font-bold' : 'border-transparent text-slate-400'}`}>ID</button>
            <button onClick={() => setLang('en')} className={`text-xs px-3 py-1 rounded-full border ${lang === 'en' ? 'bg-slate-100 border-slate-300 font-bold' : 'border-transparent text-slate-400'}`}>EN</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-slate-900 font-sans selection:bg-emerald-100 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <ClipboardList size={24} />
            </div>
            <div>
              <input 
                type="text" 
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="text-xl font-semibold bg-transparent border-none focus:ring-0 p-0 w-full"
                placeholder={t.defaultEventName}
              />
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t.tagline}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-50 rounded-full p-1 border border-slate-200">
              <button onClick={() => setLang('id')} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${lang === 'id' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>ID</button>
              <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${lang === 'en' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>EN</button>
            </div>

            <button 
              onClick={() => setShowAiModal(true)}
              className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
              <Sparkles size={16} className="text-emerald-400" />
              {t.aiSuggest}
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3">
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-slate-200" />
              <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Progress */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">{t.overallProgress}</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-4xl font-light">{progress}%</span>
              <span className="text-sm text-slate-500 mb-1">{tasks.filter(t => t.completed).length}/{tasks.length} {t.tasks}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest px-2 mb-3">{t.categories}</h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategory === cat ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
                    {tasks.filter(t => t.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Task List */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
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
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button 
                  type="submit"
                  className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
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
                      className="text-center py-12 text-slate-400"
                    >
                      <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
                      <p>{t.noTasks}</p>
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
                            task.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-emerald-200'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleTask(task.id)}
                              className={`transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-400'}`}
                            >
                              {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                            </button>
                            <span className={`flex-1 text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {task.text}
                            </span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => {
                                  setEditingNotesId(editingNotesId === task.id ? null : task.id);
                                  setTempNotes(task.notes || '');
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${editingNotesId === task.id ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:bg-slate-100'}`}
                                title="Catatan"
                              >
                                <FileText size={18} />
                              </button>
                              <button 
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Hapus"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 h-24 resize-none"
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
                                    <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                                      <p className="text-xs text-slate-500 whitespace-pre-wrap italic">
                                        {task.notes}
                                      </p>
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
  );
}

export default function App() {
  const [lang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'id');
  return (
    <ErrorBoundary lang={lang}>
      <ChecklistApp />
    </ErrorBoundary>
  );
}
