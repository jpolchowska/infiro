export type ImportControls = {
  submitting: boolean;
  showErrors: (errors: string[]) => void;
  run: (action: (token: string) => Promise<void>, fallbackError: string) => Promise<void>;
};

export async function readValidatedJson(
  file: File,
  validate: (data: unknown) => string[]
): Promise<{ data: unknown; errors: string[] }> {
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return { data: null, errors: ["Nie udało się sparsować pliku jako JSON."] };
  }

  return { data, errors: validate(data) };
}
