export const STICKY_ACTION_PREVIEW_CASES = [
  'apply',
  'guest',
  'unverified',
  'owner',
  'editor',
  'pending',
  'cooldown',
  'closed',
  'none'
] as const

export type StickyActionPreviewCase =
  (typeof STICKY_ACTION_PREVIEW_CASES)[number]

export interface StickyActionState {
  canApply: boolean
  isProjectOwner: boolean
  canEditDefinition: boolean
  hasUser: boolean
  isVerified: boolean
}

const PREVIEW_STATES: Record<StickyActionPreviewCase, StickyActionState> = {
  apply: {
    canApply: true,
    isProjectOwner: false,
    canEditDefinition: false,
    hasUser: true,
    isVerified: true
  },
  guest: {
    canApply: true,
    isProjectOwner: false,
    canEditDefinition: false,
    hasUser: false,
    isVerified: false
  },
  unverified: {
    canApply: true,
    isProjectOwner: false,
    canEditDefinition: false,
    hasUser: true,
    isVerified: false
  },
  owner: {
    canApply: false,
    isProjectOwner: true,
    canEditDefinition: true,
    hasUser: true,
    isVerified: true
  },
  editor: {
    canApply: false,
    isProjectOwner: false,
    canEditDefinition: true,
    hasUser: true,
    isVerified: true
  },
  pending: {
    canApply: false,
    isProjectOwner: false,
    canEditDefinition: false,
    hasUser: true,
    isVerified: true
  },
  cooldown: {
    canApply: false,
    isProjectOwner: false,
    canEditDefinition: false,
    hasUser: true,
    isVerified: true
  },
  closed: {
    canApply: false,
    isProjectOwner: false,
    canEditDefinition: false,
    hasUser: true,
    isVerified: true
  },
  none: {
    canApply: false,
    isProjectOwner: false,
    canEditDefinition: false,
    hasUser: false,
    isVerified: false
  }
}

export function getStickyActionPreviewCase(
  value: unknown
): StickyActionPreviewCase | null {
  const candidate = Array.isArray(value) ? value[0] : value
  return typeof candidate === 'string' &&
    STICKY_ACTION_PREVIEW_CASES.includes(candidate as StickyActionPreviewCase)
    ? (candidate as StickyActionPreviewCase)
    : null
}

export function resolveStickyActionState(
  previewCase: StickyActionPreviewCase | null,
  actualState: StickyActionState
): StickyActionState {
  return previewCase ? { ...PREVIEW_STATES[previewCase] } : actualState
}
