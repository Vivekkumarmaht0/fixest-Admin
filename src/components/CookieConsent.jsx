import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('fixest_admin_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('fixest_admin_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#c3c6d7]/30 p-4 shadow-[0_-4px_12px_rgba(0,74,198,0.05)] z-[9999] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
      <div className="text-[13px] text-[#434655] font-medium max-w-4xl">
        We use cookies to improve your experience and ensure the security of this portal. By continuing, you agree to our policies.
      </div>
      <div className="flex-shrink-0 w-full sm:w-auto">
        <button
          onClick={handleAccept}
          className="w-full sm:w-auto bg-[#004ac6] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#2563eb] transition-colors shadow-sm text-[13px]"
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
