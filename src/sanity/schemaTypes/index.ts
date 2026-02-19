import type { SchemaTypeDefinition } from "sanity";
import { blogCategoryType } from "./blogCategoryType";
import { blogPostType } from "./blogPostType";
import { homepageType } from "./homepageType";
import { serviceCategoryType } from "./serviceCategoryType";
import { siteSettingsType } from "./siteSettingsType";
import { testimonialType } from "./testimonialType";

export const schemaTypes: SchemaTypeDefinition[] = [
	homepageType,
	siteSettingsType,
	serviceCategoryType,
	testimonialType,
	blogCategoryType,
	blogPostType,
];
