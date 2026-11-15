import React from 'react';

export default function ToggleSwitch({ checked, onChange, disabled = false, size = 'md' }) {
  const isSm = size === 'sm';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onChange) onChange(!checked);
      }}
      className={`relative inline-flex items-center rounded-full transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
        isSm ? 'w-8 h-4.5' : 'w-10 h-6'
      } ${
        checked ? 'bg-green-500' : 'bg-muted-foreground/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow-md transition-transform ${
          isSm ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'
        } ${
          checked
            ? isSm ? 'translate-x-4' : 'translate-x-4.5'
            : 'translate-x-1'
        }`}
      />
    </button>
  );
}
