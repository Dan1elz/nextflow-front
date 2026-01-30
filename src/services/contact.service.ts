import { BaseService } from "./base.service";
import type { IContact } from "@/interfaces/contact.interface";

const baseService = new BaseService<IContact>("contacts");

export const contactService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
};
