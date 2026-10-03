interface CorsCallback {
  (err: Error | null, allow?: boolean): void;
}

export default interface CorsOrigin {
  (origin: string | undefined, callback: CorsCallback): void;
}
