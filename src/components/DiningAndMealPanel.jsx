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
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2v10l4.24 4.24"/>
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
      background: 'white',
      borderRadius: '1.5rem',
      padding: '1.25rem',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      textAlign: 'left'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #FF5F00, #ff8533)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(255,95,0,0.3)',
          flexShrink: 0
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1e293b', margin: 0 }}>
            Dining Options &amp; Meal Add-ons
          </h3>
          <p style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, margin: 0 }}>Curated meals for your stay</p>
        </div>
      </div>

      {/* Free Meals Badge */}
      {freeMealsList.length > 0 && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '0.875rem',
          padding: '0.625rem 0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: '#dcfce7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#15803d', letterSpacing: '0.02em' }}>
            Complimentary: <span style={{ color: '#16a34a' }}>{freeMealsList.join(' · ')}</span> included
          </span>
        </div>
      )}

      {/* Paid Meal Toggle Cards */}
      {paidMealsList.length > 0 && (
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Add per person / night
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${paidMealsList.length === 1 ? 1 : paidMealsList.length === 2 ? 2 : 3}, 1fr)`,
            gap: '0.625rem'
          }}>
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
                    border: isChecked ? '2px solid #FF5F00' : '1.5px solid #e2e8f0',
                    background: isChecked ? 'linear-gradient(135deg, #fff7f3, #fff3ee)' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isChecked ? '0 4px 16px rgba(255,95,0,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                    userSelect: 'none',
                    position: 'relative'
                  }}
                >
                  {/* Hidden native checkbox */}
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
                      background: isChecked ? 'rgba(255,95,0,0.12)' : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isChecked ? '#FF5F00' : '#94a3b8',
                      transition: 'all 0.2s ease'
                    }}>
                      {mealIcons[meal.name]}
                    </div>
                    <div style={{
                      width: 16, height: 16, borderRadius: 5,
                      border: isChecked ? '2px solid #FF5F00' : '2px solid #cbd5e1',
                      background: isChecked ? '#FF5F00' : 'white',
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

                  <span style={{ fontSize: 11, fontWeight: 900, color: isChecked ? '#1e293b' : '#475569', display: 'block', marginBottom: 2 }}>
                    {meal.label}
                  </span>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>
                    {mealTimes[meal.name]}
                  </span>
                  <span style={{
                    marginTop: 8, fontSize: 12, fontWeight: 900,
                    color: isChecked ? '#FF5F00' : '#64748b'
                  }}>
                    +₹{meal.price}
                    <span style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', marginLeft: 2 }}>/guest/night</span>
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
