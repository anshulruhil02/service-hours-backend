import { IsNotEmpty, IsString } from "class-validator";

export class SaveSignatureDto {
    @IsString()
    @IsNotEmpty()
    signatureKey: string;
}