import { defineQuery } from "next-sanity";

// ─── Homepage ─────────────────────────────────────────────────────────────────
// Revalidation tag: "homepage"

export const homepageQuery = defineQuery(`*[_type == "homepage" && _id == "homepage"][0]{
  heroHeadline,
  heroSubtitle,
  heroBadges[]{
    _key,
    emoji,
    text
  },
  heroDoctorImage,
  heroCards[]{
    _key,
    title,
    subtitle,
    icon
  },
  servicesHeadline,
  servicesSubtitle,
  labTestsHeadline,
  labTestsSubtitle,
  testimonialsHeadline,
  testimonialsCtaText,
  testimonialsCtaUrl,
  testimonials[]->{
    _id,
    patientName,
    photo,
    text,
    condition,
    order
  },
  blogHeadline,
  ctaHeadline,
  ctaDescription,
  metaDescription,
  ogImage
}`);

// ─── Site Settings ────────────────────────────────────────────────────────────
// Revalidation tag: "siteSettings"

export const siteSettingsQuery =
  defineQuery(`*[_type == "siteSettings" && _id == "siteSettings"][0]{
  logo,
  clinicName,
  phone,
  email,
  address,
  navigationLinks[]{
    _key,
    label,
    href
  },
  socialLinks[]{
    _key,
    platform,
    url
  },
  footerColumns[]{
    _key,
    heading,
    links[]{
      _key,
      label,
      href
    }
  },
  privacyPolicyUrl,
  metaDescription,
  siteName,
  defaultOgImage
}`);

// ─── Services ─────────────────────────────────────────────────────────────────
// Revalidation tag: "service"

export const allServicesQuery = defineQuery(`*[_type == "service"] | order(order asc){
  _id,
  name,
  description,
  price,
  icon,
  category->{_id, name, emoji},
  order
}`);

// ─── Service Categories ───────────────────────────────────────────────────────
// Revalidation tag: "serviceCategory"

export const allServiceCategoriesQuery =
  defineQuery(`*[_type == "serviceCategory"] | order(order asc){
  _id,
  name,
  emoji,
  order
}`);

// ─── Lab Tests ────────────────────────────────────────────────────────────────
// Revalidation tag: "labTest"

export const allLabTestsQuery = defineQuery(`*[_type == "labTest"] | order(order asc){
  _id,
  name,
  slug,
  description,
  price,
  originalPrice,
  discount,
  illustration,
  order
}`);

// ─── Lab Test (single by slug) ───────────────────────────────────────────────
// Revalidation tag: "labTest"

export const labTestBySlugQuery = defineQuery(`*[_type == "labTest" && slug.current == $slug][0]{
  _id,
  name,
  slug,
  description,
  price,
  originalPrice,
  discount,
  illustration,
  body,
  order
}`);

// ─── Testimonials ─────────────────────────────────────────────────────────────
// Revalidation tag: "testimonial"

export const allTestimonialsQuery = defineQuery(`*[_type == "testimonial"] | order(order asc){
  _id,
  patientName,
  photo,
  text,
  condition,
  order
}`);

// ─── Blog Posts (listing) ─────────────────────────────────────────────────────
// Revalidation tag: "blogPost"

export const allBlogPostsQuery = defineQuery(`*[_type == "blogPost"] | order(publishedAt desc){
  _id,
  title,
  slug,
  category->{_id, name, slug},
  featuredImage,
  excerpt,
  publishedAt
}`);

// ─── Blog Post (single by slug) ───────────────────────────────────────────────
// Revalidation tag: "blogPost"

export const blogPostBySlugQuery = defineQuery(`*[_type == "blogPost" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  category->{_id, name, slug},
  featuredImage,
  body,
  excerpt,
  metaDescription,
  ogImage,
  publishedAt
}`);

// ─── Latest Blog Posts (homepage section) ─────────────────────────────────────
// Revalidation tag: "blogPost"

export const latestBlogPostsQuery = defineQuery(
  `*[_type == "blogPost"] | order(publishedAt desc)[0...5]{
  _id,
  title,
  slug,
  category->{_id, name},
  featuredImage{
    asset->{url, alt},
    ...
  },
  excerpt,
  content
}`,
);

// ─── Related Blog Posts (blog post detail page) ───────────────────────────────
// Revalidation tag: "blogPost"
// If category is null, the caller should fall back to latestBlogPostsQuery.

export const relatedBlogPostsQuery = defineQuery(
  `*[_type == "blogPost" && category._ref == $categoryId && _id != $currentPostId] | order(publishedAt desc)[0...3]{
  _id,
  title,
  slug,
  featuredImage,
  excerpt
}`,
);

// ─── Privacy Policy ───────────────────────────────────────────────────────────
// Revalidation tag: "privacyPolicy"

export const privacyPolicyQuery = defineQuery(
  `*[_type == "privacyPolicy" && _id == "privacyPolicy"][0]{
  title,
  body,
  lastUpdated
}`,
);

// ─── Scheduling & Booking Queries ─────────────────────────────────────────────

export const weeklyScheduleQuery = defineQuery(`*[_type == "weeklySchedule" && _id == "weeklySchedule"][0]{
  defaultSlotDuration,
  bufferMinutes,
  days[]{
    _key,
    dayOfWeek,
    isDayOff,
    startTime,
    endTime
  }
}`);

export const blockedDatesQuery = defineQuery(`*[_type == "blockedDate" && _id == "blockedDate"][0]{
  dates[]{
    _key,
    date,
    isHoliday
  }
}`);

export const slotLockByIdQuery = defineQuery(`*[_type == "slotLock" && _id == $slotLockId][0]{
  _id, dateTime, status
}`);

export const bookingsForDateQuery = defineQuery(`*[_type == "booking" && dateTime >= $startDate && dateTime < $endDate]{
  _id, dateTime, patientEmail, serviceId
}`);

export const slotLocksForDateQuery = defineQuery(`*[_type == "slotLock" && dateTime >= $startDate && dateTime < $endDate]{
  _id, dateTime, status
}`);

export const servicesForBookingQuery = defineQuery(`*[_type == "service"] | order(order asc){
  _id, name, duration, price
}`);
