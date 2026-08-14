import type { LoadedImage } from '../lib/convert'

type BatchListProps = {
  images: LoadedImage[]
  activeId: string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onClearAll: () => void
  onAddMore: () => void
  disabled?: boolean
}

export function BatchList({
  images,
  activeId,
  onSelect,
  onRemove,
  onClearAll,
  onAddMore,
  disabled,
}: BatchListProps) {
  return (
    <div className="batch">
      <div className="batch__header">
        <span className="batch__count">
          {images.length} image{images.length === 1 ? '' : 's'}
        </span>
        <div className="batch__actions">
          <button type="button" className="btn btn--ghost" onClick={onAddMore} disabled={disabled}>
            Add more
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClearAll} disabled={disabled}>
            Clear all
          </button>
        </div>
      </div>
      <ul className="batch__list" role="listbox" aria-label="Image queue">
        {images.map((img) => (
          <li key={img.id}>
            <button
              type="button"
              role="option"
              aria-selected={img.id === activeId}
              className={`batch__item${img.id === activeId ? ' is-active' : ''}`}
              onClick={() => onSelect(img.id)}
              disabled={disabled}
            >
              <img src={img.previewUrl} alt="" className="batch__thumb" />
              <span className="batch__name" title={img.file.name}>
                {img.file.name}
              </span>
            </button>
            <button
              type="button"
              className="batch__remove"
              onClick={() => onRemove(img.id)}
              disabled={disabled}
              aria-label={`Remove ${img.file.name}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
