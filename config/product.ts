/**
 * Product identity — single place to customize after forking.
 * URLs for deployment stay in env (`NEXT_PUBLIC_SITE_URL`); SEO/PWA/schema read from here.
 *
 * Set `author: null` and `schema.person: false` for products without a public author persona.
 * Set `links.github: null` and `schema.softwareApplication: false` when not an open-source boilerplate.
 */

export type ProductAuthor = {
  name: string
  url: string
}

export type ProductLinks = {
  github?: string | null
  demo?: string | null
}

export type ProductSitemapExtra = {
  path: string
  priority: number
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

export const PRODUCT_CONFIG = {
  name: 'aigames.art',
  shortName: 'aigames',
  description: 'A curated arcade of games made entirely by AI tools — play in the browser, vote, inspect the prompts behind them',
  defaultTitle: 'aigames.art — a museum of games made entirely by AI',

  /** Public author for articles / Person schema. `null` → Organization-only publisher. */
  author: null as ProductAuthor | null,

  /** Marketing / repo links (homepage, SoftwareApplication schema). */
  links: {
    github: null,
    demo: null,
  } satisfies ProductLinks,

  /** Which optional JSON-LD blocks to emit on the homepage. */
  schema: {
    person: false,
    softwareApplication: false,
  },

  pwa: {
    themeColor: '#0f172a',
    backgroundColor: '#0f172a',
    display: 'standalone' as const,
    orientation: 'portrait' as const,
    icons: [
      { src: '/images/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/images/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      { src: '/images/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any maskable' },
      { src: '/images/favicon-32x32.png', sizes: '32x32', type: 'image/png', purpose: 'any maskable' },
      { src: '/images/favicon-16x16.png', sizes: '16x16', type: 'image/png', purpose: 'any maskable' },
    ],
  },

  /** Static paths not defined in `routes.ts` (feeds, verification-adjacent URLs, etc.). */
  sitemapExtras: [{ path: '/rss.xml', priority: 0.6, changeFrequency: 'daily' as const }] satisfies ProductSitemapExtra[],
} as const
