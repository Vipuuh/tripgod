import React from 'react';
import ActivityDetail from '../components/ActivityDetail';

export default function Zipline({ openBookingModal }) {
  return (
    <ActivityDetail
      id="zipline"
      title="ZIPLINE OVER GANGA RISHIKESH"
      category="zipline"
      price={2000}
      heroImage={[
        '/zipline-hero.jpg',
        '/zipline-1.jpg',
        '/zipline-2.jpg',
        '/zipline-3.jpg'
      ]}
      tagline="Glide over the roaring currents of the holy Ganges."
      description="Glide securely suspended above the rapids of Ganga. India's longest and fastest zipline stretches 400 metres across the river valley, offering breathtaking panoramic views of Rishikesh's green hills and the white-water river below."
      highlights={[
        { label: 'Zipline Length', value: '400 Metres' },
        { label: 'Speed', value: 'Up to 140 km/h' },
        { label: 'Duration', value: '45 Minutes' }
      ]}
      inclusions={[
        'Full Safety Body Harness & Carabiner Hook',
        'Sturdy Polycarbonate Helmet',
        'Safety Briefing by Certified Instructors',
        'Access to Zipline platforms'
      ]}
      exclusions={[
        'GoPro / Drone Footage (Available for ₹600 extra)',
        'Transport back to town office'
      ]}
      eligibility={[
        'Age 12 years and above',
        'Weight 30 kg to 100 kg',
        'Physical fitness for brief uphill walk'
      ]}
      notSuitableFor={[
        'Pregnant women',
        'High blood pressure or heart problems',
        'Vertigo or severe fear of heights'
      ]}
      location="Ganga Zipline activity point, Rishikesh"
      openBookingModal={openBookingModal}
    />
  );
}
