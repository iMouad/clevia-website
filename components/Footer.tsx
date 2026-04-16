import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  )
}

export default function Footer() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  const tContact = useTranslations('contact.info')

  return (
    <footer className="bg-brun text-creme">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Image
              src="/logo-light.svg"
              alt="Clévia Conciergerie"
              width={160}
              height={45}
            />
            <p className="text-creme/60 text-sm leading-relaxed max-w-xs">
              {t('description')}
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 mt-2">
              <a
                href="https://www.instagram.com/cleviamaroc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-creme/50 hover:text-sable transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.facebook.com/Cleviama"
                target="_blank"
                rel="noopener noreferrer"
                className="text-creme/50 hover:text-sable transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>

          {/* Pages column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sable font-medium text-sm tracking-widest uppercase">
              {t('links.title')}
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/services" className="text-creme/60 hover:text-sable text-sm transition-colors">
                  {t('links.services')}
                </Link>
              </li>
              <li>
                <Link href="/comment" className="text-creme/60 hover:text-sable text-sm transition-colors">
                  {t('links.how')}
                </Link>
              </li>
              <li>
                <Link href="/pourquoi" className="text-creme/60 hover:text-sable text-sm transition-colors">
                  {t('links.why')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-creme/60 hover:text-sable text-sm transition-colors">
                  {t('links.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sable font-medium text-sm tracking-widest uppercase">
              {t('contact.title')}
            </h3>
            <ul className="flex flex-col gap-3">
              <li className="text-creme/60 text-sm">
                {tContact('email.value')}
              </li>
              <li className="text-creme/60 text-sm">
                {tContact('phone.value')}
              </li>
              <li className="text-creme/60 text-sm">
                {tContact('hours.value')}
              </li>
              <li className="text-creme/60 text-sm">
                {tContact('zone.value')}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-creme/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-creme/40 text-sm">{t('copyright')}</p>
          <p className="text-creme/40 text-xs">{t('tagline')}</p>
        </div>
      </div>
    </footer>
  )
}
