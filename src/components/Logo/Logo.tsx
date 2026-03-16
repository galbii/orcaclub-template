import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { className } = props

  return (
    <span
      className={clsx(className)}
      style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: '1.1rem',
        fontWeight: 400,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'hsl(210 15% 88%)',
      }}
    >
      Orcaclub
    </span>
  )
}
