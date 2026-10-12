// launch-editor ships no types. Only the call form used in cli.ts is declared.
declare module 'launch-editor' {
  export default function launchEditor(file: string, onError?: (fileName: string, errorMessage: string | null) => void): void;
}
