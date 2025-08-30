import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartIcon: React.FC = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <button
      onClick={handleCartClick}
      className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
      title="Ver carrinho"
    >
      <ShoppingCart className="h-6 w-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem]">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
};