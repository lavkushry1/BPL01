import React from 'react';

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  availableQuantity: number;
  maxPerOrder?: number;
}

export interface SelectedTicket {
  id: string;
  quantity: number;
}

interface TicketSelectorProps {
  ticketTypes: TicketType[];
  selectedTickets: SelectedTicket[];
  onTicketChange: (ticketId: string, quantity: number) => void;
}

export const TicketSelector: React.FC<TicketSelectorProps> = ({
  ticketTypes,
  selectedTickets,
  onTicketChange,
}) => {
  const formatCurrency = (price: number, currency?: string) => {
    const currencyCode = currency || 'INR';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  };

  const getSelectedQuantity = (ticketId: string): number => {
    const selectedTicket = selectedTickets.find(ticket => ticket.id === ticketId);
    return selectedTicket ? selectedTicket.quantity : 0;
  };

  return (
    <div>
      <h3 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        marginBottom: 'var(--spacing-4)',
      }}>
        Select Tickets
      </h3>
      
      <div>
        {ticketTypes.map((ticket) => {
          const selectedQuantity = getSelectedQuantity(ticket.id);
          const isAvailable = ticket.availableQuantity > 0;
          const maxAllowed = ticket.maxPerOrder || ticket.availableQuantity;
          
          return (
            <div 
              key={ticket.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--color-neutral-200)',
                backgroundColor: isAvailable ? 'var(--color-neutral-white)' : 'var(--color-neutral-100)',
                marginBottom: 'var(--spacing-3)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ flex: 1 }}>
                <h4 style={{
                  margin: 0,
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: isAvailable ? 'var(--color-neutral-900)' : 'var(--color-neutral-500)',
                }}>
                  {ticket.name}
                </h4>
                
                {ticket.description && (
                  <p style={{
                    margin: '0.25rem 0 0',
                    fontSize: 'var(--font-size-sm)',
                    color: isAvailable ? 'var(--color-neutral-600)' : 'var(--color-neutral-500)',
                  }}>
                    {ticket.description}
                  </p>
                )}
                
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  color: isAvailable ? 'var(--color-neutral-700)' : 'var(--color-neutral-500)',
                  marginTop: 'var(--spacing-1)',
                }}>
                  {isAvailable ? (
                    <span key="available">Available: {ticket.availableQuantity}</span>
                  ) : (
                    <span key="sold-out">Sold Out</span>
                  )}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
              }}>
                <div style={{
                  fontWeight: 'var(--font-weight-medium)',
                  color: isAvailable ? 'var(--color-neutral-900)' : 'var(--color-neutral-500)',
                }}>
                  {formatCurrency(ticket.price, ticket.currency)}
                </div>
                
                {isAvailable ? (
                  <div key="quantity-selector" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)',
                  }}>
                    <button
                      onClick={() => onTicketChange(ticket.id, Math.max(0, selectedQuantity - 1))}
                      disabled={selectedQuantity <= 0}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--border-radius-full)',
                        border: '1px solid var(--color-neutral-300)',
                        backgroundColor: selectedQuantity <= 0 ? 'var(--color-neutral-100)' : 'var(--color-neutral-white)',
                        color: selectedQuantity <= 0 ? 'var(--color-neutral-400)' : 'var(--color-neutral-900)',
                        fontSize: 'var(--font-size-md)',
                        fontWeight: 'var(--font-weight-medium)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: selectedQuantity <= 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      -
                    </button>
                    
                    <span style={{
                      width: '32px',
                      textAlign: 'center',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-md)',
                    }}>
                      {selectedQuantity}
                    </span>
                    
                    <button
                      onClick={() => onTicketChange(ticket.id, Math.min(maxAllowed, selectedQuantity + 1))}
                      disabled={selectedQuantity >= maxAllowed}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--border-radius-full)',
                        border: '1px solid var(--color-neutral-300)',
                        backgroundColor: selectedQuantity >= maxAllowed ? 'var(--color-neutral-100)' : 'var(--color-neutral-white)',
                        color: selectedQuantity >= maxAllowed ? 'var(--color-neutral-400)' : 'var(--color-neutral-900)',
                        fontSize: 'var(--font-size-md)',
                        fontWeight: 'var(--font-weight-medium)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: selectedQuantity >= maxAllowed ? 'not-allowed' : 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    key="sold-out-button"
                    disabled
                    style={{
                      padding: 'var(--spacing-1) var(--spacing-3)',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1px solid var(--color-neutral-300)',
                      backgroundColor: 'var(--color-neutral-100)',
                      color: 'var(--color-neutral-400)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      cursor: 'not-allowed',
                    }}
                  >
                    Sold Out
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        {ticketTypes.length === 0 && (
          <div key="no-tickets" style={{
            padding: 'var(--spacing-4)',
            textAlign: 'center',
            color: 'var(--color-neutral-500)',
            border: '1px dashed var(--color-neutral-300)',
            borderRadius: 'var(--border-radius-md)',
          }}>
            No tickets available for this event
          </div>
        )}
      </div>
    </div>
  );
}; 