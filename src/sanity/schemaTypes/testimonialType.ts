import { defineField, defineType } from "sanity";

export const testimonialType = defineType({
	name: "testimonial",
	title: "Velemenyek",
	type: "document",
	fields: [
		defineField({
			name: "patientName",
			title: "Paciens neve",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "photo",
			title: "Fenykep",
			type: "image",
			description: "A paciens fotoja (opcionalis)",
			options: {
				hotspot: true,
			},
		}),
		defineField({
			name: "text",
			title: "Velemenye",
			type: "text",
			rows: 4,
			description: "A paciens velemenye, tapasztalata",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "condition",
			title: "Kontextus/allapot",
			type: "string",
			description: 'Milyen problemaban segitettunk, pl. "Cukorbetegseg kezeles"',
		}),
		defineField({
			name: "order",
			title: "Sorrend",
			type: "number",
		}),
	],
	preview: {
		select: {
			title: "patientName",
			subtitle: "condition",
			media: "photo",
		},
	},
});
