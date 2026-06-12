import { SiteFooter } from '~/components/Landing/SiteFooter'
import { LandingHeader } from '~/components/Layouts/LandingHeader'
import { ThemeShell } from '~/providers/theme'
import { cn } from '~/utils/cn'

type Props = {
  children: React.ReactNode
  className?: string
}

/**
 * Public site layout for aigames.art — header with platform nav + footer.
 * The admin/profile side uses `PlatformLayout` (sidebar shell) instead.
 */
export const LandingLayout = async ({ children, className }: Props) => {
  return (
    <ThemeShell className={cn('flex min-h-screen flex-col', className)}>
      <LandingHeader />

      <main className="flex flex-col flex-1 font-sans">{children}</main>

      <SiteFooter />
    </ThemeShell>
  )
}
