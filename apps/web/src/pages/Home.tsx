import React from 'react';

import { Layout } from '../components/layout/Layout';

export const Home: React.FC = () => {
  return (
<Layout>
  <div className="relative min-h-screen w-full">
    <img 
      src="frutosdomar.jpg" 
      alt="banner" 
      className="absolute inset-0 w-full h-full object-cover"
    />
  </div>
</Layout>

  );
};
