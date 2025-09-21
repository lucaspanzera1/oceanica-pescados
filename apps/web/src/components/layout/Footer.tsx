import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-blue-900 text-white py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">© {new Date().getFullYear()} Oceânica Pescados. Todos os direitos reservados.</p>
          </div>
          <div className="flex items-center">
            <span className="text-sm">Powered by </span>
            <a 
              href="https://www.stelestial.app" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm ml-1 hover:text-blue-300 transition-colors duration-300 flex items-center"
            >
              Stelestial Software
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                className="w-4 h-4 ml-1 inline-block"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;