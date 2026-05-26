// SettleMe — AI image URL builder (Pollinations.ai, Flux model).
//
// Pollinations.ai is a free, no-auth, URL-based AI image API.
// Deterministic by seed → expo-image caches and CDN reuses the result.

const STYLE =
  'editorial photograph, warm sand and ink color palette, soft golden hour, ' +
  'cinematic lighting, no people, premium magazine quality, shallow depth of field';

const VENDOR_PROMPTS: Record<string, string> = {
  pro: 'flat lay of a passport, immigration stamps and a fountain pen on a warm marigold linen desk',
  lawyer: 'minimal stack of leather law books with reading glasses by a window at afternoon light',
  accountant: 'wooden desk with a calculator, ledger and small succulent in golden hour light',
  property: 'modern Dubai apartment terrace at golden hour with palm tree silhouette',
  school: 'bright classroom corner with stacked books, a small globe and a single hanging plant',
  dentist: 'calm minimal clinic shelf with ceramic vase and white orchid, soft greens and creams',
  movers: 'kraft paper moving boxes stacked neatly with a single houseplant on top, warm interior',
};

const EVENT_PROMPTS: Record<string, string> = {
  cultural: 'vibrant cultural festival lanterns floating in warm bokeh evening',
  professional: 'modern co-working space with warm lighting and an empty long table',
  family: 'cozy living room with cushions and a low table set with chai',
  social: 'warm cafe corner with a single window and steam rising from a mug',
  religious: 'serene temple courtyard at golden hour with marigold petals',
};

const COMMUNITY_PROMPTS: Record<string, string> = {
  city: 'aerial Dubai skyline at golden hour, warm pastel sky',
  diaspora: 'mosaic of warm textile patterns folded together, indigo and marigold',
  interest: 'hand-bound notebook with brass pen and dried flower, warm desk',
  professional: 'open laptop on a marble cafe table with a single espresso cup',
  family: 'children watercolour painting set on a wooden floor with afternoon sun',
};

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 100_000_000;
}

function build(prompt: string, seedKey: string, width: number, height: number): string {
  const encoded = encodeURIComponent(`${prompt}. ${STYLE}`);
  const seed = hashSeed(seedKey);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true`;
}

export function vendorImage(vendorId: string, category: string): string {
  const prompt = VENDOR_PROMPTS[category] ?? VENDOR_PROMPTS.pro ?? '';
  return build(prompt, `vendor:${vendorId}:${category}`, 800, 360);
}

export function eventImage(eventId: string, kind: string): string {
  const prompt = EVENT_PROMPTS[kind] ?? EVENT_PROMPTS.social ?? '';
  return build(prompt, `event:${eventId}:${kind}`, 800, 360);
}

export function communityImage(communityId: string, kind: string): string {
  const prompt = COMMUNITY_PROMPTS[kind] ?? COMMUNITY_PROMPTS.interest ?? '';
  return build(prompt, `community:${communityId}:${kind}`, 600, 360);
}

export function profileHeroImage(profileId: string): string {
  return build(
    'abstract organic shapes in warm marigold and emerald, soft layered paper aesthetic',
    `profile:${profileId}`,
    1200,
    480,
  );
}
