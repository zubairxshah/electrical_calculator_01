'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useMobileMenu } from '@/hooks/useMobileMenu'

const inter = Inter({ subsets: ['latin'] })

// Note: Metadata moved to client component requires alternative approach
// Consider using next/head or separate metadata configuration

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const mobileMenu = useMobileMenu()

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
        <div className="flex min-h-screen">
          {/* Sidebar Navigation with mobile menu state */}
          <Sidebar isOpen={mobileMenu.isOpen} onClose={mobileMenu.close} />

          {/* Main Content Area - CRITICAL FIX: md:pl-64 instead of pl-64 */}
          <div className="flex flex-1 flex-col md:pl-64">
            {/* Header with mobile menu button */}
            <Header
              mobileMenuOpen={mobileMenu.isOpen}
              onMobileMenuToggle={mobileMenu.toggle}
              triggerRef={mobileMenu.triggerRef}
            />

            {/* Page Content - Responsive padding */}
            <main className="flex-1 p-4 md:p-6">
              {children}
            </main>

            {/* Footer */}
            <Footer />
          </div>
        </div>
      </body>
    </html>
  )
}
