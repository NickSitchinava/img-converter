import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react'

type DropzoneProps = {
  onFiles: (files: File[]) => void
  disabled?: boolean
  compact?: boolean
}

function collectImageFiles(fileList: FileList | null): File[] {
  if (!fileList) return []
  return Array.from(fileList).filter((f) => f.type.startsWith('image/'))
}

export function Dropzone({ onFiles, disabled, compact }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const takeFiles = useCallback(
    (list: FileList | null) => {
      if (disabled) return
      const files = collectImageFiles(list)
      if (files.length > 0) onFiles(files)
    },
    [onFiles, disabled],
  )

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    takeFiles(e.dataTransfer.files)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    takeFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <button
      type="button"
      className={`dropzone${dragging ? ' dropzone--active' : ''}${compact ? ' dropzone--compact' : ''}`}
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragging(false)
        }
      }}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={onChange}
        tabIndex={-1}
      />
      {!compact && (
        <span className="dropzone__mark" aria-hidden>
          ⌁
        </span>
      )}
      <span className="dropzone__title">{compact ? 'Add images' : 'Drop images'}</span>
      <span className="dropzone__hint">
        {compact
          ? 'Click or drop more files'
          : 'or click to browse — one or many images, PNG / JPG / WebP out'}
      </span>
    </button>
  )
}
