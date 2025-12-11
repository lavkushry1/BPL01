import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp, Clock, Info, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Price Categories & Colors
const CATEGORIES = {
  PREMIUM: { id: 'premium', label: 'Premium', color: '#f472b6', price: 15000, bg: 'bg-pink-500', border: 'border-pink-500' }, // Pink
  GOLD: { id: 'gold', label: 'Gold', color: '#fbbf24', price: 8000, bg: 'bg-amber-400', border: 'border-amber-400' }, // Amber
  SILVER: { id: 'silver', label: 'Silver', color: '#94a3b8', price: 4000, bg: 'bg-slate-400', border: 'border-slate-400' }, // Slate
  GENERAL: { id: 'general', label: 'General', color: '#a78bfa', price: 2000, bg: 'bg-violet-400', border: 'border-violet-400' }, // Violet
};

// Generate Stadium Blocks (Eden Gardens Style - Circular/Oval)
const generateStadiumBlocks = () => {
  const blocks = [];
  const totalBlocks = 12; // A to L
  const centerX = 250;
  const centerY = 250;
  const radiusInner = 120;
  const radiusOuter = 220;
  const gap = 0.05; // Gap between blocks in radians

  const angleStep = (2 * Math.PI) / totalBlocks;

  const categories = [
    CATEGORIES.PREMIUM, CATEGORIES.GOLD, CATEGORIES.GOLD,
    CATEGORIES.SILVER, CATEGORIES.SILVER, CATEGORIES.GENERAL,
    CATEGORIES.GENERAL, CATEGORIES.GENERAL, CATEGORIES.SILVER,
    CATEGORIES.SILVER, CATEGORIES.GOLD, CATEGORIES.PREMIUM
  ];

  const blockNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  for (let i = 0; i < totalBlocks; i++) {
    const startAngle = i * angleStep + gap;
    const endAngle = (i + 1) * angleStep - gap;

    // Calculate path points
    const x1 = centerX + radiusInner * Math.cos(startAngle);
    const y1 = centerY + radiusInner * Math.sin(startAngle);
    const x2 = centerX + radiusOuter * Math.cos(startAngle);
    const y2 = centerY + radiusOuter * Math.sin(startAngle);
    const x3 = centerX + radiusOuter * Math.cos(endAngle);
    const y3 = centerY + radiusOuter * Math.sin(endAngle);
    const x4 = centerX + radiusInner * Math.cos(endAngle);
    const y4 = centerY + radiusInner * Math.sin(endAngle);

    // Create SVG Path Arc
    const largeArc = 0;
    const path = `
      M ${x1} ${y1}
      L ${x2} ${y2}
      A ${radiusOuter} ${radiusOuter} 0 ${largeArc} 1 ${x3} ${y3}
      L ${x4} ${y4}
      A ${radiusInner} ${radiusInner} 0 ${largeArc} 0 ${x1} ${y1}
      Z
    `;

    blocks.push({
      id: `block-${blockNames[i]}`,
      name: `${blockNames[i]} Block`,
      shortName: blockNames[i],
      path,
      category: categories[i],
      price: categories[i].price,
      labelX: centerX + (radiusInner + radiusOuter) / 2 * Math.cos((startAngle + endAngle) / 2),
      labelY: centerY + (radiusInner + radiusOuter) / 2 * Math.sin((startAngle + endAngle) / 2),
    });
  }
  return blocks;
};

const STADIUM_BLOCKS = generateStadiumBlocks();

interface AdvancedStadiumMapProps {
  matchId?: string;
  teams?: { home: string, away: string };
  onBookingConfirm?: (sectionId: string, seats: number) => void;
}

