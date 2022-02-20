import React from 'react';

type RippleDotProps = {
  size: number;
  color: string;
}

export const RippleDot: React.FC<RippleDotProps> = ({ size, color }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{
      margin: 'auto',
      background: 'transparent',
      display: 'block',
      shapeRendering: 'auto'
    }} width={size} height={size} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
      <circle cx="50" cy="50" r="0" fill="none" stroke={color} strokeWidth={size/2}>
        <animate attributeName="r" repeatCount="indefinite" dur="2.941176470588235s" values="0;40" keyTimes="0;1" keySplines="0 0.2 0.8 1" calcMode="spline" begin="0s"></animate>
        <animate attributeName="opacity" repeatCount="indefinite" dur="2.941176470588235s" values="1;0" keyTimes="0;1" keySplines="0.2 0 0.8 1" calcMode="spline" begin="0s"></animate>
      </circle>
      <circle cx="50" cy="50" r="0" fill="none" stroke={color} strokeWidth={size/2}>
        <animate attributeName="r" repeatCount="indefinite" dur="2.941176470588235s" values="0;40" keyTimes="0;1" keySplines="0 0.2 0.8 1" calcMode="spline" begin="-1.4705882352941175s"></animate>
        <animate attributeName="opacity" repeatCount="indefinite" dur="2.941176470588235s" values="1;0" keyTimes="0;1" keySplines="0.2 0 0.8 1" calcMode="spline" begin="-1.4705882352941175s"></animate>
      </circle>
    </svg>
  );
}