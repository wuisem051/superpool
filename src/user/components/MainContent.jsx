import React from 'react';

const MainContent = ({ children }) => {
  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[#06080d] ml-72 overflow-y-auto w-[calc(100%-18rem)] custom-scrollbar">
      {/* Añadimos margin-left (ml-72) igual al ancho del Sidebar (w-72) */}
      <div className="flex-1 relative flex flex-col pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/10 via-[#06080d] to-[#06080d] pointer-events-none z-0"></div>
        <div className="relative z-10 flex-1 flex flex-col w-full h-full">
          {children}
        </div>
      </div>
    </main>
  );
};

export default MainContent;
