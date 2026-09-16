import React from 'react';
import logoImg from '../assets/logo-n-personal-fit.jpg';

export default function LogoN({ className = "w-9 h-9" }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-black border border-[#39FF14]/40 shadow-md ${className}`}>
      <img 
        src={logoImg} 
        alt="N Personal Fit Life Logo" 
        className="w-full h-full object-cover" 
      />
    </div>
  );
}

