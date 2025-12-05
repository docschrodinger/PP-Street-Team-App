import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, Clock, Users, Star } from 'lucide-react';
import { realisticMemberships, venueTypes, VenueMembership } from '@/data/realisticMembershipData';

const BrutalistMembershipShowcase: React.FC = () => {
  const [selectedVenueType, setSelectedVenueType] = useState('All Venues');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fixed filtering logic
  const filteredMemberships = selectedVenueType === 'All Venues' ? realisticMemberships : realisticMemberships.filter(membership => {
    // Handle the plural/singular matching properly
    const categoryMap: {
      [key: string]: string[];
    } = {
      'Coffee Shops': ['Coffee Shop', 'Specialty Coffee'],
      'Bakeries': ['Bakery'],
      'Restaurants': ['Restaurant', 'Farm-to-Table Restaurant', 'Italian Restaurant'],
      'Bars': ['Bar', 'Cocktail Bar', 'Bar & Grill'],
      'Breweries': ['Brewery', 'Craft Brewery', 'Brewpub'],
      'Nightclubs': ['Nightclub', 'Dance Club']
    };
    const validTypes = categoryMap[selectedVenueType] || [];
    return validTypes.includes(membership.venueType);
  });

  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedVenueType]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning && filteredMemberships.length > 1) {
        setCurrentIndex(prev => (prev + 1) % filteredMemberships.length);
      }
    }, 8000); // Changed from 5000 to 8000 (slower transition)
    return () => clearInterval(interval);
  }, [isTransitioning, filteredMemberships.length]);

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (isTransitioning || filteredMemberships.length <= 1) return;
    setIsTransitioning(true);
    if (direction === 'next') {
      setCurrentIndex(prev => (prev + 1) % filteredMemberships.length);
    } else {
      setCurrentIndex(prev => (prev - 1 + filteredMemberships.length) % filteredMemberships.length);
    }
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const currentMembership = filteredMemberships[currentIndex];

  // Show message if no memberships for selected category
  if (filteredMemberships.length === 0) {
    return (
      <section className="py-16 px-8 bg-[#F7F5EC] relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-black mb-4">
              No memberships available for {selectedVenueType}
            </h3>
            <p className="text-gray-600">
              Check back soon as venues in this category join our platform!
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!currentMembership) return null;

  const monthlySavings = currentMembership.originalMonthlySpend - currentMembership.price;
  const savingsPercentage = Math.round(monthlySavings / currentMembership.originalMonthlySpend * 100);

  return (
    <section className="py-0 px-8 relative bg-transparent">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.6 }} 
          className="text-center mb-12"
        >
          <p className="text-xl max-w-4xl mx-auto leading-relaxed mb-8 font-normal text-gray-600">
            Every venue creates their own custom memberships, which are based on what makes sense for their business model, peak hours, and customer preferences. From $25 coffee clubs to $200 VIP nightclub access, the possibilities are endless. <span className="font-bold">These are just examples.</span>
          </p>
          
          {/* Venue Type Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {venueTypes.map(type => (
              <motion.button 
                key={type} 
                onClick={() => setSelectedVenueType(type)} 
                className={`px-6 py-3 font-bold border-3 border-black transition-all duration-300 ${selectedVenueType === type ? 'bg-hermes-orange text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`} 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                {type}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Main Membership Display */}
        <div className="relative max-w-6xl mx-auto min-h-[600px]">
          {/* Navigation Arrows */}
          {filteredMemberships.length > 1 && (
            <>
              <motion.button 
                onClick={() => handleNavigation('prev')} 
                className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/95 backdrop-blur-sm border-3 border-black hover:bg-hermes-orange hover:text-white transition-all duration-300 flex items-center justify-center group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] pointer-events-auto" 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
              </motion.button>

              <motion.button 
                onClick={() => handleNavigation('next')} 
                className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/95 backdrop-blur-sm border-3 border-black hover:bg-hermes-orange hover:text-white transition-all duration-300 flex items-center justify-center group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] pointer-events-auto" 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </>
          )}

          {/* Main Card */}
          <div className="relative mx-8">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`${currentMembership.id}-${selectedVenueType}`} 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: -20 }} 
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} 
                className={`bg-gradient-to-br ${currentMembership.gradient} border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-8 right-8 text-6xl">{currentMembership.icon}</div>
                  <motion.div 
                    className="absolute bottom-8 left-8 w-24 h-24 bg-white/20 blur-2xl" 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
                    transition={{ duration: 4, repeat: Infinity }} 
                  />
                </div>

                <div className="relative z-10 p-8">
                  {/* Top Row: Venue Info & Savings */}
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Left: Venue & Membership Info */}
                    <div>
                      <div className="mb-4">
                        <div className="inline-block bg-black/20 backdrop-blur-sm text-white px-4 py-2 font-bold text-sm mb-3">
                          {currentMembership.venueType}
                        </div>
                        <h3 className="text-3xl font-black text-white mb-2">
                          {currentMembership.venueName}
                        </h3>
                        <p className="text-2xl font-bold text-white/90">
                          {currentMembership.membershipName}
                        </p>
                      </div>
                      
                      {/* Visit Frequency */}
                      <div className="flex items-center gap-2 text-white/80 mb-4">
                        <Clock size={16} />
                        <span className="font-medium">{currentMembership.monthlyVisits}</span>
                      </div>
                    </div>

                    {/* Right: Pricing & Savings */}
                    <div className="text-right">
                      <div className="bg-white/20 backdrop-blur-sm p-6 border-2 border-white/30 mb-4">
                        <div className="text-white/70 text-sm line-through mb-1">
                          Usually spend: ${currentMembership.originalMonthlySpend}/month
                        </div>
                        <div className="text-4xl font-black text-white mb-2">
                          ${currentMembership.price}
                          <span className="text-lg">/month</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-green-300 font-bold">
                          <TrendingUp size={18} />
                          Save ${monthlySavings} ({savingsPercentage}% off)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Benefits & Offers */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Key Offers */}
                    <div className="md:col-span-2">
                      <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Star size={18} />
                        What You Get:
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {currentMembership.keyOffers.map((offer, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, x: -20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ duration: 0.4, delay: index * 0.1 }} 
                            className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3 border-4 border-white/20"
                          >
                            <div className="w-2 h-2 bg-white mt-2 flex-shrink-0" />
                            <span className="text-white text-sm font-medium">{offer}</span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Special Offers */}
                      <div className="mt-4 grid sm:grid-cols-2 gap-3">
                        {currentMembership.unlimitedOffer && (
                          <div className="bg-green-500/20 border-2 border-green-400/30 p-3">
                            <div className="text-green-300 font-bold text-xs mb-1">UNLIMITED</div>
                            <div className="text-white text-sm font-medium">
                              {currentMembership.unlimitedOffer}
                            </div>
                          </div>
                        )}
                        
                        {currentMembership.groupDeals && (
                          <div className="bg-blue-500/20 border-2 border-blue-400/30 p-3">
                            <div className="text-blue-300 font-bold text-xs mb-1 flex items-center gap-1">
                              <Users size={12} />
                              GROUP PERKS
                            </div>
                            <div className="text-white text-sm font-medium">
                              {currentMembership.groupDeals}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Restrictions */}
                      {currentMembership.restrictions && (
                        <div className="mt-4 text-white/60 text-xs">
                          <span className="font-medium">Terms: </span> 
                          {currentMembership.restrictions.join(' • ')}
                        </div>
                      )}
                    </div>

                    {/* CTA Section */}
                    <div className="flex flex-col justify-center">
                      <motion.button 
                        onClick={() => window.location.href = '/partners'}
                        className="px-8 py-4 bg-white text-black font-black text-lg border-4 border-black hover:bg-black hover:text-white transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-4" 
                        whileHover={{ scale: 1.02, y: -2 }} 
                        whileTap={{ scale: 0.98 }}
                      >
                        Find Your Spots
                      </motion.button>
                      
                      <div className="text-center">
                        <div className="text-white/80 text-xs mb-2">Why this works:</div>
                        <div className="text-white text-sm font-medium">
                          {currentMembership.strategicBenefit}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicators */}
          {filteredMemberships.length > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {filteredMemberships.map((_, index) => (
                <motion.button 
                  key={index} 
                  onClick={() => {
                    if (!isTransitioning) {
                      setCurrentIndex(index);
                    }
                  }} 
                  className={`h-3 border-2 border-black transition-all duration-300 ${index === currentIndex ? 'w-8 bg-hermes-orange border-hermes-orange' : 'w-3 bg-white hover:bg-gray-200'}`} 
                  whileHover={{ scale: 1.2 }} 
                  whileTap={{ scale: 0.9 }} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA & Info */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.6, delay: 0.4 }} 
          className="text-center mt-16"
        >
        </motion.div>
      </div>
    </section>
  );
};

export default BrutalistMembershipShowcase;
