import React from 'react';
import TripGodSpecialBanner from './TripGodSpecialBanner';

export default function PackagesSection({ setRoute, onBookPackage }) {
  const handleOpenComboBuilder = () => {
    if (setRoute) {
      setRoute('custom-combo');
    } else {
      window.history.pushState(null, '', '/custom-combo');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <TripGodSpecialBanner onOpenComboBuilder={handleOpenComboBuilder} />
  );
}

