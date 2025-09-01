import React from 'react';
import { Layout } from '../components/layout/Layout';
import { Products } from './Products';

export const Home: React.FC = () => {
  return (
    <Layout>
      <div className="relative min-h-[60vh] w-full">
        <img 
          src="frutosdomar.jpg" 
          alt="banner" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <section id="produtos" className="mt-8">
        <Products />
      </section>
    </Layout>
  );
};
