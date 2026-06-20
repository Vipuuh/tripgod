import React from 'react';
import ActivityDetail from '../components/ActivityDetail';

export default function Paragliding({ openBookingModal }) {
  return (
    <ActivityDetail
      id="paragliding"
      title="PARAGLIDING IN RISHIKESH"
      category="paragliding"
      price={4500}
      rating={4.8}
      reviewsCount={520}
      heroImage={[
        '/paragliding-hero.jpg',
        '/paragliding-1.jpg',
        '/paragliding-2.jpg',
        '/paragliding-3.jpg',
        '/paragliding-4.jpg'
      ]}
      tagline="Fly high above Rishikesh valley with experienced tandem pilots."
      description="Enjoy the ultimate bird's-eye view of Rishikesh. Take off from a lush mountain crest in the Shivpuri Hills and soar at an altitude of up to 5,000 feet. Experience a tandem flight with an expert pilot controlling the paraglider, concluding with a safe landing on the white sands of the Ganges."
      highlights={[
        { label: 'Altitude', value: '5,000 Feet' },
        { label: 'Air Time', value: '15-20 Mins' },
        { label: 'Pilot Type', value: 'Certified Tandem' }
      ]}
      inclusions={[
        'Certified Tandem Pilot services',
        'State-of-the-art Paraglider, Harness & Helmet',
        'GoPro Selfie stick video footage (Free)',
        'Transport from landing zone to takeoff point'
      ]}
      exclusions={[
        'Snacks and beverages',
        'Pickup from hotels (available as extra)'
      ]}
      eligibility={[
        'Age 12 to 65 Years',
        'Weight 30 kg to 100 kg',
        'Comfortable running 10-15 steps on takeoff run'
      ]}
      notSuitableFor={[
        'Pregnant women',
        'Heart patients or asthma history',
        'Chronic knee or back issues preventing takeoff run'
      ]}
      location="Takeoff: Shivpuri Hills, Landing: Ganga riverbank, Rishikesh"
      openBookingModal={openBookingModal}
    />
  );
}
