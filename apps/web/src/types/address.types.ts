export interface Address {
  id?: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  isDefault?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressResponse {
  success: boolean;
  message: string;
  data: {
    address: Address;
  };
}

export interface AddressListResponse {
  success: boolean;
  message: string;
  data: {
    addresses: Address[];
  };
}

export interface CreateAddressRequest {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  isDefault?: boolean;
}