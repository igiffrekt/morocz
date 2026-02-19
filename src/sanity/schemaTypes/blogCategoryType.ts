import { defineField, defineType } from "sanity";

export const blogCategoryType = defineType({
	name: "blogCategory",
	title: "Blog kategoria",
	type: "document",
	fields: [
		defineField({
			name: "name",
			title: "Kategoria neve",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "slug",
			title: "URL cimke",
			type: "slug",
			description: "Az URL-ben megjeleno nev",
			options: {
				source: "name",
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "order",
			title: "Sorrend",
			type: "number",
		}),
	],
	preview: {
		select: {
			title: "name",
		},
	},
});
