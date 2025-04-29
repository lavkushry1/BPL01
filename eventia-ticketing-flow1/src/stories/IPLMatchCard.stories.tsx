import type { Meta, StoryObj } from '@storybook/react';
import IPLMatchCard from '../components/events/IPLMatchCard';
import { BrowserRouter } from 'react-router-dom';

const meta = {
  title: 'Events/IPLMatchCard',
  component: IPLMatchCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div style={{ width: '380px' }}>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof IPLMatchCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base card example
export const Default: Story = {
  args: {
    id: 'ipl1',
    title: 'IPL 2025: Opening Match',
    posterUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1605&q=80',
    date: '2025-03-28',
    time: '19:30',
    venue: 'Wankhede Stadium, Mumbai',
    startingPrice: 1000,
    featured: false,
    teams: {
      team1: {
        name: 'Mumbai Indians',
        shortName: 'MI',
        logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/Logos/Roundbig/MIroundbig.png',
      },
      team2: {
        name: 'Chennai Super Kings',
        shortName: 'CSK',
        logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Roundbig/CSKroundbig.png',
      },
    },
  },
};

// Featured match with ribbon
export const Featured: Story = {
  args: {
    ...Default.args,
    featured: true,
  },
};

// High price match
export const PremiumMatch: Story = {
  args: {
    ...Default.args,
    startingPrice: 8000,
    title: 'IPL 2025: Final Match',
    teams: {
      team1: {
        name: 'Mumbai Indians',
        shortName: 'MI',
        logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/Logos/Roundbig/MIroundbig.png',
      },
      team2: {
        name: 'Royal Challengers Bangalore',
        shortName: 'RCB',
        logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/Logos/Roundbig/RCBroundbig.png',
      },
    },
  },
};

// Match with broken image to test fallback
export const WithBrokenImage: Story = {
  args: {
    ...Default.args,
    posterUrl: 'broken-url.jpg',
    teams: {
      team1: {
        name: 'Kolkata Knight Riders',
        shortName: 'KKR',
        logo: 'broken-logo.jpg',
      },
      team2: {
        name: 'Punjab Kings',
        shortName: 'PBKS',
        logo: 'broken-logo.jpg',
      },
    },
  },
};

// Mobile viewport example
export const MobileView: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Responsive grid demo with multiple cards
export const ResponsiveGrid: Story = {
  render: () => (
    <BrowserRouter>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        width: '100%',
        maxWidth: '1200px'
      }}>
        <IPLMatchCard 
          id="ipl1"
          title="MI vs CSK"
          posterUrl="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1605&q=80"
          date="2025-03-28"
          time="19:30"
          venue="Wankhede Stadium, Mumbai"
          startingPrice={1000}
          teams={{
            team1: {
              name: 'Mumbai Indians',
              shortName: 'MI',
              logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/Logos/Roundbig/MIroundbig.png',
            },
            team2: {
              name: 'Chennai Super Kings',
              shortName: 'CSK',
              logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Roundbig/CSKroundbig.png',
            },
          }}
          featured={true}
        />
        <IPLMatchCard 
          id="ipl2"
          title="RCB vs DC"
          posterUrl="https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1494&q=80"
          date="2025-03-29"
          time="15:30"
          venue="M. Chinnaswamy Stadium, Bangalore"
          startingPrice={1200}
          teams={{
            team1: {
              name: 'Royal Challengers Bangalore',
              shortName: 'RCB',
              logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/Logos/Roundbig/RCBroundbig.png',
            },
            team2: {
              name: 'Delhi Capitals',
              shortName: 'DC',
              logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/DC/Logos/Roundbig/DCroundbig.png',
            },
          }}
        />
        <IPLMatchCard 
          id="ipl3"
          title="KKR vs RR"
          posterUrl="https://images.unsplash.com/photo-1590075865003-e48b56637b5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
          date="2025-03-30"
          time="19:30"
          venue="Eden Gardens, Kolkata"
          startingPrice={900}
          teams={{
            team1: {
              name: 'Kolkata Knight Riders',
              shortName: 'KKR',
              logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/KKR/Logos/Roundbig/KKRroundbig.png',
            },
            team2: {
              name: 'Rajasthan Royals',
              shortName: 'RR',
              logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RR/Logos/Roundbig/RRroundbig.png',
            },
          }}
        />
      </div>
    </BrowserRouter>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}; 