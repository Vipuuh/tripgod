import React from 'react';
import AdventureMarketplace from '../components/AdventureMarketplace';

export default function Camping({ currentCity, openBookingModal }) {
  return (
    <AdventureMarketplace
      activityType="camping"
      currentCity={currentCity}
      openBookingModal={openBookingModal}
    />
  );
}
