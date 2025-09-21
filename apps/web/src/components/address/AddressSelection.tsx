import React, { useState, useEffect } from 'react';
import { AddressForm } from './AddressForm';
import { Button } from '../ui';
import { Address } from '../../types/address.types';
import { addressService } from '../../services/address.service';

interface AddressSelectionProps {
  onAddressSelect: (address: Address) => void;
  selectedAddressId?: string;
}

export const AddressSelection: React.FC<AddressSelectionProps> = ({
  onAddressSelect,
  selectedAddressId,
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const userAddresses = await addressService.getAddresses();
      setAddresses(userAddresses);
      
      // Se há um endereço principal e nenhum endereço selecionado, seleciona o principal
      if (!selectedAddressId) {
        const defaultAddress = userAddresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          onAddressSelect(defaultAddress);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar endereços');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressCreated = () => {
    // Recarrega a lista de endereços para incluir o novo endereço
    loadAddresses();
    setShowForm(false);
  };

  const handleSelectAddress = (address: Address) => {
    onAddressSelect(address);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {!showForm && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Selecione um endereço de entrega
            </h2>
            <Button
              variant="secondary"
              onClick={() => setShowForm(true)}
            >
              Novo Endereço
            </Button>
          </div>

          <div className="space-y-4">
            {addresses.length > 0 ? (
              <div className="grid gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => handleSelectAddress(address)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAddressId === address.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">
                          {address.street}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.neighborhood}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.city} - {address.state}
                        </p>
                        <p className="text-sm text-gray-600">
                          CEP: {address.postal_code}
                        </p>
                        {address.isDefault && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="flex items-center h-5">
                        <input
                          type="radio"
                          checked={selectedAddressId === address.id}
                          onChange={() => handleSelectAddress(address)}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">
                  Você ainda não tem endereços cadastrados
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowForm(true)}
                >
                  Adicionar Endereço
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {showForm && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Novo Endereço
            </h2>
            <Button
              variant="secondary"
              onClick={() => setShowForm(false)}
            >
              Voltar
            </Button>
          </div>
          <AddressForm
            onSuccess={handleAddressCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
};