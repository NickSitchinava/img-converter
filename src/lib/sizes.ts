export type SizePresetId = 'original' | '720p' | '1080p' | '4k'

export type SizePreset = {
  id: SizePresetId
  label: string
  /** Target box; null means keep native pixels */
  box: { width: number; height: number } | null
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'original', label: 'Original', box: null },
  { id: '720p', label: '720p', box: { width: 1280, height: 720 } },
  { id: '1080p', label: '1080p', box: { width: 1920, height: 1080 } },
  { id: '4k', label: '4K', box: { width: 3840, height: 2160 } },
]

export type OutputDimensions = {
  width: number
  height: number
  /** True when we will enlarge the image to reach the preset */
  willUpscale: boolean
  /** True when image already meets/exceeds the preset (kept as-is) */
  alreadyLargeEnough: boolean
}

/**
 * Uniform contain-fit into the target box, upscale only (never shrink).
 */
export function resolveOutputSize(
  sourceWidth: number,
  sourceHeight: number,
  preset: SizePreset,
): OutputDimensions {
  if (!preset.box) {
    return {
      width: sourceWidth,
      height: sourceHeight,
      willUpscale: false,
      alreadyLargeEnough: false,
    }
  }

  const scale = Math.min(
    preset.box.width / sourceWidth,
    preset.box.height / sourceHeight,
  )

  if (scale <= 1) {
    return {
      width: sourceWidth,
      height: sourceHeight,
      willUpscale: false,
      alreadyLargeEnough: true,
    }
  }

  return {
    width: Math.round(sourceWidth * scale),
    height: Math.round(sourceHeight * scale),
    willUpscale: true,
    alreadyLargeEnough: false,
  }
}

export function getPreset(id: SizePresetId): SizePreset {
  const found = SIZE_PRESETS.find((p) => p.id === id)
  if (!found) return SIZE_PRESETS[0]
  return found
}
