'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Zap, Users, Globe, Award } from 'lucide-react';

export default function AboutPage() {
  const prefersReducedMotion = useReducedMotion();

  const capabilities = [
    {
      title: 'Precision Printing',
      desc: 'DTF + Embroidery technology for flawless custom merchandise',
      icon: Zap,
    },
    {
      title: 'Reliable Turnaround',
      desc: '5–7 working days from order to doorstep',
      icon: Award,
    },
    {
      title: 'Pan-India Delivery',
      desc: 'Seamless logistics across India with real-time tracking',
      icon: Globe,
    },
    {
      title: 'Dedicated Support',
      desc: 'Expert project managers guiding you at every step',
      icon: Users,
    },
  ];

  return (
    <div className="w-full bg-[#F7F6F2] text-[#111111] overflow-hidden">
      {/* Hero Intro Section - Compact */}
      <section className="bg-[#F7F6F2] pt-8 sm:pt-10 lg:pt-12 pb-8 sm:pb-10 lg:pb-12 border-b border-[#DDDCD5]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-3.5 sm:space-y-4 max-w-2xl lg:col-span-7"
            >
              <span className="inline-flex items-center text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#3B6FEB] bg-white border border-[#D9E2FF] px-2.5 py-1 rounded-full font-heading shadow-2xs">
                ABOUT ZOBBRA
              </span>

              <h1 className="text-2xl sm:text-4xl lg:text-[40px] xl:text-[44px] font-heading font-black text-[#111111] tracking-tight leading-[1.08]">
                Custom Merchandise That Represents Your Brand
              </h1>

              <p className="text-sm sm:text-[15px] text-[#555555] leading-[1.55]">
                ZOBBRA is a specialized Modern B2B Merchandise SaaS and corporate apparel platform designed for printing businesses, gift providers, and organizations across India. We streamline the complete merchandise journey from idea to delivery with precision, reliability, and dedicated support.
              </p>

              <p className="text-xs sm:text-[13px] text-[#666666] leading-relaxed">
                Headquartered in Bhubaneswar, Odisha, we combine cutting-edge DTF printing, 3D computerized embroidery, and automated GST billing to deliver premium custom merchandise for businesses, events, schools, and corporate clients.
              </p>
            </motion.div>
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              className="lg:col-span-5 relative aspect-[4/3] sm:aspect-[4/3.2] rounded-[1.5rem] overflow-hidden bg-[#111111] shadow-[0_16px_36px_-12px_rgba(17,17,17,0.25)] border border-[#2B2B2B]"
            >
              <Image
                src="/images/landing/testimonial-showcase.jpg"
                alt="ZOBBRA branded merchandise collection"
                fill
                priority
                className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-[#111111]/10 pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Values Section - Compact */}
      <section className="bg-white py-10 sm:py-12 lg:py-14 border-b border-[#DDDCD5]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* Left: Text */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-3.5 sm:space-y-4"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#666666] font-heading block">
                  OUR MISSION
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-heading font-black text-[#111111] tracking-[-0.03em] leading-tight">
                  Empower Businesses Through Premium Merchandise
                </h2>
              </div>

              <p className="text-xs sm:text-[13.5px] text-[#666666] leading-relaxed">
                We believe merchandise is more than just products—it&apos;s a powerful way for brands to connect with their audience, build loyalty, and create lasting impressions. Our mission is to make premium custom merchandise accessible to businesses of all sizes.
              </p>

              <p className="text-xs sm:text-[13.5px] text-[#666666] leading-relaxed">
                Every product we create represents our commitment to quality, reliability, and your brand&apos;s success. From the first inquiry to the final delivery, we&apos;re your dedicated partner in creating merchandise that matters.
              </p>

              <div className="pt-2">
                <Link
                  href="/get-quote"
                  className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 sm:px-5 sm:py-2.5 bg-[#111111] hover:bg-[#3B6FEB] text-white text-[11.5px] font-bold tracking-wider uppercase rounded-full transition-all shadow-sm active:scale-[0.98] group min-h-[38px] sm:min-h-[40px]"
                >
                  <span>GET STARTED</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </motion.div>

            {/* Right: Key Values as Cards */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5"
            >
              {[
                { title: 'Quality First', desc: 'Premium materials and flawless execution' },
                { title: 'Speed & Reliability', desc: '5–7 day turnaround, guaranteed' },
                { title: 'Transparency', desc: 'Clear pricing, no hidden charges' },
                { title: 'Partnership', desc: 'Dedicated support from start to finish' },
              ].map((value, _idx) => (
                <motion.div
                  key={value.title}
                  whileHover={prefersReducedMotion ? {} : { y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#F7F6F2] rounded-xl p-4 sm:p-4.5 border border-[#DDDCD5] hover:border-[#3B6FEB] hover:shadow-[0_8px_20px_-4px_rgba(17,17,17,0.08)] transition-all duration-300 space-y-1.5 group"
                >
                  <h3 className="text-[13px] font-heading font-black text-[#050505] group-hover:text-black">
                    {value.title}
                  </h3>
                  <p className="text-[11.5px] text-[#666666] leading-snug">
                    {value.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Capabilities Section - Compact */}
      <section className="bg-[#F7F6F2] py-10 sm:py-12 lg:py-14 border-b border-[#DDDCD5]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Section Header */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-left space-y-1.5 max-w-2xl mr-auto"
          >
            <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#666666] font-heading block">
              CAPABILITIES
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-heading font-black text-[#111111] tracking-[-0.03em] leading-tight">
              Why Choose ZOBBRA?
            </h2>
          </motion.div>

          {/* 4 Capability Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <motion.div
                  key={cap.title}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{
                    duration: 0.55,
                    delay: idx * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="bg-white border border-[#DDDCD5] rounded-xl p-4 sm:p-4.5 space-y-2.5 group hover:border-[#3B6FEB] hover:shadow-[0_12px_24px_-6px_rgba(17,17,17,0.1)] transition-all duration-300"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#EEF2FF] border border-[#D9E2FF] flex items-center justify-center text-[#3B6FEB] group-hover:bg-[#3B6FEB] group-hover:text-white transition-all duration-300">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[13px] sm:text-[13.5px] font-heading font-black text-[#050505]">
                      {cap.title}
                    </h3>
                    <p className="text-[11.5px] text-[#666666] leading-snug">
                      {cap.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Compact */}
      <section className="bg-[#3B6FEB] py-10 sm:py-12 lg:py-14">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center space-y-4 sm:space-y-5 max-w-2xl mx-auto"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-heading font-black text-white tracking-[-0.02em] leading-tight">
              Ready to Create Premium Merchandise?
            </h2>

            <p className="text-xs sm:text-[13.5px] text-[#D1D5DB] leading-relaxed max-w-xl mx-auto">
              Get started with a free quote. Our team will guide you through the entire process and create merchandise that represents your brand perfectly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Link
                href="/get-quote"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 sm:px-6 sm:py-2.5 bg-white hover:bg-[#EEF2FF] text-[#111111] text-[11.5px] font-bold tracking-wider uppercase rounded-full transition-all shadow-sm active:scale-[0.98] min-h-[38px] sm:min-h-[40px] group"
              >
                <span>GET A FREE QUOTE</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 sm:px-6 sm:py-2.5 bg-transparent hover:bg-white/10 text-white text-[11.5px] font-bold tracking-wider uppercase rounded-full border border-white/50 hover:border-white transition-all active:scale-[0.98] min-h-[38px] sm:min-h-[40px] group"
              >
                <span>EXPLORE PRODUCTS</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

