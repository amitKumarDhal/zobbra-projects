import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { TrustedBrands } from '@/components/landing/TrustedBrands';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ProductsSection } from '@/components/landing/ProductsSection';
import { PrintServices } from '@/components/landing/PrintServices';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { Testimonial } from '@/components/landing/Testimonial';
import { CTASection } from '@/components/landing/CTASection';

export default function HomePage() {
  return (
    <div className="w-full bg-white text-[#111111] overflow-hidden">
      {/* 3. Hero Section */}
      <Hero />

      {/* 4. Trusted By Brands */}
      <TrustedBrands />

      {/* 5. How It Works */}
      <HowItWorks />

      {/* 6. Our Products */}
      <ProductsSection />

      {/* 7. Print Services Banner */}
      <PrintServices />

      {/* 8. Why Choose ZOBRA */}
      <WhyChooseUs />

      {/* 9. Testimonial Section */}
      <Testimonial />

      {/* 10. Large Bottom CTA Banner */}
      <CTASection />
    </div>
  );
}
