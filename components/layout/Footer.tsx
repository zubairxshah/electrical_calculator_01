import Link from 'next/link'

/**
 * Footer Component
 *
 * Polished, responsive footer with branding, quick links, standards, and disclaimer.
 */

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-surface">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-start">
          {/* Branding */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 text-white shadow">
                {/* Simple SVG logo */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="3" fill="white" opacity="0.06" />
                  <path d="M6 12h12M12 6v12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold">MZS CodeWorks</div>
                <div className="text-xs text-muted-foreground">Professional electrical engineering tools</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-prose">Fast, standards-compliant calculations for battery sizing, UPS design, cable selection, and solar installations. Verified against IEEE, IEC, and NEC where applicable.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/standards" className="text-muted-foreground hover:text-foreground transition-colors">
                  Standards Reference
                </Link>
              </li>
              <li>
                <Link href="/documentation" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-muted-foreground hover:text-foreground transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/examples" className="text-muted-foreground hover:text-foreground transition-colors">
                  Example Calculations
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Standards */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Standards</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>IEEE 485-2020 (Batteries)</li>
              <li>IEEE 1100-2020 (UPS)</li>
              <li>NEC 2020 (Cable Sizing)</li>
              <li>IEC 60364 (Installations)</li>
            </ul>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-md bg-muted/40 p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Professional Engineering Disclaimer</p>
          <p className="leading-relaxed">
            These calculations are provided as engineering tools and should be verified by a licensed professional engineer before use in production systems. Always consult local codes and standards. MZS CodeWorks assumes no liability for calculations performed using this tool.
          </p>
          <div className="mt-3 flex justify-between items-center">
            <span>ElectroMate v0.1.0-MVP</span>
            <span>© 2026 MZS CodeWorks. All rights reserved.</span>
            <span>Built with standards in mind</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
