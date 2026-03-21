export interface ReadingDay {
  day: number;
  reference: string;
  highlightVerse: string;
  verseText: string;
  summary: string;
  message: string;
  action: string;
  imageSeed: string;
}

export const READING_PLAN: Record<number, ReadingDay> = {
  1: {
    day: 1,
    reference: "Kejadian 1–2",
    highlightVerse: "Kejadian 1:1",
    verseText: "Pada mulanya Allah menciptakan langit dan bumi.",
    summary: "Tuhan menciptakan dunia yang indah ini dalam enam hari. Semuanya sungguh amat baik!",
    message: "Tuhan adalah pencipta yang hebat, dan Dia menciptakanmu dengan sangat istimewa.",
    action: "Sebutkan 3 hal indah yang Tuhan ciptakan yang kamu lihat hari ini.",
    imageSeed: "nature"
  },
  2: {
    day: 2,
    reference: "Kejadian 3–5",
    highlightVerse: "Kejadian 3:15",
    verseText: "Aku akan mengadakan permusuhan antara engkau dan perempuan ini, antara keturunanmu dan keturunannya.",
    summary: "Manusia jatuh ke dalam dosa, tetapi Tuhan memberikan janji keselamatan yang luar biasa.",
    message: "Tuhan selalu punya rencana untuk menolong kita, bahkan saat kita melakukan kesalahan.",
    action: "Berdoa minta ampun kepada Tuhan jika ada kesalahan yang kamu lakukan hari ini.",
    imageSeed: "garden"
  },
  3: {
    day: 3,
    reference: "Kejadian 6–9",
    highlightVerse: "Kejadian 9:13",
    verseText: "Busur-Ku Kutaruh di awan, supaya itu menjadi tanda perjanjian antara Aku dan bumi.",
    summary: "Kisah Nuh dan bahtera. Tuhan menyelamatkan Nuh dan keluarganya dari air bah dan memberikan pelangi sebagai tanda janji-Nya.",
    message: "Tuhan selalu menepati janji-Nya. Pelangi adalah pengingat kasih setia Tuhan.",
    action: "Gambarlah pelangi yang indah dan tuliskan 'Tuhan Setia' di bawahnya.",
    imageSeed: "rainbow"
  },
  4: {
    day: 4,
    reference: "Kejadian 10–11",
    highlightVerse: "Kejadian 11:9",
    verseText: "Itulah sebabnya kota itu dinamai Babel, karena di situlah dikacaubalaukan TUHAN bahasa seluruh bumi.",
    summary: "Manusia mencoba membangun menara yang sangat tinggi untuk menyamai Tuhan. Tuhan mengacaukan bahasa mereka.",
    message: "Kerendahan hati sangat penting. Tuhan ingin kita mengandalkan-Nya, bukan kekuatan kita sendiri.",
    action: "Cobalah belajar satu kata baru dalam bahasa lain hari ini!",
    imageSeed: "tower"
  },
  5: {
    day: 5,
    reference: "Kejadian 12–14",
    highlightVerse: "Kejadian 12:2",
    verseText: "Aku akan membuat engkau menjadi bangsa yang besar, dan memberkati engkau serta membuat namamu masyhur.",
    summary: "Tuhan memanggil Abram untuk pergi ke tanah yang baru. Abram taat dan percaya pada janji Tuhan.",
    message: "Ketaatan membawa berkat. Saat kita mengikuti petunjuk Tuhan, Dia akan membimbing kita.",
    action: "Bantu orang tuamu melakukan sesuatu tanpa diminta sebagai bentuk ketaatan.",
    imageSeed: "mountain"
  },
  // ... existing 41, 42, 43 will be merged or kept
  41: {
    day: 41,
    reference: "Mazmur 5–7",
    highlightVerse: "Mazmur 5:12",
    verseText: "Tetapi semua orang yang berlindung pada-Mu akan bersukacita, mereka akan bersorak-sorai selama-lamanya.",
    summary: "Daud berdoa memohon perlindungan Tuhan dari musuh-musuhnya. Ia percaya bahwa Tuhan adalah perisai bagi orang benar.",
    message: "Tuhan selalu menjagamu seperti perisai yang kuat saat kamu merasa takut.",
    action: "Ucapkan terima kasih kepada Tuhan karena Dia menjagamu hari ini.",
    imageSeed: "shield"
  },
  42: {
    day: 42,
    reference: "Mazmur 8–10",
    highlightVerse: "Mazmur 8:2",
    verseText: "Ya TUHAN, Tuhan kami, betapa mulianya nama-Mu di seluruh bumi! Keagungan-Mu yang mengatasi langit dinyanyikan.",
    summary: "Mazmur 8 mengajak kita melihat keindahan alam semesta dan menyadari betapa besarnya kasih Tuhan kepada kita. Mazmur 9-10 memuji Tuhan sebagai Hakim yang adil.",
    message: "Tuhan memperhatikan setiap detail hidupmu karena kamu sangat berharga di mata-Nya.",
    action: "Lihatlah ke langit malam ini dan kagumilah betapa hebatnya Tuhan pencipta kita.",
    imageSeed: "stars"
  },
  43: {
    day: 43,
    reference: "Mazmur 11–13",
    highlightVerse: "Mazmur 13:6",
    verseText: "Tetapi aku, kepada kasih setia-Mu aku percaya, hatiku bersorak-sorai karena penyelamatan-Mu.",
    summary: "Meskipun Daud merasa sedih atau dalam kesulitan, ia tetap memilih untuk percaya pada kasih setia Tuhan yang tidak pernah berubah.",
    message: "Saat kamu merasa sedih, ingatlah bahwa Tuhan sangat menyayangimu dan akan menolongmu.",
    action: "Nyanyikan satu lagu pujian favoritmu untuk Tuhan hari ini.",
    imageSeed: "heart"
  },
  365: {
    day: 365,
    reference: "Wahyu 21–22",
    highlightVerse: "Wahyu 22:21",
    verseText: "Kasih karunia Tuhan Yesus menyertai kamu sekalian! Amin.",
    summary: "Tuhan menjanjikan langit dan bumi yang baru di mana tidak ada lagi kesedihan. Yesus akan datang segera!",
    message: "Selamat! Kamu telah menyelesaikan perjalanan satu tahun. Ingatlah, Yesus selalu bersamamu sampai selamanya.",
    action: "Rayakan keberhasilanmu membaca Alkitab selama setahun bersama keluarga!",
    imageSeed: "celebration"
  }
};

