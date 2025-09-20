import React, { useEffect, useState } from 'react';
import { useOrders } from '../../context/OrderContext';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { Order } from '../../types/order';
import { apiService } from '../../services/api';
import { toast } from 'react-toastify';

export function AdminOrders() {
  const { orders, fetchOrders, loading, error } = useOrders();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, status: 'confirmado' | 'cancelado') => {
    try {
      setUpdatingOrderId(orderId);
      await apiService.put(`/orders/${orderId}`, { status });
      await fetchOrders();
      toast.success(`Pedido ${status} com sucesso!`);
    } catch (err) {
      toast.error('Erro ao atualizar o status do pedido');
      console.error(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Todos os Pedidos</h1>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID do Pedido</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders?.map((order: Order) => (
            <TableRow key={order.id}>
              <TableCell>{order.id}</TableCell>
              <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell>R$ {parseFloat(order.total_price).toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {order.status === 'pendente' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmado')}
                        disabled={updatingOrderId === order.id}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelado')}
                        disabled={updatingOrderId === order.id}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
