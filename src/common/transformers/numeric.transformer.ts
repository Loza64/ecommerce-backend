import { ValueTransformer } from 'typeorm';

/**
 * Postgres devuelve `decimal`/`numeric` como string. Este transformer lo
 * expone como number en la entidad.
 */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};
