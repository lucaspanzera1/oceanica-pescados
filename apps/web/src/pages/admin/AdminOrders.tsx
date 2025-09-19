import React, { useEffect } from 'react';
import { useOrders } from '../../context/OrderContext';

export function AdminOrders() {
  const { Orders, fetchOrders, loading, error } = useOrders();

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h1>Todos os Pedidos</h1>

      </div>
  );
}
