import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { BatchList } from './components/BatchList'
import { Controls } from './components/Controls'
import { Dropzone } from './components/Dropzone'
import { Preview } from './components/Preview'
import { useExportPreview } from './hooks/useExportPreview'
import {
  convertImage,
  loadImageFile,
  revokeLoadedImage,
  type LoadedImage,
  type OutputFormat,
} from './lib/convert'
import { buildOutputFilename, downloadBlob, downloadZip } from './lib/download'
import { formatBytes } from './lib/formatBytes'
import { getPreset, resolveOutputSize, type SizePresetId } from './lib/sizes'

function revokeAll(images: LoadedImage[]) {
  for (const img of images) revokeLoadedImage(img)
}

export default function App() {
  const [images, setImages] = useState<LoadedImage[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [format, setFormat] = useState<OutputFormat>('png')
  const [presetId, setPresetId] = useState<SizePresetId>('original')
  const [quality, setQuality] = useState(0.92)
  const [customName, setCustomName] = useState('')
  const [busy, setBusy] = useState(false)
  const [convertProgress, setConvertProgress] = useState<{
    current: number
    total: number
    bytes: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)
  const imagesRef = useRef<LoadedImage[]>([])
  imagesRef.current = images

  const activeImage = useMemo(
    () => images.find((img) => img.id === activeId) ?? images[0] ?? null,
    [images, activeId],
  )

  const exportOptions = useMemo(
    () => ({ format, presetId, quality }),
    [format, presetId, quality],
  )

  const exportPreview = useExportPreview(activeImage, exportOptions)

  useEffect(() => {
    return () => revokeAll(imagesRef.current)
  }, [])

  const output = useMemo(() => {
    if (!activeImage) {
      return { width: 0, height: 0, willUpscale: false, alreadyLargeEnough: false }
    }
    return resolveOutputSize(activeImage.width, activeImage.height, getPreset(presetId))
  }, [activeImage, presetId])

  const handleFiles = useCallback(async (files: File[]) => {
    setError(null)
    if (files.length === 0) return

    try {
      const loaded = await Promise.all(files.map(loadImageFile))
      setImages((prev) => {
        const isFirst = prev.length === 0
        if (isFirst) {
          setCustomName('')
          setActiveId(loaded[0].id)
        } else {
          setActiveId((id) => id ?? loaded[0].id)
        }
        return [...prev, ...loaded]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load image(s).')
    }
  }, [])

  const handleAddMoreChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) void handleFiles(files)
    e.target.value = ''
  }

  const handleRemove = useCallback((id: string) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id)
      if (removed) revokeLoadedImage(removed)
      const next = prev.filter((img) => img.id !== id)
      setActiveId((active) => {
        if (active === id) return next[0]?.id ?? null
        return active
      })
      if (next.length === 0) setCustomName('')
      return next
    })
  }, [])

  const handleClearAll = useCallback(() => {
    setImages((prev) => {
      revokeAll(prev)
      return []
    })
    setActiveId(null)
    setCustomName('')
    setError(null)
  }, [])

  const handleConvert = useCallback(async () => {
    if (images.length === 0) return
    setBusy(true)
    setError(null)
    const opts = { format, presetId, quality }

    try {
      if (images.length === 1) {
        const img = images[0]
        const blob =
          exportPreview.blob &&
          exportPreview.status === 'ready' &&
          activeImage?.id === img.id
            ? exportPreview.blob
            : await convertImage(img.bitmap, opts)
        const filename = buildOutputFilename(img.file.name, format, presetId, customName)
        downloadBlob(blob, filename)
      } else {
        const results: { name: string; blob: Blob }[] = []
        const failures: string[] = []
        let totalBytes = 0

        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          setConvertProgress({ current: i + 1, total: images.length, bytes: totalBytes })
          try {
            const blob = await convertImage(img.bitmap, opts)
            totalBytes += blob.size
            results.push({
              name: buildOutputFilename(img.file.name, format, presetId),
              blob,
            })
            setConvertProgress({ current: i + 1, total: images.length, bytes: totalBytes })
          } catch {
            failures.push(img.file.name)
          }
        }

        if (results.length === 0) {
          throw new Error('All conversions failed.')
        }

        await downloadZip(results)
        if (failures.length > 0) {
          setError(`Skipped ${failures.length} file(s): ${failures.join(', ')}`)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.')
    } finally {
      setBusy(false)
      setConvertProgress(null)
    }
  }, [images, format, presetId, quality, customName, exportPreview, activeImage])

  const isBatch = images.length > 1
  let convertLabel = 'Convert & download'
  if (busy && convertProgress) {
    convertLabel = `Converting ${convertProgress.current}/${convertProgress.total}… (${formatBytes(convertProgress.bytes)} so far)`
  } else if (busy) {
    convertLabel = 'Converting…'
  } else if (isBatch) {
    convertLabel = `Convert all & download ZIP (${images.length})`
  }

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden />
      <header className="header">
        <p className="brand">Converter</p>
        <p className="tagline">Local image format &amp; upscale tool</p>
      </header>

      <main className="workspace">
        {images.length === 0 ? (
          <Dropzone onFiles={handleFiles} disabled={busy} />
        ) : (
          <>
            {isBatch && (
              <BatchList
                images={images}
                activeId={activeImage?.id ?? ''}
                onSelect={setActiveId}
                onRemove={handleRemove}
                onClearAll={handleClearAll}
                onAddMore={() => addInputRef.current?.click()}
                disabled={busy}
              />
            )}
            <div className="workspace__panel">
              {activeImage && (
                <Preview
                  image={activeImage}
                  output={output}
                  afterUrl={exportPreview.previewUrl}
                  previewStatus={exportPreview.status}
                  originalBytes={activeImage.file.size}
                  estimatedBytes={exportPreview.bytes}
                  onClear={handleClearAll}
                  showClear={!isBatch}
                />
              )}
              <Controls
                format={format}
                presetId={presetId}
                quality={quality}
                customName={customName}
                originalName={activeImage?.file.name ?? 'image'}
                isBatch={isBatch}
                busy={busy}
                canConvert={images.length > 0}
                convertLabel={convertLabel}
                onFormatChange={setFormat}
                onPresetChange={setPresetId}
                onQualityChange={setQuality}
                onCustomNameChange={setCustomName}
                onConvert={handleConvert}
              />
            </div>
          </>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </main>

      <footer className="footer">
        <span>PNG · JPG · WebP</span>
        <span>Runs entirely in your browser</span>
      </footer>

      <input
        ref={addInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleAddMoreChange}
        tabIndex={-1}
      />
    </div>
  )
}
