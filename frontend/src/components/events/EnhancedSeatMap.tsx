import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export interface Seat {
  id: string;
  row: string;
  number: string;
  status: 'available' | 'reserved' | 'booked' | 'blocked' | 'selected';
  price: number;
  category: string;
  section_id?: string;
}

interface SeatSection {
  id: string;
  name: string;
  rows: SeatRow[];
}

interface SeatRow {
  name: string;
  seats: Seat[];
}

interface SeatMapData {
  venue_id: string;
  name: string;
  sections: SeatSection[];
}

interface EnhancedSeatMapProps {
  seatMap?: SeatMapData;
  selectedSeats: Seat[];
  onSeatSelect: (seats: Seat[]) => void;
  isLoading?: boolean;
}

export const EnhancedSeatMap: React.FC<EnhancedSeatMapProps> = ({
  seatMap,
  selectedSeats,
  onSeatSelect,
  isLoading = false
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Set the first section as active when seat map loads
  useEffect(() => {
    if (seatMap && seatMap.sections.length > 0 && !activeSection) {
      setActiveSection(seatMap.sections[0].id);
    }
  }, [seatMap]);
  
  const handleSeatClick = (seat: Seat) => {
    // Don't allow selecting unavailable seats
    if (seat.status === 'booked' || seat.status === 'reserved' || seat.status === 'blocked') {
      return;
    }
    
    // Check if seat is already selected
    const isSeatSelected = selectedSeats.some(s => s.id === seat.id);
    let updatedSeats: Seat[];
    
    if (isSeatSelected) {
      // Remove from selection
      updatedSeats = selectedSeats.filter(s => s.id !== seat.id);
    } else {
      // Add to selection
      updatedSeats = [...selectedSeats, { ...seat, status: 'selected' }];
    }
    
    onSeatSelect(updatedSeats);
  };
  
  // Get the active section data
  const activeSectionData = seatMap?.sections.find(section => section.id === activeSection);
  
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
          overflowX: 'auto',
          padding: 'var(--spacing-2)'
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              width: '100px',
              height: '36px',
              backgroundColor: 'var(--color-neutral-200)',
              borderRadius: 'var(--border-radius-md)',
              flexShrink: 0
            }}></div>
          ))}
        </div>
        <div style={{
          width: '100%',
          height: '250px',
          backgroundColor: 'var(--color-neutral-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--border-radius-md)'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: 'var(--color-neutral-300) transparent var(--color-neutral-300) transparent',
            borderRadius: '50%',
            animation: 'spin 1.5s linear infinite'
          }}></div>
          
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }
  
  if (!seatMap || !activeSectionData) {
    return (
      <div style={{
        backgroundColor: 'var(--color-neutral-white)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-6)',
        marginBottom: 'var(--spacing-6)',
        textAlign: 'center',
        color: 'var(--color-neutral-600)'
      }}>
        Seat map is not available for this event.
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
      <h3 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        marginBottom: 'var(--spacing-4)',
        color: 'var(--color-neutral-800)'
      }}>
        Select Seats
      </h3>
      
      {/* Section tabs */}
      {seatMap.sections.length > 1 && (
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-2)',
          overflowX: 'auto',
          paddingBottom: 'var(--spacing-2)',
          marginBottom: 'var(--spacing-4)'
        }}>
          {seatMap.sections.map(section => (
            <button
              key={section.id}
              style={{
                padding: 'var(--spacing-2) var(--spacing-4)',
                backgroundColor: section.id === activeSection 
                  ? 'var(--color-primary-600)' 
                  : 'var(--color-neutral-100)',
                color: section.id === activeSection 
                  ? 'var(--color-neutral-white)' 
                  : 'var(--color-neutral-700)',
                border: 'none',
                borderRadius: 'var(--border-radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
                flexShrink: 0
              }}
              onClick={() => setActiveSection(section.id)}
            >
              {section.name}
            </button>
          ))}
        </div>
      )}
      
      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-4)',
        flexWrap: 'wrap',
        marginBottom: 'var(--spacing-4)',
        padding: 'var(--spacing-2) var(--spacing-4)',
        backgroundColor: 'var(--color-neutral-50)',
        borderRadius: 'var(--border-radius-md)',
        fontSize: 'var(--font-size-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: 'var(--color-primary-500)',
            borderRadius: 'var(--border-radius-sm)'
          }}></div>
          <span>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: 'var(--color-secondary-500)',
            borderRadius: 'var(--border-radius-sm)'
          }}></div>
          <span>Selected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: 'var(--color-warning)',
            borderRadius: 'var(--border-radius-sm)'
          }}></div>
          <span>Reserved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: 'var(--color-neutral-400)',
            borderRadius: 'var(--border-radius-sm)'
          }}></div>
          <span>Unavailable</span>
        </div>
      </div>
      
      {/* Stage */}
      <div style={{
        width: '100%',
        textAlign: 'center',
        padding: 'var(--spacing-2)',
        backgroundColor: 'var(--color-neutral-200)',
        borderRadius: 'var(--border-radius-md)',
        marginBottom: 'var(--spacing-8)',
        color: 'var(--color-neutral-700)',
        fontWeight: 'var(--font-weight-medium)',
        fontSize: 'var(--font-size-sm)',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        Stage
      </div>
      
      {/* Seat map */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--spacing-1)',
        marginBottom: 'var(--spacing-6)',
        overflowX: 'auto',
        padding: 'var(--spacing-2)',
        maxWidth: '100%'
      }}>
        {activeSectionData.rows.map(row => (
          <div 
            key={row.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)'
            }}
          >
            <div style={{
              width: '20px',
              textAlign: 'center',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-neutral-600)'
            }}>
              {row.name}
            </div>
            
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-1)'
            }}>
              {row.seats.map(seat => {
                const isSelected = selectedSeats.some(s => s.id === seat.id);
                let backgroundColor;
                
                switch (seat.status) {
                  case 'available':
                    backgroundColor = 'var(--color-primary-500)';
                    break;
                  case 'booked':
                  case 'blocked':
                    backgroundColor = 'var(--color-neutral-400)';
                    break;
                  case 'reserved':
                    backgroundColor = 'var(--color-warning)';
                    break;
                  default:
                    backgroundColor = 'var(--color-primary-500)';
                }
                
                // Override if seat is selected
                if (isSelected) {
                  backgroundColor = 'var(--color-secondary-500)';
                }
                
                return (
                  <button
                    key={seat.id}
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor,
                      borderRadius: 'var(--border-radius-sm)',
                      border: 'none',
                      color: 'var(--color-neutral-white)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      cursor: seat.status === 'available' || isSelected ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.1s ease',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                    }}
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.status === 'booked' || seat.status === 'reserved' || seat.status === 'blocked'}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
            
            <div style={{
              width: '20px',
              textAlign: 'center',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-neutral-600)'
            }}>
              {row.name}
            </div>
          </div>
        ))}
      </div>
      
      {/* Selected seats summary */}
      {selectedSeats.length > 0 && (
        <div style={{
          backgroundColor: 'var(--color-primary-50)',
          borderRadius: 'var(--border-radius-md)',
          padding: 'var(--spacing-4)'
        }}>
          <h4 style={{
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-3)',
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-neutral-800)'
          }}>
            Selected Seats ({selectedSeats.length})
          </h4>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-2)',
            marginBottom: 'var(--spacing-3)'
          }}>
            {selectedSeats.map(seat => (
              <div 
                key={seat.id}
                style={{
                  backgroundColor: 'var(--color-neutral-white)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)'
                }}
              >
                <span style={{
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  {seat.row}-{seat.number}
                </span>
                <span style={{
                  color: 'var(--color-neutral-600)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  {seat.category}
                </span>
                <Button
                  variant="text"
                  onClick={() => handleSeatClick(seat)}
                  style={{
                    padding: 0,
                    height: 'auto',
                    minWidth: 'auto',
                    color: 'var(--color-error)'
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          
          <div style={{
            borderTop: '1px dashed var(--color-neutral-300)',
            paddingTop: 'var(--spacing-3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-size-lg)'
            }}>
              Total
            </div>
            <div style={{
              fontWeight: 'var(--font-weight-bold)',
              fontSize: 'var(--font-size-xl)',
              color: 'var(--color-primary-700)'
            }}>
              ₹{selectedSeats.reduce((sum, seat) => sum + seat.price, 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 