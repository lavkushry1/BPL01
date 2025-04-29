export interface TicketType {
  category: string;
  price: number;
  available: number;
  capacity: number; // Total capacity for calculating availability percentage
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  duration: string;
  image: string;
  posterImage?: string;
  ticketTypes: TicketType[];
  featured?: boolean;  // Added optional featured flag
  discount?: {
    type: 'percent' | 'amount';
    value: number;
  };
}

// Update events with featured flags

export const events: Event[] = [
  {
    id: "evt1",
    title: "ICC T20 World Cup Final",
    description: "Experience the thrilling climax of the T20 World Cup as the top teams battle for the championship trophy.",
    date: "2025-06-15",
    time: "19:00",
    venue: "Narendra Modi Stadium, Ahmedabad",
    category: "Cricket",
    duration: "3-4 hours",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1605&q=80",
    posterImage: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1494&q=80",
    ticketTypes: [
      {
        category: "VIP Box",
        price: 15000,
        available: 10,
        capacity: 50
      },
      {
        category: "Premium Stand",
        price: 8000,
        available: 150,
        capacity: 500
      },
      {
        category: "General Stand",
        price: 3500,
        available: 2000,
        capacity: 5000
      }
    ],
    featured: true,
    discount: { type: 'percent', value: 10 }
  },
  {
    id: "evt2",
    title: "Coldplay World Tour",
    description: "Join Coldplay for an unforgettable night as they bring their Music of the Spheres World Tour to India.",
    date: "2025-06-28",
    time: "20:00",
    venue: "DY Patil Stadium, Mumbai",
    category: "Festival",
    duration: "2-3 hours",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    posterImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    ticketTypes: [
      {
        category: "Front Row",
        price: 12000,
        available: 5,
        capacity: 100
      },
      {
        category: "Gold Circle",
        price: 7500,
        available: 200,
        capacity: 1000
      },
      {
        category: "Silver Section",
        price: 4000,
        available: 1000,
        capacity: 3000
      }
    ],
    featured: true,
    discount: { type: 'amount', value: 500 }
  },
  {
    id: "evt3",
    title: "Web3 & AI Summit",
    description: "Connect with industry leaders, developers, and enthusiasts to explore the future of Web3 and AI technologies.",
    date: "2025-07-10",
    time: "09:00",
    venue: "Bangalore International Exhibition Centre",
    category: "Conference",
    duration: "2 days",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80",
    posterImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    ticketTypes: [
      {
        category: "VIP Access",
        price: 9000,
        available: 50,
        capacity: 100
      },
      {
        category: "Full Conference",
        price: 5000,
        available: 250,
        capacity: 500
      },
      {
        category: "Single Day",
        price: 3000,
        available: 400,
        capacity: 800
      }
    ],
    featured: true
  },
  {
    id: "evt4",
    title: "Holi Color Festival",
    description: "Celebrate the festival of colors with music, dance, and traditional festivities in a grand carnival atmosphere.",
    date: "2025-03-15",
    time: "10:00",
    venue: "Jawaharlal Nehru Stadium, Delhi",
    category: "Festival",
    duration: "8 hours",
    image: "https://images.unsplash.com/photo-1610809027249-86c649feacd5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    posterImage: "https://images.unsplash.com/photo-1668541621748-d6c5ad3242e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    ticketTypes: [
      {
        category: "Premium Experience",
        price: 4000,
        available: 100,
        capacity: 300
      },
      {
        category: "Standard Entry",
        price: 2000,
        available: 500,
        capacity: 1500
      },
      {
        category: "Group Pass (4 people)",
        price: 6000,
        available: 100,
        capacity: 200
      }
    ],
    featured: false
  },
  {
    id: "evt5",
    title: "AR Rahman Live in Concert",
    description: "Experience the musical genius of AR Rahman performing his greatest hits with a full orchestra.",
    date: "2025-05-22",
    time: "19:30",
    venue: "Indira Gandhi Arena, Delhi",
    category: "Festival",
    duration: "3 hours",
    image: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    posterImage: "https://images.unsplash.com/photo-1603186741833-4cfa8b8aa393?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80",
    ticketTypes: [
      {
        category: "VVIP",
        price: 10000,
        available: 30,
        capacity: 50
      },
      {
        category: "VIP",
        price: 7000,
        available: 150,
        capacity: 300
      },
      {
        category: "Gold",
        price: 5000,
        available: 300,
        capacity: 600
      },
      {
        category: "Silver",
        price: 3000,
        available: 500,
        capacity: 1000
      }
    ],
    featured: false
  },
  {
    id: "evt6",
    title: "Digital Marketing Masterclass",
    description: "Learn advanced digital marketing strategies from industry experts in this intensive workshop.",
    date: "2025-06-05",
    time: "10:00",
    venue: "Taj Lands End, Mumbai",
    category: "Workshop",
    duration: "6 hours",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    posterImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    ticketTypes: [
      {
        category: "Professional",
        price: 6000,
        available: 25,
        capacity: 50
      },
      {
        category: "Standard",
        price: 4000,
        available: 50,
        capacity: 100
      },
      {
        category: "Student",
        price: 2000,
        available: 25,
        capacity: 50
      }
    ],
    featured: true
  }
];
