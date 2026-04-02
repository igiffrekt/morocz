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
  cookiePolicyUrl,
  metaDescription,
  siteName,
  defaultOgImage
}`);

// ─── Services ─────────────────────────────────────────────────────────────────
// Revalidation tag: "service"

export const allServicesQuery = defineQuery(`*[_type == "service" && isHidden != true] | order(order asc){
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

export const cookiePolicyQuery = defineQuery(
  `*[_type == "cookiePolicy" && _id == "cookiePolicy"][0]{
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

export const bookingsForDateQuery = defineQuery(`*[_type == "booking" && slotDate == $date]{
  _id, slotDate, slotTime, patientEmail, service->{_id}
}`);

export const customAvailabilityForDateQuery = defineQuery(`*[_type == "customAvailability" && date == $date][0]{
  _id,
  date,
  startTime,
  endTime,
  services[]->{_id}
}`);

export const slotLocksForDateQuery = defineQuery(`*[_type == "slotLock" && slotDate == $date]{
  _id, slotDate, slotTime, status
}`);

export const servicesForBookingQuery = defineQuery(`*[_type == "service" && isHidden != true] | order(order asc){
  _id, name, duration, price
}`);

export const KAPCSOLAT_QUERY = defineQuery(`*[_type == "kapcsolat"][0]{
  heroTitle,
  heroDescription,
  heroImage{
    asset->{url, alt},
    hotspot
  },
  phoneNumbers[]{label, number, iconName},
  heroEmailAddresses[]{label, email, iconName},
  emailAddresses[]{label, email, iconName, _key},
  address,
  officeHoursTitle,
  officeHoursIconName,
  officeHours,
  locationTitle,
  locationIconName,
  locationImage{
    asset->{url, alt},
    hotspot
  },
  locationLat,
  locationLng,
  goodToKnowLabel,
  goodToKnowTitle,
  goodToKnowSubtitle,
  goodToKnowCards[]{iconName, title, description, url},
  hasznos_label,
  hasznos_title,
  hasznos_subtitle,
  hasznos_items[]{title, body, iconName, _key},
  fontos_label,
  fontos_title,
  fontos_subtitle,
  fontos_items[]{title, body, iconName, _key}
}`);

// ─── Yoga Page ───────────────────────────────────────────────────────────────
// Revalidation tag: "yogaPage"

export const yogaPageQuery = defineQuery(`*[_type == "yogaPage"][0]{
  heroHeadline,
  heroSubtitle,
  heroImage,
  heroBadges[]{
    _key,
    emoji,
    text
  },
  scheduleHeadline,
  scheduleSubtitle,
  instructorsHeadline,
  metaDescription,
  ogImage
}`);

// ─── Yoga Schedule ───────────────────────────────────────────────────────────
// Revalidation tag: "yogaSchedule"

export const yogaScheduleQuery = defineQuery(`*[_type == "yogaSchedule" && isActive != false] | order(dayOfWeek asc, startTime asc){
  _id,
  yogaClass->{
    name,
    color,
    icon,
    description
  },
  instructor->{
    name,
    color,
    photo
  },
  dayOfWeek,
  startTime,
  endTime,
  recurrence,
  location,
  notes,
  maxParticipants
}`);

// ─── Yoga Instructors ────────────────────────────────────────────────────────
// Revalidation tag: "yogaInstructor"

export const yogaInstructorsQuery = defineQuery(`*[_type == "yogaInstructor"] | order(name asc){
  _id,
  name,
  slug,
  photo,
  bio,
  phone,
  email,
  color
}`);

// ─── Yoga Classes ────────────────────────────────────────────────────────────
// Revalidation tag: "yogaClass"

export const yogaClassesQuery = defineQuery(`*[_type == "yogaClass"] | order(name asc){
  _id,
  name,
  slug,
  description,
  icon,
  color,
  instructors[]->{
    _id,
    name,
    photo
  }
}`);
