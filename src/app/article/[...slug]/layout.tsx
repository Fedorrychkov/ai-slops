import type { Metadata } from 'next'

import { LandingLayout } from '~/components/Layouts/LandingLayout'

export const metadata: Metadata = {
  title: {
    default: 'Article',
    template: '%s | Article',
  },
  description: 'Article page',
}

export default function ArticlePublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <LandingLayout>{children}</LandingLayout>
}
