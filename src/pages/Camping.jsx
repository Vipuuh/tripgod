import React from 'react';
import ActivityDetail from '../components/ActivityDetail';

export default function Camping({ openBookingModal }) {
  return (
    <ActivityDetail
      id="camping"
      title="RIVERSIDE CAMPING RISHIKESH"
      category="camping"
      price={1800}
      rating={4.6}
      reviewsCount={618}
      heroImage={[
        '/camping-hero.jpg',
        '/camping-1.jpg',
        '/camping-2.jpg',
        '/camping-3.jpg',
        '/camping-4.jpg'
      ]}
      tagline="Unwind under the stars in clean Swiss tents by the river."
      description="Immerse yourself in nature at our luxury riverside campsite in Shivpuri. Wake up to the sound of flowing water and the chirping of birds. The camping package includes overnight accommodation in clean, spacious Swiss tents with attached washrooms, delicious buffet meals, bonfire evenings, and adventure activities like volleyball and hiking."
      highlights={[
        { label: 'Stay Duration', value: '1 Night / 2 Days' },
        { label: 'Tent Type', value: 'Swiss Luxury Tent' },
        { label: 'Location', value: 'Shivpuri Riverbank' }
      ]}
      inclusions={[
        'Swiss tent accommodation with attached modern bathrooms',
        'Welcome drinks & snacks upon arrival',
        'All Meals: Buffet Dinner, Morning Breakfast & Evening Snacks',
        'Bonfire, light music, and volleyball/hiking games'
      ]}
      exclusions={[
        'Locker facilities (Available at checkout counter)',
        'Private transport to the campsite from town center',
        'Personal toiletry items'
      ]}
      eligibility={[
        'All ages allowed (Children under 5 years free)',
        'Ideal for groups, friends, couples, and families'
      ]}
      notSuitableFor={[
        'No major medical restrictions',
        'Wheelchair users (due to natural steps leading down to riverbed)'
      ]}
      location="Shivpuri Riverside Campsite, Rishikesh"
      cancellation="100% refund up to 48 hours prior to arrival"
      openBookingModal={openBookingModal}
    />
  );
}
