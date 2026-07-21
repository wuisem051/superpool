import React, { useEffect, useState } from 'react';

const ErrorMessage = ({ message, onDismiss, type = 'error' }) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  const isSuccess = type === 'success';

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Progress bar countdown (5s matches ErrorContext auto-dismiss)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) { clearInterval(interval); return 0; }
        return prev - (100 / 50); // 50 steps over 5000ms = 100ms each
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onDismiss, 250);
  };

  return (
    // Backdrop overlay — centered on screen
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
    >
      {/* Modal box */}
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-90 -translate-y-4'}
          ${isSuccess ? 'bg-[#0a1a0f] border border-green-500/30' : 'bg-[#1a0a0a] border border-red-500/30'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className={`h-1 w-full ${isSuccess ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon circle */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl
              ${isSuccess ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
              {isSuccess ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm uppercase tracking-wider mb-1 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                {isSuccess ? 'Operación Exitosa' : 'Error'}
              </p>
              <p className="text-white text-sm leading-relaxed break-words">{message}</p>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors
                ${isSuccess ? 'text-green-400/60 hover:text-green-300 hover:bg-green-500/10' : 'text-red-400/60 hover:text-red-300 hover:bg-red-500/10'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar (auto-dismiss countdown) */}
        <div className="h-0.5 bg-white/5">
          <div
            className={`h-full transition-all ease-linear ${isSuccess ? 'bg-green-500/60' : 'bg-red-500/60'}`}
            style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
