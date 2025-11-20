import { PartialType } from '@nestjs/mapped-types';
import { CreateReleaseNoteDto } from './create-release-note.dto';

export class UpdateReleaseNoteDto extends PartialType(CreateReleaseNoteDto) {}
