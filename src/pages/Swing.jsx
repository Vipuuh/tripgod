import React from 'react';
import ActivityDetail from '../components/ActivityDetail';

export default function Swing({ openBookingModal }) {
  return (
    <ActivityDetail
      id="swing"
      title="GIANT SWING RISHIKESH"
      category="swing"
      price={3600}
      heroImage={[
        '/swing-hero.png',
        '/swing-1.jpg',
        '/swing-2.jpg',
        '/swing-3.jpg',
        '/swing-4.jpg'
      ]}
      tagline="Swing 113 metres above deep river valleys, solo or in couples."
      description="Enjoy the thrill of a lifetime on India's highest Giant Swing. Suspended at a height of 113 metres, you are harnessed securely before the platform retracts and sends you free-falling into a massive, sweeping pendulum arc across the lush mountain valley."
      highlights={[
        { label: 'Platform Height', value: '113 Metres' },
        { label: 'Swing Type', value: 'Solo or Couples' },
        { label: 'Swing Speed', value: 'Up to 110 km/h' }
      ]}
      inclusions={[
        'Double-redundant Safety Harness',
        'Detailed safety briefing by expert instructors',
        'Official Giant Swing completion certificate',
        'Shuttle service from Tapovan registration office'
      ]}
      exclusions={[
        'Full HD DSLR Video (Extra ₹600)',
        'Viewer tickets (₹500/viewer)'
      ]}
      eligibility={[
        'Age 12 to 65 Years',
        'Weight 35 kg to 110 kg (Combined max 200kg for couples)',
        'Compliance with safety commands'
      ]}
      notSuitableFor={[
        'Pregnant women',
        'Heart conditions, high BP or breathing ailments',
        'Epilepsy or chronic back/neck spinal conditions'
      ]}
      location="Giant Swing activity zone, Shivpuri Canyon, Rishikesh"
      openBookingModal={openBookingModal}
    />
  );
}
