import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../../services/api';
import { adminProductService } from '../../../services/admin/product.service';
import { CreateProductRequest } from '../../../types/admin/product.types';
import { Button } from '../../ui/Button';
import { toast } from 'react-toastify';

const initialFormState = {
  name: '',
  description: '',
  price: '',
  stock: 0,
};

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialFormState);
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [image1Preview, setImage1Preview] = useState<string>('');
  const [image2Preview, setImage2Preview] = useState<string>('');
  const [currentImages, setCurrentImages] = useState<{image_url?: string; image_url1?: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      const response = await apiService.getProductById(productId);
      const product = response.data.product;
      setForm({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
      });
      setCurrentImages({
        image_url: product.image_url,
        image_url1: product.image_url1,
      });
    } catch (error) {
      toast.error('Erro ao carregar produto');
      navigate('/admin/products');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);

      if (name === 'image1') {
        setImage1(file);
        setImage1Preview(previewUrl);
      } else if (name === 'image2') {
        setImage2(file);
        setImage2Preview(previewUrl);
      }
    }
  };

  // Limpar as URLs temporárias quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (image1Preview) URL.revokeObjectURL(image1Preview);
      if (image2Preview) URL.revokeObjectURL(image2Preview);
    };
  }, [image1Preview, image2Preview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('stock', form.stock.toString());
      
      if (image1) {
        formData.append('image_url', image1);
      }
      
      if (image2) {
        formData.append('image_url1', image2);
      }

      if (id) {
        await adminProductService.updateProduct(id, formData);
        toast.success('Produto atualizado com sucesso');
      } else {
        await adminProductService.createProduct(formData);
        toast.success('Produto criado com sucesso');
      }
      
      navigate('/admin/products');
    } catch (error) {
      toast.error('Erro ao salvar produto');
      console.error('Erro ao salvar produto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Editar Produto' : 'Novo Produto'}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-4xl bg-white p-8 rounded-lg shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coluna da esquerda - Informações básicas */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Produto</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="Digite o nome do produto"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="Descreva o produto"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Preço (R$)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R$</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full pl-12 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estoque</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Quantidade"
                  required
                />
              </div>
            </div>
          </div>

          {/* Coluna da direita - Imagens */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Imagem Principal</label>
              <div 
                className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 ${
                  image1Preview ? 'border-blue-500' : 'border-gray-300 border-dashed'
                } rounded-lg hover:border-blue-500 transition-colors relative group`}
              >
                {image1Preview ? (
                  <>
                    <img
                      src={image1Preview}
                      alt="Preview da imagem principal"
                      className="h-48 w-full object-contain rounded"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                      <label htmlFor="image1" className="hidden group-hover:flex items-center justify-center px-4 py-2 bg-white bg-opacity-90 rounded-md cursor-pointer transition-all transform hover:scale-105">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Trocar imagem
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="image1" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Carregar arquivo</span>
                        <input
                          id="image1"
                          name="image1"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG até 10MB</p>
                  </div>
                )}
              </div>
              {currentImages.image_url && !image1Preview && (
                <div className="mt-4">
                  <div className="relative group">
                    <img
                      src={currentImages.image_url}
                      alt="Imagem atual do produto"
                      className="h-40 w-full object-cover rounded-lg shadow-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">Imagem atual</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Imagem Secundária</label>
              <div 
                className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 ${
                  image2Preview ? 'border-blue-500' : 'border-gray-300 border-dashed'
                } rounded-lg hover:border-blue-500 transition-colors relative group`}
              >
                {image2Preview ? (
                  <>
                    <img
                      src={image2Preview}
                      alt="Preview da imagem secundária"
                      className="h-48 w-full object-contain rounded"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                      <label htmlFor="image2" className="hidden group-hover:flex items-center justify-center px-4 py-2 bg-white bg-opacity-90 rounded-md cursor-pointer transition-all transform hover:scale-105">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Trocar imagem
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="image2" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Carregar arquivo</span>
                        <input
                          id="image2"
                          name="image2"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG até 10MB</p>
                  </div>
                )}
              </div>
              {currentImages.image_url1 && !image2Preview && (
                <div className="mt-4">
                  <div className="relative group">
                    <img
                      src={currentImages.image_url1}
                      alt="Segunda imagem do produto"
                      className="h-40 w-full object-cover rounded-lg shadow-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">Imagem atual</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/products')}
            disabled={isLoading}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="px-6"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </span>
            ) : (
              id ? 'Atualizar' : 'Criar'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;