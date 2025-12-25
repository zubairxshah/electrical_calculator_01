import Link from 'next/link'

/**
 * Footer Component
 *
 * Provides:
 * - MZS CodeWorks branding per spec requirements
 * - Legal links (privacy, terms)
 * - Version information
 * - Standards compliance notice
 */

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Branding */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
                <span className="text-sm font-bold">MZS</span>
              </div>
              <span className="font-semibold">MZS CodeWorks</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional electrical engineering calculation tools for battery sizing, UPS design, cable selection, and solar installations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Resources</h3>
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
            <h3 className="mb-4 text-sm font-semibold">Standards Compliance</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• IEEE 485-2020 (Batteries)</li>
              <li>• IEEE 1100-2020 (UPS)</li>
              <li>• NEC 2020 (Cable Sizing)</li>
              <li>• IEC 60364 (Installations)</li>
            </ul>
            <div className="mt-4 space-y-2 text-sm">
              <Link href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>
            © {currentYear} MZS CodeWorks. All rights reserved.
          </p>
          <p className="mt-2 md:mt-0">
            ElectroMate v0.1.0-MVP
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 rounded-lg bg-muted p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Professional Engineering Disclaimer:</p>
          <p>
            These calculations are provided as engineering tools and must be verified by a licensed professional engineer before use in production systems. Always consult applicable local codes and standards. MZS CodeWorks assumes no liability for calculations performed using this tool.
          </p>
        </div>
      </div>
    </footer>
  )
}
