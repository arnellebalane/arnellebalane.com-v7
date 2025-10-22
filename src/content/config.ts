import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const experiences = defineCollection({
    loader: file('data/experiences.json'),
    schema: z.object({
        position: z.string(),
        company: z.string(),
        start_date: z.string(),
        end_date: z.string().optional(),
        is_present: z.boolean(),
        image_url: z.string(),
        details: z.array(z.string()),
    }),
});

const socials = defineCollection({
    loader: file('data/socials.json'),
    schema: z.object({
        name: z.string(),
        url: z.string(),
    }),
});

export const collections = {
    experiences,
    socials,
};
