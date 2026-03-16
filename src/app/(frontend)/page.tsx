import type { Metadata } from 'next'
import { OrcaHomePage } from './_components/OrcaHomePage'
import { getServerSideURL } from '@/utilities/getURL'

export default function HomePage() {
  return <OrcaHomePage />
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: 'OrcaClub — The Club for Builders Who Move Fast',
  description: 'OrcaClub is a premium membership community for ambitious founders, operators, and engineers.',
  openGraph: {
    title: 'OrcaClub',
    description: 'The premium membership for builders who move fast.',
    siteName: 'OrcaClub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@orcaclub',
    title: 'OrcaClub',
    description: 'The premium membership for builders who move fast.',
  },
}
