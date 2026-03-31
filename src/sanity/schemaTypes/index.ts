import { appointmentHistoryType } from "./appointmentHistoryType";
import type { SchemaTypeDefinition } from "sanity";
import { blockedDateType } from "./blockedDateType";
import { blogCategoryType } from "./blogCategoryType";
import { blogPostType } from "./blogPostType";
import { bookingType } from "./bookingType";
import { homepageType } from "./homepageType";
import { kapcsolatType } from "./kapcsolatType";
import { labTestType } from "./labTestType";
import { patientType } from "./patientType";
import { privacyPolicyType } from "./privacyPolicyType";
import { cookiePolicyType } from "./cookiePolicyType";
import { serviceCategoryType } from "./serviceCategoryType";
import { serviceType } from "./serviceType";
import { siteSettingsType } from "./siteSettingsType";
import { slotLockType } from "./slotLockType";
import { testimonialType } from "./testimonialType";
import { weeklyScheduleType } from "./weeklyScheduleType";
import { yogaInstructorType } from "./yogaInstructorType";
import { yogaClassType } from "./yogaClassType";
import { yogaScheduleType } from "./yogaScheduleType";
import { yogaPageType } from "./yogaPageType";

export const schemaTypes: SchemaTypeDefinition[] = [
  homepageType,
  kapcsolatType,
  siteSettingsType,
  serviceCategoryType,
  serviceType,
  labTestType,
  testimonialType,
  blogCategoryType,
  blogPostType,
  privacyPolicyType,
  cookiePolicyType,
  weeklyScheduleType,
  blockedDateType,
  bookingType,
  slotLockType,
  patientType,
  appointmentHistoryType,
  yogaInstructorType,
  yogaClassType,
  yogaScheduleType,
  yogaPageType,
];
