export interface IPLMatch {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  image: string;
  category: string;
  teams: {
    team1: {
      id: string;
      name: string;
      shortName: string;
      logo: string;
    };
    team2: {
      id: string;
      name: string;
      shortName: string;
      logo: string;
    };
  };
  ticketTypes: {
    category: string;
    price: number;
    available: number;
    capacity: number;
  }[];
}

export const iplMatches: IPLMatch[] = [
  {
    id: "ipl1",
    title: "IPL 2025: Opening Match",
    description: "The opening match of IPL 2025 featuring defending champions Mumbai Indians against Chennai Super Kings.",
    category: "IPL",
    teams: {
      team1: {
        id: "mi",
        name: "Mumbai Indians",
        shortName: "MI",
        logo: "/placeholder.svg"
      },
      team2: {
        id: "csk",
        name: "Chennai Super Kings",
        shortName: "CSK",
        logo: "/placeholder.svg"
      }
    },
    venue: "Wankhede Stadium, Mumbai",
    date: "2025-03-28",
    time: "19:30",
    ticketTypes: [
      {
        category: "General Stand",
        price: 1000,
        available: 1000,
        capacity: 5000
      },
      {
        category: "Premium Stand",
        price: 3000,
        available: 500,
        capacity: 2000
      },
      {
        category: "VIP Box",
        price: 8000,
        available: 100,
        capacity: 500
      }
    ],
    image: "/placeholder.svg"
  },
  {
    id: "ipl2",
    title: "IPL 2025: Match 2",
    description: "Royal Challengers Bangalore hosts Delhi Capitals at their home ground in an exciting league match.",
    category: "IPL",
    teams: {
      team1: {
        id: "rcb",
        name: "Royal Challengers Bangalore",
        shortName: "RCB",
        logo: "/placeholder.svg"
      },
      team2: {
        id: "dc",
        name: "Delhi Capitals",
        shortName: "DC",
        logo: "/placeholder.svg"
      }
    },
    venue: "M. Chinnaswamy Stadium, Bangalore",
    date: "2025-03-29",
    time: "15:30",
    ticketTypes: [
      {
        category: "General Stand",
        price: 1200,
        available: 1200,
        capacity: 6000
      },
      {
        category: "Premium Stand",
        price: 3500,
        available: 600,
        capacity: 2500
      },
      {
        category: "VIP Box",
        price: 7500,
        available: 80,
        capacity: 400
      }
    ],
    image: "/placeholder.svg"
  },
  {
    id: "ipl3",
    title: "IPL 2025: Match 3",
    description: "Kolkata Knight Riders face Rajasthan Royals in an electrifying encounter at the iconic Eden Gardens.",
    category: "IPL",
    teams: {
      team1: {
        id: "kkr",
        name: "Kolkata Knight Riders",
        shortName: "KKR",
        logo: "/placeholder.svg"
      },
      team2: {
        id: "rr",
        name: "Rajasthan Royals",
        shortName: "RR",
        logo: "/placeholder.svg"
      }
    },
    venue: "Eden Gardens, Kolkata",
    date: "2025-03-30",
    time: "19:30",
    ticketTypes: [
      {
        category: "General Stand",
        price: 900,
        available: 1500,
        capacity: 8000
      },
      {
        category: "Premium Stand",
        price: 2800,
        available: 700,
        capacity: 3000
      },
      {
        category: "VIP Box",
        price: 6500,
        available: 120,
        capacity: 600
      }
    ],
    image: "/placeholder.svg"
  },
  {
    id: "ipl4",
    title: "IPL 2025: Match 4",
    description: "Punjab Kings welcome Sunrisers Hyderabad for an afternoon thriller at their home ground in Mohali.",
    category: "IPL",
    teams: {
      team1: {
        id: "pbks",
        name: "Punjab Kings",
        shortName: "PBKS",
        logo: "/placeholder.svg"
      },
      team2: {
        id: "srh",
        name: "Sunrisers Hyderabad",
        shortName: "SRH",
        logo: "/placeholder.svg"
      }
    },
    venue: "Punjab Cricket Association Stadium, Mohali",
    date: "2025-03-31",
    time: "15:30",
    ticketTypes: [
      {
        category: "General Stand",
        price: 800,
        available: 1300,
        capacity: 7000
      },
      {
        category: "Premium Stand",
        price: 2500,
        available: 600,
        capacity: 2500
      },
      {
        category: "VIP Box",
        price: 6000,
        available: 90,
        capacity: 450
      }
    ],
    image: "/placeholder.svg"
  }
];
