// Global type declarations for non-TS assets
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}
declare module '*.sass' {
  const content: Record<string, string>
  export default content
}
