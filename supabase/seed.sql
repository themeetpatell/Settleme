-- SettleMe — founding seed (Indians in Dubai corridor).

insert into public.communities (slug, name, kind, city, diaspora, description, member_count) values
  ('dubai-indian',           'Indians in Dubai',          'diaspora',     'Dubai', 'Indian', 'The main hub. New arrivals, settled NRIs, families, founders — all in one room.', 0),
  ('dubai-nri-moms',         'NRI Moms — Dubai',          'family',       'Dubai', 'Indian', 'Schools, pediatricians, weekend plans, language classes for the kids.', 0),
  ('dubai-indian-founders',  'Indian Founders — Dubai',   'professional', 'Dubai', 'Indian', 'Founders, operators, fundraisers in the UAE. Build, hire, sell.', 0),
  ('dubai-tamil',            'Tamil Dubai',               'diaspora',     'Dubai', 'Indian', 'Tamil-speaking community. Events, food, language schools.', 0),
  ('dubai-gujarati',         'Gujarati Dubai',            'diaspora',     'Dubai', 'Indian', 'Gujarati community in Dubai. Garba, Diwali, business circles.', 0),
  ('dubai-malayali',         'Malayali Dubai',            'diaspora',     'Dubai', 'Indian', 'Malayalee community. Onam, Vishu, kids cultural school.', 0),
  ('dubai-indian-tech',      'Indian Tech — Dubai',       'professional', 'Dubai', 'Indian', 'Tech, AI, fintech operators. Hire and get hired.', 0),
  ('dubai-indian-finance',   'Indian Finance — Dubai',    'professional', 'Dubai', 'Indian', 'Finance, banking, audit, advisory.', 0),
  ('dubai-indian-healthcare','Indian Healthcare — Dubai', 'professional', 'Dubai', 'Indian', 'Doctors, nurses, hospital ops, healthcare entrepreneurs.', 0),
  ('dubai-new-arrivals',     'Just Landed — Dubai',       'interest',     'Dubai', 'Indian', 'First 90 days. Visa, banking, housing, Emirates ID. We have answers.', 0);

insert into public.events (title, host_name, city, diaspora, kind, starts_at, location, description, capacity) values
  ('SettleMe Launch Dinner — Dubai',          'Meet Patel',        'Dubai', 'Indian', 'social',       now() + interval '4 days',  'Trove, DIFC',                    'First 1000 Indians on SettleMe. Vouched entry only.', 60),
  ('Indian Founders Coffee — JLT',            'Indian Founders',   'Dubai', 'Indian', 'professional', now() + interval '6 days',  '%Arabica, JLT',                  'Open coffee + intros. Bring one founder you wish more people knew.', 30),
  ('NRI Moms — Diwali Craft for Kids',        'NRI Moms Dubai',    'Dubai', 'Indian', 'family',       now() + interval '10 days', 'Mira Community, Reem',           'Diya painting + rangoli + samosas. Kids 4–10.', 40),
  ('First 90 Days in UAE — Live Q&A',         'SettleMe',          'Dubai', 'Indian', 'professional', now() + interval '7 days',  'Online (Zoom + WhatsApp)',       'Visa, EID, banking, housing. Bring your questions.', 200),
  ('Tamil Sangam Cultural Night',             'Tamil Dubai',       'Dubai', 'Indian', 'cultural',     now() + interval '14 days', 'India Club, Oud Metha',          'Classical music + speeches + dinner. Family event.', 250),
  ('Indian Tech Founders Hot Seat',           'Indian Tech Dubai', 'Dubai', 'Indian', 'professional', now() + interval '18 days', 'Astrolabs, JLT',                 'Three founders. Five minutes each. Live feedback from the room.', 80),
  ('Indian Healthcare — Career Roundtable',   'Indian Healthcare', 'Dubai', 'Indian', 'professional', now() + interval '21 days', 'NMC Royal Hospital, DIP',        'Licensing, jobs, fellowships, India-UAE healthcare bridge.', 50);

insert into public.vendors (name, category, city, diaspora, description, contact_phone, whatsapp, rating, review_count, verified_at) values
  ('Hansraj PRO Services',          'pro',        'Dubai', 'Indian', 'Visa stamping, EID, Mohre, business setup. 20 years in DMCC.',                  '+971501112233', '+971501112233', 4.7, 84, now()),
  ('Sara Khan & Associates',        'lawyer',     'Dubai', 'Indian', 'Immigration + family law. NRIs, dependents, divorce, inheritance.',              '+971501112244', '+971501112244', 4.8, 51, now()),
  ('Finanshels',                    'accountant', 'Dubai', 'Indian', 'UAE corporate tax + VAT + accounting for SMEs.',                                  '+97142233445',  '+971501112255', 4.9, 132, now()),
  ('JVC Homes — Property',          'property',   'Dubai', 'Indian', 'JVC, JLT, Damac Hills rentals. Specialise in Indian families.',                  '+971501112266', '+971501112266', 4.5, 47, now()),
  ('Indian International School',   'school',     'Dubai', 'Indian', 'CBSE + ICSE streams. KG–12. Outstanding KHDA rating.',                            '+97143377001',  null,            4.6, 219, now()),
  ('Dr. Anjali Bansal — Pediatrics','dentist',    'Dubai', 'Indian', 'Pediatric dentistry. Mediclinic Parkview. Hindi + English + Tamil.',              '+971501112277', '+971501112277', 4.9, 38, now()),
  ('Quick Move UAE',                'movers',     'Dubai', 'Indian', 'Door-to-door from India + intra-UAE moves. WhatsApp quote in 2 hours.',           '+971501112288', '+971501112288', 4.4, 29, now());