const AdvancedStadiumMap: React.FC<AdvancedStadiumMapProps> = ({
  matchId,
  teams = { home: 'Team A', away: 'Team B' },
  onBookingConfirm
}) => {
  // Map Interaction State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedSection, setSelectedSection] = useState<typeof STADIUM_BLOCKS[0] | null>(null);
  const [seatCount, setSeatCount] = useState(2);
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes in seconds

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Touch Gesture Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
    // Prevent default pinch-zoom of page
    if (e.touches.length === 2) {
      e.preventDefault();
      // Simple pinch distance calc could go here for zoom
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse Handling (Desktop fallback)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const newScale = scale - e.deltaY * 0.01;
        setScale(Math.min(Math.max(0.5, newScale), 3));
    }
  };

  const zoomIn = () => setScale(s => Math.min(s + 0.5, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));
  const resetMap = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white overflow-hidden relative">
      {/* Top Bar: Match Info & Timer */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex justify-between items-center shadow-lg">
        <div>
           <h2 className="font-bold text-sm text-gray-100">{teams.home} vs {teams.away}</h2>
           <p className="text-xs text-slate-400">Eden Gardens • Today, 7:30 PM</p>
        </div>
        <div className="flex flex-col items-end">
          <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10 gap-1.5 font-mono">
             <Clock className="w-3 h-3" /> {formatTime(timeLeft)}
          </Badge>
          <span className="text-[10px] text-slate-500 mt-0.5">to select seats</span>
        </div>
      </div>

      {/* Main Map Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full bg-[#1a1f2e] relative overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Floating Controls */}
        <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 text-white shadow-lg opacity-80" onClick={zoomIn}><ZoomIn className="w-4 h-4" /></Button>
            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 text-white shadow-lg opacity-80" onClick={zoomOut}><ZoomOut className="w-4 h-4" /></Button>
             <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 text-white shadow-lg opacity-80" onClick={resetMap}><RotateCcw className="w-4 h-4" /></Button>
        </div>

        {/* SVG Container */}
        <motion.div
            className="w-full h-full flex items-center justify-center origin-center"
            style={{
                x: position.x,
                y: position.y,
                scale: scale
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <svg
                ref={svgRef}
                viewBox="0 0 500 500"
                className="w-full h-full max-w-[800px] max-h-[800px]"
            >
                {/* Field */}
                <circle cx="250" cy="250" r="110" fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
                <rect x="235" y="210" width="30" height="80" fill="#d4b896" className="opacity-80" /> {/* Pitch */}

                 {/* Blocks */}
                 {STADIUM_BLOCKS.map((block) => {
                     const isSelected = selectedSection?.id === block.id;
                      return (
                        <g
                            key={block.id}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent drag start interference if needed
                                setSelectedSection(block);
                            }}
                            className="cursor-pointer"
                        >
                            <path
                                d={block.path}
                                fill={isSelected ? '#ec4899' : block.category.color} // Pink if selected
                                stroke={isSelected ? 'white' : 'rgba(0,0,0,0.2)'}
                                strokeWidth={isSelected ? 2 : 1}
                                className={cn(
                                    "transition-colors duration-200 hover:opacity-90",
                                    isSelected && "drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                                )}
                            />
                            {/* Label */}
                             <text
                                x={block.labelX}
                                y={block.labelY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="white"
                                fontSize="10"
                                fontWeight="bold"
                                className="pointer-events-none shadow-black drop-shadow-md"
                            >
                                {block.shortName}
                                <tspan x={block.labelX} y={block.labelY + 8} fontSize="6" opacity="0.8">₹{block.price}</tspan>
                            </text>
                        </g>
                     );
                 })}
            </svg>
        </motion.div>
      </div>

       {/* Bottom Sheet / Info Panel */}
       <AnimatePresence>
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="bg-slate-900 border-t border-white/10 z-30 pb-safe"
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-12 h-1.5 rounded-full bg-slate-700" />
                </div>

                {selectedSection ? (
                    // Selected Section Details
                    <div className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="text-xl font-bold text-white mb-1">{selectedSection.name}</h3>
                                <Badge className={cn("text-xs font-bold text-white border-0", selectedSection.category.bg)}>
                                    {selectedSection.category.label}
                                </Badge>
                             </div>
                             <div className="text-right">
                                <div className="text-2xl font-bold text-white">₹{selectedSection.price * seatCount}</div>
                                <div className="text-xs text-slate-400">for {seatCount} tickets</div>
                             </div>
                        </div>

                         {/* Seat Counter */}
                         <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-sm font-medium text-slate-300">Quantity</span>
                            <div className="flex items-center gap-3">
                                <Button
                                    size="icon" variant="outline" className="h-8 w-8 rounded-full border-white/20 hover:bg-white/10"
                                    onClick={() => setSeatCount(Math.max(1, seatCount - 1))}
                                >-</Button>
                                <span className="w-8 text-center font-bold">{seatCount}</span>
                                <Button
                                    size="icon" variant="outline" className="h-8 w-8 rounded-full border-white/20 hover:bg-white/10"
                                    onClick={() => setSeatCount(Math.min(10, seatCount + 1))}
                                >+</Button>
                            </div>
                         </div>

                         {/* Action Button */}
                         <Button
                            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-lg shadow-pink-900/20"
                            onClick={() => onBookingConfirm && onBookingConfirm(selectedSection.id, seatCount)}
                         >
                            Book {seatCount} Tickets <ChevronUp className="w-4 h-4 ml-2 rotate-90" />
                         </Button>
                    </div>
                ) : (
                    // Prompt to Select
                    <div className="p-6 text-center text-slate-400 pb-10">
                        <Info className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium text-white">Select a stand to view prices</p>
                        <p className="text-sm">Pinch to zoom into the stadium map</p>

                        {/* Price Legend */}
                        <div className="flex flex-wrap justify-center gap-2 mt-4 opacity-80">
                            {Object.values(CATEGORIES).map(cat => (
                                <div key={cat.id} className="flex items-center gap-1.5 text-xs bg-white/5 px-2 py-1 rounded-full border border-white/5">
                                    <div className={`w-2 h-2 rounded-full ${cat.bg}`} />
                                    <span>{cat.label} ₹{cat.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
       </AnimatePresence>
    </div>
  );
};

export default AdvancedStadiumMap;
