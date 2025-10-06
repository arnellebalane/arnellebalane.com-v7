/* @type {import("prettier").Config} */
export default {
    plugins: ['prettier-plugin-astro'],
    tabWidth: 4,
    useTabs: false,
    semi: true,
    singleQuote: true,
    printWidth: 120,
    overrides: [
        {
            files: '*.json',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: '*.astro',
            options: {
                parser: 'astro',
            },
        },
    ],
};
