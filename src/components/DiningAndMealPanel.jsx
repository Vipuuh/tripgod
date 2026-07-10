import React from 'react';

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
    <div className="bg-slate-50 border border-slate-200/50 rounded-3xl p-5 space-y-3.5 text-left">
      <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider font-display">🍽️ Dining Options &amp; Meal Add‑ons</h3>

      {freeMealsList.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 p-3 rounded-2xl flex items-center gap-2 text-xs font-black">
          <span>✅</span>
          <span>Complimentary Free Meals Included: {freeMealsList.join(', ')}</span>
        </div>
      )}

      {paidMealsList.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Add meals per person / night to stay:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {paidMealsList.map((meal, idx) => {
              const isChecked = selectedMeals[meal.name];
              return (
                <label
                  key={idx}
                  className={`flex flex-col p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                    isChecked ? 'bg-[#FF5F00]/5 border-[#FF5F00] shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setSelectedMeals(prev => ({ ...prev, [meal.name]: e.target.checked }))}
                      className="rounded border-slate-350 text-[#FF5F00] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-black text-slate-800">{meal.label}</span>
                  </div>
                  <span className="text-[9.5px] font-extrabold text-slate-500 mt-1.5 ml-6">+ ₹{meal.price} / guest / night</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
