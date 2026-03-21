/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Instagram, Music2, MessageCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Screen, UserProfile, JournalEntry, AppState, Badge } from './types';
import { INITIAL_BADGES, AVATARS, INITIAL_NOTIFICATIONS, INITIAL_REWARDS } from './constants';
import { getReadingForDay } from './data/readingPlan';
import { Avatar } from './types';

// Helper to handle asset URLs with Vite base path
const getAssetUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

function AvatarDisplay({ avatarId, customUrl, className = "w-full h-full", iconSize = "text-3xl" }: { avatarId?: string, customUrl?: string, className?: string, iconSize?: string }) {
  if (customUrl) {
    return <img src={customUrl} alt="Avatar" className={`${className} object-cover rounded-full`} referrerPolicy="no-referrer" translate="no" />;
  }

  // Normalize ID for compatibility and to fight auto-translation
  let normalizedId = avatarId?.toString().toLowerCase().trim() || '';
  
  // Handle some common auto-translations and legacy IDs
  const idMap: Record<string, string> = {
    'singa': 'h_singa', 'lion': 'h_singa',
    'domba': 'h_domba', 'sheep': 'h_domba',
    'anjing': 'h_anjing', 'dog': 'h_anjing',
    'ayam': 'h_ayam', 'chicken': 'h_ayam',
    'ikan': 'h_ikan', 'fish': 'h_ikan',
    'kelinci': 'h_kelinci', 'rabbit': 'h_kelinci',
    'kucing': 'h_kucing', 'cat': 'h_kucing',
    'merpati': 'h_merpati', 'dove': 'h_merpati', 'pigeon': 'h_merpati'
  };

  if (idMap[normalizedId]) {
    normalizedId = idMap[normalizedId];
  }

  const avatar = AVATARS.find(a => 
    a.id.toLowerCase().trim() === normalizedId
  ) as Avatar | undefined;

  if (!avatar) {
    return (
      <div className={`${className} bg-surface-container flex items-center justify-center rounded-full`} translate="no">
        <span className="material-symbols-outlined notranslate text-primary opacity-50" translate="no">&#xe7fd;</span>
      </div>
    );
  }

  if (avatar.url) {
    return (
      <div className={`${className} rounded-full overflow-hidden bg-surface-container border border-primary/20 shadow-sm`} translate="no">
        <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover notranslate" referrerPolicy="no-referrer" translate="no" />
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center`} translate="no">
      <span className={`${iconSize} notranslate`} translate="no">{avatar.icon}</span>
    </div>
  );
}

function DynamicIcon({ 
  hex, 
  iconUrl, 
  className = "material-symbols-outlined notranslate", 
  sizeClass = "text-xl", 
  containerClassName = "w-full h-full",
  imgClassName = "w-full h-full object-contain rounded-full"
}: { 
  hex?: string; 
  iconUrl?: string | null; 
  className?: string; 
  sizeClass?: string;
  containerClassName?: string;
  imgClassName?: string;
}) {
  if (iconUrl) {
    return (
      <div className={`${containerClassName} flex items-center justify-center overflow-hidden pointer-events-none`}>
        <img src={iconUrl} alt="icon" className={imgClassName} />
      </div>
    );
  }
  return (
    <span 
      className={`${className} ${sizeClass} fill-icon`} 
      translate="no" 
      dangerouslySetInnerHTML={{ __html: hex || '' }}
    />
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('bible_journal_state');
    const defaults = {
      screen: 'loading' as Screen,
      user: null,
      currentDay: 1,
      streak: 0,
      xp: 0,
      level: 1,
      entries: [],
      badges: INITIAL_BADGES,
      notifications: INITIAL_NOTIFICATIONS,
      rewards: INITIAL_REWARDS,
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...defaults,
          ...parsed, 
          screen: 'loading',
          // Merge latest badge data (like URLs) into saved progress
          badges: (parsed.badges || INITIAL_BADGES).map((b: Badge) => {
            const initial = INITIAL_BADGES.find(ib => ib.id === b.id);
            return initial ? { ...b, ...initial, unlocked: b.unlocked } : b;
          }),
          notifications: parsed.notifications || INITIAL_NOTIFICATIONS,
          rewards: parsed.rewards || INITIAL_REWARDS,
          entries: parsed.entries || [],
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return defaults;
  });

  useEffect(() => {
    if (state.screen === 'loading') {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, screen: prev.user ? 'home' : 'onboarding' }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.screen, state.user]);

  useEffect(() => {
    if (state.screen !== 'loading') {
      localStorage.setItem('bible_journal_state', JSON.stringify(state));
      
      // Also save to multi-profile storage if user is logged in
      if (state.user?.name) {
        try {
          const profiles = JSON.parse(localStorage.getItem('bible_journal_profiles') || '{}');
          profiles[state.user.name.toLowerCase()] = {
            ...state,
            screen: 'loading' // Always start at loading when switching
          };
          localStorage.setItem('bible_journal_profiles', JSON.stringify(profiles));
        } catch (e) {
          console.error("Failed to save profile", e);
        }
      }
    }
  }, [state]);

  const navigate = (screen: Screen) => {
    setState(prev => ({ ...prev, screen }));
  };

  const handleOnboarding = (name: string, avatar: string, schoolName: string) => {
    try {
      const savedProfiles = JSON.parse(localStorage.getItem('bible_journal_profiles') || '{}');
      const existingProfile = savedProfiles[name.toLowerCase()];

      if (existingProfile) {
        // Load existing profile but update with the newly selected avatar and school
        setState({
          ...existingProfile,
          user: {
            ...existingProfile.user,
            avatar,
            schoolName
          },
          screen: 'home'
        });
        return;
      }
    } catch (e) {
      console.error("Error checking existing profiles", e);
    }

    // New profile
    setState(prev => ({
      ...prev,
      user: { 
        name, 
        schoolName,
        avatar, 
        startDate: new Date().toISOString() 
      },
      screen: 'home'
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('bible_journal_state');
    window.location.reload();
  };

  const saveToSpreadsheet = async (entry: JournalEntry) => {
    const webhookUrl = (import.meta as any).env.VITE_SPREADSHEET_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script requires no-cors for simple POST
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: state.user?.name,
          day: entry.day,
          date: entry.date,
          scripture: entry.scripture,
          observation: entry.observation,
          application: entry.application,
          prayer: entry.prayer
        }),
      });
    } catch (error) {
      console.error('Failed to save to spreadsheet:', error);
    }
  };

  const extractJournalMetadata = async (entry: Omit<JournalEntry, 'id' | 'date' | 'day'>) => {
    try {
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
      
      // MOCK FALLBACK: Use mock data if no API key is provided
      if (!apiKey) {
        console.info("Running in Offline/Mock mode for AI extraction");
        return {
          tags: ["Bible", "Iman", "Doa"],
          summary: "Catatan ini menunjukkan pertumbuhan imanmu hari ini.",
          mood: "Tenang",
          mainTheme: "Kasih Tuhan"
        };
      }

      const genAI = new GoogleGenAI(apiKey);
      
      const promptText = `
        Analyze this children's Bible journal entry (S.O.A.P format) and extract metadata in JSON format.
        
        S (Scripture): ${entry.scripture}
        O (Observation): ${entry.observation}
        A (Application): ${entry.application}
        P (Prayer): ${entry.prayer}

        Return a JSON object with:
        - "tags": array of 3-5 short keywords (Indonesian)
        - "summary": a 1-sentence summary of the takeaway
        - "mood": the overall feeling (e.g., Bersyukur, Semangat, Tenang)
        - "mainTheme": the primary spiritual theme
      `;

      const result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: {
          parts: [{ text: promptText }]
        }
      });

      const responseText = result.candidates[0].content.parts[0].text || "";
      // Basic JSON cleaning if AI returns markdown blocks
      const jsonStr = responseText.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Failed to extract metadata:", error);
      return null;
    }
  };

  const handleSaveJournal = async (entry: Omit<JournalEntry, 'id' | 'date' | 'day'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newEntry: JournalEntry = {
      ...entry,
      id: newId,
      date: new Date().toISOString().split('T')[0],
      day: state.currentDay
    };

    // UI Feedback: Immediately navigate and show rewards
    setState(prev => {
      // Calculate streak based on number of unique days in entries
      const newEntries = [newEntry, ...prev.entries];
      const uniqueDays = new Set(newEntries.map(e => e.day)).size;
      
      return {
        ...prev,
        entries: newEntries,
        screen: 'reward',
        xp: prev.xp + 50,
        streak: uniqueDays, // Streak corresponds to days worked
        notifications: [
          {
            id: Math.random().toString(36).substr(2, 9),
            title: 'S.O.A.P Selesai! 🎉',
            message: `Selamat! Kamu telah menyelesaikan jurnal untuk Hari ${state.currentDay}.`,
            date: new Date().toISOString(),
            read: false,
            type: 'achievement'
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Misi Baru Terbuka! 📖',
            message: `Bintang kecil! Hari ${state.currentDay + 1} sudah menunggu untuk disinari.`,
            date: new Date().toISOString(),
            read: false,
            type: 'info'
          },
          ...prev.notifications
        ],
        currentDay: prev.currentDay + 1 // Advance to next day automatically
      };
    });

    // Save to spreadsheet automatically
    saveToSpreadsheet(newEntry);

    // AI Metadata Extraction in background
    extractJournalMetadata(entry).then(metadata => {
      if (metadata) {
        setState(prev => ({
          ...prev,
          entries: prev.entries.map(e => e.id === newId ? { ...e, aiMetadata: metadata } : e)
        }));
      }
    });
  };

  const handleUpdateCustomAvatar = (url: string) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, customAvatarUrl: url } : null
    }));
  };

  const handleClaimReward = (rewardId: string) => {
    setState(prev => {
      const reward = prev.rewards.find(r => r.id === rewardId);
      if (!reward || reward.claimed) return prev;

      return {
        ...prev,
        xp: prev.xp + reward.xpValue,
        rewards: prev.rewards.map(r => r.id === rewardId ? { ...r, claimed: true } : r),
        notifications: [
          {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Hadiah Diklaim!',
            message: `Kamu mendapatkan ${reward.xpValue} XP dari ${reward.title}.`,
            date: new Date().toISOString(),
            read: false,
            type: 'achievement'
          },
          ...prev.notifications
        ]
      };
    });
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === notificationId ? { ...n, read: true } : n)
    }));
  };

  useEffect(() => {
    if (state.user?.startDate) {
      const calculateDay = () => {
        const start = new Date(state.user!.startDate);
        const now = new Date();
        // Reset hours to compare dates only
        start.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        // Only advance the day if the calendar is ahead of the current progress
        if (diffDays > state.currentDay) {
          setState(prev => ({ ...prev, currentDay: diffDays }));
        }
      };

      calculateDay();
      // Check every hour if the day has changed
      const interval = setInterval(calculateDay, 3600000);
      return () => clearInterval(interval);
    }
  }, [state.user?.startDate, state.currentDay]);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        {state.screen === 'loading' && <LoadingScreen key="loading" />}
        {state.screen === 'onboarding' && (
          <OnboardingScreen key="onboarding" onComplete={handleOnboarding} />
        )}
        {state.screen === 'home' && (
          <HomeScreen 
            key="home" 
            state={state} 
            navigate={navigate} 
            onMarkRead={handleMarkNotificationRead}
            onClaimReward={handleClaimReward}
            onLogout={handleLogout}
          />
        )}
        {state.screen === 'reading-plan' && (
          <ReadingPlanScreen 
            key="reading-plan" 
            state={state} 
            navigate={navigate} 
            onMarkRead={handleMarkNotificationRead}
            onClaimReward={handleClaimReward}
            onLogout={handleLogout}
          />
        )}
        {state.screen === 'daily-reading' && (
          <DailyReadingScreen 
            key="daily-reading" 
            state={state} 
            navigate={navigate} 
            onMarkRead={handleMarkNotificationRead}
            onClaimReward={handleClaimReward}
            onLogout={handleLogout}
          />
        )}
        {state.screen === 'journal-entry' && (
          <JournalEntryScreen key="journal-entry" state={state} onSave={handleSaveJournal} onBack={() => navigate('daily-reading')} />
        )}
        {state.screen === 'profile' && (
          <ProfileScreen 
            key="profile" 
            state={state} 
            navigate={navigate} 
            onUpdateCustomAvatar={handleUpdateCustomAvatar} 
            onMarkRead={handleMarkNotificationRead}
            onClaimReward={handleClaimReward}
            onLogout={handleLogout}
          />
        )}
        {state.screen === 'reward' && (
          <RewardScreen key="reward" state={state} onContinue={() => navigate('home')} />
        )}
        {state.screen === 'celebration' && (
          <CelebrationScreen 
            key="celebration" 
            state={state} 
            onRestart={() => navigate('home')} 
            onMarkRead={handleMarkNotificationRead}
            onClaimReward={handleClaimReward}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Screens ---

function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-background z-50"
    >
      <div className="star-field absolute inset-0 opacity-30">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="star absolute bg-white rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random()
            }}
          />
        ))}
      </div>
      <div className="relative flex flex-col items-center">
        <div className="central-glow absolute w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border-2 border-transparent border-t-primary border-r-secondary rounded-full"
          />
          <div className="w-56 h-56 rounded-full glass-card flex items-center justify-center border border-primary/20 p-2 relative overflow-hidden">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-surface-container-high to-surface-container flex flex-col items-center justify-center text-center overflow-hidden">
              {getAssetUrl((import.meta as any).env.VITE_LOGO_URL || '/img/logo.png') ? (
                <img 
                  src={getAssetUrl((import.meta as any).env.VITE_LOGO_URL || '/img/logo.png')} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <span className="material-symbols-outlined notranslate text-primary text-6xl fill-icon mb-2" translate="no">&#xe920;</span>
                  <h1 className="font-headline font-bold text-xl tracking-tight">Bible Journal</h1>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-12 text-center space-y-4 z-10">
          <p className="font-headline text-lg font-semibold text-on-background opacity-90">Memuat Jurnal Firman Tuhan</p>
          <div className="flex gap-2 justify-center">
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2 h-2 rounded-full bg-primary" />
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2 h-2 rounded-full bg-primary" />
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2 h-2 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function OnboardingScreen({ onComplete }: { onComplete: (name: string, avatar: string, schoolName: string) => void; key?: string }) {
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('adv1');
  const [activeCategory, setActiveCategory] = useState<'Laki-laki' | 'Perempuan' | 'Hewan'>('Laki-laki');

  const filteredAvatars = AVATARS.filter(a => a.category === activeCategory);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden"
    >
      <CosmicBackground />
      <div className="max-w-2xl w-full glass-card p-8 md:p-12 rounded-lg border border-outline-variant/15 flex flex-col items-center text-center shadow-2xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: [1, 1.05, 1] }}
          transition={{ 
            opacity: { duration: 1 },
            scale: { repeat: Infinity, duration: 3, ease: "easeInOut" }
          }}
          className="mb-8 w-full flex justify-center"
        >
          <img 
            src={getAssetUrl("/img/judul.png")} 
            alt="Selamat Datang di Jurnal Alkitab Anak" 
            className="w-full max-w-[320px] h-auto drop-shadow-[0_0_25px_rgba(255,137,173,0.4)] cursor-default"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.includes('judul.png')) {
                // Try fallback to logo if judul fails
                target.src = getAssetUrl('/img/logo.png');
              } else {
                target.style.display = 'none';
                // Find or create text fallback
                const parent = target.parentElement?.parentElement;
                if (parent && !parent.querySelector('h1')) {
                  const h1 = document.createElement('h1');
                  h1.className = "font-headline text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary leading-tight mb-4";
                  h1.innerText = "Selamat Datang di Jurnal Alkitab Anak";
                  parent.prepend(h1);
                }
              }
            }}
          />
        </motion.div>
        <p className="text-on-surface-variant text-lg mb-10">Pilih temanmu dan tulis namamu untuk mulai berpetualang!</p>

        <div className="w-full max-w-sm mb-8">
          <label className="block text-left text-sm font-label text-secondary mb-3 ml-2">Nama</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-6 py-4 text-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface placeholder-on-surface-variant/30 transition-all"
            placeholder="Ketik namamu di sini..."
          />
        </div>

        <div className="w-full max-w-sm mb-8">
          <label className="block text-left text-sm font-label text-secondary mb-3 ml-2">Sekolah</label>
          <input
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-6 py-4 text-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface placeholder-on-surface-variant/30 transition-all"
            placeholder="Ketik nama sekolahmu..."
          />
        </div>

        <div className="w-full mb-14">
          <label className="block text-center text-sm font-label text-secondary mb-6">Pilih Karaktermu</label>
          
          {/* Category Tabs */}
          <div className="flex justify-center flex-wrap gap-3 mb-8">
            {(['Laki-laki', 'Perempuan', 'Hewan'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeCategory === cat ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 max-h-[400px] overflow-y-auto custom-scrollbar p-2">
            {filteredAvatars.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`group flex flex-col items-center gap-4 focus:outline-none transition-all ${selectedAvatar === avatar.id ? 'scale-110' : 'opacity-70'}`}
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-surface-container-high border-2 flex items-center justify-center overflow-hidden transition-all shadow-inner ${selectedAvatar === avatar.id ? 'border-primary ring-4 ring-primary/20 bg-primary/5' : 'border-transparent group-hover:border-primary/50'}`}
                >
                  <AvatarDisplay avatarId={avatar.id} iconSize="text-5xl" />
                </motion.div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => name && schoolName && onComplete(name, selectedAvatar, schoolName)}
          disabled={!name || !schoolName}
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-bold text-xl px-12 py-5 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl"
        >
          Mulai Membaca
        </button>
      </div>
    </motion.div>
  );
}

