export interface Env { DB: D1Database; ASSETS: Fetcher; CORS_ORIGINS: string }
export interface Lookup { id: string; name: string }
export interface EntryRow { slug: string; name: string; originalName: string; summary: string; description: string; materialType: string; cultureId: string; cultureName: string; categoryId: string; categoryName: string }
export interface EntryCard { slug: string; name: string; originalName: string; summary: string; culture: Lookup; category: Lookup; tags: Lookup[] }
