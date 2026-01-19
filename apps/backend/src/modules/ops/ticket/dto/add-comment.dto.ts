import { IsString } from 'class-validator';

export class AddCommentDto {
  @IsString()
  comment: string;
}
