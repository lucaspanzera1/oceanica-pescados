import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../components/ui';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bem-vindo ao Sistema
            </h1>
            <p className="mt-2 text-gray-600">
              Faça login para acessar sua conta
            </p>
          </div>
          
          <div className="space-y-4">
            <Link to="/login" className="block">
              <Button className="w-full" size="large">
                Fazer Login
              </Button>
            </Link>
            
            <div className="text-sm text-gray-500">
              <p>Sistema de Autenticação JWT</p>
              <p className="mt-1">React + TypeScript + Vite</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
