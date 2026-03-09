import React from 'react';

export default function Arrow({ width = 2, height = 30, color = 'black' }) {
  return (
    <div style={{
      width, height, background: color, position: 'relative', margin: '0 auto'
    }}>
      <div style={{
        position: 'absolute', bottom: -5, left: -(10 - width) / 2,
        width: 0, height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: `5px solid ${color}`
      }}></div>
    </div>
  );
}
