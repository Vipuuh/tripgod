import React from 'react';
import AdventureMarketplace from '../components/AdventureMarketplace';

export default function Zipline({ currentCity, openBookingModal }) {
  return (
    <AdventureMarketplace
      activityType="zipline"
      currentCity={currentCity}
      openBookingModal={openBookingModal}
    />
  );
}
