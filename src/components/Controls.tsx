import { SIZE_PRESETS, type SizePresetId } from '../lib/sizes'
import type { OutputFormat } from '../lib/convert'

type ControlsProps = {
  format: OutputFormat
  presetId: SizePresetId
  quality: number
  customName: string
  originalName: string
  isBatch: boolean
  busy: boolean
  canConvert: boolean
  convertLabel: string
  onFormatChange: (format: OutputFormat) => void
  onPresetChange: (id: SizePresetId) => void
  onQualityChange: (q: number) => void
  onCustomNameChange: (name: string) => void
  onConvert: () => void
}

const FORMATS: OutputFormat[] = ['png', 'jpg', 'webp']

export function Controls({
  format,
  presetId,
  quality,
  customName,
  originalName,
  isBatch,
  busy,
  canConvert,
  convertLabel,
  onFormatChange,
  onPresetChange,
  onQualityChange,
  onCustomNameChange,
  onConvert,
}: ControlsProps) {
  const showQuality = format === 'jpg' || format === 'webp'
  const placeholderBase = originalName.replace(/\.[^.]+$/, '') || 'image'

  return (
    <section className="controls">
      {!isBatch && (
        <div className="controls__group">
          <span className="controls__label">File name</span>
          <input
            type="text"
            className="text-input"
            value={customName}
            onChange={(e) => onCustomNameChange(e.target.value)}
            placeholder={placeholderBase}
            aria-label="Download file name"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="controls__note">
            Leave empty to keep the original name. Extension is added from the format you pick.
          </p>
        </div>
      )}

      {isBatch && (
        <p className="controls__note controls__note--batch">
          Batch mode uses each file&apos;s original name inside the ZIP.
        </p>
      )}

      <div className="controls__group">
        <span className="controls__label">Format</span>
        <div className="segmented" role="group" aria-label="Output format">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              className={`segmented__btn${format === f ? ' is-active' : ''}`}
              onClick={() => onFormatChange(f)}
              aria-pressed={format === f}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="controls__group">
        <span className="controls__label">Resolution</span>
        <div className="segmented segmented--wrap" role="group" aria-label="Resolution preset">
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`segmented__btn${presetId === p.id ? ' is-active' : ''}`}
              onClick={() => onPresetChange(p.id)}
              aria-pressed={presetId === p.id}
              title={
                p.box
                  ? `Upscale to fit ${p.box.width}×${p.box.height} (never shrink)`
                  : 'Keep native pixels'
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="controls__note">Upscale only — images already at or above the target stay as-is.</p>
      </div>

      {showQuality && (
        <div className="controls__group">
          <div className="controls__label-row">
            <span className="controls__label">Quality</span>
            <span className="controls__value">{Math.round(quality * 100)}%</span>
          </div>
          <input
            type="range"
            className="slider"
            min={50}
            max={100}
            step={1}
            value={Math.round(quality * 100)}
            onChange={(e) => onQualityChange(Number(e.target.value) / 100)}
            aria-label="Export quality"
          />
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary"
        disabled={!canConvert || busy}
        onClick={onConvert}
      >
        {convertLabel}
      </button>
    </section>
  )
}
