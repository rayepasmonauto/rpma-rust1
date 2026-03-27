import type { Metadata } from 'next';
import RootClientLayout from './RootClientLayout';

// This is a Server Component. Client Components will be imported into it.

export const metadata: Metadata = {
  title: 'RPMA V2 - Gestion Professionnelle de Film de Protection',
  description:
    "Systeme de gestion complet pour les entreprises d'installation de PPF. Logiciel proprietaire RPMA v2.",
  applicationName: 'RPMA v2',
  authors: [{ name: 'Raye Pas Mon Auto' }],
  creator: 'Raye Pas Mon Auto',
  publisher: 'Raye Pas Mon Auto',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <RootClientLayout>{children}</RootClientLayout>
      </body>
    </html>
  );
}
