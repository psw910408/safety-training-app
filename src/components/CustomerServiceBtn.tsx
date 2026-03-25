'use client';

import { useState } from 'react';

export default function CustomerServiceBtn() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#004494',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'scale(0.95)' : 'scale(1)'
        }}
        aria-label="고객센터"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '24px',
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: '280px',
          border: '1px solid #e0e4e8',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#111', fontWeight: '800', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>
            🎧 고객센터
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '1rem', color: '#333', marginBottom: '8px' }}>
              <span style={{ color: '#004494', fontWeight: '700', marginRight: '8px' }}>개발자:</span> 
              <span style={{ fontWeight: '500' }}>박상우 AI Pro</span>
            </p>
            <p style={{ fontSize: '1.2rem', color: '#111', fontWeight: '800', letterSpacing: '0.5px' }}>
              📞 010-3809-4753
            </p>
          </div>
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '12px', 
            borderRadius: '8px',
            borderLeft: '4px solid #004494'
          }}>
            <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5', fontWeight: '500' }}>
              💡 건의사항 또는 불편사항<br/>문의 바랍니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
