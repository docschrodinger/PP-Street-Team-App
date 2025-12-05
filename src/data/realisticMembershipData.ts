export interface VenueMembership {
  id: string;
  venueName: string;
  venueType: string;
  membershipName: string;
  price: number;
  originalMonthlySpend: number;
  monthlyVisits: string;
  keyOffers: string[];
  unlimitedOffer?: string;
  groupDeals?: string;
  restrictions?: string[];
  strategicBenefit: string;
  icon: string;
  gradient: string;
}

export const venueTypes = [
  'All Venues',
  'Coffee Shops',
  'Bakeries',
  'Restaurants',
  'Bars',
  'Breweries',
  'Nightclubs',
];

export const realisticMemberships: VenueMembership[] = [
  // Coffee Shops
  {
    id: 'morning-brew-1',
    venueName: 'Morning Brew Café',
    venueType: 'Coffee Shop',
    membershipName: 'Daily Grind Club',
    price: 25,
    originalMonthlySpend: 80,
    monthlyVisits: '15-20 visits/month',
    keyOffers: [
      'One free drip coffee daily',
      '20% off all specialty drinks',
      'Free pastry upgrade on Mondays',
      'Priority mobile ordering',
    ],
    unlimitedOffer: 'Unlimited drip coffee refills',
    restrictions: ['Valid 6am-2pm only', 'Excludes seasonal specials'],
    strategicBenefit: 'Locks in morning commuters for daily repeat visits',
    icon: '☕',
    gradient: 'from-amber-600 to-amber-800',
  },
  {
    id: 'artisan-roast-1',
    venueName: 'Artisan Roasters',
    venueType: 'Specialty Coffee',
    membershipName: 'Bean Connoisseur',
    price: 45,
    originalMonthlySpend: 120,
    monthlyVisits: '8-12 visits/month',
    keyOffers: [
      '2 free specialty drinks per week',
      '30% off whole bean purchases',
      'Free cupping class monthly',
      'Early access to new roasts',
    ],
    groupDeals: 'Bring a friend, both get free upgrades',
    restrictions: ['Premium drinks only', 'Beans must be 12oz or larger'],
    strategicBenefit: 'Builds community of coffee enthusiasts who evangelize the brand',
    icon: '🫘',
    gradient: 'from-stone-700 to-stone-900',
  },

  // Bakeries
  {
    id: 'sweet-rise-1',
    venueName: 'Sweet Rise Bakery',
    venueType: 'Bakery',
    membershipName: 'Fresh Baked Club',
    price: 35,
    originalMonthlySpend: 90,
    monthlyVisits: '10-15 visits/month',
    keyOffers: [
      'Daily fresh bread loaf at 50% off',
      'Free birthday cake slice',
      '25% off custom orders',
      'First dibs on daily specials',
    ],
    unlimitedOffer: 'Free day-old bread with any purchase',
    restrictions: ['Bread pickup before noon', 'Custom orders 48hr notice'],
    strategicBenefit: 'Reduces waste while building loyal morning crowd',
    icon: '🥐',
    gradient: 'from-orange-500 to-orange-700',
  },

  // Restaurants
  {
    id: 'harvest-table-1',
    venueName: 'Harvest Table',
    venueType: 'Farm-to-Table Restaurant',
    membershipName: 'Season Pass',
    price: 75,
    originalMonthlySpend: 200,
    monthlyVisits: '4-6 visits/month',
    keyOffers: [
      'Free appetizer with every visit',
      'Complimentary wine pairing once monthly',
      '20% off weeknight dinners',
      'Chef\'s table booking priority',
    ],
    groupDeals: 'Free dessert sampler for parties of 4+',
    restrictions: ['Excludes Saturday evenings', 'Wine pairing = 2 glasses'],
    strategicBenefit: 'Fills weeknight tables with high-value repeat customers',
    icon: '🍽️',
    gradient: 'from-green-600 to-green-800',
  },
  {
    id: 'mamas-kitchen-1',
    venueName: "Mama's Kitchen",
    venueType: 'Italian Restaurant',
    membershipName: 'Family Table',
    price: 50,
    originalMonthlySpend: 150,
    monthlyVisits: '3-5 visits/month',
    keyOffers: [
      'Free garlic bread basket every visit',
      '15% off all pasta dishes',
      'Kids eat free on Tuesdays',
      'Free tiramisu on your anniversary',
    ],
    groupDeals: 'Family meal deal: 4 entrees for the price of 3',
    restrictions: ['Dine-in only', 'Max 2 kids per adult'],
    strategicBenefit: 'Creates multi-generational family loyalty',
    icon: '🍝',
    gradient: 'from-red-600 to-red-800',
  },

  // Bars
  {
    id: 'velvet-lounge-1',
    venueName: 'Velvet Lounge',
    venueType: 'Cocktail Bar',
    membershipName: 'Mixologist Circle',
    price: 60,
    originalMonthlySpend: 180,
    monthlyVisits: '6-8 visits/month',
    keyOffers: [
      'First cocktail free every visit',
      '25% off signature cocktails',
      'Private bartender tutorial monthly',
      'Reserved seating 6pm-8pm',
    ],
    unlimitedOffer: 'Free mocktails for designated drivers',
    restrictions: ['Valid Sun-Thu only', 'Tutorial requires 2+ people'],
    strategicBenefit: 'Drives consistent weeknight traffic to premium establishment',
    icon: '🍸',
    gradient: 'from-purple-700 to-purple-900',
  },
  {
    id: 'corner-pub-1',
    venueName: 'The Corner Pub',
    venueType: 'Bar & Grill',
    membershipName: 'Regulars Club',
    price: 40,
    originalMonthlySpend: 120,
    monthlyVisits: '8-12 visits/month',
    keyOffers: [
      '50% off appetizers during happy hour',
      'Free birthday pitcher',
      '20% off all food orders',
      'Skip the line on game nights',
    ],
    groupDeals: 'Book trivia table + free nachos platter',
    restrictions: ['Happy hour 4-7pm', 'Birthday offer valid within birthday week'],
    strategicBenefit: 'Builds neighborhood community and repeat visits',
    icon: '🍺',
    gradient: 'from-amber-700 to-amber-900',
  },

  // Breweries
  {
    id: 'hopworks-1',
    venueName: 'Hopworks Brewing',
    venueType: 'Craft Brewery',
    membershipName: 'Founders Club',
    price: 55,
    originalMonthlySpend: 140,
    monthlyVisits: '5-8 visits/month',
    keyOffers: [
      '4 free pints per month',
      '30% off growler fills',
      'Exclusive access to limited releases',
      'Free brewery tour for member + 3 guests',
    ],
    unlimitedOffer: 'Free tasting flights every visit',
    groupDeals: 'Private event space 50% off for groups of 10+',
    restrictions: ['Pints cannot be saved month-to-month', 'Limited releases while supplies last'],
    strategicBenefit: 'Creates brand ambassadors who bring friends',
    icon: '🍻',
    gradient: 'from-yellow-600 to-yellow-800',
  },
  {
    id: 'barrel-house-1',
    venueName: 'Barrel House Brewpub',
    venueType: 'Brewpub',
    membershipName: 'Barrel Aged Society',
    price: 80,
    originalMonthlySpend: 220,
    monthlyVisits: '4-6 visits/month',
    keyOffers: [
      '6 free pints monthly + 1 barrel-aged special',
      'Name on the wall for new brew releases',
      'Annual member-only beer release party',
      '40% off all food',
    ],
    groupDeals: 'Rent the barrel room for private events at cost',
    restrictions: ['Barrel-aged special once per month', 'Food discount dine-in only'],
    strategicBenefit: 'Premium tier creates aspirational membership goal',
    icon: '🛢️',
    gradient: 'from-amber-800 to-amber-950',
  },

  // Nightclubs - Note: Neon Palace has a darker gradient for better text legibility
  {
    id: 'neon-palace-1',
    venueName: 'Neon Palace',
    venueType: 'Nightclub',
    membershipName: 'VIP Elite',
    price: 200,
    originalMonthlySpend: 500,
    monthlyVisits: '4-6 visits/month',
    keyOffers: [
      'Skip the line always',
      'Free bottle service once monthly',
      'VIP booth reservation priority',
      'Guest list + 4 friends every visit',
    ],
    unlimitedOffer: 'Unlimited coat check',
    groupDeals: 'Group of 8+ gets private section + champagne',
    restrictions: ['Cover charge waived', 'Bottle service excludes premium brands'],
    strategicBenefit: 'High-value customers who drive bottle service revenue',
    icon: '💎',
    gradient: 'from-slate-800 via-purple-900 to-slate-900',
  },
  {
    id: 'pulse-club-1',
    venueName: 'Pulse Dance Club',
    venueType: 'Dance Club',
    membershipName: 'Dance Floor Royalty',
    price: 150,
    originalMonthlySpend: 350,
    monthlyVisits: '3-5 visits/month',
    keyOffers: [
      'No cover charge ever',
      '2 free drinks per visit',
      'Early entry (9pm access)',
      'Meet & greet with guest DJs',
    ],
    groupDeals: 'Birthday package: Free VIP area + cake + sparklers',
    restrictions: ['Drinks = house cocktails/beer/wine', 'Early entry on event nights only'],
    strategicBenefit: 'Builds core community of regulars who create the vibe',
    icon: '🎵',
    gradient: 'from-fuchsia-700 to-fuchsia-900',
  },
];
