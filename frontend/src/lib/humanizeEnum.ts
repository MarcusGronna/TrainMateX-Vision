export function humanizeEnum(value: string | undefined | null): string {
  // Return empty string if value is falsy
  if (!value || typeof value !== 'string') return ''

  // Ex: "BodyWeight" -> "Body Weight", "PullUpBar" -> "Pull Up Bar"
  return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}
