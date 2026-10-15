export type ProjectCategory =
  | 'product'
  | 'community'
  | 'open_source'
  | 'research'
  | 'education'
  | 'business'
  | 'other'

export const PROJECT_CATEGORY_OPTIONS = [
  { value: 'product', label: 'Produk' },
  { value: 'community', label: 'Komunitas' },
  { value: 'open_source', label: 'Sumber Terbuka' },
  { value: 'research', label: 'Riset' },
  { value: 'education', label: 'Pendidikan' },
  { value: 'business', label: 'Bisnis' },
  { value: 'other', label: 'Lainnya' }
] as const satisfies ReadonlyArray<{ value: ProjectCategory; label: string }>

export const getProjectCategoryLabel = (
  value: ProjectCategory | string
): string =>
  PROJECT_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ??
  'Lainnya'
