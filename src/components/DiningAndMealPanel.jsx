import React from 'react';

const mealIcons = {
  breakfast: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
      <line x1="6" x2="6" y1="2" y2="4"/>
      <line x1="10" x2="10" y1="2" y2="4"/>
      <line x1="14" x2="14" y1="2" y2="4"/>
    </svg>
  ),
  lunch: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12V2Z"/>
      <path d="M21.18 10A10 10 0 0 0 12 2v10Z"/>
    </svg>
  ),
  dinner: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  ),
};

const mealTimes = {
  breakfast: 'Morning',
  lunch: 'Afternoon',
  dinner: 'Evening',
};

/**
 * DiningAndMealPanel renders the dining options and meal add‑ons section.
 * Props:
 *   - selectedHotel: hotel object containing rules.meals
 *   - selectedMeals: state object for paid meals
 *   - setSelectedMeals: state setter
 */
export default function DiningAndMealPanel({ selectedHotel, selectedMeals, setSelectedMeals }) {
  const meals = selectedHotel.rules?.meals;
  const hasMeals = meals && (
    meals.breakfast?.status !== 'none' ||
    meals.lunch?.status !== 'none' ||
    meals.dinner?.status !== 'none'
  );
  if (!hasMeals) return null;

  const freeMealsList = [];
  if (meals.breakfast?.status === 'free') freeMealsList.push('Breakfast');
  if (meals.lunch?.status === 'free') freeMealsList.push('Lunch');
  if (meals.dinner?.status === 'free') freeMealsList.push('Dinner');

  const paidMealsList = [];
  if (meals.breakfast?.status === 'paid') paidMealsList.push({ name: 'breakfast', label: 'Breakfast', price: meals.breakfast.price || 150 });
  if (meals.lunch?.status === 'paid') paidMealsList.push({ name: 'lunch', label: 'Lunch', price: meals.lunch.price || 250 });
  if (meals.dinner?.status === 'paid') paidMealsList.push({ name: 'dinner', label: 'Dinner', price: meals.dinner.price || 300 });

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1a1035 50%, #0f172a 100%)',
      borderRadius: '1.5rem',
      padding: '1.25rem',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 4px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
      textAlign: 'left'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(124,58,237,0.5)',
          flexShrink: 0
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.92)', margin: 0 }}>
            Dining Options &amp; Meal Add-ons
          </h3>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, margin: 0 }}>Curated meals for your stay</p>
        </div>
      </div>

      {/* Free Meals Badge */}
      {freeMealsList.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.06))',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '0.875rem',
          padding: '0.625rem 0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: 'rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#6ee7b7', letterSpacing: '0.02em' }}>
            Complimentary: <span style={{ color: '#34d399' }}>{freeMealsList.join(' · ')}</span> included
          </span>
        </div>
      )}

      {/* Paid Meal Toggle Cards */}
      {paidMealsList.length > 0 && (
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Add per person / night
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${paidMealsList.length === 1 ? 1 : paidMealsList.length === 2 ? 2 : 3}, 1fr)`, gap: '0.625rem' }}>
            {paidMealsList.map((meal, idx) => {
              const isChecked = selectedMeals[meal.name];
              return (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.75rem',
                    borderRadius: '0.875rem',
                    border: isChecked ? '1.5px solid rgba(255,95,0,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
                    background: isChecked
                      ? 'linear-gradient(135deg, rgba(255,95,0,0.18), rgba(255,95,0,0.06))'
                      : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isChecked ? '0 0 16px rgba(255,95,0,0.2)' : 'none',
                    userSelect: 'none',
                    position: 'relative'
                  }}
                >
                  {/* Hidden checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setSelectedMeals(prev => ({ ...prev, [meal.name]: e.target.checked }))}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                  />

                  {/* Icon + custom checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 7,
                      background: isChecked ? 'rgba(255,95,0,0.25)' : 'rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isChecked ? '#FF5F00' : 'rgba(255,255,255,0.4)',
                      transition: 'all 0.2s ease'
                    }}>
                      {mealIcons[meal.name]}
                    </div>
                    <div style={{
                      width: 16, height: 16, borderRadius: 5,
                      border: isChecked ? '2px solid #FF5F00' : '2px solid rgba(255,255,255,0.2)',
                      background: isChecked ? '#FF5F00' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}>
                      {isChecked && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: 11, fontWeight: 900, color: isChecked ? 'white' : 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 2 }}>
                    {meal.label}
                  </span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>
                    {mealTimes[meal.name]}
                  </span>
                  <span style={{
                    marginTop: 8, fontSize: 11, fontWeight: 900,
                    color: isChecked ? '#FF5F00' : 'rgba(255,255,255,0.5)'
                  }}>
                    +₹{meal.price}
                    <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginLeft: 2 }}>/guest/night</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
