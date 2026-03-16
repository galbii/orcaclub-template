import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer
      className="mt-auto"
      style={{
        background: 'hsl(220 20% 6%)',
        borderTop: '1px solid hsl(220 15% 14%)',
        color: 'hsl(210 12% 40%)',
      }}
    >
      <div className="container py-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>

        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          <ThemeSelector />
          <nav className="flex flex-col md:flex-row gap-6">
            {navItems.map(({ link }, i) => {
              return (
                <CMSLink
                  className="text-xs tracking-widest uppercase transition-opacity duration-150 hover:opacity-100 opacity-60 font-display"
                  key={i}
                  {...link}
                />
              )
            })}
          </nav>
        </div>
      </div>

      <div
        className="container py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2"
        style={{ borderTop: '1px solid hsl(220 15% 11%)' }}
      >
        <p className="text-xs tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>
          © {new Date().getFullYear()} OrcaClub
        </p>
      </div>
    </footer>
  )
}
