import React from 'react';

export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  availableQuantity: number;
  maxPerOrder: number;
}

interface TicketSelectorProps {
  tickets: TicketType[];
  selectedTickets: Record<string, number>;
  onTicketQuantityChange: (ticketId: string, quantity: number) => void;
  isLoading?: boolean;
}

export const TicketSelector: React.FC<TicketSelectorProps> = ({
  tickets,
  selectedTickets,
  onTicketQuantityChange,
  isLoading = false
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-6)',
        border: '1px solid var(--color-gray-200)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-6)' }}>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            border: '3px solid var(--color-gray-200)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-6)',
        border: '1px solid var(--color-gray-200)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <p style={{ textAlign: 'center', color: 'var(--color-gray-500)' }}>
          No tickets available for this event.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: 'var(--border-radius-lg)',
      padding: 'var(--spacing-6)',
      border: '1px solid var(--color-gray-200)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <h2 style={{ 
        fontSize: 'var(--font-size-xl)', 
        marginTop: 0,
        marginBottom: 'var(--spacing-4)',
      }}>
        Tickets
      </h2>

      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
      }}>
        {tickets.map((ticket) => (
          <div 
            key={ticket.id}
            style={{
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ 
                fontSize: 'var(--font-size-md)', 
                marginTop: 0,
                marginBottom: 'var(--spacing-1)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                {ticket.name}
              </h3>
              <p style={{ 
                margin: '0 0 var(--spacing-2) 0',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-gray-600)',
              }}>
                {ticket.description}
              </p>
              <div style={{ 
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-gray-900)',
              }}>
                {formatCurrency(ticket.price)}
              </div>
              {ticket.availableQuantity <= 10 && (
                <div style={{ 
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-warning)',
                  marginTop: 'var(--spacing-1)',
                }}>
                  Only {ticket.availableQuantity} left!
                </div>
              )}
            </div>
            
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
            }}>
              <button
                onClick={() => {
                  const currentQuantity = selectedTickets[ticket.id] || 0;
                  if (currentQuantity > 0) {
                    onTicketQuantityChange(ticket.id, currentQuantity - 1);
                  }
                }}
                disabled={!selectedTickets[ticket.id]}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--border-radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-gray-300)',
                  backgroundColor: 'white',
                  cursor: selectedTickets[ticket.id] ? 'pointer' : 'not-allowed',
                  opacity: selectedTickets[ticket.id] ? 1 : 0.5,
                }}
              >
                -
              </button>
              
              <div style={{ 
                width: '40px',
                textAlign: 'center', 
                fontSize: 'var(--font-size-md)',
              }}>
                {selectedTickets[ticket.id] || 0}
              </div>
              
              <button
                onClick={() => {
                  const currentQuantity = selectedTickets[ticket.id] || 0;
                  const maxAllowed = Math.min(ticket.availableQuantity, ticket.maxPerOrder);
                  if (currentQuantity < maxAllowed) {
                    onTicketQuantityChange(ticket.id, currentQuantity + 1);
                  }
                }}
                disabled={
                  (selectedTickets[ticket.id] || 0) >= Math.min(ticket.availableQuantity, ticket.maxPerOrder)
                }
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--border-radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-gray-300)',
                  backgroundColor: 'white',
                  cursor: (selectedTickets[ticket.id] || 0) < Math.min(ticket.availableQuantity, ticket.maxPerOrder) 
                    ? 'pointer' 
                    : 'not-allowed',
                  opacity: (selectedTickets[ticket.id] || 0) < Math.min(ticket.availableQuantity, ticket.maxPerOrder) 
                    ? 1 
                    : 0.5,
                }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {Object.values(selectedTickets).some(quantity => quantity > 0) && (
        <div style={{
          marginTop: 'var(--spacing-4)',
          padding: 'var(--spacing-4)',
          borderTop: '1px solid var(--color-gray-200)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: 'var(--spacing-1)',
          }}>
            <span>Selected Tickets:</span>
            <span>
              {Object.values(selectedTickets).reduce((sum, quantity) => sum + quantity, 0)}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: 'var(--spacing-4)',
          }}>
            <span>Total:</span>
            <span>
              {formatCurrency(
                tickets.reduce((sum, ticket) => {
                  const quantity = selectedTickets[ticket.id] || 0;
                  return sum + (ticket.price * quantity);
                }, 0)
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}; 