import { describe, it, expect, beforeEach } from 'vitest';
import { ticketReducer, selectTickets, selectTotal, addTicket, removeTicket } from '../../../store/ticketSlice';
import { configureStore } from '@reduxjs/toolkit';

describe('Ticket Slice', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        tickets: ticketReducer
      }
    });
  });
  
  it('should have an empty initial state', () => {
    const state = store.getState().tickets;
    
    expect(state.items).toEqual([]);
    expect(state.total).toBe(0);
  });
  
  it('should add a ticket to the cart', () => {
    // Initial state should be empty
    expect(selectTickets(store.getState())).toEqual([]);
    
    const ticket = {
      id: 'ticket-1',
      seat: 'A-1',
      section: 'Premium',
      price: 100,
      eventId: 'event-1'
    };
    
    // Dispatch action to add ticket
    store.dispatch(addTicket(ticket));
    
    // Check updated state
    expect(selectTickets(store.getState())).toEqual([ticket]);
    expect(selectTotal(store.getState())).toBe(100);
  });
  
  it('should remove a ticket from the cart', () => {
    // Add two tickets
    const ticket1 = {
      id: 'ticket-1',
      seat: 'A-1',
      section: 'Premium',
      price: 100,
      eventId: 'event-1'
    };
    
    const ticket2 = {
      id: 'ticket-2',
      seat: 'A-2',
      section: 'Premium',
      price: 100,
      eventId: 'event-1'
    };
    
    store.dispatch(addTicket(ticket1));
    store.dispatch(addTicket(ticket2));
    
    // Verify both tickets are in the cart
    expect(selectTickets(store.getState())).toHaveLength(2);
    expect(selectTotal(store.getState())).toBe(200);
    
    // Remove one ticket
    store.dispatch(removeTicket('ticket-1'));
    
    // Verify state after removal
    expect(selectTickets(store.getState())).toHaveLength(1);
    expect(selectTickets(store.getState())[0].id).toBe('ticket-2');
    expect(selectTotal(store.getState())).toBe(100);
  });
  
  it('should not add duplicate tickets', () => {
    const ticket = {
      id: 'ticket-1',
      seat: 'A-1',
      section: 'Premium',
      price: 100,
      eventId: 'event-1'
    };
    
    // Add the same ticket twice
    store.dispatch(addTicket(ticket));
    store.dispatch(addTicket(ticket));
    
    // Should only have one ticket in the cart
    expect(selectTickets(store.getState())).toHaveLength(1);
    expect(selectTotal(store.getState())).toBe(100);
  });
  
  it('should clear all tickets', () => {
    // Add multiple tickets
    const tickets = [
      {
        id: 'ticket-1',
        seat: 'A-1',
        section: 'Premium',
        price: 100,
        eventId: 'event-1'
      },
      {
        id: 'ticket-2',
        seat: 'A-2',
        section: 'Premium',
        price: 100,
        eventId: 'event-1'
      }
    ];
    
    tickets.forEach(ticket => store.dispatch(addTicket(ticket)));
    
    // Verify tickets were added
    expect(selectTickets(store.getState())).toHaveLength(2);
    
    // Clear all tickets
    store.dispatch({ type: 'tickets/clearTickets' });
    
    // Verify all tickets were removed
    expect(selectTickets(store.getState())).toHaveLength(0);
    expect(selectTotal(store.getState())).toBe(0);
  });
  
  it('should calculate total price correctly with different prices', () => {
    // Add tickets with different prices
    const tickets = [
      {
        id: 'ticket-1',
        seat: 'A-1',
        section: 'Premium',
        price: 200,
        eventId: 'event-1'
      },
      {
        id: 'ticket-2',
        seat: 'B-1',
        section: 'Regular',
        price: 100,
        eventId: 'event-1'
      },
      {
        id: 'ticket-3',
        seat: 'C-1',
        section: 'Economy',
        price: 50,
        eventId: 'event-1'
      }
    ];
    
    tickets.forEach(ticket => store.dispatch(addTicket(ticket)));
    
    // Verify total price
    expect(selectTotal(store.getState())).toBe(350);
  });
}); 