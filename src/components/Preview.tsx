import type { LoadedImage } from '../lib/convert'
import type { OutputDimensions } from '../lib/sizes'
import type { ExportPreviewStatus } from '../hooks/useExportPreview'
import { formatBytes } from '../lib/formatBytes'
import { CompareSlider } from './CompareSlider'

type PreviewProps = {
  image: LoadedImage
  output: OutputDimensions
  afterUrl: string | null
  previewStatus: ExportPreviewStatus
  originalBytes: number
  estimatedBytes: number | null
  onClear: () => void
  showClear?: boolean
}

export function Preview({
  image,
  output,
  afterUrl,
  previewStatus,
  originalBytes,
  estimatedBytes,
  onClear,
  showClear = true,
}: PreviewProps) {
  let sizeNote = 'Original dimensions'
  if (output.willUpscale) {
    sizeNote = `Will upscale → ${output.width} × ${output.height}`
  } else if (output.alreadyLargeEnough) {
    sizeNote = `Already large enough — keeping ${output.width} × ${output.height}`
  }

  const estimatedLabel =
    previewStatus === 'pending'
      ? 'Estimating…'
      : estimatedBytes != null
        ? formatBytes(estimatedBytes)
        : '—'

  return (
    <div className="preview">
      <div className="preview__frame">
        <CompareSlider
          beforeUrl={image.previewUrl}
          afterUrl={afterUrl}
          alt={image.file.name}
          loading={previewStatus === 'pending'}
        />
      </div>
      <div className="preview__meta">
        <div className="preview__row">
          <span className="preview__name" title={image.file.name}>
            {image.file.name}
          </span>
          {showClear && (
            <button type="button" className="btn btn--ghost" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
        <dl className="preview__stats">
          <div>
            <dt>Source</dt>
            <dd>
              {image.width} × {image.height}
            </dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{image.file.type || 'unknown'}</dd>
          </div>
          <div>
            <dt>Output</dt>
            <dd>{sizeNote}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>
              {formatBytes(originalBytes)} → {estimatedLabel}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
