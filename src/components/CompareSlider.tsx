import { useCallback, useRef, useState, type PointerEvent } from 'react'

type CompareSliderProps = {
  beforeUrl: string
  afterUrl: string | null
  alt: string
  loading?: boolean
}

export function CompareSlider({ beforeUrl, afterUrl, alt, loading }: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)
  const dragging = useRef(false)

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setPosition((x / rect.width) * 100)
  }, [])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    updatePosition(e.clientX)
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const showAfter = !!afterUrl

  return (
    <div className="compare" ref={containerRef}>
      <img src={beforeUrl} alt={alt} className="compare__img compare__img--before" draggable={false} />
      {showAfter && (
        <div className="compare__after" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
          <img src={afterUrl} alt={`${alt} (converted)`} className="compare__img" draggable={false} />
        </div>
      )}
      {showAfter && (
        <>
          <span className="compare__label compare__label--before">Before</span>
          <span className="compare__label compare__label--after">After</span>
          <div
            className="compare__divider"
            style={{ left: `${position}%` }}
            role="slider"
            aria-label="Compare before and after"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 2))
              if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 2))
            }}
          />
        </>
      )}
      {loading && !showAfter && <div className="compare__loading">Estimating…</div>}
    </div>
  )
}
