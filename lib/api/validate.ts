import { z } from 'zod';
import { ValidationError } from './errors';

export function validateInput<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors = result.error.format();
    throw new ValidationError(formattedErrors);
  }
  return result.data;
}

export async function validateRequest<T extends z.ZodTypeAny>(schema: T, req: Request): Promise<z.infer<T>> {
  try {
    const json = await req.json();
    return validateInput(schema, json);
  } catch (err: any) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError({ _errors: ['Invalid JSON body'] });
  }
}
