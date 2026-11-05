import React, { useState } from 'react';
import { DonationPaymentMethod } from '../../types';

export const BKASH_LOGO_URL = 'https://i.postimg.cc/Bvvhwt8n/Adobe-Express-file.png';
export const NAGAD_LOGO_URL = 'https://i.postimg.cc/Bvvhwt8s/Adobe-Express-file-(1).png';

interface PaymentMethodLogoProps {
  provider: DonationPaymentMethod;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const PaymentMethodLogo: React.FC<PaymentMethodLogoProps> = ({
  provider,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const isBkash = provider === 'BKASH';
  const logoSrc = isBkash ? BKASH_LOGO_URL : NAGAD_LOGO_URL;
  const labelBangla = isBkash ? 'বিকাশ' : 'নগদ';

  const containerSizeClasses: Record<NonNullable<PaymentMethodLogoProps['size']>, string> = {
    xs: 'w-7 h-5 rounded-md p-0.5',
    sm: 'w-9 h-7 rounded-lg p-1',
    md: 'w-12 h-9 rounded-xl p-1.5',
    lg: 'w-16 h-12 rounded-2xl p-2',
  };

  return (
    <div
      className={`bg-white border border-slate-200/90 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${containerSizeClasses[size]} ${className}`}
    >
      {!imgError ? (
        <img
          src={logoSrc}
          alt={`${labelBangla} অফিসিয়াল লোগো`}
          referrerPolicy="no-referrer"
          loading="eager"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain select-none"
        />
      ) : (
        <span
          className={`text-[11px] font-black leading-none select-none ${
            isBkash ? 'text-[#E2136E]' : 'text-[#EA580C]'
          }`}
        >
          {labelBangla}
        </span>
      )}
    </div>
  );
};