insert into public.qa_questions (question, answer_md, corridor, category, keywords) values
  ('How do I open a bank account in Dubai as a new arrival?',
   $$## Quick answer

You can open a salary or savings account once you have your **Emirates ID (EID)** or at minimum your **visa stamping page** in your passport.

## Banks most Indians in Dubai use

- **Emirates NBD** — largest, easiest WhatsApp banking.
- **Mashreq Neo** — fully digital, fastest onboarding.
- **HDFC Bank UAE** — best if you want India linkage (NRE / NRO).
- **ADCB** — solid for salary accounts.

## What you'll need

- Passport with visa stamping page
- Emirates ID (or EID application receipt)
- Salary certificate (for employment visa)
- Tenancy contract or hotel booking (proof of address)

## Pro tips

- Mashreq Neo takes about 48 hours from app submission to account number.
- Open both an AED salary account and an NRE account with HDFC if you plan to remit home.
- Don't pay any agent for "fast tracking" — banks don't use third-party agents.$$,
   'in_ae', 'banking',
   array['bank','account','emirates nbd','mashreq','adcb','hdfc','salary account','nre','nro']),
  ('What is the cheapest way to send money from UAE to India?',
   $$## Best options today (mid-2026)

| Method               | Fee + spread vs spot | Speed       |
|----------------------|----------------------|-------------|
| Wise                 | ~0.4–0.7%            | minutes     |
| LuLu Money           | ~0.3–0.8%            | minutes     |
| Al Ansari (online)   | ~0.5–1.0%            | minutes     |
| HDFC UAE → HDFC IN   | ~0.2%                | 1 day       |
| Branch exchange      | 2–4% (avoid)         | hours       |

## Playbook

- Wise for one-off transfers above AED 5,000.
- LuLu Money for monthly small transfers — UAE-licensed, fast.
- For salary remittance, route through your NRE account via your UAE bank.
- Avoid sending USD; always send AED → INR.$$,
   'in_ae', 'banking',
   array['remittance','send money','wise','lulu money','al ansari','exchange','transfer']),
  ('How do I get my Emirates ID after landing?',
   $$## Timeline

Landing → EID in hand = **10–21 days**.

1. **Day 1–3:** Employer or PRO submits visa stamping in passport.
2. **Day 4–7:** Medical fitness test at DHA Smart Salem or Premier Medical Centre.
3. **Day 5–10:** Biometrics + EID application at ICP / Amer / Tasheel.
4. **Day 10–21:** Physical EID delivered to your home.

## What to bring

- Passport with visa entry stamp
- Offer / labour contract
- 4 passport-size photos (white background)
- Tenancy contract or hotel address

## Pro tips

- DHA Smart Salem is the fastest medical centre. Book online.
- ICP Smart Services app lets you track EID status without calling anyone.
- Don't pay AED 500+ to agents for EID — your employer's PRO does this for free.$$,
   'in_ae', 'visa',
   array['emirates id','eid','medical test','dha','smart salem','icp','tasheel','amer']),
  ('Best areas in Dubai to live as a new Indian family?',
   $$## Top neighborhoods

| Area                | Vibe                  | 2BR rent (AED/year) | Schools |
|---------------------|-----------------------|---------------------|---------|
| JVC                 | Family, residential   | 95–130k             | GEMS Wellington, JSS |
| Greens / Views      | Mid-rise, walkable    | 115–150k            | EI School, GEMS World |
| Mirdif              | Quiet villas          | 90–140k             | Star International |
| Damac Hills 2       | Affordable, growing   | 75–110k             | Jebel Ali (bus) |
| Discovery Gardens   | Indian-heavy, value   | 70–95k              | DPS / Delhi Private (bus) |

## Pro tips

- JVC has the highest density of Indian families.
- Mirdif if you want villas, parks, no traffic.
- Use Airbnb / Silkhaus for 60 days, then commit.
- Always pay rent in 4 cheques. Standard in Dubai.$$,
   'in_ae', 'housing',
   array['housing','rent','neighbourhood','jvc','mirdif','damac','greens','discovery gardens','area','school']);
