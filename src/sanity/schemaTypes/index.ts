import type { SchemaTypeDefinition } from "sanity";
import { blockedDateType } from "./blockedDateType";
import { blogCategoryType } from "./blogCategoryType";
import { blogPostType } from "./blogPostType";
import { bookingType } from "./bookingType";
import { homepageType } from "./homepageType";
import { labTestType } from "./labTestType";
import { patientType } from "./patientType";
import { privacyPolicyType } from "./privacyPolicyType";
import { serviceCategoryType } from "./serviceCategoryType";
import { serviceType } from "./serviceType";
import { siteSettingsType } from "./siteSettingsType";
import { slotLockType } from "./slotLockType";
import { testimonialType } from "./testimonialType";
import { weeklyScheduleType } from "./weeklyScheduleType";

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
  weeklyScheduleType,
  blockedDateType,
  bookingType,
  slotLockType,
  patientType,
];
