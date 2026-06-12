import type { Metadata } from 'next'

import { LandingLayout } from '~/components/Layouts/LandingLayout'

export const metadata: Metadata = {
  title: {
    default: 'Games',
    template: '%s | Games',
  },
  description: 'AI slop games catalog',
}

export default function GamesPublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <LandingLayout>{children}</LandingLayout>
}
