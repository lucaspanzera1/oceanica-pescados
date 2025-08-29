import React from 'react';

import { Layout } from '../components/layout/Layout';

export const Home: React.FC = () => {
  return (
    <Layout>
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <img src="frutosdomar.jpg" alt="banner" />
    </div>
    </Layout>
  );
};
