import { useNavigate } from 'react-router-dom';

// Sample data with "District" aesthetic visuals
const featuredMatches = [
  {
    id: 'match-1',
    title: 'The El Clasico: CSK vs MI',
    date: '2026-04-14T19:30:00Z',
    posterUrl: 'https://images.unsplash.com/photo-1631194758628-71ec7c35137e?q=80&w=2940&auto=format&fit=crop',
    venue: 'Wankhede Stadium, Mumbai',
    price: 2500,
    teams: {
      team1: { name: 'Chennai Super Kings', shortName: 'CSK', logo: 'https://scores.iplt20.com/ipl/teamlogos/CSK.png' },
      team2: { name: 'Mumbai Indians', shortName: 'MI', logo: 'https://scores.iplt20.com/ipl/teamlogos/MI.png' }
    }
  },
  {
    id: 'match-2',
    title: 'Royal Battle: RCB vs KKR',
    date: '2026-04-15T19:30:00Z',
    posterUrl: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=2940&auto=format&fit=crop',
    venue: 'M. Chinnaswamy Stadium, Bengaluru',
    price: 3000,
    teams: {
      team1: { name: 'Royal Challengers Bengaluru', shortName: 'RCB', logo: 'https://scores.iplt20.com/ipl/teamlogos/RCB.png' },
      team2: { name: 'Kolkata Knight Riders', shortName: 'KKR', logo: 'https://scores.iplt20.com/ipl/teamlogos/KKR.png' }
    }
  }
];

const LandingPage = () => {
  const navigate = useNavigate();

  return;
};

export default LandingPage;
