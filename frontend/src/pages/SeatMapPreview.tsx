import AdvancedStadiumMap from '@/components/booking/AdvancedStadiumMap';

const SeatMapPreview = () => {
  const handleBooking = (sectionId: string, seats: number) => {
;
    // In real app, this would navigate to checkout or open a payment modal
    console.log(`Booked ${seats} in ${sectionId}`);
  };

  return (
    <AdvancedStadiumMap
      matchId="demo-match"
      teams={{ home: "CSK", away: "MI" }}
      onBookingConfirm={handleBooking}
    />
  );
};

export default SeatMapPreview;
