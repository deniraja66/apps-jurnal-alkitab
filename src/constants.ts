import { Badge, Notification, Reward } from './types';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const INITIAL_BADGES: Badge[] = [
  { id: '1', name: 'PEMULA', icon: '🌱', url: `${base}/img/lencana/pemula.png`, unlocked: true, color: 'tertiary', requiredDays: 0 },
  { id: '2', name: 'SETIA', icon: '🛡️', url: `${base}/img/lencana/setia.png`, unlocked: true, color: 'primary', requiredDays: 3 },
  { id: '3', name: 'DAMAI', icon: '🕊️', url: `${base}/img/lencana/damai.png`, unlocked: true, color: 'secondary', requiredDays: 5 },
  { id: '4', name: 'BINTANG 181 HARI', icon: '⭐', url: `${base}/img/lencana/bintang 7 hari.png`, unlocked: true, color: 'tertiary', requiredDays: 7 },
  { id: '5', name: 'PRAJURIT DOA', icon: '✨', url: `${base}/img/lencana/prajurit doa.png`, unlocked: true, color: 'secondary', requiredDays: 14 },
  { id: '6', name: 'PENYELAM DALAM', icon: '🚀', url: `${base}/img/lencana/penyelam dalam.png`, unlocked: true, color: 'primary', requiredDays: 30 },
  { id: '7', name: 'Lion', icon: '🦁', unlocked: false, color: 'surface-variant', requiredDays: 60 },
  { id: '8', name: 'Warrior', icon: '⚔️', unlocked: false, color: 'surface-variant', requiredDays: 90 },
  { id: '9', name: 'King', icon: '👑', unlocked: false, color: 'surface-variant', requiredDays: 120 },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Selamat Datang!',
    message: 'Mulai petualangan imanmu hari ini dengan membaca Firman Tuhan.',
    date: new Date().toISOString(),
    read: false,
    type: 'info'
  },
  {
    id: 'n2',
    title: 'Badge Baru Terbuka!',
    message: 'Kamu telah mendapatkan badge "Pemula". Teruslah membaca!',
    date: new Date().toISOString(),
    read: false,
    type: 'achievement'
  }
];

export const INITIAL_REWARDS: Reward[] = [
  {
    id: 'r1',
    title: 'Bonus Awal',
    description: 'Hadiah selamat datang untuk penjelajah baru.',
    icon: '🎁',
    xpValue: 100,
    claimed: false
  },
  {
    id: 'r2',
    title: 'Pembaca Setia',
    description: 'Selesaikan 3 hari berturut-turut.',
    icon: '🏆',
    xpValue: 250,
    claimed: false
  },
  {
    id: 'r3',
    title: 'Penulis Jurnal',
    description: 'Tulis jurnal S.O.A.P pertamamu.',
    icon: '✍️',
    xpValue: 150,
    claimed: false
  }
];

export const AVATARS = [
  // Karakter Laki-laki (Dulu adv1-adv4)
  { id: 'adv1', name: 'Laki-laki 1', category: 'Laki-laki', url: `${base}/img/karakter/laki-1.jpg` },
  { id: 'adv2', name: 'Laki-laki 2', category: 'Laki-laki', url: `${base}/img/karakter/laki-2.jpg` },
  { id: 'adv3', name: 'Laki-laki 3', category: 'Laki-laki', url: `${base}/img/karakter/laki-3.jpg` },
  { id: 'adv4', name: 'Laki-laki 4', category: 'Laki-laki', url: `${base}/img/karakter/laki-4.jpg` },

  // Karakter Perempuan (Dulu adv5-adv8)
  { id: 'adv5', name: 'Perempuan 1', category: 'Perempuan', url: `${base}/img/karakter/cewe-1.jpg` },
  { id: 'adv6', name: 'Perempuan 2', category: 'Perempuan', url: `${base}/img/karakter/cewe-2.jpg` },
  { id: 'adv7', name: 'Perempuan 3', category: 'Perempuan', url: `${base}/img/karakter/cewe-3.jpg` },
  { id: 'adv8', name: 'Perempuan 4', category: 'Perempuan', url: `${base}/img/karakter/cewe-4.jpg` },
 
  // Hewan
  { id: 'h_anjing', name: 'Anjing', category: 'Hewan', url: `${base}/img/hewan/anjing.jpg` },
  { id: 'h_ayam', name: 'Ayam', category: 'Hewan', url: `${base}/img/hewan/ayam.jpg` },
  { id: 'h_domba', name: 'Domba', category: 'Hewan', url: `${base}/img/hewan/domba.jpg` },
  { id: 'h_ikan', name: 'Ikan', category: 'Hewan', url: `${base}/img/hewan/ikan.jpg` },
  { id: 'h_kelinci', name: 'Kelinci', category: 'Hewan', url: `${base}/img/hewan/kelinci.jpg` },
  { id: 'h_kucing', name: 'Kucing', category: 'Hewan', url: `${base}/img/hewan/kucing.jpg` },
  { id: 'h_merpati', name: 'Merpati', category: 'Hewan', url: `${base}/img/hewan/merpati.jpg` },
  { id: 'h_singa', name: 'Singa', category: 'Hewan', url: `${base}/img/hewan/singa.jpg` },
];
