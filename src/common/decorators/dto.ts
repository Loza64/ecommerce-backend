import { Transform, TransformFnParams } from 'class-transformer';

export const ToBoolean = () =>
  Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return false;
  });

export const EmptyToUndefined = () =>
  Transform(({ value }: TransformFnParams): string | undefined =>
    value === '' ? undefined : (value as string),
  );