const BIBLE_BOOKS = [
  { name: "Kejadian", chapters: 50 },
  { name: "Keluaran", chapters: 40 },
  { name: "Imamat", chapters: 27 },
  { name: "Bilangan", chapters: 36 },
  { name: "Ulangan", chapters: 34 },
  { name: "Yosua", chapters: 24 },
  { name: "Hakim-hakim", chapters: 21 },
  { name: "Rut", chapters: 4 },
  { name: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", chapters: 24 },
  { name: "1 Raja-raja", chapters: 22 },
  { name: "2 Raja-raja", chapters: 25 },
  { name: "1 Tawarikh", chapters: 29 },
  { name: "2 Tawarikh", chapters: 36 },
  { name: "Ezra", chapters: 10 },
  { name: "Nehemia", chapters: 13 },
  { name: "Ester", chapters: 10 },
  { name: "Ayub", chapters: 42 },
  { name: "Mazmur", chapters: 150 },
  { name: "Amsal", chapters: 31 },
  { name: "Pengkhotbah", chapters: 12 },
  { name: "Kidung Agung", chapters: 8 },
  { name: "Yesaya", chapters: 66 },
  { name: "Yeremia", chapters: 52 },
  { name: "Ratapan", chapters: 5 },
  { name: "Yehezkiel", chapters: 48 },
  { name: "Daniel", chapters: 12 },
  { name: "Hosea", chapters: 14 },
  { name: "Yoel", chapters: 3 },
  { name: "Amos", chapters: 9 },
  { name: "Obaja", chapters: 1 },
  { name: "Yunus", chapters: 4 },
  { name: "Mikha", chapters: 7 },
  { name: "Nahum", chapters: 3 },
  { name: "Habakuk", chapters: 3 },
  { name: "Zefanya", chapters: 3 },
  { name: "Hagai", chapters: 2 },
  { name: "Zakharia", chapters: 14 },
  { name: "Maleakhi", chapters: 4 },
  { name: "Matius", chapters: 28 },
  { name: "Markus", chapters: 16 },
  { name: "Lukas", chapters: 24 },
  { name: "Yohanes", chapters: 21 },
  { name: "Kisah Para Rasul", chapters: 28 },
  { name: "Roma", chapters: 16 },
  { name: "1 Korintus", chapters: 16 },
  { name: "2 Korintus", chapters: 13 },
  { name: "Galatia", chapters: 6 },
  { name: "Efesus", chapters: 6 },
  { name: "Filipi", chapters: 4 },
  { name: "Kolose", chapters: 4 },
  { name: "1 Tesalonika", chapters: 5 },
  { name: "2 Tesalonika", chapters: 3 },
  { name: "1 Timotius", chapters: 6 },
  { name: "2 Timotius", chapters: 4 },
  { name: "Titus", chapters: 3 },
  { name: "Filemon", chapters: 1 },
  { name: "Ibrani", chapters: 13 },
  { name: "Yakobus", chapters: 5 },
  { name: "1 Petrus", chapters: 5 },
  { name: "2 Petrus", chapters: 3 },
  { name: "1 Yohanes", chapters: 5 },
  { name: "2 Yohanes", chapters: 1 },
  { name: "3 Yohanes", chapters: 1 },
  { name: "Yudas", chapters: 1 },
  { name: "Wahyu", chapters: 22 }
];

const MESSAGES = [
  "Tuhan sangat menyayangimu dan ingin kamu menjadi anak yang baik.",
  "Jangan takut, sebab Tuhan menyertaimu ke mana pun kamu pergi.",
  "Kebaikan Tuhan selalu baru setiap pagi bagi kamu.",
  "Jadilah terang bagi teman-temanmu dengan berbuat baik.",
  "Tuhan mendengar setiap doamu, sekecil apa pun itu.",
  "Firman Tuhan adalah pelita bagi kakimu dan terang bagi jalanmu.",
  "Bersyukurlah dalam segala hal karena Tuhan itu baik."
];

const ACTIONS = [
  "Bantu orang tuamu merapikan tempat tidur hari ini.",
  "Berikan senyuman termanismu kepada teman yang kamu temui.",
  "Doakan satu temanmu yang sedang sakit atau sedih.",
  "Ucapkan kata-kata yang baik kepada kakak atau adikmu.",
  "Bagikan mainan atau makananmu dengan teman hari ini.",
  "Tuliskan satu hal yang membuatmu bahagia hari ini.",
  "Hafalkan satu ayat pendek dari bacaan hari ini."
];

const SEEDS = ["forest", "mountain", "ocean", "stars", "garden", "cloud", "sun"];

const FAMOUS_VERSES = [
  { ref: "Yohanes 3:16", text: "Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal." },
  { ref: "Filipi 4:13", text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
  { ref: "Amsal 3:5", text: "Percayalah kepada TUHAN dengan segenap hatimu, dan janganlah bersandar kepada pengertianmu sendiri." },
  { ref: "Yosua 1:9", text: "Bukankah telah Kuperintahkan kepadamu: kuatkan dan teguhkanlah hatimu? Janganlah kecut dan tawar hati." },
  { ref: "Mazmur 23:1", text: "TUHAN adalah gembalaku, takkan kekurangan aku." },
  { ref: "Roma 8:28", text: "Kita tahu sekarang, bahwa Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan." },
  { ref: "Yeremia 29:11", text: "Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN." },
  { ref: "Matius 11:28", text: "Marilah kepada-Ku, semua yang letih lesu dan berbeban berat, Aku akan memberi kelegaan kepadamu." },
  { ref: "1 Korintus 13:4", text: "Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong." },
  { ref: "Yesaya 40:31", text: "Tetapi orang-orang yang menanti-nantikan TUHAN mendapat kekuatan baru." }
];

export const getReadingForDay = (day: number): ReadingDay => {
  if (READING_PLAN[day]) return READING_PLAN[day];

  // Generate dynamic data for other days
  const bookIndex = Math.floor((day / 365) * BIBLE_BOOKS.length);
  const book = BIBLE_BOOKS[Math.min(bookIndex, BIBLE_BOOKS.length - 1)];
  const startChapter = Math.floor(((day % 30) / 30) * book.chapters) + 1;
  const endChapter = Math.min(startChapter + 2, book.chapters);

  const famousVerse = FAMOUS_VERSES[day % FAMOUS_VERSES.length];

  return {
    day,
    reference: `${book.name} ${startChapter}${startChapter !== endChapter ? `–${endChapter}` : ""}`,
    highlightVerse: famousVerse.ref,
    verseText: famousVerse.text,
    summary: `Hari ini kita belajar dari kitab ${book.name}. Mari kita temukan keajaiban Firman Tuhan bersama-sama!`,
    message: MESSAGES[day % MESSAGES.length],
    action: ACTIONS[day % ACTIONS.length],
    imageSeed: SEEDS[day % SEEDS.length]
  };
};
