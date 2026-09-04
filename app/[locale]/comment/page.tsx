import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AnimateIn } from '@/components/ui/AnimateIn'
import type { Metadata } from 'next'
import { getPageSeo } from '@/lib/seo'
import { getFaqJsonLd, getBreadcrumbJsonLd } from '@/lib/schemas'
import HowTabs from '@/components/HowTabs'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'how' })
  return getPageSeo(locale, '/comment', t('hero.title'), t('hero.subtitle'))
}

export default async function CommentPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'how' })
  const tCta = await getTranslations({ locale, namespace: 'cta' })

  const faqItems = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
  ]

  const tabs = [
    {
      id: 'courteDuree' as const,
      label: t('tabs.courteDuree'),
      intro: t('courteDuree.intro'),
      steps: [
        { number: t('courteDuree.steps.contact.number'), title: t('courteDuree.steps.contact.title'), description: t('courteDuree.steps.contact.description') },
        { number: t('courteDuree.steps.visit.number'), title: t('courteDuree.steps.visit.title'), description: t('courteDuree.steps.visit.description') },
        { number: t('courteDuree.steps.contract.number'), title: t('courteDuree.steps.contract.title'), description: t('courteDuree.steps.contract.description') },
        { number: t('courteDuree.steps.publish.number'), title: t('courteDuree.steps.publish.title'), description: t('courteDuree.steps.publish.description') },
        { number: t('courteDuree.steps.manage.number'), title: t('courteDuree.steps.manage.title'), description: t('courteDuree.steps.manage.description') },
        { number: t('courteDuree.steps.payment.number'), title: t('courteDuree.steps.payment.title'), description: t('courteDuree.steps.payment.description') },
      ],
    },
    {
      id: 'longueDuree' as const,
      label: t('tabs.longueDuree'),
      intro: t('longueDuree.intro'),
      steps: [
        { number: t('longueDuree.steps.contact.number'), title: t('longueDuree.steps.contact.title'), description: t('longueDuree.steps.contact.description') },
        { number: t('longueDuree.steps.evaluation.number'), title: t('longueDuree.steps.evaluation.title'), description: t('longueDuree.steps.evaluation.description') },
        { number: t('longueDuree.steps.search.number'), title: t('longueDuree.steps.search.title'), description: t('longueDuree.steps.search.description') },
        { number: t('longueDuree.steps.contract.number'), title: t('longueDuree.steps.contract.title'), description: t('longueDuree.steps.contract.description') },
        { number: t('longueDuree.steps.manage.number'), title: t('longueDuree.steps.manage.title'), description: t('longueDuree.steps.manage.description') },
      ],
    },
    {
      id: 'vente' as const,
      label: t('tabs.vente'),
      intro: t('vente.intro'),
      steps: [
        { number: t('vente.steps.contact.number'), title: t('vente.steps.contact.title'), description: t('vente.steps.contact.description') },
        { number: t('vente.steps.estimation.number'), title: t('vente.steps.estimation.title'), description: t('vente.steps.estimation.description') },
        { number: t('vente.steps.preparation.number'), title: t('vente.steps.preparation.title'), description: t('vente.steps.preparation.description') },
        { number: t('vente.steps.visits.number'), title: t('vente.steps.visits.title'), description: t('vente.steps.visits.description') },
        { number: t('vente.steps.closing.number'), title: t('vente.steps.closing.title'), description: t('vente.steps.closing.description') },
      ],
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getFaqJsonLd(faqItems)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getBreadcrumbJsonLd(locale, [{ name: t('hero.title'), path: '/comment' }])) }}
      />
      {/* HERO */}
      <section className="bg-creme py-24 px-4 border-b border-brun/5">
        <div className="max-w-7xl mx-auto text-center">
          <AnimateIn>
            <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('tag')}
            </span>
            <h1 className="text-5xl md:text-6xl text-brun mb-6">{t('hero.title')}</h1>
            <p className="text-brun-mid text-lg max-w-xl mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('hero.subtitle')}
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* TABS + TIMELINE */}
      <HowTabs tabs={tabs} />

      {/* FAQ */}
      <section className="bg-white py-20 px-4 border-t border-brun/5">
        <div className="max-w-3xl mx-auto">
          <AnimateIn>
            <h2 className="text-3xl text-brun mb-10 text-center">Questions fréquentes</h2>
          </AnimateIn>
          <div className="flex flex-col gap-4">
            {faqItems.map((item, i) => (
              <details key={i} className="group bg-creme border border-brun/10 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-brun font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {item.question}
                  <svg className="w-5 h-5 text-terra transition-transform group-open:rotate-180 flex-shrink-0 ml-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 text-brun-mid text-sm leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-terra py-20 px-4">
        <AnimateIn className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl text-white mb-4">{tCta('title')}</h2>
          <p className="text-white/80 mb-8 text-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {tCta('subtitle')}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-terra font-medium rounded-full px-10 py-4 hover:bg-creme transition-all duration-200"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {tCta('button')}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </AnimateIn>
      </section>
    </>
  )
}
