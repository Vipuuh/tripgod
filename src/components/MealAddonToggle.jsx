import React from 'react';

export default function MealAddonToggle({ label, pricePerPerson, selected, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={selected}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        id={`meal-${label.toLowerCase().replace(/\s+/g, '-')}`}
      />
      <label htmlFor={`meal-${label.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-medium text-gray-700">
        {label} {pricePerPerson > 0 ? `(+₹${pricePerPerson}/person)` : '(Free)'}
      </label>
    </div>
  );
}
