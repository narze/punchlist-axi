// esbuild's text loader: a .css import is the stylesheet as a string
declare module '*.css' {
  const css: string;
  export default css;
}
