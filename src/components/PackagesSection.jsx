import React, { useState } from 'react';
import TripGodSpecialBanner from './TripGodSpecialBanner';
import CustomComboPage from '../pages/CustomComboPage';

export default function PackagesSection({ onBookPackage }) {
  const [showComboPage, setShowComboPage] = useState(false);

  return (
    <>
      <TripGodSpecialBanner onOpenComboBuilder={() => setShowComboPage(true)} />

      {showComboPage && (
        <CustomComboPage 
          onClose={() => setShowComboPage(false)}
          onBookCustomCombo={(bookingPayload) => {
            setShowComboPage(false);
            if (onBookPackage) {
              onBookPackage(bookingPayload);
            }
          }}
        />
      )}
    </>
  );
}
