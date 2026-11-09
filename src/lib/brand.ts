// Business details used across the site, emails, receipts and the footer.
// Update here and every page picks it up.
export const BRAND = {
  name: "Khan House",
  tagline: "Hibachi · Mediterranean · Fusion",
  slogan: "Elevated grilling. Unforgettable taste.",
  city: "Apex",
  region: "North Carolina",
  area: "Apex, NC",
  phone: "(919) 307-9893",
  phoneHref: "tel:+19193079893",
  email: "hello@khanhouse.co",
  instagramHandle: "KhanHouseCo",
  doordash: "https://www.doordash.com/store/khan-house-apex-52774027/",
  halal: true,
  founded: 2024,
} as const;

export const SOCIAL = {
  instagram: `https://www.instagram.com/${BRAND.instagramHandle}`,
  facebook: `https://www.facebook.com/${BRAND.instagramHandle}`,
  tiktok: `https://www.tiktok.com/@${BRAND.instagramHandle}`,
  doordash: BRAND.doordash,
};
