export type Screen = 'loading' | 'onboarding' | 'home' | 'reading-plan' | 'daily-reading' | 'journal-entry' | 'profile' | 'reward' | 'celebration';

export interface UserProfile {
  name: string;
  schoolName?: string;
  avatar: string;
  customAvatarUrl?: string;
  startDate: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  scripture: string;
  observation: string;
  application: string;
  prayer: string;
  day: number;
  aiMetadata?: {
    tags: string[];
    summary: string;
    mood: string;
    mainTheme: string;
  };
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  url?: string;
  unlocked: boolean;
  color: string;
  requiredDays: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'achievement' | 'reminder';
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpValue: number;
  claimed: boolean;
}

export interface Avatar {
  id: string;
  name: string;
  icon?: string;
  category: 'Laki-laki' | 'Perempuan' | 'Hewan' | 'Karakter';
  url?: string;
  spritePos?: string;
}

export interface AppState {
  screen: Screen;
  user: UserProfile | null;
  currentDay: number;
  selectedDay: number;
  streak: number;
  xp: number;
  level: number;
  entries: JournalEntry[];
  completedDays: number[];
  badges: Badge[];
  notifications: Notification[];
  rewards: Reward[];
}
