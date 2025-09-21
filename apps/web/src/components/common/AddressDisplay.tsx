import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Address } from '../../types/order';
import { Loader } from 'lucide-react';

interface AddressDisplayProps {
  addressId: string;
}

export const AddressDisplay: React.FC<AddressDisplayProps> = ({ addressId }) => {
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAddress(addressId);
        setAddress(response.data.address);
      } catch (err) {
        setError('Erro ao carregar endereço');
        console.error('Erro ao buscar endereço:', err);
      } finally {
        setLoading(false);
      }
    };

    if (addressId) {
      fetchAddress();
    }
  }, [addressId]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Carregando endereço...</span>
      </div>
    );
  }

  if (error || !address) {
    return (
      <p className="text-sm text-red-500">
        {error || 'Endereço não disponível'}
      </p>
    );
  }

  return (
    <p className="text-sm font-medium text-gray-900">
      {address.street}
      {address.number && `, ${address.number}`}
      {address.complement && ` - ${address.complement}`}<br />
      {address.city} - {address.state}<br />
      CEP: {address.postal_code}
    </p>
  );
};