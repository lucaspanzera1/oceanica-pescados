import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';
import { 
  Menu, 
  X, 
  Phone, 
  MapPin,
  User,
  LogOut,
  ShoppingCart,
  Fish,
  Waves,
  Facebook,
  Instagram
} from 'lucide-react';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const navigation = [
    { name: 'Início', href: '/', current: location.pathname === '/' },
    { name: 'Produtos', href: '/produtos', current: location.pathname === '/produtos' },
    { name: 'Sobre Nós', href: '/sobre', current: location.pathname === '/sobre' },
    { name: 'Contato', href: '/contato', current: location.pathname === '/contato' },
  ];

  return (
    <>
      {/* Top Bar - Informações de Contato */}
      <div className="bg-blue-900 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-2 space-y-2 sm:space-y-0">

            {/* 📞 Contatos (só no desktop) */}
            <div className="hidden sm:flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>(31) 3428-8312</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>Belo Horizonte, MG</span>
              </div>
            </div>

            {/* 🔗 Redes sociais + Entrar/Usuário */}
            <div className="flex items-center space-x-4">

              {/* Redes sociais (sempre visíveis) */}
              <div className="flex items-center space-x-3">
                <a 
                  href="https://www.facebook.com/oceanicapescados/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a 
                  href="https://www.instagram.com/oceanicapescados/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-pink-400 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>

              {/* Login / Usuário */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 hover:text-blue-200 transition-colors"
                  >
                    <User className="h-3 w-3" />
                    {/* nome aparece só em desktop */}
                    <span className="hidden sm:inline text-xs">
                      Olá, {user?.email?.split('@')[0] || 'Usuário'}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                        <div className="font-medium text-gray-900">{user?.email}</div>
                        <div className="capitalize">{user?.role}</div>
                      </div>
                      
                      <Link 
                        to="/dashboard" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3" />
                        Minha Área
                      </Link>
                      
                      <Link 
                        to="/perfil" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3" />
                        Meu Perfil
                      </Link>
                      
                      <div className="border-t border-gray-100 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sair
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="text-xs hover:text-blue-200 transition-colors px-3 py-1 rounded-md border border-white/20 hover:border-white/40"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`bg-white shadow-lg transition-all duration-300 sticky top-0 z-40 ${
        isScrolled ? 'shadow-xl bg-white/95 backdrop-blur-sm' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <img src="logo_oceanica.fw_.webp" alt="Logo" width="100px" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    item.current
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {item.name}
                  {item.current && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500"></div>
                  )}
                </Link>
              ))}
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              {/* WhatsApp Button */}
              <a
                href="https://wa.me/553134288312"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm font-medium"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                </svg>
                <span>WhatsApp</span>
              </a>

              {/* Cart Button - FUNCIONAL AGORA */}
              <button 
                onClick={handleCartClick}
                className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 hover:bg-gray-50 rounded-lg"
                title="Ver carrinho"
              >
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem] animate-pulse">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
                {totalItems === 0 && (
                  <span className="absolute -top-1 -right-1 bg-gray-300 text-gray-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    0
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              <div className="py-4 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Mobile Cart Button */}
                <button
                  onClick={handleCartClick}
                  className="flex items-center space-x-2 px-3 py-2 w-full text-left text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors text-sm font-medium rounded-lg"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Carrinho ({totalItems})</span>
                  {totalItems > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
                
                {/* Mobile WhatsApp */}
                <a
                  href="https://wa.me/553134288312"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                  </svg>
                  <span>Entrar em Contato</span>
                </a>

                {!isAuthenticated && (
                  <div className="pt-4 border-t border-gray-200">
                    <Link
                      to="/login"
                      className="block px-3 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Fazer Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Ocean Wave Decoration */}
      <div className="relative h-2 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 overflow-hidden">
        <div className="absolute inset-0 opacity-60">
          <Waves className="h-8 w-full text-white/20 animate-pulse" />
        </div>
      </div>
    </>
  );
};