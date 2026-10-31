import { BaseService } from "./base.service";
import type {
  ClientListItemDto,
  ClientOptionDto,
  ClientRequestDto,
  ClientResponseDto,
  QuickCreateClientRequestDto,
} from "@/interfaces/client.interface";

class ClientService extends BaseService<
  ClientResponseDto,
  ClientRequestDto,
  ClientListItemDto
> {
  constructor() {
    super("clients");
  }

  clientOptions(search?: string, token?: string) {
    return this.apiService.get<ClientOptionDto[]>(
      `${this.endpoint}/options`,
      { search },
      token
    );
  }

  quickCreate(dto: QuickCreateClientRequestDto, token?: string) {
    return this.apiService.post<ClientOptionDto>(
      `${this.endpoint}/quick`,
      dto,
      token
    );
  }
}

export const clientService = new ClientService();
