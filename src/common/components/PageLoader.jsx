import React from 'react';

const PageLoader = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0e14]">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full animate-pulse"></div>
            </div>

            {/* Logo animado */}
            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Anillo exterior giratorio */}
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-[#1e2330]"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 border-r-orange-400 animate-spin"></div>
                    {/* Anillo interior giratorio inverso */}
                    <div
                        className="absolute inset-2 rounded-full border-4 border-transparent border-b-yellow-400 animate-spin"
                        style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
                    ></div>
                    {/* Ícono central */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-7 w-7 text-orange-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Nombre del sitio */}
                <div className="text-center">
                    <p className="text-xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
                        MAXIOS POOL
                    </p>
                    {/* Barra de progreso animada */}
                    <div className="mt-3 w-40 h-0.5 bg-[#1e2330] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full animate-loading-bar"
                            style={{
                                animation: 'loadingBar 1.5s ease-in-out infinite',
                            }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Keyframe inline via style tag */}
            <style>{`
        @keyframes loadingBar {
          0%   { width: 0%; margin-left: 0; }
          50%  { width: 100%; margin-left: 0; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
        </div>
    );
};

export default PageLoader;
