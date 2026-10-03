export class UploadResponseDto {
  id!: number;
  url!: string;
  secureUrl!: string;
  resourceType!: string;
  format!: string;
  originalFilename!: string;
  width!: number | null;
  height!: number | null;
  bytes!: number | null;
  tags!: string[] | null;
  eager!:
    | { url: string; secureUrl: string; width: number; height: number }[]
    | null;
}