function Navbar({ state, navigate, onMarkRead, onClaimReward, onLogout }: { 
  state: AppState; 
  navigate: (s: Screen) => void;
  onMarkRead: (id: string) => void;
  onClaimReward: (id: string) => void;
  onLogout: () => void;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const unreadCount = state.notifications?.filter(n => !n.read).length || 0;
  const unclaimedCount = state.rewards?.filter(r => !r.claimed).length || 0;

  return (
    <nav className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-surface/80 backdrop-blur-md border-b border-outline-variant/10">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('home')}>
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/20">
          <img src={getAssetUrl("/img/logo.png")} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <span className="font-headline font-bold text-xl tracking-tight">Bible Journal</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <button onClick={() => navigate('home')} className={`font-medium transition-colors ${state.screen === 'home' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>Home</button>
        <button onClick={() => navigate('reading-plan')} className={`font-medium transition-colors ${state.screen === 'reading-plan' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>Progress</button>
        <button onClick={() => navigate('profile')} className={`font-medium transition-colors ${state.screen === 'profile' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>Profile</button>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRewards(false);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors relative"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <DynamicIcon 
                hex="&#xe7f4;" 
                iconUrl={getAssetUrl((import.meta as any).env.VITE_NOTIFICATION_ICON_URL || '/img/notif.png')} 
                sizeClass="text-xl"
              />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
                {unreadCount}
              </span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 glass-card rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low flex items-center justify-between">
                  <h4 className="font-headline font-bold">Pemberitahuan</h4>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{unreadCount} Baru</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {state.notifications?.length > 0 ? (
                    state.notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => onMarkRead(n.id)}
                        className={`p-4 border-b border-outline-variant/5 cursor-pointer transition-colors ${n.read ? 'opacity-60' : 'bg-primary/5 hover:bg-primary/10'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'achievement' ? 'bg-tertiary/20 text-tertiary' : 'bg-primary/20 text-primary'}`}>
                            <span className="material-symbols-outlined notranslate text-sm" translate="no" dangerouslySetInnerHTML={{ __html: n.type === 'achievement' ? '&#xea3f;' : '&#xe88e;' }}></span>
                          </div>
                          <div>
                            <h5 className="text-sm font-bold mb-0.5">{n.title}</h5>
                            <p className="text-xs text-on-surface-variant leading-relaxed">{n.message}</p>
                            <span className="text-[9px] text-outline mt-1 block uppercase font-medium">Baru Saja</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-on-surface-variant text-sm">Tidak ada pemberitahuan.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button 
            onClick={() => {
              setShowRewards(!showRewards);
              setShowNotifications(false);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors relative"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <DynamicIcon 
                hex="&#xea23;" 
                iconUrl={getAssetUrl((import.meta as any).env.VITE_REWARD_ICON_URL || '/img/reward.png')} 
                sizeClass="text-xl text-tertiary"
                className="material-symbols-outlined notranslate fill-icon"
              />
            </div>
            {unclaimedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-tertiary text-on-tertiary text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
                {unclaimedCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showRewards && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 glass-card rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low flex items-center justify-between">
                  <h4 className="font-headline font-bold">Klaim Hadiah</h4>
                  <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">{unclaimedCount} Tersedia</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {state.rewards?.length > 0 ? (
                    state.rewards.map(r => (
                      <div 
                        key={r.id} 
                        className={`p-4 border-b border-outline-variant/5 transition-colors ${r.claimed ? 'opacity-40' : 'hover:bg-tertiary/5'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl shrink-0">{r.icon}</div>
                          <div className="flex-grow">
                            <h5 className="text-sm font-bold">{r.title}</h5>
                            <p className="text-xs text-on-surface-variant">{r.description}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="material-symbols-outlined notranslate text-[10px] text-tertiary fill-icon" translate="no">&#xea3f;</span>
                              <span className="text-[10px] font-bold text-tertiary">{r.xpValue} XP</span>
                            </div>
                          </div>
                          {!r.claimed && (
                            <button 
                              onClick={() => onClaimReward(r.id)}
                              className="px-3 py-1.5 bg-tertiary text-on-tertiary text-[10px] font-bold rounded-lg hover:scale-105 transition-transform"
                            >
                              KLAIM
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-on-surface-variant text-sm">Tidak ada hadiah tersedia.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <div 
            className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden cursor-pointer bg-surface-container flex items-center justify-center" 
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifications(false);
              setShowRewards(false);
            }}
          >
            <AvatarDisplay avatarId={state.user?.avatar} customUrl={state.user?.customAvatarUrl} iconSize="text-2xl" />
          </div>

          <AnimatePresence>
            {showProfileDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-64 glass-card rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-50"
              >
                <div className="p-5 border-b border-outline-variant/10 bg-surface-container-low text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-primary p-0.5">
                    <div className="w-full h-full rounded-full overflow-hidden bg-surface-container flex items-center justify-center">
                      <AvatarDisplay avatarId={state.user?.avatar} customUrl={state.user?.customAvatarUrl} />
                    </div>
                  </div>
                  <h4 className="font-headline font-bold text-lg">{state.user?.name}</h4>
                  <p className="text-xs text-on-surface-variant font-medium flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined notranslate text-xs" translate="no">&#xe80c;</span>
                    {state.user?.schoolName || 'Sekolah Dasar'}
                  </p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => {
                      navigate('profile');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-high transition-colors text-sm font-medium"
                  >
                    <span className="material-symbols-outlined notranslate text-primary" translate="no">&#xe7fd;</span>
                    Lihat Profil
                  </button>
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-error/10 text-error transition-colors text-sm font-bold"
                  >
                    <span className="material-symbols-outlined notranslate" translate="no">&#xe9ba;</span>
                    Keluar Aplikasi
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}

function DeveloperPortfolioPopup({ onClose }: { onClose: () => void }) {
  const projects = [
    { 
      title: "Jurnal Alkitab Anak-anak", 
      desc: "Aplikasi jurnal Alkitab yang menyenangkan dan interaktif untuk anak-anak.", 
      icon: getAssetUrl("/img/logo.png"),
      isImage: true 
    },
    { 
      title: "Penjelajah Alkitab", 
      desc: "Permainan edukasi tentang Alkitab.", 
      icon: "&#xeb9b;",
      url: "https://remaja-aelor.vercel.app/" 
    },
    { 
      title: "Prajurit Doa", 
      desc: "Aplikasi komunitas untuk berbagi permintaan doa.", 
      icon: "&#xea70;" 
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-card w-full max-w-md rounded-2xl p-8 border border-primary/30 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
        >
          <span className="material-symbols-outlined notranslate" translate="no">&#xe5cd;</span>
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-primary/30 shadow-lg">
            <img src={getAssetUrl("/img/profil.png")} alt="Developer" className="w-full h-full object-cover" />
          </div>
          <h2 className="font-headline text-2xl font-bold">DENI RAJA99</h2>
          <p className="text-primary text-sm font-bold uppercase tracking-widest">Pendidik di SDN KEJURON</p>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-3">Keahlian</h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Tailwind', 'Node.js', 'Firebase', 'AI Integration'].map(skill => (
                <span key={skill} className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold border border-outline-variant/20">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-3">Proyek Unggulan</h3>
            <div className="space-y-3">
              {projects.map((project, i) => {
                const Content = (
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {project.isImage ? (
                        <img src={project.icon} alt={project.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined notranslate text-primary text-xl" translate="no" dangerouslySetInnerHTML={{ __html: project.icon }}></span>
                      )}
                    </div>
                    <div className="text-left flex-grow">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold group-hover:text-primary transition-colors">{project.title}</h4>
                        {project.url && <span className="material-symbols-outlined notranslate text-xs text-primary animate-pulse" translate="no">&#xe89e;</span>}
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-tight">{project.desc}</p>
                    </div>
                  </div>
                );

                if (project.url) {
                  return (
                    <a key={i} href={project.url} target="_blank" rel="noopener noreferrer" className="block focus:outline-none">
                      {Content}
                    </a>
                  );
                }

                return <div key={i}>{Content}</div>;
              })}
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-outline-variant/10 flex justify-center gap-4">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full overflow-hidden hover:scale-110 transition-transform bg-surface-container-high border border-outline-variant/10">
            <img src={getAssetUrl("/img/medsos/instagram.jpg")} alt="Instagram" className="w-full h-full object-cover" />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full overflow-hidden hover:scale-110 transition-transform bg-surface-container-high border border-outline-variant/10">
            <img src={getAssetUrl("/img/medsos/tiktok.jpg")} alt="TikTok" className="w-full h-full object-cover" />
          </a>
          <a href="https://wa.me/628" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full overflow-hidden hover:scale-110 transition-transform bg-surface-container-high border border-outline-variant/10">
            <img src={getAssetUrl("/img/medsos/whatsapp.jpg")} alt="WhatsApp" className="w-full h-full object-cover" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Footer({ user }: { user: UserProfile | null }) {
  const [showPortfolio, setShowPortfolio] = useState(false);

  return (
    <footer className="py-16 px-8 border-t border-outline-variant/10 bg-surface-container-low mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={getAssetUrl("/img/logo.png")} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
              <span className="font-headline font-bold text-2xl">Bible Journal</span>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Membantu anak-anak bertumbuh dalam iman melalui pembacaan Alkitab harian dan jurnal S.O.A.P yang interaktif.
            </p>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-headline font-bold mb-4 text-primary uppercase tracking-widest text-xs">Profil Pengembang</h4>
            <div className="flex items-start gap-4">
              <button 
                onClick={() => setShowPortfolio(true)}
                className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 hover:border-primary border-2 border-transparent transition-all overflow-hidden shadow-lg group relative"
              >
                <img src={getAssetUrl("/img/profil.png")} alt="Developer" className="w-full h-full object-cover" />
              </button>
              <div>
                <p className="font-bold text-sm">DENI RAJA99</p>
                <p className="text-xs text-on-surface-variant italic mb-2">"Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku."</p>
                <p className="text-[10px] text-outline uppercase font-bold">Filipi 4:13</p>
              </div>
            </div>
          </div>

          <div className="col-span-1">
            <h4 className="font-headline font-bold mb-4 text-primary uppercase tracking-widest text-xs">Hubungi Kami</h4>
            <div className="flex gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full overflow-hidden hover:scale-110 transition-transform bg-surface-container-high border border-outline-variant/10">
                <img src={getAssetUrl("/img/medsos/instagram.jpg")} alt="Instagram" className="w-full h-full object-cover" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full overflow-hidden hover:scale-110 transition-transform bg-surface-container-high border border-outline-variant/10">
                <img src={getAssetUrl("/img/medsos/tiktok.jpg")} alt="TikTok" className="w-full h-full object-cover" />
              </a>
              <a href="https://wa.me/628" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full overflow-hidden hover:scale-110 transition-transform bg-surface-container-high border border-outline-variant/10">
                <img src={getAssetUrl("/img/medsos/whatsapp.jpg")} alt="WhatsApp" className="w-full h-full object-cover" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-outline-variant/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-on-surface-variant text-xs">© 2026 Children's Bible Journal. Sparkle & Learn.</p>
          <div className="flex gap-6 text-xs text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Parent Guide</a>
            <a href="#" className="hover:text-primary transition-colors">Help</a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPortfolio && (
          <DeveloperPortfolioPopup onClose={() => setShowPortfolio(false)} />
        )}
      </AnimatePresence>
    </footer>
  );
}

const CosmicBackground = () => {
  const stars = useMemo(() => [...Array(30)].map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: Math.random() * 5 + 3,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.7 + 0.3
  })), []);

  const orbs = useMemo(() => [...Array(5)].map((_, i) => ({
    id: i,
    size: Math.random() * 300 + 100,
    top: Math.random() * 100,
    left: Math.random() * 100,
    color: i % 2 === 0 ? 'rgba(255, 137, 173, 0.08)' : 'rgba(197, 164, 248, 0.08)',
    duration: Math.random() * 10 + 15,
    delay: Math.random() * 5
  })), []);

  return (
    <div className="cosmic-bg">
      <div className="nebula-glow absolute inset-0" />
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            width: star.size + 'px',
            height: star.size + 'px',
            top: star.top + '%',
            left: star.left + '%',
            animation: `twinkle ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
            opacity: star.opacity
          }}
        />
      ))}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size + 'px',
            height: orb.size + 'px',
            top: orb.top + '%',
            left: orb.left + '%',
            background: orb.color,
            animation: `float ${orb.duration}s ease-in-out infinite`,
            animationDelay: `${orb.delay}s`
          }}
        />
      ))}
    </div>
  );
};

function HomeScreen({ state, navigate, onMarkRead, onClaimReward, onLogout }: { 
  state: AppState; 
  navigate: (s: Screen) => void; 
  onMarkRead: (id: string) => void;
  onClaimReward: (id: string) => void;
  onLogout: () => void;
  key?: string 
}) {
  const dailyReading = getReadingForDay(state.currentDay);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col relative">
      <CosmicBackground />
      <Navbar 
        state={state} 
        navigate={navigate} 
        onMarkRead={onMarkRead}
        onClaimReward={onClaimReward}
        onLogout={onLogout}
      />
      <main className="max-w-6xl mx-auto px-6 py-12 w-full">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-on-surface to-secondary bg-clip-text text-transparent">
              Hallo... {state.user?.name || 'Samuel'} 👋
            </h1>
            <p className="text-on-surface-variant text-lg">Siap untuk petualangan iman hari ini?</p>
          </div>
          <div className="text-right glass-card px-8 py-4 rounded-3xl border border-primary/30 shadow-[0_0_15px_rgba(255,137,173,0.2)]">
            <div className="text-primary font-bold text-3xl tracking-widest mb-1" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {formattedTime}
            </div>
            <div className="text-on-surface-variant text-xs font-black uppercase tracking-[0.3em] opacity-70">{formattedDate}</div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Card */}
          <div className="md:col-span-8 glass-card rounded-xl p-8 relative overflow-hidden group border border-outline-variant/10">
            {/* Daily Background Image */}
            <div className="absolute inset-0 z-0 opacity-15 group-hover:opacity-25 transition-opacity">
              <div className="w-full h-full relative">
                <img 
                  src={getAssetUrl(`/img/daily/day-${state.currentDay}.jfif`)}
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (t.src.endsWith('.jfif')) t.src = t.src.replace('.jfif', '.jpeg');
                    else if (t.src.endsWith('.jpeg')) t.src = t.src.replace('.jpeg', '.jpg');
                    else if (!t.src.includes('logo.png')) t.src = getAssetUrl('/img/logo.png');
                  }}
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-0 opacity-60" />
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/20 transition-all" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-semibold">
                    <span className="material-symbols-outlined notranslate text-sm fill-icon" translate="no">&#xe838;</span>
                    BACAAN HARI INI
                  </div>
                  {state.entries.some(e => e.day === state.currentDay) && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 animate-bounce">
                      <span className="material-symbols-outlined notranslate text-sm fill-icon" translate="no">&#xe86c;</span>
                      SELESAI
                    </div>
                  )}
                </div>
                <h2 className="font-headline text-3xl md:text-5xl font-bold mb-4">Hari {state.currentDay}: {dailyReading.reference}</h2>
                <div className="relative mb-8">
                  <span className="material-symbols-outlined notranslate absolute -top-4 -left-4 text-primary/20 text-6xl rotate-180" translate="no">&#xe244;</span>
                  <p className="text-on-surface-variant text-lg md:text-xl font-medium italic leading-relaxed pl-6 border-l-4 border-primary/30">
                    "{dailyReading.verseText}"
                  </p>
                  <p className="text-primary font-bold mt-2 text-right">— {dailyReading.highlightVerse}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('daily-reading')}
                className="bg-gradient-to-b from-primary to-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 hover:scale-105 transition-transform shadow-lg w-fit"
              >
                Baca Firman
                <span className="material-symbols-outlined notranslate" translate="no">&#xe5c8;</span>
              </button>
            </div>
            <div className="absolute bottom-4 right-4 opacity-30 md:opacity-100">
              <span className="material-symbols-outlined notranslate text-9xl text-primary opacity-20" translate="no">&#xe891;</span>
            </div>
          </div>

          {/* Streak Card */}
          <div className="md:col-span-4 bg-surface-container-high rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden border border-outline-variant/10 group">
            <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
              {/* Animated Bible Icon from local gif */}
              <img 
                src={getAssetUrl("/img/gif/bible.gif")} 
                alt="Bible"
                className="w-full h-full object-contain relative z-10"
              />
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
            </div>
            
            <h3 className="font-headline text-2xl font-bold mb-1">Streak Membaca</h3>
            <p className="text-on-surface-variant text-sm mb-4 italic">Semangat terus, pahlawan Kristus!</p>
            <div className="text-5xl font-extrabold text-primary font-headline tracking-tighter drop-shadow-sm">
              {new Set(state.entries.map(e => e.day)).size} Hari
            </div>
            <p className="text-[10px] text-outline mt-3 uppercase font-black tracking-[0.2em] opacity-60">Berturut-turut Aktif</p>
          </div>

          {/* Progress Card */}
          <div className="md:col-span-7 glass-card rounded-xl p-8 border border-outline-variant/10 relative overflow-hidden group">
            {/* Background Image */}
            <div 
              className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700"
              style={{ 
                backgroundImage: `url(${getAssetUrl("/img/kemajuan membaca.jpg")})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-headline text-2xl font-bold">Progress Membaca</h3>
                <p className="text-on-surface-variant">Kamu sudah sangat jauh!</p>
              </div>
              <div className="text-right flex items-center gap-2">
                {state.entries.some(e => e.day === state.currentDay) && (
                  <span className="material-symbols-outlined notranslate text-emerald-500 fill-icon text-2xl" translate="no">&#xe86c;</span>
                )}
                <div>
                  <span className="text-3xl font-headline font-bold text-secondary">{state.currentDay}</span>
                  <span className="text-on-surface-variant text-lg"> / 365 Hari</span>
                </div>
              </div>
            </div>
            <div className="relative pt-1">
              <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-surface-container-highest">
                <div
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-secondary to-primary rounded-full relative transition-all duration-1000"
                  style={{ width: `${(state.currentDay / 365) * 100}%` }}
                >
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-on-surface rounded-full flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined notranslate text-primary text-xs fill-icon" translate="no">&#xeb9b;</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-outline font-medium">
                <span>Mulai</span>
                <span>Selesai</span>
              </div>
            </div>
          </div>
        </div>

          {/* Badge Card */}
          <div className="md:col-span-5 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline text-2xl font-bold text-on-surface">Lencana Koleksi</h3>
              <button 
                onClick={() => navigate('profile')} 
                className="bg-[#ff89ad] text-[#543782] px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(255,137,173,0.3)]"
              >
                Lihat Semua
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-5">
              {(state.badges || []).slice(0, 6).map((badge) => (
                <div 
                  key={badge.id} 
                  className={`aspect-square rounded-2xl bg-[#2a124a]/40 flex flex-col items-center justify-center p-3 border border-[#513f6b]/30 transition-all duration-500 hover:bg-[#311753]/60 hover:border-primary/30 group ${badge.unlocked ? 'opacity-100' : 'opacity-30 grayscale'}`}
                >
                  <div className="w-full h-2/3 mb-2 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    {badge.url ? (
                      <img src={badge.url} alt={badge.name} className="w-full h-full object-contain drop-shadow-lg" />
                    ) : (
                      <span className="text-3xl">{badge.icon}</span>
                    )}
                  </div>
                  <span className="text-[9px] font-black text-center text-on-surface-variant group-hover:text-primary transition-colors tracking-widest uppercase truncate w-full">
                    {badge.unlocked ? badge.name : 'TERKUNCI'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h3 className="font-headline text-2xl font-bold mb-6">Jurnal S.O.A.P Terakhir</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {state.entries.length > 0 ? (
              <>
                {[
                  { label: 'S', value: state.entries[0].scripture, color: 'primary' },
                  { label: 'O', value: state.entries[0].observation, color: 'secondary' },
                  { label: 'A', value: state.entries[0].application, color: 'tertiary' },
                  { label: 'P', value: state.entries[0].prayer, color: 'primary' }
                ].map((item) => (
                  <div key={item.label} className="glass-card p-6 rounded-xl hover:translate-y-[-4px] transition-transform cursor-pointer border border-outline-variant/5 relative overflow-hidden">
                    <div className={`w-10 h-10 rounded-full bg-${item.color}/10 flex items-center justify-center text-${item.color} font-bold mb-4`}>{item.label}</div>
                    <p className="text-sm text-on-surface-variant line-clamp-3 leading-relaxed">
                      {item.value}
                    </p>
                  </div>
                ))}
                {state.entries[0].aiMetadata && (
                  <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-2 px-2 py-3 bg-surface-container-low rounded-xl border border-outline-variant/10 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined notranslate" translate="no">&#xe94f;</span>
                      <span className="text-[10px] font-bold text-outline-variant uppercase">AI Insights:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {state.entries[0].aiMetadata.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs font-medium text-secondary">#{tag}</span>
                      ))}
                    </div>
                    <div className="hidden md:block h-4 w-px bg-outline-variant/20 mx-2" />
                    <p className="text-xs text-on-surface-variant italic truncate">
                      "{state.entries[0].aiMetadata.summary}"
                    </p>
                  </div>
                )}
              </>
            ) : (
              ['S', 'O', 'A', 'P'].map((letter, i) => (
                <div key={letter} className="glass-card p-6 rounded-xl opacity-40 border border-outline-variant/5">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-outline-variant font-bold mb-4">{letter}</div>
                  <p className="text-xs text-on-surface-variant italic">Belum ada catatan...</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer user={state.user} />
    </motion.div>
  );
}

function ReadingPlanScreen({ state, navigate, onMarkRead, onClaimReward, onLogout }: { 
  state: AppState; 
  navigate: (s: Screen) => void; 
  onMarkRead: (id: string) => void;
  onClaimReward: (id: string) => void;
  onLogout: () => void;
  key?: string 
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col relative">
      <CosmicBackground />
      <Navbar 
        state={state} 
        navigate={navigate} 
        onMarkRead={onMarkRead}
        onClaimReward={onClaimReward}
        onLogout={onLogout}
      />
      <main className="max-w-4xl mx-auto px-6 py-12 w-full">
        <header className="mb-12 text-center md:text-left">
          <h1 className="font-headline text-5xl font-black mb-4">
            Petualangan <span className="text-primary">365 Hari</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-xl">
            Jelajahi keajaiban Firman Tuhan setiap hari. Kumpulkan bintang dan selesaikan perjalananmu!
          </p>
          <div className="mt-8 p-6 rounded-lg bg-surface-container-low flex flex-col md:flex-row items-center gap-6 border border-outline-variant/10">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-variant" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8" />
                <circle className="text-primary" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - state.currentDay / 365)} strokeWidth="8" strokeLinecap="round" />
              </svg>
              <span className="absolute font-headline font-bold text-xl">{Math.round((state.currentDay / 365) * 100)}%</span>
            </div>
            <div className="flex-1">
              <h3 className="font-headline font-bold text-lg">Hampir Sampai, Bintang Kecil!</h3>
              <p className="text-on-surface-variant text-sm">{state.currentDay} dari 365 hari telah selesai disinari.</p>
            </div>
            <button onClick={() => navigate('daily-reading')} className="px-6 py-3 rounded-xl cosmic-gradient text-on-primary font-bold shadow-lg">
              Lanjut Membaca
            </button>
          </div>
        </header>

        <div className="mb-10 glass-card p-6 rounded-2xl border border-outline-variant/10">
          <div className="flex justify-between items-end mb-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Progress Perjalanan</span>
              <span className="text-on-surface-variant text-sm font-medium">Teruslah bersinar, kamu luar biasa!</span>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-primary leading-none">{Math.round((state.currentDay / 365) * 100)}%</span>
            </div>
          </div>
          <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden p-1 border border-outline-variant/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(state.currentDay / 365) * 100}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary via-secondary to-tertiary rounded-full shadow-lg shadow-primary/20"
            />
          </div>
        </div>

        <div className="space-y-4 relative">
          <div className="absolute left-10 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-secondary/20 to-transparent rounded-full -z-10 hidden md:block" />
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar pb-20">
            {[...Array(365)].map((_, i) => {
              const day = i + 1;
              const dailyReading = getReadingForDay(day);
              const hasEntry = state.entries?.some(e => e.day === day);
              const isCompleted = day < state.currentDay || hasEntry;
              const isToday = day === state.currentDay;
              const isLocked = day > state.currentDay;

              return (
                <div key={day} className={`group flex items-center gap-6 ${isLocked ? 'opacity-40' : 'opacity-100'} transition-all duration-300`}>
                  <div className="hidden md:flex w-20 justify-end">
                    <span className={`font-headline font-black text-2xl ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{day.toString().padStart(3, '0')}</span>
                  </div>
                  <div className={`flex-none w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${isToday && !hasEntry ? 'cosmic-gradient border-primary-container shadow-xl' : isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-surface-container-high border-surface-container'}`}>
                    {isCompleted && <span className="material-symbols-outlined notranslate text-emerald-600 text-3xl fill-icon" translate="no">&#xe86c;</span>}
                    {isToday && !hasEntry && <span className="material-symbols-outlined notranslate text-on-primary text-3xl fill-icon" translate="no">&#xe838;</span>}
                    {isLocked && <span className="material-symbols-outlined notranslate text-outline-variant text-3xl" translate="no">&#xe897;</span>}
                  </div>
                  <div 
                    onClick={() => !isLocked && navigate('daily-reading')}
                    className={`flex-1 glass-card p-5 rounded-xl flex items-center justify-between transition-all cursor-pointer relative overflow-hidden ${isToday && !hasEntry ? 'ring-2 ring-primary bg-surface-container-highest' : isCompleted ? 'border-emerald-100 bg-emerald-50/30' : 'hover:bg-surface-container-highest'}`}
                  >
                    {!isLocked && (
                      <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity">
                        <img 
                          src={getAssetUrl(`/img/daily/day-${day}.jfif`)}
                          onError={(e) => {
                            const t = e.currentTarget;
                            if (t.src.endsWith('.jfif')) t.src = t.src.replace('.jfif', '.jpeg');
                            else if (t.src.endsWith('.jpeg')) t.src = t.src.replace('.jpeg', '.jpg');
                            else if (!t.src.includes('logo.png')) t.src = getAssetUrl('/img/logo.png');
                          }}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                    )}
                    <div className="relative z-10">
                      <h4 className={`font-headline font-bold text-lg ${isToday && !hasEntry ? 'text-primary' : isCompleted ? 'text-emerald-700' : 'text-on-surface'}`}>{isLocked ? 'Terkunci' : `Hari ${day}`}</h4>
                      <p className="text-on-surface-variant font-label text-xs uppercase tracking-widest">{dailyReading.reference}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isToday && !hasEntry && <div className="bg-primary px-3 py-1 rounded-full text-on-primary font-bold text-[10px] uppercase animate-pulse">Hari Ini</div>}
                      {isCompleted && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase">Selesai</span>}
                      {!isLocked && <span className="material-symbols-outlined notranslate text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" translate="no">&#xe5cc;</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer user={state.user} />
    </motion.div>
  );
}

function DailyReadingScreen({ state, navigate, onMarkRead, onClaimReward, onLogout }: { 
  state: AppState; 
  navigate: (s: Screen) => void; 
  onMarkRead: (id: string) => void;
  onClaimReward: (id: string) => void;
  onLogout: () => void;
  key?: string 
}) {
  const dailyReading = getReadingForDay(state.currentDay);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col relative">
      <CosmicBackground />
      <Navbar 
        state={state} 
        navigate={navigate} 
        onMarkRead={onMarkRead}
        onClaimReward={onClaimReward}
        onLogout={onLogout}
      />
      <main className="max-w-3xl mx-auto px-6 py-12 w-full pb-32">
        <header className="mb-10 text-center relative p-8 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20">
            <img 
              src={getAssetUrl(`/img/daily/day-${state.currentDay}.jfif`)}
              onError={(e) => {
                const t = e.currentTarget;
                if (t.src.endsWith('.jfif')) t.src = t.src.replace('.jfif', '.jpeg');
                else if (t.src.endsWith('.jpeg')) t.src = t.src.replace('.jpeg', '.jpg');
                else if (!t.src.includes('logo.png')) t.src = getAssetUrl('/img/logo.png');
              }}
              className="w-full h-full object-cover"
              alt=""
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-surface/40 to-surface z-0" />
          <div className="relative z-10">
            <h1 className="font-headline text-4xl font-extrabold mb-2 text-on-surface">Bacaan Hari Ini</h1>
            <p className="text-secondary font-bold tracking-wide text-lg">Hari {state.currentDay} {dailyReading.reference}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <div className="glass-card rounded-lg p-8 border border-outline-variant/15 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-tertiary/10 rounded-full blur-xl" />
            <div className="flex items-start gap-4 mb-6">
              <span className="material-symbols-outlined notranslate text-primary text-4xl fill-icon" translate="no">&#xe244;</span>
              <h2 className="font-headline text-2xl font-bold leading-tight">"{dailyReading.verseText}"</h2>
            </div>
            <div className="space-y-6 text-on-surface-variant leading-relaxed">
              <p className="font-bold text-primary">— {dailyReading.highlightVerse}</p>
              <p>{dailyReading.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container-high p-6 rounded-lg border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined notranslate text-secondary text-sm" translate="no">&#xe0f0;</span>
                </div>
                <span className="font-bold text-sm text-secondary">Pesan Utama</span>
              </div>
              <p className="text-sm leading-relaxed">{dailyReading.message}</p>
            </div>
            <div className="bg-surface-container-high p-6 rounded-lg border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center">
                  <span className="material-symbols-outlined notranslate text-tertiary text-sm" translate="no">&#xe91d;</span>
                </div>
                <span className="font-bold text-sm text-tertiary">Aksi Hari Ini</span>
              </div>
              <p className="text-sm leading-relaxed">{dailyReading.action}</p>
            </div>
          </div>

          <div className="relative h-56 rounded-2xl overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-outline-variant/10">
            <img 
              className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
              src={getAssetUrl(`/img/daily/day-${state.currentDay}.jfif`)} 
              alt="Reading Visual" 
              referrerPolicy="no-referrer" 
              onError={(e) => {
                const t = e.currentTarget;
                if (t.src.endsWith('.jfif')) t.src = t.src.replace('.jfif', '.jpeg');
                else if (t.src.endsWith('.jpeg')) t.src = t.src.replace('.jpeg', '.jpg');
                else if (!t.src.includes('logo.png')) t.src = getAssetUrl('/img/logo.png');
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6">
              <div className="flex items-center gap-3 drop-shadow-lg">
                <span className="material-symbols-outlined notranslate text-[#ff89ad] text-2xl fill-icon" translate="no">&#xe1e0;</span>
                <span className="text-white text-lg font-bold italic drop-shadow-sm">"{dailyReading.highlightVerse}"</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 glass-card border-t border-outline-variant/10 z-40 bg-gradient-to-b from-transparent to-surface/80">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => navigate('journal-entry')} 
            className="w-full h-16 bg-[#ff89ad] hover:bg-[#ff7aa3] text-white font-headline font-extrabold text-xl rounded-2xl flex items-center justify-center gap-4 shadow-[0_8px_25px_rgba(255,137,173,0.4)] active:scale-95 transition-all group"
          >
            <span className="material-symbols-outlined notranslate text-white text-3xl group-hover:rotate-12 transition-transform" translate="no">&#xe43a;</span>
            Tulis Jurnal
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function JournalEntryScreen({ state, onSave, onBack }: { state: AppState; onSave: (e: any) => void; onBack: () => void; key?: string }) {
  const [scripture, setScripture] = useState('');
  const [observation, setObservation] = useState('');
  const [application, setApplication] = useState('');
  const [prayer, setPrayer] = useState('');
  const [showHints, setShowHints] = useState(true);

  const soapItems = [
    { 
      id: 'S', 
      label: 'Scripture (Ayat)', 
      question: 'Ayat mana yang paling kamu ingat?', 
      hint: 'Tuliskan ayat yang paling menyentuh hatimu hari ini. Kamu bisa menyalinnya pelan-pelan dari Alkitab ya!',
      placeholder: 'Contoh: Mazmur 8:2 - Ya TUHAN, Tuhan kami...', 
      value: scripture, 
      setter: setScripture 
    },
    { 
      id: 'O', 
      label: 'Observation (Observasi)', 
      question: 'Apa yang kamu pelajari tentang Tuhan?', 
      hint: 'Apa yang Tuhan lakukan dalam cerita tadi? Apakah Tuhan menunjukkan kasih-Nya atau kuasa-Nya? Tuliskan apa yang kamu lihat.',
      placeholder: 'Aku belajar bahwa Tuhan menciptakan bintang yang sangat banyak...', 
      value: observation, 
      setter: setObservation 
    },
    { 
      id: 'A', 
      label: 'Application (Aplikasi)', 
      question: 'Bagaimana kamu melakukannya hari ini?', 
      hint: 'Pikirkan satu hal kecil yang bisa kamu lakukan di rumah atau sekolah berdasarkan ayat tadi. Misalnya: Membantu mama atau berkata jujur.',
      placeholder: 'Hari ini aku mau bersyukur saat melihat langit biru...', 
      value: application, 
      setter: setApplication 
    },
    { 
      id: 'P', 
      label: 'Prayer (Doa)', 
      question: 'Apa yang ingin kamu katakan pada Yesus?', 
      hint: 'Bicaralah pada Yesus seperti bicara pada sahabat baikmu. Kamu bisa berterima kasih atau minta tolong kepada-Nya.',
      placeholder: 'Tuhan Yesus, terima kasih sudah menjagaku...', 
      value: prayer, 
      setter: setPrayer 
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col relative">
      <CosmicBackground />
      <nav className="sticky top-0 z-50 w-full px-6 py-4 glass-card flex items-center justify-between border-b border-outline-variant/10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
          <span className="material-symbols-outlined notranslate" translate="no">&#xe5c4;</span>
          <span className="font-headline font-bold text-xl">Jurnal Harian</span>
        </div>
        <button 
          onClick={() => setShowHints(!showHints)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${showHints ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-high text-on-surface-variant'}`}
        >
          <span className="material-symbols-outlined notranslate text-sm" translate="no" dangerouslySetInnerHTML={{ __html: showHints ? '&#xe0f0;' : '&#xe90f;' }}></span>
          <span className="text-xs font-bold uppercase tracking-wider">{showHints ? 'Petunjuk Aktif' : 'Lihat Petunjuk'}</span>
        </button>
      </nav>

      <main className="flex-grow container mx-auto px-6 py-12 max-w-4xl">
        <header className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high text-tertiary-fixed font-label text-sm mb-4">
            <span className="material-symbols-outlined notranslate text-sm" translate="no">&#xe935;</span>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface mb-3">Refleksi   S.O.A.P</h1>
          <p className="text-on-surface-variant text-lg">Mari merenungkan Firman Tuhan bersama pada hari ini.</p>
        </header>

        <div className="space-y-6">
          {soapItems.map((item) => (
            <section key={item.id} className="glass-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 border border-outline-variant/15 hover:scale-[1.01] transition-transform relative overflow-hidden">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#ff89ad] flex items-center justify-center text-[#543782] mb-2 shadow-inner">
                  <span className="font-headline font-bold text-2xl">{item.id}</span>
                </div>
                <span className="font-label text-[10px] uppercase tracking-widest text-on-tertiary-container font-black">{item.label.split(' ')[0]}</span>
              </div>
              <div className="flex-grow">
                <div className="flex flex-col mb-3">
                  <label className="block font-headline font-semibold text-lg text-on-surface">{item.question}</label>
                  <AnimatePresence>
                    {showHints && (
                      <motion.p 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-primary text-sm font-medium mt-1 italic flex items-start gap-2"
                      >
                        <span className="material-symbols-outlined notranslate text-xs mt-1" translate="no">&#xe88e;</span>
                        {item.hint}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <textarea
                  value={item.value}
                  onChange={(e) => item.setter(e.target.value)}
                  className="w-full bg-surface-container-lowest/50 border border-outline-variant/10 rounded-xl p-4 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                  placeholder={item.placeholder}
                  rows={item.id === 'S' || item.id === 'P' ? 3 : 4}
                />
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 pb-20">
          <button
            onClick={() => onSave({ scripture, observation, application, prayer })}
            className="w-full md:w-auto md:min-w-[320px] h-16 cosmic-gradient rounded-xl font-headline font-extrabold text-xl text-on-primary shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined notranslate fill-icon" translate="no">&#xe838;</span>
            Simpan Jurnal
            <span className="material-symbols-outlined notranslate fill-icon" translate="no">&#xe838;</span>
          </button>
          <p className="font-label text-sm text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined notranslate text-sm" translate="no">&#xe94f;</span>
            You will earn +50 Star Points!
          </p>
        </div>
      </main>
    </motion.div>
  );
}

function RewardScreen({ state, onContinue }: { state: AppState; onContinue: () => void; key?: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6 overflow-hidden">
      <CosmicBackground />
      <div className="relative z-10 w-full max-w-2xl glass-card rounded-lg p-8 md:p-12 text-center border border-white/10 shadow-2xl">
        <div className="relative mb-8 inline-block">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl scale-150" />
          <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full p-1 shadow-2xl">
            <div className="w-full h-full rounded-full bg-surface-container-highest flex items-center justify-center relative overflow-hidden">
              <div className="flex flex-col items-center">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="material-symbols-outlined text-7xl md:text-9xl text-primary fill-icon"
                >
                  &#xeb9b;
                </motion.span>
                <span className="mt-2 font-headline font-extrabold text-sm md:text-base text-tertiary tracking-widest uppercase">Genesis Explorer</span>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-tertiary rounded-full flex items-center justify-center shadow-lg rotate-12">
            <span className="material-symbols-outlined notranslate text-on-tertiary fill-icon" translate="no">&#xe838;</span>
          </div>
          <div className="absolute bottom-4 -left-6 w-10 h-10 bg-primary-container rounded-full flex items-center justify-center shadow-lg -rotate-12">
            <span className="material-symbols-outlined notranslate text-on-primary-container fill-icon" translate="no">&#xe94f;</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-on-surface leading-tight">
            Hebat! Kamu membaca Firman Tuhan hari ini!
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-md mx-auto">
            Satu langkah lebih dekat untuk menjadi penjelajah Alkitab sejati. Teruslah bersinar!
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onContinue} className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-all">
            Klaim Hadiah ✨
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-sm font-label text-tertiary font-bold">+50 XP didapat</span>
            <span className="text-sm font-label text-on-surface-variant">Level {state.level}</span>
          </div>
          <div className="w-full h-4 bg-surface-container-low rounded-full overflow-hidden p-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${state.xp}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileScreen({ state, navigate, onUpdateCustomAvatar, onMarkRead, onClaimReward, onLogout }: { 
  state: AppState; 
  navigate: (s: Screen) => void; 
  onUpdateCustomAvatar: (url: string) => void; 
  onMarkRead: (id: string) => void;
  onClaimReward: (id: string) => void;
  onLogout: () => void;
  key?: string 
}) {
  const [showMagicCreator, setShowMagicCreator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateCustomAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col relative">
      <CosmicBackground />
      <Navbar 
        state={state} 
        navigate={navigate} 
        onMarkRead={onMarkRead}
        onClaimReward={onClaimReward}
        onLogout={onLogout}
      />
      <main className="max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-lg p-8 relative overflow-hidden text-center border border-outline-variant/10">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary opacity-10 blur-[100px] rounded-full" />
              <div className="relative z-10">
                <div className="relative inline-block mb-6">
                  <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary">
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-surface bg-surface-container flex items-center justify-center">
                      <AvatarDisplay avatarId={state.user?.avatar} customUrl={state.user?.customAvatarUrl} iconSize="text-6xl" />
                    </div>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-12 h-12 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-lg border-4 border-surface hover:scale-105 transition-transform"
                  >
                    <span className="material-symbols-outlined notranslate" translate="no">&#xe3c9;</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                <h1 className="font-headline text-3xl font-extrabold mb-1">{state.user?.name || 'Sammy Explorer'}</h1>
                <p className="text-secondary font-bold text-sm mb-3 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined notranslate text-sm" translate="no">&#xe80c;</span>
                  {state.user?.schoolName || 'Sekolah Dasar'}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-xs font-bold mb-4">
                  <span className="material-symbols-outlined notranslate text-sm fill-icon" translate="no">&#xea3f;</span>
                  {state.xp} XP TERKUMPUL
                </div>
                <p className="text-on-surface-variant mb-8">Member since 2026</p>
                <div className="flex flex-col gap-3">
                  <button className="w-full h-14 cosmic-gradient text-on-primary-container font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                    <span className="material-symbols-outlined notranslate" translate="no">&#xe86a;</span>
                    Ganti Avatar
                  </button>
                  <button 
                    onClick={() => setShowMagicCreator(true)}
                    className="w-full h-14 bg-surface-container-highest text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform border border-primary/20"
                  >
                    <span className="material-symbols-outlined notranslate" translate="no">&#xe336;</span>
                    Magic Avatar Creator
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-lg p-4 flex flex-col items-center justify-center border border-outline-variant/10">
                <span className="font-headline text-2xl font-black text-primary mb-1">{state.level}</span>
                <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-widest">Level</span>
              </div>
              <div className="glass-card rounded-lg p-4 flex flex-col items-center justify-center border border-outline-variant/10">
                <span className="font-headline text-2xl font-black text-secondary mb-1">{state.streak}</span>
                <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-widest">Streak</span>
              </div>
              <div className="glass-card rounded-lg p-4 flex flex-col items-center justify-center border border-outline-variant/10">
                <span className="font-headline text-2xl font-black text-tertiary mb-1">{state.xp}</span>
                <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-widest">Total XP</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline text-xl font-bold px-2">Perjalanan Membaca</h2>
                <span className="text-primary font-bold">{state.currentDay} / 365 Hari</span>
              </div>
              <div className="glass-card rounded-lg p-8 border border-outline-variant/10 relative overflow-hidden group">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 z-0 opacity-15 group-hover:opacity-25 transition-opacity duration-700"
                  style={{ 
                    backgroundImage: `url(${getAssetUrl("/img/perjalanan membaca.jpg")})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                
                <div className="relative z-10">
                  <div className="w-full bg-surface-container-highest h-4 rounded-full mb-8 overflow-hidden p-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(state.currentDay / 365) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full cosmic-gradient rounded-full shadow-lg shadow-primary/20" 
                    />
                  </div>
                  <div className="grid grid-cols-7 gap-3">
                    {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((day, i) => {
                      const today = new Date().getDay(); // 0 is Sun, 1 is Mon...
                      const dayIndex = today === 0 ? 6 : today - 1; // Map to 0 (Mon) - 6 (Sun)
                      const isActive = i === dayIndex;
                      
                      return (
                        <div 
                          key={i} 
                          className={`
                            h-12 rounded-xl flex flex-col items-center justify-center text-xs font-black transition-all duration-500
                            ${i <= dayIndex ? 'bg-primary text-on-primary' : 'bg-surface-container-high/60 border border-outline-variant/20 text-on-surface-variant'}
                            ${isActive ? 'ring-4 ring-primary/40 shadow-[0_0_20px_rgba(255,137,173,0.6)] scale-110 z-10 animate-pulse' : ''}
                          `}
                        >
                          <span className="opacity-60 text-[8px] uppercase mb-0.5">
                            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]}
                          </span>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline text-xl font-bold px-2">Lencana Keren</h2>
                <span className="text-secondary font-bold">{state.badges?.filter(b => b.unlocked).length || 0} Koleksi</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {state.badges?.filter(b => b.unlocked).slice(-4).reverse().map((badge, index) => (
                  <motion.div 
                    key={badge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -5,
                      boxShadow: "0 10px 25px -5px rgba(var(--primary-rgb), 0.2)"
                    }}
                    className="glass-card rounded-lg p-4 flex flex-col items-center text-center transition-colors border border-outline-variant/10 group cursor-pointer"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-${badge.color}/20 group-hover:bg-${badge.color}/30 transition-colors relative overflow-hidden`}>
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="w-full h-full flex items-center justify-center p-2"
                      >
                        {badge.url ? (
                          <img src={badge.url} alt={badge.name} className="w-full h-full object-contain drop-shadow-lg" />
                        ) : badge.icon.length > 2 ? (
                          <span className="material-symbols-outlined notranslate text-3xl fill-icon group-hover:scale-110 transition-transform" translate="no" dangerouslySetInnerHTML={{ __html: badge.icon }}></span>
                        ) : (
                          <span className="text-3xl group-hover:scale-110 transition-transform">{badge.icon}</span>
                        )}
                      </motion.div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full group-hover:translate-x-full duration-1000" />
                    </div>
                    <span className="font-bold text-sm group-hover:text-primary transition-colors">{badge.name}</span>
                  </motion.div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-headline text-xl font-bold px-2 mb-4">Catatan Jurnal Terbaru</h2>
              <div className="space-y-4">
                {state.entries?.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="glass-card rounded-lg p-5 flex items-center gap-4 hover:translate-x-2 transition-transform cursor-pointer border border-outline-variant/10">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined notranslate text-primary" translate="no">&#xe891;</span>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-primary">{entry.scripture}</h4>
                      <p className="text-sm text-on-surface-variant line-clamp-1 italic">"{entry.observation}"</p>
                      {entry.aiMetadata && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entry.aiMetadata.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full border border-secondary/20">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-secondary block mb-1">HARI {entry.day}</span>
                      <span className="text-[10px] text-outline uppercase font-medium">{entry.date}</span>
                    </div>
                  </div>
                ))}
                {state.entries.length === 0 && (
                  <div className="text-center py-8 glass-card rounded-lg border border-dashed border-outline-variant/30">
                    <p className="text-on-surface-variant">Belum ada catatan jurnal.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer user={state.user} />
      <AnimatePresence>
        {showMagicCreator && (
          <MagicAvatarCreator 
            onClose={() => setShowMagicCreator(false)} 
            onSave={(url) => {
              onUpdateCustomAvatar(url);
              setShowMagicCreator(false);
            }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MagicAvatarCreator({ onClose, onSave }: { onClose: () => void; onSave: (url: string) => void }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);

    try {
      const aistudio = (window as any).aistudio;
      if (aistudio && !(await aistudio.hasSelectedApiKey())) {
        await aistudio.openSelectKey();
      }

      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
      
      // MOCK FALLBACK: Generate a random color avatar if no API key
      if (!apiKey) {
        console.info("Running in Offline/Mock mode for Avatar Generation");
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
        setGeneratedImage(`https://api.dicebear.com/7.x/bottts/svg?seed=${prompt}`);
        setIsGenerating(false);
        return;
      }

      const ai = new GoogleGenAI(apiKey);
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: `A cute, high-quality, 3D rendered animal avatar for a kids app: ${prompt}. The style should be friendly, colorful, and centered on a simple background.` }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          },
        },
      });

      let imageUrl = null;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl);
      } else {
        setError("Gagal membuat gambar. Coba lagi ya!");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        const aistudio = (window as any).aistudio;
        if (aistudio) await aistudio.openSelectKey();
      }
      setError("Ups, ada masalah. Pastikan kamu sudah memilih kunci API yang benar.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-card w-full max-w-lg rounded-2xl p-8 border border-primary/30 shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
        >
          <span className="material-symbols-outlined notranslate" translate="no">&#xe5cd;</span>
        </button>

        <h2 className="font-headline text-2xl font-bold mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined notranslate text-primary" translate="no">&#xe336;</span>
          Magic Avatar Creator
        </h2>
        <p className="text-on-surface-variant text-sm mb-6">
          Tuliskan hewan apa yang kamu inginkan, dan AI akan membuatnya untukmu!
        </p>

        <div className="space-y-6">
          <div className="relative">
            <input 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Contoh: Kucing astronot yang lucu..."
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-4 text-on-surface focus:ring-2 focus:ring-primary outline-none"
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="absolute right-2 top-2 bottom-2 px-6 cosmic-gradient rounded-lg font-bold text-sm disabled:opacity-50 disabled:scale-100 hover:scale-105 transition-transform"
            >
              {isGenerating ? 'Membuat...' : 'Buat!'}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-error-container text-on-error-container rounded-lg text-sm flex items-start gap-2">
              <span className="material-symbols-outlined notranslate text-sm mt-0.5" translate="no">&#xe000;</span>
              {error}
            </div>
          )}

          <div className="aspect-square w-full max-w-[280px] mx-auto rounded-2xl bg-surface-container-high border-2 border-dashed border-outline-variant/30 flex items-center justify-center overflow-hidden relative">
            {generatedImage ? (
              <img src={generatedImage} alt="Generated Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : isGenerating ? (
              <div className="flex flex-col items-center gap-4">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                />
                <p className="text-xs font-bold animate-pulse">Sedang menyulap...</p>
              </div>
            ) : (
              <div className="text-center p-6">
                <span className="material-symbols-outlined notranslate text-5xl text-outline-variant mb-2" translate="no">&#xe3f4;</span>
                <p className="text-xs text-on-surface-variant">Gambar akan muncul di sini</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-surface-container-high rounded-xl font-bold hover:bg-surface-container-highest transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={() => generatedImage && onSave(generatedImage)}
              disabled={!generatedImage}
              className="flex-1 py-4 cosmic-gradient rounded-xl font-bold disabled:opacity-50 hover:scale-105 transition-transform"
            >
              Gunakan Avatar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CelebrationScreen({ state, onRestart, onMarkRead, onClaimReward, onLogout }: { 
  state: AppState; 
  onRestart: () => void; 
  onMarkRead: (id: string) => void;
  onClaimReward: (id: string) => void;
  onLogout: () => void;
  key?: string 
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <CosmicBackground />
      <Navbar 
        state={state} 
        navigate={() => {}} 
        onMarkRead={onMarkRead}
        onClaimReward={onClaimReward}
        onLogout={onLogout}
      />
      <main className="flex-grow flex items-center justify-center relative px-4 py-12 cosmic-gradient">
        <div className="max-w-4xl w-full text-center z-10">
          <div className="mb-8 relative inline-block">
            <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-150" />
            <div className="relative glass-card rounded-full p-8 w-48 h-48 md:w-64 md:h-64 flex items-center justify-center mx-auto border border-outline-variant/20 shadow-2xl">
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined notranslate text-7xl md:text-9xl text-primary mb-2 fill-icon" translate="no">&#xe7af;</span>
                <div className="absolute -bottom-4 bg-tertiary-container px-6 py-2 rounded-full shadow-lg">
                  <span className="font-headline font-extrabold text-on-tertiary-container text-xl md:text-2xl">DAY 365</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h1 className="font-headline font-extrabold text-4xl md:text-7xl leading-tight text-on-surface">
              Selamat! Kamu Telah <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-tertiary to-secondary">Membaca Alkitab</span>
            </h1>
            <p className="font-body text-xl md:text-2xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Satu tahun penuh keajaiban bersama Firman Tuhan! Kamu telah menyelesaikan perjalanan luar biasa ini.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-12">
              <button className="px-10 py-5 bg-gradient-to-r from-primary to-primary-container rounded-xl font-headline font-bold text-on-primary text-xl shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                <span className="material-symbols-outlined notranslate" translate="no">&#xe80d;</span>
                Bagikan Pencapaian
              </button>
              <button onClick={onRestart} className="px-10 py-5 bg-surface-container-high border border-outline-variant/30 rounded-xl font-headline font-bold text-on-surface text-xl hover:bg-surface-container-highest transition-all flex items-center gap-3">
                <span className="material-symbols-outlined notranslate" translate="no">&#xf090;</span>
                Sertifikat Digital
              </button>
            </div>
            <div className="mt-16 flex items-center justify-center gap-2 text-primary">
              <span className="font-headline font-bold text-2xl">Tuhan Memberkati ❤️</span>
            </div>
          </div>
        </div>
      </main>
      <Footer user={state.user} />
    </motion.div>
  );
}
