export interface ISupplier {
  id: string; // Guid
  name: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}
