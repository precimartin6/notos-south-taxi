/**
 * Single source of truth for client info, social links, and destinations.
 * Edit this file when the client provides final details.
 */

export const SITE = {
  name: 'Notos South Taxi',
  tagline: {
    en: 'The Athenian Riviera and beyond',
    el: 'Από την Αθηναϊκή Ριβιέρα σε όλη την Ελλάδα'
  },
  driverName: { en: 'Martin Preci', el: 'Μάρτιν Πρέτσι' }, // Data Controller
  // Both numbers below answer WhatsApp as well as voice calls
  phone: '+30 694 656 4581',
  phoneAlt: '+30 698 451 1006',
  whatsapp: '+306946564581', // primary WABA number for SendZen
  whatsappAlt: '+306984511006',
  email: 'precimartin4@gmail.com',
  locations: [
    {
      label: { en: 'Vouliagmeni base', el: 'Έδρα Βουλιαγμένης' },
      address: 'Apollonos 10, Vouliagmeni 166 71',
      addressEl: 'Απόλλωνος 10, Βουλιαγμένη 166 71',
      googleMapsUrl: 'https://share.google/Km4fcgcYlxyPJgPF3'
    },
    {
      label: { en: 'Alimos Marina', el: 'Μαρίνα Αλίμου' },
      address: 'Marina Alimou, Alimos 174 55',
      addressEl: 'Μαρίνα Αλίμου, Άλιμος 174 55',
      googleMapsUrl: 'https://share.google/XO897sw3sP83rENI4'
    }
  ],
  vatId: 'EL104842406',
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61556370542297',
    instagram: 'https://www.instagram.com/notos_taxi_services/',
    googleMaps1: 'https://share.google/Km4fcgcYlxyPJgPF3',
    googleMaps2: 'https://share.google/XO897sw3sP83rENI4',
    reviews: 'https://share.google/Km4fcgcYlxyPJgPF3'
  }
};

export type DestinationSlug =
  | 'patra'
  | 'sounio'
  | 'chalkida'
  | 'meteora'
  | 'kalamata'
  | 'korinthos'
  | 'ancient-corinth'
  | 'athens-centre'
  | 'piraeus-port'
  | 'rafina-port'
  | 'delphi'
  | 'nafplio'
  | 'mycenae'
  | 'thessaloniki'
  | 'ioannina'
  | 'porto-heli';

export interface Destination {
  slug: DestinationSlug;
  name: { en: string; el: string };
  blurb: { en: string; el: string };
  body: { en: string; el: string };
  /** 3 photos that rotate on hover/animation. First is the cover. */
  images: [string, string, string];
  featured: boolean;
  coords: { lat: number; lng: number };
}

/** Backwards-compat helper for existing detail page code. */
export function destImage(d: Destination): string {
  return d.images[0];
}

const ATH_AIRPORT = { lat: 37.9356, lng: 23.9484 };

