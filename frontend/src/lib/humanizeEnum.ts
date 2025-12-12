export function humanizeEnum(value: string): string {
  // Ex: "BodyWeight" -> "Body Weight", "PullUpBar" -> "Pull Up Bar"
  return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}
