import { BaseService } from "./base.service";
import type {
  ContactRequestDto,
  ContactResponseDto,
  UpdateContactRequestDto,
} from "@/interfaces/contact.interface";

export const contactService = new BaseService<
  ContactResponseDto,
  ContactRequestDto | UpdateContactRequestDto
>("contacts");
