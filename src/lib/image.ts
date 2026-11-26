/** Reduce la foto a un máximo de `maxSide` px y la comprime a JPEG. */
export async function resizeImage(file: File, maxSide = 1280, quality = 0.75): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No s\'ha pogut processar la foto'))), 'image/jpeg', quality),
  )
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}
