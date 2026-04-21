const LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="17" fill="#C97B4B"/><circle cx="18" cy="18" r="12.5" fill="#FAF6F1"/><path d="M18 7C18 7 11 12 11 18C11 21.9 14.1 25 18 25C21.9 25 25 21.9 25 18C25 12 18 7Z" fill="#C97B4B"/><circle cx="18" cy="17.5" r="2.8" fill="#FAF6F1"/><rect x="16.5" y="20.3" width="4" height="1.8" rx="0.9" fill="#FAF6F1"/><rect x="18.5" y="22.1" width="4" height="1.8" rx="0.9" fill="#FAF6F1"/></svg>`

function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = typeof source === 'string' ? source : URL.createObjectURL(source)
    img.onload = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }
    img.src = url
  })
}

export async function applyWatermark(file: File): Promise<Blob> {
  const img = await loadImage(file)

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.drawImage(img, 0, 0)

  // Dimensions responsive à la taille de l'image
  const base = Math.min(img.width, img.height)
  const logoSize  = Math.round(Math.max(24, Math.min(60, base * 0.065)))
  const fontSize  = Math.round(Math.max(13, Math.min(28, base * 0.030)))
  const subSize   = Math.round(Math.max(7,  Math.min(14, base * 0.017)))
  const padding   = Math.round(Math.max(8,  base * 0.016))
  const gap       = Math.round(Math.max(6,  base * 0.011))
  const margin    = Math.round(Math.max(10, base * 0.022))

  // Mesures texte
  ctx.font = `bold ${fontSize}px Georgia, "Times New Roman", serif`
  const mainW = ctx.measureText('Clévia').width
  ctx.font = `${subSize}px Arial, Helvetica, sans-serif`
  const subW = ctx.measureText('CONCIERGERIE').width

  const textBlockW = Math.max(mainW, subW)
  const pillW = padding + logoSize + gap + textBlockW + padding
  const pillH = logoSize + padding * 2
  const pillX = img.width  - pillW - margin
  const pillY = img.height - pillH - margin
  const r     = pillH / 4

  // Fond pill arrondi semi-transparent
  ctx.fillStyle = 'rgba(44, 26, 14, 0.68)'
  ctx.beginPath()
  ctx.moveTo(pillX + r, pillY)
  ctx.lineTo(pillX + pillW - r, pillY)
  ctx.quadraticCurveTo(pillX + pillW, pillY,        pillX + pillW, pillY + r)
  ctx.lineTo(pillX + pillW, pillY + pillH - r)
  ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - r, pillY + pillH)
  ctx.lineTo(pillX + r, pillY + pillH)
  ctx.quadraticCurveTo(pillX, pillY + pillH,         pillX, pillY + pillH - r)
  ctx.lineTo(pillX, pillY + r)
  ctx.quadraticCurveTo(pillX, pillY,                 pillX + r, pillY)
  ctx.closePath()
  ctx.fill()

  // Logo SVG
  try {
    const svgBlob = new Blob([LOGO_SVG], { type: 'image/svg+xml' })
    const svgUrl  = URL.createObjectURL(svgBlob)
    const logoImg = await loadImage(svgUrl)
    ctx.drawImage(logoImg, pillX + padding, pillY + padding, logoSize, logoSize)
  } catch { /* logo non critique */ }

  const textX = pillX + padding + logoSize + gap

  // "Clévia"
  ctx.font      = `bold ${fontSize}px Georgia, "Times New Roman", serif`
  ctx.fillStyle = '#FAF6F1'
  ctx.fillText('Clévia', textX, pillY + padding + logoSize * 0.58)

  // "CONCIERGERIE"
  ctx.font      = `${subSize}px Arial, Helvetica, sans-serif`
  ctx.fillStyle = 'rgba(250, 246, 241, 0.72)'
  ctx.fillText('CONCIERGERIE', textX, pillY + padding + logoSize * 0.88)

  return new Promise((resolve, reject) => {
    const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      mime,
      0.92,
    )
  })
}
