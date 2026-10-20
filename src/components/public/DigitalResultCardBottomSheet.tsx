import React from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { DigitalResultCard, CardTheme } from './DigitalResultCard';
import { StudentResult } from '../../types';

interface DigitalResultCardBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  result: StudentResult | null;
  onVerify?: (code: string) => void;
}

export const DigitalResultCardBottomSheet: React.FC<DigitalResultCardBottomSheetProps> = ({
  isOpen,
  onClose,
  result,
  onVerify,
}) => {
  if (!result) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="max-h-[88vh]"
    >
      <div className="pb-4">
        <DigitalResultCard
          result={result}
          onClose={onClose}
          onVerify={onVerify}
        />
      </div>
    </BottomSheet>
  );
};
