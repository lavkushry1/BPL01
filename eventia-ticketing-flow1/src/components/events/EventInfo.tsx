import React, { useState } from 'react';

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface Organizer {
  id: string;
  name: string;
  description: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  speaker?: string;
}

interface EventInfoProps {
  description: string;
  startDate: string;
  endDate: string;
  venue: Venue;
  organizer: Organizer;
  schedule: ScheduleItem[];
}

export const EventInfo: React.FC<EventInfoProps> = ({
  description,
  startDate,
  endDate,
  venue,
  organizer,
  schedule
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'schedule' | 'venue' | 'organizer'>('details');
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div style={{ 
      border: '1px solid var(--color-neutral-200)',
      borderRadius: 'var(--border-radius-lg)',
      overflow: 'hidden'
    }}>
      <div style={{ 
        display: 'flex',
        borderBottom: '1px solid var(--color-neutral-200)'
      }}>
        <TabButton 
          active={activeTab === 'details'} 
          onClick={() => setActiveTab('details')}
        >
          Details
        </TabButton>
        <TabButton 
          active={activeTab === 'schedule'} 
          onClick={() => setActiveTab('schedule')}
        >
          Schedule
        </TabButton>
        <TabButton 
          active={activeTab === 'venue'} 
          onClick={() => setActiveTab('venue')}
        >
          Venue
        </TabButton>
        <TabButton 
          active={activeTab === 'organizer'} 
          onClick={() => setActiveTab('organizer')}
        >
          Organizer
        </TabButton>
      </div>
      
      <div style={{ padding: 'var(--spacing-4)' }}>
        {activeTab === 'details' && (
          <div>
            <h3 style={{ marginTop: 0 }}>About this event</h3>
            <p>{description}</p>
            
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              margin: 'var(--spacing-4) 0'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 9H21" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 13H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 17H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div>
                <div style={{ fontWeight: 'var(--font-weight-medium)' }}>Date and time</div>
                <div>{formatDateTime(startDate)} - {formatTime(endDate)}</div>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              margin: 'var(--spacing-4) 0'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M19 10C19 14.9706 12 21 12 21C12 21 5 14.9706 5 10C5 6.13401 8.13401 3 12 3C15.866 3 19 6.13401 19 10Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <div>
                <div style={{ fontWeight: 'var(--font-weight-medium)' }}>Location</div>
                <div>{venue.name}</div>
                <div>{venue.address}, {venue.city}, {venue.state} {venue.zipCode}</div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'schedule' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Event Schedule</h3>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-4)'
            }}>
              {schedule.map((item) => (
                <div 
                  key={item.id}
                  style={{ 
                    borderLeft: '3px solid var(--color-primary-600)',
                    paddingLeft: 'var(--spacing-3)',
                  }}
                >
                  <div style={{ 
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-neutral-500)',
                    marginBottom: 'var(--spacing-1)'
                  }}>
                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </div>
                  <div style={{ 
                    fontWeight: 'var(--font-weight-medium)',
                    fontSize: 'var(--font-size-lg)',
                    marginBottom: 'var(--spacing-1)'
                  }}>
                    {item.title}
                  </div>
                  {item.speaker && (
                    <div style={{ 
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-neutral-500)',
                      marginBottom: 'var(--spacing-1)'
                    }}>
                      Speaker: {item.speaker}
                    </div>
                  )}
                  <div>{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'venue' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Venue Information</h3>
            <h4>{venue.name}</h4>
            <p>
              {venue.address}<br />
              {venue.city}, {venue.state} {venue.zipCode}<br />
              {venue.country}
            </p>
            
            {venue.latitude && venue.longitude && (
              <div style={{ 
                height: '300px',
                backgroundColor: 'var(--color-neutral-100)',
                borderRadius: 'var(--border-radius-md)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 'var(--spacing-4)'
              }}>
                <p>Map will be displayed here using venue coordinates<br />
                Latitude: {venue.latitude}<br />
                Longitude: {venue.longitude}</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'organizer' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Organizer Information</h3>
            <div style={{ 
              display: 'flex',
              gap: 'var(--spacing-4)',
              alignItems: 'flex-start'
            }}>
              {organizer.logo && (
                <img
                  src={organizer.logo}
                  alt={`${organizer.name} logo`}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: 'var(--border-radius-md)'
                  }}
                />
              )}
              <div>
                <h4 style={{ marginTop: 0 }}>{organizer.name}</h4>
                <p>{organizer.description}</p>
                {organizer.website && (
                  <div>
                    <a 
                      href={organizer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: 'var(--color-primary-600)',
                        textDecoration: 'none'
                      }}
                    >
                      Visit Website
                    </a>
                  </div>
                )}
                {organizer.email && (
                  <div>
                    <a 
                      href={`mailto:${organizer.email}`}
                      style={{ 
                        color: 'var(--color-primary-600)',
                        textDecoration: 'none'
                      }}
                    >
                      Contact via Email
                    </a>
                  </div>
                )}
                {organizer.phone && (
                  <div>
                    <a 
                      href={`tel:${organizer.phone}`}
                      style={{ 
                        color: 'var(--color-primary-600)',
                        textDecoration: 'none'
                      }}
                    >
                      Call: {organizer.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: 'var(--spacing-3)',
        background: active ? 'var(--color-neutral-50)' : 'transparent',
        border: 'none',
        borderBottom: active 
          ? '2px solid var(--color-primary-600)' 
          : '2px solid transparent',
        color: active 
          ? 'var(--color-primary-600)' 
          : 'var(--color-neutral-600)',
        fontWeight: active 
          ? 'var(--font-weight-medium)' 
          : 'var(--font-weight-regular)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}; 