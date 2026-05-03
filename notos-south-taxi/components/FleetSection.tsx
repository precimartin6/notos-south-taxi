import type { Locale } from '@/i18n';

interface Vehicle {
  key: 'taxi' | 'wagon' | 'coach' | 'vip';
  name: { en: string; el: string };
  capacity: { en: string; el: string };
  blurb: { en: string; el: string };
  images: string[];
}

const FLEET: Vehicle[] = [
  {
    key: 'taxi',
    name: { en: 'Standard taxi', el: 'Κανονικό ταξί' },
    capacity: { en: 'Up to 4 passengers', el: 'Έως 4 επιβάτες' },
    blurb: {
      en: 'A licensed Athens yellow taxi — the everyday ride for couples, small families, and airport runs.',
      el: 'Αδειοδοτημένο κίτρινο ταξί Αθηνών — το καθημερινό όχημα για ζευγάρια, μικρές οικογένειες και μεταφορές αεροδρομίου.'
    },
    images: ['/photos/fleet/taxi-1.jpg', '/photos/fleet/taxi-2.jpg']
  },
  {
    key: 'wagon',
    name: { en: 'Station wagon', el: 'Station wagon' },
    capacity: { en: 'Up to 4 + extra luggage', el: 'Έως 4 άτομα + παραπάνω αποσκευές' },
    blurb: {
      en: 'Mercedes E-Class estate. Same passenger space, but room for the suitcases and the surf bag too.',
      el: 'Mercedes E-Class. Ο ίδιος χώρος για επιβάτες, με μεγαλύτερο πορτ-μπαγκάζ για βαλίτσες και εξοπλισμό.'
    },
    images: ['/photos/fleet/wagon-2.jpg', '/photos/fleet/wagon-1.jpg']
  },
  {
    key: 'coach',
    name: { en: 'Group coach', el: 'Λεωφορείο' },
    capacity: { en: 'Up to 24 passengers', el: 'Έως 24 επιβάτες' },
    blurb: {
      en: 'Mercedes Sprinter for tour groups, weddings, conferences, and large families. Reclining seats, A/C, USB charging.',
      el: 'Mercedes Sprinter για γκρουπ, γάμους, συνέδρια και μεγάλες οικογένειες. Καθίσματα ανακλινόμενα, A/C, USB.'
    },
    images: ['/photos/fleet/coach-exterior.jpg', '/photos/fleet/coach-interior.jpg']
  },
  {
    key: 'vip',
    name: { en: 'VIP & business', el: 'VIP & επιχειρήσεις' },
    capacity: { en: 'On request', el: 'Κατόπιν αιτήματος' },
    blurb: {
      en: 'Discreet executive and luxury transfers, multi-stop schedules, and private hire — by appointment.',
      el: 'Διακριτικές πολυτελείς μεταφορές, διαδρομές με πολλές στάσεις, ιδιωτικές μισθώσεις — κατόπιν συνεννόησης.'
    },
    images: ['/photos/fleet/vip.jpg']
  }
];

export default function FleetSection({ locale }: { locale: Locale }) {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-notos-blue-deep md:text-4xl">
            {locale === 'el' ? 'Ο στόλος μας' : 'Our fleet'}
          </h2>
          <p className="mt-2 text-notos-blue-deep/70">
            {locale === 'el'
              ? 'Ένας οδηγός, αρκετά οχήματα — ανάλογα με την ομάδα σας.'
              : 'One driver, several vehicles — picked to fit your party.'}
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FLEET.map((v) => (
            <article
              key={v.key}
              className="group overflow-hidden rounded-2xl border border-notos-blue/10 bg-notos-paper shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative h-48 overflow-hidden bg-notos-blue-deep/5">
                <img
                  src={v.images[0]}
                  alt={v.name[locale]}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-notos-blue/70">
                  {v.capacity[locale]}
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-notos-blue-deep">
                  {v.name[locale]}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-notos-blue-deep/70">
                  {v.blurb[locale]}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
