'use client'

type Props = {
  whatsappNum: string
  whatsappMsg: string
  bienId: string
  bienTitre: string
  bienReference?: string | null
  telephone: string
  label: string
}

export default function WhatsAppButton({
  whatsappNum,
  whatsappMsg,
  bienId,
  bienTitre,
  bienReference,
  telephone,
  label,
}: Props) {
  const handleClick = () => {
    fetch('/api/vente/whatsapp-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bien_id: bienId,
        bien_titre: bienTitre,
        bien_reference: bienReference ?? null,
        telephone,
      }),
    }).catch(() => {})
  }

  return (
    <a
      href={`https://wa.me/${whatsappNum}?text=${whatsappMsg}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="flex items-center justify-center gap-2 text-white text-sm font-medium rounded-full px-5 py-3 transition-all"
      style={{ backgroundColor: '#25D366', fontFamily: 'var(--font-dm-sans)' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.828L.057 23.143l5.462-1.432A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.66-.518-5.172-1.418l-.371-.218-3.843 1.008 1.027-3.736-.241-.386A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
      {label}
    </a>
  )
}
