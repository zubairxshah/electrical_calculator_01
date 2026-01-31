'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

// Note: Metadata moved to client component requires alternative approach
// Consider using next/head or separate metadata configuration

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ElectroMate - Electrical Engineering Calculations</title>
        <meta
          name="description"
          content="Professional electrical engineering calculation tools for battery sizing, UPS design, cable selection, and solar installations. Standards-compliant calculations per IEEE, IEC, and NEC."
        />
        <meta
          name="keywords"
          content="electrical engineering, battery calculator, UPS sizing, cable sizing, solar calculator, IEEE 485, NEC 2020, IEC 60364"
        />
      </head>
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          {/* Top Navigation */}
          <TopNavigation />

          {/* Main Content Area */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </body>
    </html>
  )
}
