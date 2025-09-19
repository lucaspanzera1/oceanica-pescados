import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../../services/api';
import { adminProductService } from '../../../services/admin/product.service';
import { Product } from '../../../types/products';
import { Button } from '../../ui/Button';
import { toast } from 'react-toastify';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const response = await apiService.getProducts(1, 50); // Get more products for admin view
      if (response.data && response.data.products) {
        setProducts(response.data.products);
      } else {
        setProducts([]);
        toast.error('Nenhum produto encontrado');
      }
    } catch (error) {
      toast.error('Erro ao carregar produtos');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await adminProductService.deleteProduct(id);
        toast.success('Produto excluído com sucesso');
        loadProducts(); // Reload the list
      } catch (error) {
        toast.error('Erro ao excluir produto');
      }
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
        <Link to="/admin/products/new">
          <Button>Novo Produto</Button>
        </Link>
      </div>

      <div className="bg-white shadow-md rounded">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Imagem</th>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Preço</th>
              <th className="px-4 py-2">Estoque</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                </td>
                <td className="px-4 py-2">{product.name}</td>
                <td className="px-4 py-2">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(Number(product.price))}
                </td>
                <td className="px-4 py-2">{product.stock}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-sm bg-green-100 text-green-800`}>
                    Ativo
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex space-x-2">
                    <Link
                      to={`/admin/products/edit/${product.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;