import React from 'react';
import { Address } from '../../types/address.types';
import { Button } from '../ui';

interface AddressListProps {
  addresses: Address[];
  onDelete?: (id: string) => void;
  onEdit?: (address: Address) => void;
}

export const AddressList: React.FC<AddressListProps> = ({
  addresses,
  onDelete,
  onEdit,
}) => {
  if (addresses.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        Nenhum endereço cadastrado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <div
          key={address.id}
          className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <p className="font-medium text-gray-900">
                  {address.street}
                </p>
                {address.isDefault && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Principal
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {address.neighborhood}
              </p>
              <p className="text-sm text-gray-600">
                {address.city} - {address.state}
              </p>
              <p className="text-sm text-gray-600">
                CEP: {address.postal_code}
              </p>
            </div>
            <div className="flex space-x-2">
              {onEdit && (
                <Button
                  variant="secondary"
                  onClick={() => onEdit(address)}
                  className="text-sm"
                >
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="danger"
                  onClick={() => onDelete(address.id!)}
                  className="text-sm"
                >
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};