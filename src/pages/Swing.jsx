import React from 'react';
import AdventureMarketplace from '../components/AdventureMarketplace';

export default function Swing({ currentCity, openBookingModal }) {
  return (
    <AdventureMarketplace
      activityType="swing"
      currentCity={currentCity}
      openBookingModal={openBookingModal}
    />
  );
}
