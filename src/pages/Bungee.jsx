import React from 'react';
import AdventureMarketplace from '../components/AdventureMarketplace';

export default function Bungee({ currentCity, openBookingModal }) {
  return (
    <AdventureMarketplace
      activityType="bungee"
      currentCity={currentCity}
      openBookingModal={openBookingModal}
    />
  );
}
