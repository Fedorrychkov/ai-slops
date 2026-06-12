import type { Metadata } from 'next'

import { LandingLayout } from '~/components/Layouts/LandingLayout'

export const metadata: Metadata = {
  title: {
    default: 'Articles',
    template: '%s | Articles',
  },
  description: 'Articles list page',
}

export default function ArticlePublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <LandingLayout>{children}</LandingLayout>
}