// Helper to build 3 Unsplash variants per destination using different keywords
const u = (q: string, suffix = '') =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=1400&q=80${suffix}`;

export const DESTINATIONS: Destination[] = [
  {
    slug: 'patra',
    name: { en: 'Athens Airport — Patras', el: 'Αεροδρόμιο Αθηνών — Πάτρα' },
    blurb: { en: 'Gateway to the Ionian. ~210 km, ~2h 30m drive.', el: 'Πύλη προς το Ιόνιο. ~210 χλμ, ~2ώ 30λ.' },
    body: {
      en: "Patras is Greece's third-largest city and the main port to Italy and the Ionian islands. Our airport-to-Patras transfer is door-to-door, with a pre-agreed flat fare, child seats on request, and luggage assistance. Tell us your ferry time and we plan around it.",
      el: 'Η Πάτρα είναι η τρίτη μεγαλύτερη πόλη της Ελλάδας και το κύριο λιμάνι προς Ιταλία και Ιόνιο. Η μεταφορά μας από το αεροδρόμιο είναι πόρτα-πόρτα, με προσυμφωνημένο τίμημα, παιδικά καθίσματα κατ’ επιλογή και βοήθεια αποσκευών. Πείτε μας την ώρα του πλοίου σας και προγραμματίζουμε τη διαδρομή.'
    },
    images: [
      '/photos/destinations/patra-1.jpg',
      '/photos/destinations/patra-2.jpg',
      '/photos/destinations/patra-1.jpg'
    ],
    featured: true,
    coords: { lat: 38.2466, lng: 21.7346 }
  },
  {
    slug: 'sounio',
    name: { en: 'Athens Airport — Cape Sounion', el: 'Αεροδρόμιο Αθηνών — Σούνιο' },
    blurb: { en: 'Temple of Poseidon at the edge of Attica. ~70 km.', el: 'Ναός Ποσειδώνα στην άκρη της Αττικής. ~70 χλμ.' },
    body: {
      en: 'A short, scenic drive along the Athenian Riviera ends at the marble columns of the Temple of Poseidon. Excellent at sunset. We can wait while you visit and continue to Athens or your hotel.',
      el: 'Σύντομη γραφική διαδρομή μέσα από την Αθηναϊκή Ριβιέρα καταλήγει στις μαρμάρινες κολώνες του Ναού του Ποσειδώνα. Ιδανικό για το ηλιοβασίλεμα. Περιμένουμε όσο επισκέπτεστε και συνεχίζουμε προς Αθήνα ή το ξενοδοχείο σας.'
    },
    images: [
      '/photos/destinations/sounio-1.jpg',
      '/photos/destinations/sounio-2.jpg',
      '/photos/destinations/sounio-3.jpg'
    ],
    featured: true,
    coords: { lat: 37.6498, lng: 24.0245 }
  },
  {
    slug: 'meteora',
    name: { en: 'Athens Airport — Kalambaka / Meteora', el: 'Αεροδρόμιο Αθηνών — Καλαμπάκα / Μετέωρα' },
    blurb: { en: 'Monasteries on towering rock pillars. ~360 km.', el: 'Μοναστήρια πάνω σε επιβλητικούς βράχους. ~360 χλμ.' },
    body: {
      en: 'A long, beautiful drive through central Greece to one of the country’s most iconic UNESCO sites. We can tailor a 1-day, 2-day, or full sightseeing package.',
      el: 'Μακριά, πανέμορφη διαδρομή μέσα από την κεντρική Ελλάδα προς ένα από τα πιο εμβληματικά μνημεία UNESCO της χώρας. Διαμορφώνουμε πακέτα 1 ή 2 ημερών.'
    },
    images: [
      '/photos/destinations/meteora-1.jpg',
      '/photos/destinations/meteora-2.jpg',
      '/photos/destinations/meteora-1.jpg'
    ],
    featured: true,
    coords: { lat: 39.7058, lng: 21.6307 }
  },
  {
    slug: 'kalamata',
    name: { en: 'Athens Airport — Kalamata', el: 'Αεροδρόμιο Αθηνών — Καλαμάτα' },
    blurb: { en: 'Heart of the Messinian Mani. ~290 km.', el: 'Καρδιά της Μεσσηνιακής Μάνης. ~290 χλμ.' },
    body: {
      en: 'Kalamata, gateway to the Mani peninsula and Costa Navarino. Long, comfortable run with rest stops along the way.',
      el: 'Η Καλαμάτα, πύλη προς τη Μάνη και το Costa Navarino. Άνετη μακρά διαδρομή με στάσεις ξεκούρασης.'
    },
    images: [
      '/photos/destinations/kalamata-1.jpg',
      '/photos/destinations/kalamata-2.jpg',
      '/photos/destinations/kalamata-3.jpg'
    ],
    featured: true,
    coords: { lat: 37.0389, lng: 22.1142 }
  },
  {
    slug: 'korinthos',
    name: { en: 'Athens Airport — Corinth', el: 'Αεροδρόμιο Αθηνών — Κόρινθος' },
    blurb: { en: 'Canal & gateway to the Peloponnese. ~110 km.', el: 'Διώρυγα & πύλη της Πελοποννήσου. ~110 χλμ.' },
    body: {
      en: 'Stop at the Corinth Canal for the iconic photo, then continue to Ancient Corinth or deeper into the Peloponnese.',
      el: 'Στάση στη Διώρυγα της Κορίνθου για την εμβληματική φωτογραφία, και συνέχεια στην Αρχαία Κόρινθο ή βαθύτερα στην Πελοπόννησο.'
    },
    images: [
      '/photos/destinations/corinth-1.jpg',
      '/photos/destinations/corinth-2.jpg',
      '/photos/destinations/corinth-3.jpg'
    ],
    featured: true,
    coords: { lat: 37.9404, lng: 22.9444 }
  },
  {
    slug: 'ancient-corinth',
    name: { en: 'Athens Airport — Ancient Corinth', el: 'Αεροδρόμιο Αθηνών — Αρχαία Κόρινθος' },
    blurb: { en: 'Apollo’s temple & St. Paul’s pulpit. ~90 km.', el: 'Ναός Απόλλωνα & βήμα του Αποστόλου Παύλου. ~90 χλμ.' },
    body: {
      en: 'Walk among the columns of the Temple of Apollo and the bema where St. Paul preached. We can combine with the canal and Mycenae for a full day.',
      el: 'Περπατήστε ανάμεσα στις κολώνες του Ναού του Απόλλωνα και στο βήμα του Αποστόλου Παύλου. Συνδυάζεται με τη Διώρυγα και τις Μυκήνες για ολοήμερη εκδρομή.'
    },
    images: [
      '/photos/destinations/corinth-3.jpg',
      '/photos/destinations/corinth-1.jpg',
      '/photos/destinations/corinth-2.jpg'
    ],
    featured: true,
    coords: { lat: 37.9061, lng: 22.8794 }
  },
  {
    slug: 'athens-centre',
    name: { en: 'Athens Airport — City Centre', el: 'Αεροδρόμιο Αθηνών — Κέντρο' },
    blurb: { en: 'Direct, fixed-fare ride to your hotel. ~35 km.', el: 'Απευθείας μεταφορά με σταθερή χρέωση. ~35 χλμ.' },
    body: {
      en: 'The classic transfer. We meet you in arrivals with your name on a sign, help with luggage, and drive you to your hotel or apartment.',
      el: 'Η κλασική μεταφορά. Σας περιμένουμε στις αφίξεις με την ταμπέλα σας, βοηθάμε με τις αποσκευές και σας πηγαίνουμε στο ξενοδοχείο ή το διαμέρισμά σας.'
    },
    images: [
      '/photos/destinations/athens-centre-1.jpg',
      '/photos/destinations/athens-centre-2.jpg',
      '/photos/destinations/athens-centre-3.jpg'
    ],
    featured: true,
    coords: { lat: 37.9755, lng: 23.7348 }
  },
  {
    slug: 'thessaloniki',
    name: { en: 'Athens Airport — Thessaloniki', el: 'Αεροδρόμιο Αθηνών — Θεσσαλονίκη' },
    blurb: { en: 'Greece’s second city. ~510 km, ~5h drive.', el: 'Η δεύτερη μεγαλύτερη πόλη. ~510 χλμ, ~5ώ διαδρομή.' },
    body: {
      en: 'A long, comfortable run through Thessaly to the Macedonian capital. Two driver-rest stops included; we plan refreshment breaks around your schedule.',
      el: 'Μακριά, άνετη διαδρομή μέσα από τη Θεσσαλία προς τη συμπρωτεύουσα. Περιλαμβάνονται δύο στάσεις ξεκούρασης· οργανώνουμε τα διαλείμματα σύμφωνα με το πρόγραμμά σας.'
    },
    images: [
      u('photo-1601972602288-3be527b4f18d'),
      u('photo-1583309217394-d3b3a8a3b87b'),
      u('photo-1611605698335-8b1569810432')
    ],
    featured: true,
    coords: { lat: 40.6401, lng: 22.9444 }
  },
  {
    slug: 'ioannina',
    name: { en: 'Athens Airport — Ioannina', el: 'Αεροδρόμιο Αθηνών — Ιωάννινα' },
    blurb: { en: 'Capital of Epirus, lakeside city. ~450 km.', el: 'Πρωτεύουσα Ηπείρου, λίμνη Παμβώτιδα. ~450 χλμ.' },
    body: {
      en: 'A scenic crossing of central Greece via the Egnatia motorway, ending at the lakeside fortress city of Ioannina. Ideal stop on the way to Zagori or the Albanian border.',
      el: 'Γραφική διέλευση της κεντρικής Ελλάδας μέσω της Εγνατίας Οδού, με προορισμό την παραλίμνια πόλη των Ιωαννίνων. Ιδανική στάση πορεία για Ζαγόρι ή σύνορα.'
    },
    images: [
      u('photo-1545569310-d7058a2e57d6'),
      u('photo-1564598519268-3e4ee5af322a'),
      u('photo-1602176005760-3eaaff67dc91')
    ],
    featured: false,
    coords: { lat: 39.6650, lng: 20.8537 }
  },
  {
    slug: 'porto-heli',
    name: { en: 'Athens Airport — Porto Heli', el: 'Αεροδρόμιο Αθηνών — Πόρτο Χέλι' },
    blurb: { en: 'Argolic Riviera. ~200 km, gateway to Spetses.', el: 'Αργολική Ριβιέρα. ~200 χλμ, πύλη προς Σπέτσες.' },
    body: {
      en: 'Discreet, well-heeled fishing village on the Argolic Gulf — the closest mainland point to Spetses. We can connect with the water taxi at the marina.',
      el: 'Διακριτικό, εκλεπτυσμένο ψαροχώρι στον Αργολικό — το κοντινότερο σημείο της ηπειρωτικής ακτής στις Σπέτσες. Συνδυάζεται με water taxi στη μαρίνα.'
    },
    images: [
      u('photo-1555993539-1732b0258235'),
      u('photo-1602176005760-3eaaff67dc91'),
      u('photo-1583309217394-d3b3a8a3b87b')
    ],
    featured: false,
    coords: { lat: 37.3220, lng: 23.1490 }
  },
  {
    slug: 'piraeus-port',
    name: { en: 'Athens Airport — Piraeus Port', el: 'Αεροδρόμιο Αθηνών — Λιμάνι Πειραιά' },
    blurb: { en: 'Ferries to the Aegean. ~50 km.', el: 'Πλοία για το Αιγαίο. ~50 χλμ.' },
    body: {
      en: 'Direct to your ferry gate, with flight tracking included so we wait if you’re late.',
      el: 'Απευθείας στην πύλη του πλοίου σας, με παρακολούθηση πτήσης ώστε να περιμένουμε σε καθυστερήσεις.'
    },
    images: [
      u('photo-1602176005760-3eaaff67dc91'),
      u('photo-1605713288610-a9f0c70a8fd4'),
      u('photo-1601972602288-3be527b4f18d')
    ],
    featured: false,
    coords: { lat: 37.9479, lng: 23.6361 }
  },
  {
    slug: 'rafina-port',
    name: { en: 'Athens Airport — Rafina Port', el: 'Αεροδρόμιο Αθηνών — Λιμάνι Ραφήνας' },
    blurb: { en: 'Closest port for Mykonos and Tinos. ~25 km.', el: 'Πλησιέστερο λιμάνι για Μύκονο/Τήνο. ~25 χλμ.' },
    body: {
      en: 'A quick 25-minute hop from the airport to the Rafina ferry terminal. Ideal if you’re heading straight to the Cyclades.',
      el: 'Σύντομη διαδρομή 25 λεπτών από το αεροδρόμιο στο λιμάνι Ραφήνας. Ιδανικό αν πηγαίνετε στις Κυκλάδες.'
    },
    images: [
      u('photo-1605713288610-a9f0c70a8fd4'),
      u('photo-1602176005760-3eaaff67dc91'),
      u('photo-1555993539-1732b0258235')
    ],
    featured: false,
    coords: { lat: 38.0228, lng: 24.0086 }
  },
  {
    slug: 'delphi',
    name: { en: 'Athens — Delphi', el: 'Αθήνα — Δελφοί' },
    blurb: { en: 'Oracle and museum on Mt. Parnassos. ~190 km.', el: 'Μαντείο και μουσείο στον Παρνασσό. ~190 χλμ.' },
    body: {
      en: 'A full-day round trip with stops at Arachova for lunch. We can wait at the archaeological site while you tour.',
      el: 'Ολοήμερη διαδρομή με στάση για φαγητό στην Αράχωβα. Περιμένουμε στον αρχαιολογικό χώρο.'
    },
    images: [
      u('photo-1564598519268-3e4ee5af322a'),
      u('photo-1545569310-d7058a2e57d6'),
      u('photo-1591801093068-f7e5cdc4d9f6')
    ],
    featured: false,
    coords: { lat: 38.4824, lng: 22.5009 }
  },
  {
    slug: 'nafplio',
    name: { en: 'Athens — Nafplio', el: 'Αθήνα — Ναύπλιο' },
    blurb: { en: 'First capital of modern Greece. ~140 km.', el: 'Πρώτη πρωτεύουσα του νεότερου ελληνικού κράτους. ~140 χλμ.' },
    body: {
      en: 'Elegant Venetian streets, three fortresses, and the gateway to Mycenae and Epidaurus.',
      el: 'Κομψά βενετσιάνικα δρομάκια, τρία κάστρα, πύλη προς Μυκήνες και Επίδαυρο.'
    },
    images: [
      u('photo-1601972602288-3be527b4f18d'),
      u('photo-1591801093068-f7e5cdc4d9f6'),
      u('photo-1611605698335-8b1569810432')
    ],
    featured: false,
    coords: { lat: 37.5675, lng: 22.8056 }
  },
  {
    slug: 'mycenae',
    name: { en: 'Athens — Mycenae', el: 'Αθήνα — Μυκήνες' },
    blurb: { en: 'Bronze Age citadel, UNESCO. ~120 km.', el: 'Ακρόπολη Εποχής Χαλκού, UNESCO. ~120 χλμ.' },
    body: {
      en: 'Walk the Lion Gate and the tomb of Agamemnon. Pairs perfectly with Nafplio for a full day.',
      el: 'Περπατήστε στην Πύλη των Λεόντων και τον τάφο του Αγαμέμνονα. Συνδυάζεται ιδανικά με το Ναύπλιο για ολοήμερη εκδρομή.'
    },
    images: [
      u('photo-1591801093068-f7e5cdc4d9f6'),
      u('photo-1564598519268-3e4ee5af322a'),
      u('photo-1611605698335-8b1569810432')
    ],
    featured: false,
    coords: { lat: 37.7307, lng: 22.7561 }
  },
  {
    slug: 'chalkida',
    name: { en: 'Athens Airport — Chalkida', el: 'Αεροδρόμιο Αθηνών — Χαλκίδα' },
    blurb: { en: 'Capital of Evia, famous tidal current. ~80 km.', el: 'Πρωτεύουσα Εύβοιας, μυστήρια ρέματα. ~80 χλμ.' },
    body: {
      en: 'Direct route to Chalkida and the Evripos strait, where the current reverses several times a day.',
      el: 'Απευθείας διαδρομή προς Χαλκίδα και τον πορθμό του Ευρίπου, όπου το ρεύμα αλλάζει κατεύθυνση πολλές φορές την ημέρα.'
    },
    images: [
      u('photo-1583309217394-d3b3a8a3b87b'),
      u('photo-1602176005760-3eaaff67dc91'),
      u('photo-1601972602288-3be527b4f18d')
    ],
    featured: false,
    coords: { lat: 38.4625, lng: 23.5944 }
  }
];

export const AIRPORT_COORDS = ATH_AIRPORT;
export function getDestination(slug: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.slug === slug);
}
