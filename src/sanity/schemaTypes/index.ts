import type { SchemaTypeDefinition } from "sanity";
import { blogCategoryType } from "./blogCategoryType";
import { blogPostType } from "./blogPostType";
import { homepageType } from "./homepageType";
import { labTestType } from "./labTestType";
import { privacyPolicyType } from "./privacyPolicyType";
import { serviceCategoryType } from "./serviceCategoryType";
import { serviceType } from "./serviceType";
import { siteSettingsType } from "./siteSettingsType";
import { testimonialType } from "./testimonialType";

export const schemaTypes: SchemaTypeDefinition[] = [
  homepageType,
  siteSettingsType,
  serviceCategoryType,
  serviceType,
  labTestType,
  testimonialType,
  blogCategoryType,
  blogPostType,
  privacyPolicyType,
];
