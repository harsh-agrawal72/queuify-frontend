import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = '', textClass = 'text-xl text-gray-900', iconSize = 'w-8 h-8', showText = true }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`${iconSize} relative flex items-center justify-center shrink-0`}>
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                    <defs>
                        <linearGradient id="q-gradient-1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
                            <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
                        </linearGradient>
                        <linearGradient id="q-gradient-2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#2563eb" /> {/* Darker Blue */}
                            <stop offset="100%" stopColor="#1e3a8a" /> {/* Deep Blue */}
                        </linearGradient>
                        <clipPath id="circle-cut">
                            <path d="M 0 0 h 100 v 100 h -100 Z" />
                        </clipPath>
                    </defs>
                    
                    {/* The main circular arc of the Q */}
                    <path 
                        d="M 50 15 A 35 35 0 1 0 81 67 A 35 35 0 0 0 50 15 Z" 
                        fill="none" 
                        stroke="url(#q-gradient-1)" 
                        strokeWidth="20" 
                        strokeLinecap="round"
                    />
                    
                    {/* The tail of the Q */}
                    <path 
                        d="M 60 60 L 95 95" 
                        stroke="url(#q-gradient-2)" 
                        strokeWidth="22" 
                        strokeLinecap="square"
                    />
                    
                    {/* A masking piece if we wanted to make the tail cut through the circle, 
                        but standard overlapping stroke looks similar to the image */}
                </svg>
            </div>
            {showText && (
                <span className={`font-bold tracking-tight ${textClass}`}>
                    Queuify
                </span>
            )}
        </div>
    );
};

export default Logo;
