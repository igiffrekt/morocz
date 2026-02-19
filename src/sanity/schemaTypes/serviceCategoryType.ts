import { defineField, defineType } from "sanity";

export const serviceCategoryType = defineType({
	name: "serviceCategory",
	title: "Szolgaltatas kategoria",
	type: "document",
	fields: [
		defineField({
			name: "name",
			title: "Kategoria neve",
			type: "string",
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: "emoji",
			title: "Emoji/ikon",
			type: "string",
			description: 'Emoji karakter a szuro gombhoz, pl. "\ud83c\udfe5"',
		}),
		defineField({
			name: "order",
			title: "Sorrend",
			type: "number",
			description: "Kisebb szam = elobb jelenik meg",
		}),
	],
	preview: {
		select: {
			title: "name",
			subtitle: "emoji",
		},
		prepare({ title, subtitle }) {
			return {
				title: subtitle ? `${subtitle} ${title}` : title,
			};
		},
	},
});
