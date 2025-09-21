import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input } from '../components/ui';
import { Fish, UserPlus, User, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const { register, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Se já estiver autenticado, redireciona para o dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (XX) XXXXX-XXXX
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return numbers.slice(0, 11);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const success = await register(email, password, name, phone);
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Erro ao criar conta. Email pode já estar em uso.');
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex">
      {/* Seção da Imagem - Lado Esquerdo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 z-10"></div>
        <img
          src="/frutosdomar.jpg"
          alt="Frutos do Mar"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-white p-8">
        </div>
      </div>

      {/* Seção do Registro - Lado Direito */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          {/* Logo/Título Mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/logo_oceanica.fw_.webp"
                alt="Oceânica Pescados"
                className="h-12 w-auto mr-3"
              />
              <div>
                <h1 className="text-2xl font-bold text-blue-800">Oceânica Pescados</h1>
                <div className="flex items-center justify-center text-blue-600 text-sm">
                  <Fish className="mr-1 h-4 w-4" />
                  Os melhores frutos do mar
                </div>
              </div>
            </div>
          </div>

          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="space-y-6 p-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Crie sua conta
                </h2>
                <p className="text-gray-600">
                  Cadastre-se para acessar os melhores frutos do mar
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Nome"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="transition-all duration-200 focus:ring-blue-500 focus:border-blue-500"
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="transition-all duration-200 focus:ring-blue-500 focus:border-blue-500"
                />

                <Input
                  label="Telefone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  placeholder="(00) 00000-0000"
                  required
                  className="transition-all duration-200 focus:ring-blue-500 focus:border-blue-500"
                />

                <Input
                  label="Senha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="transition-all duration-200 focus:ring-blue-500 focus:border-blue-500"
                />

                <Input
                  label="Confirmar Senha"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`transition-all duration-200 focus:ring-blue-500 focus:border-blue-500 ${
                    confirmPassword && password !== confirmPassword ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />

                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-600 text-sm flex items-center">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    As senhas não coincidem
                  </p>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  disabled={!name || !email || !phone || !password || password !== confirmPassword || password.length < 6}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  size="large"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Criando conta...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <UserPlus className="mr-2 h-5 w-5" />
                      Criar conta
                    </div>
                  )}
                </Button>
              </form>

              <div className="space-y-4">
                {/* Divisor */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">ou</span>
                  </div>
                </div>

                {/* Botão de Login */}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full bg-white border-2 border-blue-600 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium"
                >
                  <div className="flex items-center justify-center">
                    <User className="mr-2 h-5 w-5" />
                    Já tenho uma conta
                  </div>
                </button>

                {/* Link para voltar */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium inline-flex items-center transition-colors duration-200"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Voltar para página inicial
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Rodapé */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>© 2025 Oceânica Pescados. Qualidade garantida!</p>
          </div>
        </div>
      </div>
    </div>
  );
};