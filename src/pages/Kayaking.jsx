import React from 'react';
import AdventureMarketplace from '../components/AdventureMarketplace';

export default function Kayaking({ currentCity, openBookingModal }) {
  return (
    <AdventureMarketplace
      activityType="kayaking"
      currentCity={currentCity}
      openBookingModal={openBookingModal}
    />
  );
}
