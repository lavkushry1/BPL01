import React, { useState } from 'react';

interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  available: number;
}

interface TicketSelectionProps {
  tickets: TicketType[];
  onAddToCart: (selectedTickets: { [ticketId: string]: number }) => void;
}

export const TicketSelection: React.FC<TicketSelectionProps> = ({
  tickets,
  onAddToCart
}) => {
  const [selectedTickets, setSelectedTickets] = useState<{ [ticketId: string]: number }>({});
  
  const handleQuantityChange = (ticketId: string, change: number) => {
    setSelectedTickets(prev => {
      const currentValue = prev[ticketId] || 0;
      const newValue = Math.max(0, currentValue + change);
      
      if (newValue === 0) {
        const { [ticketId]: _, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [ticketId]: newValue
      };
    });
  };
  
  const totalSelected = Object.values(selectedTickets).reduce((sum, quantity) => sum + quantity, 0);
  const totalPrice = tickets.reduce((sum, ticket) => {
    return sum + (ticket.price * (selectedTickets[ticket.id] || 0));
  }, 0);
  
  return (
    <div style={{
      backgroundColor: 'var(--color-neutral-white)',
      borderRadius: 'var(--border-radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      marginTop: 'var(--spacing-5)',
      marginBottom: 'var(--spacing-5)'
    }}>
      <div style={{
        padding: 'var(--spacing-4)',
        borderBottom: '1px solid var(--color-neutral-200)',
        backgroundColor: 'var(--color-neutral-50)'
      }}>
        <h3 style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-neutral-900)'
        }}>
          Select Tickets
        </h3>
      </div>
      
      <div>
        {tickets.map(ticket => (
          <div 
            key={ticket.id}
            style={{
              padding: 'var(--spacing-4)',
              borderBottom: '1px solid var(--color-neutral-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ flex: 1 }}>
              <h4 style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-neutral-900)',
                marginBottom: 'var(--spacing-1)'
              }}>
                {ticket.name}
              </h4>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-neutral-600)',
                marginBottom: 'var(--spacing-2)'
              }}>
                {ticket.description}
              </p>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-neutral-500)'
              }}>
                {ticket.available} tickets available
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 'var(--spacing-2)'
            }}>
              <div style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-primary-700)'
              }}>
                ₹{ticket.price.toLocaleString()}
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)'
              }}>
                <button
                  onClick={() => handleQuantityChange(ticket.id, -1)}
                  disabled={!selectedTickets[ticket.id]}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--border-radius-full)',
                    border: '1px solid var(--color-neutral-300)',
                    backgroundColor: !selectedTickets[ticket.id] ? 'var(--color-neutral-100)' : 'var(--color-neutral-white)',
                    color: !selectedTickets[ticket.id] ? 'var(--color-neutral-400)' : 'var(--color-neutral-700)',
                    cursor: !selectedTickets[ticket.id] ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-lg)'
                  }}
                >
                  -
                </button>
                
                <span style={{
                  width: '32px',
                  textAlign: 'center',
                  fontSize: 'var(--font-size-md)',
                  color: 'var(--color-neutral-900)'
                }}>
                  {selectedTickets[ticket.id] || 0}
                </span>
                
                <button
                  onClick={() => handleQuantityChange(ticket.id, 1)}
                  disabled={selectedTickets[ticket.id] >= ticket.available}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--border-radius-full)',
                    border: '1px solid var(--color-neutral-300)',
                    backgroundColor: selectedTickets[ticket.id] >= ticket.available ? 'var(--color-neutral-100)' : 'var(--color-neutral-white)',
                    color: selectedTickets[ticket.id] >= ticket.available ? 'var(--color-neutral-400)' : 'var(--color-neutral-700)',
                    cursor: selectedTickets[ticket.id] >= ticket.available ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-lg)'
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {totalSelected > 0 && (
        <div style={{
          padding: 'var(--spacing-4)',
          backgroundColor: 'var(--color-neutral-50)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-3)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-neutral-700)'
            }}>
              Total ({totalSelected} {totalSelected === 1 ? 'ticket' : 'tickets'})
            </div>
            <div style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-primary-700)'
            }}>
              ₹{totalPrice.toLocaleString()}
            </div>
          </div>
          
          <button 
            onClick={() => onAddToCart(selectedTickets)}
            style={{
              backgroundColor: 'var(--color-primary-600)',
              color: 'var(--color-neutral-white)',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-3) var(--spacing-4)',
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              width: '100%'
            }}
          >
            Continue to Checkout
          </button>
        </div>
      )}
    </div>
  );
}; 