interface KnownLanguageProperties {
    quotes: string[];
    escapes: boolean;
}

export const knownLanguageProps: { [langId: string]: KnownLanguageProperties } = {
    "typescript": { quotes: ["'", '"', "`"], escapes: true },
    "javascript": { quotes: ["'", '"', "`"], escapes: true },
    "csharp": { quotes: ['"'], escapes: true },
    "c": { quotes: ['"'], escapes: true },
    "cpp": { quotes: ['"'], escapes: true },
    "yaml": { quotes: ['"', "'"], escapes: true },
    "dockercompose": { quotes: ['"', "'"], escapes: true },
    "css": { quotes: ['"', "'"], escapes: false },
    "scss": { quotes: ['"', "'"], escapes: false },
    "sass": { quotes: ['"', "'"], escapes: false },
    "cuda-cpp": { quotes: ['"'], escapes: true },
    "d": { quotes: ['"', "`"], escapes: true },
    "pascal": { quotes: ["'"], escapes: false },
    "fsharp": { quotes: ['"', "'", "`"], escapes: true },
    "go": { quotes: ['"', "`"], escapes: true },
    "groovy": { quotes: ['"', "'"], escapes: true },
    "handlebars": { quotes: ['"', "'"], escapes: false },
    "html": { quotes: ['"', "'"], escapes: false },
    "php": { quotes: ['"', "'"], escapes: true },
    "bat": { quotes: ['"'], escapes: false },
    "plaintext": { quotes: [], escapes: false },
    "python": { quotes: ["'", '"'], escapes: true },
    "markdown": { quotes: [], escapes: false },
    "json": { quotes: ["'", '"'], escapes: true },
    "java": { quotes: ['"'], escapes: true },
    "lua": { quotes: ['"', "'"], escapes: true },
};
