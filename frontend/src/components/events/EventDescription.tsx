import React, { useState } from 'react';

interface EventDescriptionProps {
  description: string;
  venueInfo?: string;
  schedule?: { time: string; title: string; description?: string }[];
  isLoading?: boolean;
}

export const EventDescription: React.FC<EventDescriptionProps> = ({
  description,
  venueInfo,
  schedule,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'description' | 'venue' | 'schedule'>('description');
  
  if (isLoading) {
    return (
      <div style={{
        backgroundColor: 'var(--color-neutral-white)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-6)'
      }}>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-2)',
          marginBottom: 'var(--spacing-4)',
        }}>
          {['Tab 1', 'Tab 2', 'Tab 3'].map((_, i) => (
            <div key={i} style={{
              width: '100px',
              height: '36px',
              backgroundColor: 'var(--color-neutral-200)',
              borderRadius: 'var(--border-radius-md)'
            }}></div>
          ))}
        </div>
        <div style={{
          height: '200px',
          backgroundColor: 'var(--color-neutral-100)',
          borderRadius: 'var(--border-radius-md)'
        }}></div>
      </div>
    );
  }
  
  return (
    <div style={{
      backgroundColor: 'var(--color-neutral-white)',
      borderRadius: 'var(--border-radius-lg)',
      padding: 'var(--spacing-4)',
      marginBottom: 'var(--spacing-6)'
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-neutral-200)',
        marginBottom: 'var(--spacing-4)',
      }}>
        <TabButton 
          isActive={activeTab === 'description'} 
          onClick={() => setActiveTab('description')}
        >
          Description
        </TabButton>
        
        {venueInfo && (
          <TabButton 
            isActive={activeTab === 'venue'} 
            onClick={() => setActiveTab('venue')}
          >
            Venue Info
          </TabButton>
        )}
        
        {schedule && schedule.length > 0 && (
          <TabButton 
            isActive={activeTab === 'schedule'} 
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </TabButton>
        )}
      </div>
      
      {/* Tab Content */}
      <div style={{
        minHeight: '150px'
      }}>
        {activeTab === 'description' && (
          <div style={{
            whiteSpace: 'pre-line',
            lineHeight: 'var(--line-height-relaxed)',
            color: 'var(--color-neutral-700)'
          }}>
            {description}
          </div>
        )}
        
        {activeTab === 'venue' && venueInfo && (
          <div style={{
            lineHeight: 'var(--line-height-relaxed)',
            color: 'var(--color-neutral-700)'
          }}>
            {venueInfo}
          </div>
        )}
        
        {activeTab === 'schedule' && schedule && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)'
          }}>
            {schedule.map((item, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  borderLeft: '2px solid var(--color-primary-500)',
                  paddingLeft: 'var(--spacing-4)'
                }}
              >
                <div style={{
                  minWidth: '80px',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-primary-700)'
                }}>
                  {item.time}
                </div>
                <div>
                  <h4 style={{
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: 'var(--spacing-1)',
                    color: 'var(--color-neutral-800)'
                  }}>
                    {item.title}
                  </h4>
                  {item.description && (
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-neutral-600)'
                    }}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for tab buttons
const TabButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: 'var(--spacing-3) var(--spacing-4)',
      fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
      color: isActive ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
      borderBottom: isActive ? '2px solid var(--color-primary-600)' : '2px solid transparent',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: 'var(--font-size-md)',
      transition: 'all 0.2s ease'
    }}
  >
    {children}
  </button>
); 