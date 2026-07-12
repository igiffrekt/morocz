import type { MetadataRoute } from "next";
import { sanityFetch } from "@/sanity/lib/fetch";
import { allBlogPostsQuery, allLabTestsQuery } from "@/sanity/lib/queries";
import type { AllBlogPostsQueryResult, AllLabTestsQueryResult } from "../../sanity.types";

const BASE_URL = "https://drmoroczangela.hu";

// Transactional and authenticated routes (/foglalas, /profil, /claim, /jelszo-visszaallitas)
// are deliberately absent — they are per-user and carry booking tokens.
const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/szolgaltatasok-es-arak", priority: 0.9, changeFrequency: "monthly" },
  { path: "/idopontfoglalas", priority: 0.9, changeFrequency: "monthly" },
  { path: "/nogyogyaszat", priority: 0.8, changeFrequency: "monthly" },
  { path: "/szuleszet", priority: 0.8, changeFrequency: "monthly" },
  { path: "/varandosgondozas", priority: 0.8, changeFrequency: "monthly" },
  { path: "/gyogyszerfeliras", priority: 0.7, changeFrequency: "monthly" },
  { path: "/joga", priority: 0.6, changeFrequency: "monthly" },
  { path: "/kapcsolat", priority: 0.7, changeFrequency: "monthly" },
  { path: "/adatkezelesi-tajekoztato", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookie-szabalyzat", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, labTests] = await Promise.all([
    sanityFetch<AllBlogPostsQueryResult>({
      query: allBlogPostsQuery,
      tags: ["blogPost"],
    }).catch(() => [] as AllBlogPostsQueryResult),
    sanityFetch<AllLabTestsQueryResult>({
      query: allLabTestsQuery,
      tags: ["labTest"],
    }).catch(() => [] as AllLabTestsQueryResult),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts
    .filter((post) => post.slug?.current)
    .map((post) => ({
      url: `${BASE_URL}/blog/${post.slug?.current}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : undefined,
      changeFrequency: "yearly",
      priority: 0.6,
    }));

  const labTestEntries: MetadataRoute.Sitemap = labTests
    .filter((test) => test.slug?.current)
    .map((test) => ({
      url: `${BASE_URL}/laborvizsgalatok/${test.slug?.current}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  return [...staticEntries, ...blogEntries, ...labTestEntries];
}
