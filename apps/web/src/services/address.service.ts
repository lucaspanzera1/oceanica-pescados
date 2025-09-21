import { apiService } from './api';
import {
  Address,
  AddressResponse,
  AddressListResponse,
  CreateAddressRequest,
} from '../types/address.types';

class AddressService {
  private baseUrl = '/addresses';

  async createAddress(address: CreateAddressRequest): Promise<Address> {
    const response = await apiService.post<AddressResponse>(this.baseUrl, address);
    return response.data.address;
  }

  async getAddresses(): Promise<Address[]> {
    const response = await apiService.get<AddressListResponse>(`${this.baseUrl}/my`);
    return response.data.addresses;
  }

  async updateAddress(id: string, address: Partial<Address>): Promise<Address> {
    const response = await apiService.put<AddressResponse>(`${this.baseUrl}/${id}`, address);
    return response.data.address;
  }

  async deleteAddress(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  async getAddressById(id: string): Promise<Address> {
    const response = await apiService.get<AddressResponse>(`${this.baseUrl}/${id}`);
    return response.data.address;
  }
}

export const addressService = new AddressService();