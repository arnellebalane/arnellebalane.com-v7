import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

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

const projects = defineCollection({
    loader: file('data/projects.json'),
    schema: z.object({
        name: z.string(),
        description: z.string(),
        repo_url: z.string(),
        project_url: z.string().optional(),
        category: z.string(),
        tags: z.array(z.string()),
    }),
});

const events = defineCollection({
    loader: file('data/events.json'),
    schema: z.object({
        title: z.string(),
        event_title: z.string(),
        event_url: z.string(),
        type: z.string(),
        date: z.string(),
        venue: z.string(),
    }),
});

const articles = defineCollection({
    loader: glob({
        base: './src/pages/blog',
        pattern: '**/*.md',
    }),
    schema: z.object({
        title: z.string(),
        summary: z.string(),
        cover_image: z.string().optional(),
        date: z.date(),
    }),
});

export const collections = {
    experiences,
    socials,
    projects,
    events,
    articles,
};
