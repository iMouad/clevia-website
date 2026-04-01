import { Link } from '@/i18n/navigation'

export default function NotFound() {
  return (
    <section className="bg-creme min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p
          className="text-terra leading-none mb-4"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '8rem', fontWeight: 300 }}
        >
          404
        </p>
        <h1 className="text-2xl text-brun mb-3">Page introuvable</h1>
        <p className="text-brun-mid text-sm mb-8" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-block bg-terra text-creme font-medium rounded-full px-8 py-3 hover:bg-brun transition-all duration-200"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Retour à l'accueil
        </Link>
      </div>
    </section>
  )
}
