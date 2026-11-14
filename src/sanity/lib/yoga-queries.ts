import { defineQuery } from "next-sanity";

// Lélekző /joga page. Kept apart from queries.ts so the page can evolve independently.

// Revalidation tag: "yogaInstructor"
export const yogaInstructorsWithLinksQuery =
  defineQuery(`*[_type == "yogaInstructor" && isActive == true] | order(name asc){
  _id,
  name,
  "slug": slug.current,
  photo,
  bio,
  phone,
  email,
  color,
  links[]{ label, url }
}`);

export interface YogaInstructorDoc {
  _id: string;
  name: string | null;
  slug: string | null;
  photo: { asset?: { _ref: string } } | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  color: string | null;
  links: Array<{ label: string | null; url: string | null }> | null;
}
