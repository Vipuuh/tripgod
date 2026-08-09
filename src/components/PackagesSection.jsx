import React from 'react';
import CustomPackageBuilder from './CustomPackageBuilder';

export default function PackagesSection({ onBookPackage }) {
  return (
    <div className="bg-gradient-to-b from-white via-slate-50/50 to-white border-y border-slate-100">
      <CustomPackageBuilder onBookCustomCombo={onBookPackage} />
    </div>
  );
}
