import loadImage from 'blueimp-load-image'

// 縦または横の大きい方の最大サイズ
const SHRINK_TO_SIZE = 2000
// ContentTypeが取得できなかった場合に使うデフォルト
const DEFAULT_CONTENT_TYPE = 'image/jpeg'

export async function shrinkImage(file: File): Promise<string> {
  const canvas: HTMLCanvasElement = await new Promise(resolve => {
    loadImage(
      file,
      canvas => {
        resolve(canvas as HTMLCanvasElement)
      },
      {
        maxHeight: SHRINK_TO_SIZE,
        maxWidth: SHRINK_TO_SIZE,
        canvas: true,
        orientation: true,
      },
    )
  })

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(data => {
      if (data) {
        resolve(data)
      } else {
        reject()
      }
    }, file.type || DEFAULT_CONTENT_TYPE)
  })

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      if (!e.target) {
        return reject()
      }
      resolve(e.target.result as string)
    }
    reader.readAsDataURL(blob)
  })
}
