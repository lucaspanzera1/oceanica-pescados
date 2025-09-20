import { apiService } from '../api';

export interface Client {
  name: string;
  phone: string | null;
}

export interface ListClientsResponse {
  success: boolean;
  message: string;
  data: {
    clients: Client[];
  };
}

export const usersService = {
  listClients: async (): Promise<Client[]> => {
    try {
      const response = await apiService.get<ListClientsResponse>('/auth/clients');
      return response.data.clients;
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      throw error;
    }
  }
};