import React from 'react';

interface EventHeaderProps {
  title: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  category: string;
}

export const EventHeader: React.FC<EventHeaderProps> = ({
  title,
  date,
  time,
  location,
  imageUrl,
  category
}) => {
  return (
    <div style={{
      borderRadius: 'var(--border-radius-xl)',
      overflow: 'hidden',
      backgroundColor: 'var(--color-neutral-100)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        overflow: 'hidden'
      }}>
        <img 
          src={imageUrl} 
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
          padding: 'var(--spacing-6)',
          color: 'var(--color-neutral-white)'
        }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'var(--color-primary-500)',
            color: 'var(--color-neutral-white)',
            padding: 'var(--spacing-1) var(--spacing-2)',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--spacing-2)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {category}
          </div>
          
          <h1 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--spacing-1)',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {title}
          </h1>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-4)',
            opacity: 0.9
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                <line x1="16" x2="16" y1="2" y2="6"></line>
                <line x1="8" x2="8" y1="2" y2="6"></line>
                <line x1="3" x2="21" y1="10" y2="10"></line>
              </svg>
              <span>{date}</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{time}</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 