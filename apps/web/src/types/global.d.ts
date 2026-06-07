// Tell TypeScript that CSS imports are valid
// Next.js handles these at runtime
declare module '*.css' {
  const styles: Record<string, string>;
  export default styles;
}