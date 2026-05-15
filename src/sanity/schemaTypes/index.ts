import type { SchemaTypeDefinition } from "sanity";
import { appointmentHistoryType } from "./appointmentHistoryType";
import { blockedDateType } from "./blockedDateType";
import { blogCategoryType } from "./blogCategoryType";
import { blogPostType } from "./blogPostType";
import { bookingType } from "./bookingType";
import { cookiePolicyType } from "./cookiePolicyType";
import { customAvailabilityType } from "./customAvailabilityType";
import { homepageType } from "./homepageType";
import { kapcsolatType } from "./kapcsolatType";
import { labTestType } from "./labTestType";
import { patientType } from "./patientType";
import { popupType } from "./popupType";
import { pricingPageType } from "./pricingPageType";
import { privacyPolicyType } from "./privacyPolicyType";
import { seasonalScheduleType } from "./seasonalScheduleType";
import { serviceCategoryType } from "./serviceCategoryType";
import { serviceType } from "./serviceType";
import { siteSettingsType } from "./siteSettingsType";
import { slotLockType } from "./slotLockType";
import { testimonialType } from "./testimonialType";
import { weeklyScheduleType } from "./weeklyScheduleType";
import { yogaClassType } from "./yogaClassType";
import { yogaInstructorType } from "./yogaInstructorType";
import { yogaPageType } from "./yogaPageType";
import { yogaScheduleType } from "./yogaScheduleType";

export const schemaTypes: SchemaTypeDefinition[] = [
  homepageType,
  pricingPageType,
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
  seasonalScheduleType,
  blockedDateType,
  customAvailabilityType,
  bookingType,
  slotLockType,
  patientType,
  appointmentHistoryType,
  yogaInstructorType,
  yogaClassType,
  yogaScheduleType,
  yogaPageType,
  popupType,
];
