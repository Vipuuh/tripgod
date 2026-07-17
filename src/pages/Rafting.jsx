import React from 'react';
import AdventureMarketplace from '../components/AdventureMarketplace';

export default function Rafting({ currentCity, openBookingModal }) {
  return (
    <AdventureMarketplace
      activityType="rafting"
      currentCity={currentCity}
      openBookingModal={openBookingModal}
    />
  );
}
