'use client'

import React from 'react'

export function OrcaHomePage() {
  return (
    <div className="bg-orca-deep text-foreground min-h-screen flex flex-col items-center justify-center gap-5 text-center p-8">
      <a
        href="https://orcaclub.pro"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-2.5 no-underline"
      >
        <p
          className="text-muted-foreground font-display font-semibold uppercase tracking-[0.3em]"
          style={{ fontSize: '0.65rem' }}
        >
          est. 2025
        </p>

        <p
          className="text-foreground uppercase leading-none tracking-[0.12em]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(3rem, 10vw, 6rem)',
            fontWeight: 400,
          }}
        >
          Orcaclub
        </p>
      </a>

      <p
        className="text-muted-foreground mt-2 leading-tight"
        style={{
          fontFamily: "'UnifrakturMaguntia', serif",
          fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
          letterSpacing: '0.04em',
          fontWeight: 400,
        }}
      >
        Built to Surface.
      </p>
    </div>
  )
}
