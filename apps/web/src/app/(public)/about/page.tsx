'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Users,
  Globe,
  Award,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  Clock,
  Building2,
  ChevronDown,
  MessageCircle,
  Cpu,
  Factory,
  Check,
} from 'lucide-react';

export default function AboutPage() {
  const prefersReducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const stats = [
    { value: '150,000+', label: 'Garments & Kits Delivered', desc: 'Crafted with precision across India' },
    { value: '500+', label: 'Enterprise & Tech Clients', desc: 'From fast-growing startups to conglomerates' },
    { value: '5–7 Days', label: 'Average Turnaround SLA', desc: 'Industry-leading production & dispatch speed' },
    { value: '99.4%', label: 'On-Time Delivery Rate', desc: 'Backed by direct factory tracking' },
  ];

  const manufacturingSteps = [
    {
      id: 'dtf-printing',
      number: '01',
      title: 'Industrial DTF Precision Printing',
      summary: '8-pass Japanese industrial printheads delivering 2400 DPI razor-sharp photographic prints.',
      details: [
        'Reactive eco-certified inks tested for 50+ wash cycles without cracking or fading',
        'Pantone color matching with under-base white masking for deep contrast on dark fabrics',
        'Breathable finish that preserves fabric softness and stretchability',
      ],
      tag: 'Print Technology',
      highlight: 'Ultra HD • Crack-Proof',
    },
    {
      id: 'embroidery',
      number: '02',
      title: 'Computerized 12-Head Tajima Embroidery',
      summary: 'High-density micro-stitching and 3D puff embroidery for corporate polos and caps.',
      details: [
        'Automated thread tension sensors ensure zero puckering or loose loops',
        'Premium metallic and high-tensile polyester threads with UV resistance',
        'Reinforced backing for skin-friendly comfort on daily-wear uniforms',
      ],
      tag: 'Needlework Craft',
      highlight: '3D Puff • 12,000+ Stitches/Item',
    },
    {
      id: 'fabrics',
      number: '03',
      title: 'Sustainably Sourced Combed Cotton',
      summary: '100% bio-washed cotton and heavy pique fabrics engineered specifically for corporate longevity.',
      details: [
        'Pre-shrunk fabric construction ensuring < 2% dimensional shrinkage after washing',
        'Available in 200 GSM, 240 GSM, and 280 GSM heavyweight options',
        'OEKO-TEX Standard 100 certified, hypoallergenic, and gentle on sensitive skin',
      ],
      tag: 'Material Science',
      highlight: 'Bio-Washed • Zero Shrinkage',
    },
    {
      id: 'quality-control',
      number: '04',
      title: '4-Point Strict Quality Assurance',
      summary: 'Every batch undergoes rigorous manual and automated inspection before packing.',
      details: [
        'Seam-pull tensile testing and dimensional tolerance validation',
        'Automated barcode tracking tied to individual order serials (e.g. ZB001)',
        'Steam-ironed, lint-cleared, and individually sealed in biodegradable poly packaging',
      ],
      tag: 'Quality Standard',
      highlight: '100% Inspected • Zero Defect SLA',
    },
    {
      id: 'logistics',
      number: '05',
      title: 'Express Pan-India Logistics',
      summary: 'Direct factory integration with Delhivery, BlueDart, and express surface partners.',
      details: [
        'Real-time automated waybill generation and WhatsApp milestone tracking',
        'Doorstep delivery to 19,000+ PIN codes across all 28 states and union territories',
        'Optional split-shipping directly to remote employees’ home addresses nationwide',
      ],
      tag: 'Fulfillment',
      highlight: 'Doorstep Delivery • Real-Time Tracking',
    },
  ];

  const pillars = [
    {
      title: 'Factory-Direct Ownership',
      desc: 'No middleman markups or outsourced broker uncertainty. From yarn knitting and dyeing to final stitching, we manage the supply chain directly.',
      icon: Factory,
      badge: 'Zero Middlemen',
    },
    {
      title: 'Interactive 3D Web Customizer',
      desc: 'Empowering design teams to upload vectors, test colorways, and preview embroidery textures in real-time 3D before committing to bulk runs.',
      icon: Cpu,
      badge: 'Real-Time 3D',
    },
    {
      title: 'Transparent Tiered Pricing',
      desc: 'Instant, volume-based pricing with automated tier discounts at 20, 50, 100, 250, and 500+ units. Zero surprise setup fees or hidden handling charges.',
      icon: Layers,
      badge: 'Zero Hidden Fees',
    },
    {
      title: 'Enterprise-Grade QC Rigor',
      desc: 'Every garment is pull-tested, steam-pressed, and barcode-scanned before sealing in biodegradable packaging. Consistent color accuracy batch after batch.',
      icon: ShieldCheck,
      badge: '4-Point Inspection',
    },
    {
      title: 'Dedicated Account Managers',
      desc: 'Get a dedicated production specialist who handles digital proofs, sample approvals, and custom size runs with instant WhatsApp and phone assistance.',
      icon: Users,
      badge: '1-on-1 Support',
    },
    {
      title: 'Guaranteed 5–7 Day SLA',
      desc: 'Never miss a product launch, annual conference, or onboarding cohort. We commit to strict production timelines with proactive schedule tracking.',
      icon: Clock,
      badge: 'Time-Definite',
    },
  ];

  const industryVerticals = [
    {
      title: 'High-Growth Tech Startups',
      description: 'Employee welcome swag boxes, hackathon tees, milestone polos, and branded team caps.',
      examples: 'Welcome Kits • Tech Polos • Team Caps',
      iconBoxBg: 'bg-blue-50 text-[#3B6FEB] border-blue-200',
      icon: Sparkles,
    },
    {
      title: 'Universities & Student Bodies',
      description: 'Durable festival merchandise, department jackets, sports club jerseys, and alumni memorabilia.',
      examples: 'College Fest Tees • Sports Kits • Heavy Varsity Jackets',
      iconBoxBg: 'bg-purple-50 text-purple-600 border-purple-200',
      icon: Award,
    },
    {
      title: 'Corporate Enterprises & BFSI',
      description: 'Formal corporate pique polos, branded caps, brass-engraved desk sets, and client hampers.',
      examples: 'Executive Polos • Embroidered Caps',
      iconBoxBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      icon: Building2,
    },
    {
      title: 'Retail, Hospitality & Events',
      description: 'Heavy-duty uniform polos, embroidered aprons, branded caps, and frontline staff apparel.',
      examples: 'Durable Aprons • Staff Polos • Embroidered Caps',
      iconBoxBg: 'bg-amber-50 text-amber-600 border-amber-200',
      icon: Globe,
    },
  ];

  const faqs = [
    {
      q: 'What is ZOBBRA’s Minimum Order Quantity (MOQ)?',
      a: 'We keep custom corporate manufacturing accessible to teams of all sizes. Our baseline MOQ is just 20 units for custom printed apparel, and 50 units for computerized embroidery. Volume discount tiers unlock automatically at 50, 100, 250, and 500+ units.',
    },
    {
      q: 'Can we inspect physical samples before mass production?',
      a: 'Yes! For bulk corporate orders (100+ units), we provide pre-production strike-off proofs or physical sample kits so your leadership team can inspect fabric drape, stitch density, and Pantone print accuracy before initiating full production.',
    },
    {
      q: 'How does ZOBBRA ensure print and color durability?',
      a: 'We use industrial multi-pass DTF technology with Japanese reactive inks and curing ovens. Every batch is wash-tested up to 50 cycles to guarantee zero cracking, peeling, or fading under commercial laundering.',
    },
    {
      q: 'Do you offer split-shipping to remote employees across India?',
      a: 'Absolutely. Many of our corporate clients use ZOBBRA for pan-India onboarding kits. Simply provide a secure spreadsheet of employee addresses and sizes, and our logistics team handles individual boxing and tracked doorstep delivery.',
    },
    {
      q: 'How does B2B invoicing and GST input credit work?',
      a: 'All ZOBBRA orders include formal, GST-compliant tax invoices with relevant HSN codes (e.g., HSN 6109 for knitted apparel) and clear GST breakdowns, allowing your finance team to claim 100% eligible input tax credit seamlessly.',
    },
  ];

  return (
    <div className="w-full bg-white text-[#111111] selection:bg-[#3B6FEB] selection:text-white">
      {/* ── 1. Hero Section: Matches Website Stone & Light Aesthetic ── */}
      <section className="relative bg-[#F7F6F2] pt-8 sm:pt-10 lg:pt-12 pb-10 sm:pb-12 lg:pb-14 border-b border-[#DDDCD5] overflow-hidden">
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#3B6FEB]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Content */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-4 lg:col-span-7"
            >
              {/* Category Eyebrow & Brand SaaS Pill (Cypress target: ABOUT ZOBBRA, Modern B2B Merchandise SaaS) */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#666666] font-heading">
                  ABOUT ZOBBRA
                </span>
                <span className="text-[#DDDCD5]">•</span>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#DDDCD5] text-[11px] font-bold text-[#3B6FEB] shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span>Modern B2B Merchandise SaaS</span>
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[50px] font-heading font-black text-[#111111] tracking-[-0.03em] leading-[1.1]">
                Engineering the Future of{' '}
                <span className="text-[#3B6FEB]">
                  Custom Corporate Merchandise
                </span>
              </h1>

              {/* Sub-copy */}
              <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed max-w-2xl">
                ZOBBRA bridges digital web-to-print technology with direct industrial manufacturing.
                Headquartered in Bhubaneswar, Odisha, we deliver high-density embroidery, photographic DTF apparel,
                and custom welcome kits to 500+ enterprises, universities, and organizations across India.
              </p>

              {/* Highlights Pill Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: '5–7 Days SLA', sub: 'Guaranteed dispatch' },
                  { label: 'Factory Direct', sub: 'Zero broker markup' },
                  { label: '50+ Washes', sub: 'Tested durability' },
                  { label: 'Pan-India', sub: '19,000+ PIN codes' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="px-3 py-2.5 rounded-xl bg-white border border-[#DDDCD5] shadow-sm"
                  >
                    <div className="text-xs sm:text-sm font-black text-[#111111] font-heading">{item.label}</div>
                    <div className="text-[11px] text-[#666666] mt-0.5">{item.sub}</div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  id="about-hero-get-quote-btn"
                  href="/get-quote"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#111111] hover:bg-[#3B6FEB] text-white text-xs sm:text-sm font-bold tracking-wider uppercase rounded-full transition-all shadow-md active:scale-[0.98] group"
                >
                  <span>Request Instant Quote</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  id="about-hero-customizer-btn"
                  href="/products/polo-200gsm"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-[#F7F6F2] text-[#111111] text-xs sm:text-sm font-bold tracking-wider uppercase rounded-full border border-[#DDDCD5] transition-all shadow-sm active:scale-[0.98]"
                >
                  <Cpu className="w-4 h-4 text-[#3B6FEB]" />
                  <span>Launch 3D Customizer</span>
                </Link>

                <a
                  id="about-hero-whatsapp-btn"
                  href="https://wa.me/919124449665?text=Hi%20ZOBBRA%20team,%20I%20would%20like%20to%20inquire%20about%20custom%20corporate%20merchandise."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </motion.div>

            {/* Right Media Frame */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.15, ease: 'easeOut' }}
              className="lg:col-span-5 relative"
            >
              <div className="relative rounded-2xl overflow-hidden bg-white border border-[#DDDCD5] shadow-xl group aspect-[4/3]">
                <Image
                  src="/images/about/zobbra-team.jpg"
                  alt="ZOBBRA Corporate Merchandise and Apparel Showcase"
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Floating Micro Card: Quality Verification */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 p-3.5 rounded-xl bg-white/95 border border-[#DDDCD5] backdrop-blur-md shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#111111] font-heading">
                        Bhubaneswar Production Lab
                      </div>
                      <div className="text-[11px] text-[#666666]">
                        In-House DTF & Embroidery Facility
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                    ISO & OEKO-TEX
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. Impact Metrics / Live Numbers Bar ── */}
      <section className="bg-white py-8 sm:py-10 border-b border-[#E5E7EB]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FC] border border-[#E5E7EB] hover:border-[#3B6FEB] hover:bg-white hover:shadow-md transition-all group"
              >
                <div className="text-2xl sm:text-3xl lg:text-[34px] font-heading font-black text-[#111111] group-hover:text-[#3B6FEB] transition-colors leading-tight">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#111111] mt-1.5 font-heading">
                  {stat.label}
                </div>
                <div className="text-[11px] text-[#666666] mt-1 leading-snug">
                  {stat.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Interactive Manufacturing & Craftsmanship Pipeline ── */}
      <section className="py-10 sm:py-12 lg:py-14 bg-[#F7F6F2] border-b border-[#DDDCD5] relative">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-3xl mb-8">
            <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#666666] font-heading block mb-1.5">
              INSIDE OUR BHUBANESWAR PRODUCTION LAB
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-heading font-black text-[#111111] tracking-tight leading-tight">
              From Raw Combed Cotton to Precision Finished Corporate Merchandise
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-2 leading-relaxed">
              Unlike online broker aggregators who outsource your work to disparate third parties, ZOBBRA operates
              its own cutting, printing, computerized embroidery, and QC facilities. Explore the stages of our production line:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Step Navigation Tabs */}
            <div className="lg:col-span-5 space-y-2">
              {manufacturingSteps.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-start gap-3 border ${
                      isActive
                        ? 'bg-white border-2 border-[#3B6FEB] shadow-md'
                        : 'bg-white/80 border-[#DDDCD5] hover:border-slate-400 hover:bg-white'
                    }`}
                  >
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-[#3B6FEB] text-white'
                          : 'bg-slate-100 text-[#666666]'
                      }`}
                    >
                      {step.number}
                    </span>

                    <div className="flex-1">
                      <h3 className={`text-sm sm:text-base font-heading font-bold ${isActive ? 'text-[#111111]' : 'text-[#374151]'}`}>
                        {step.title}
                      </h3>
                      <p className="text-xs text-[#666666] mt-1 line-clamp-2">
                        {step.summary}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step Detail Display Box & Facility Photo */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-2xl bg-white border border-[#DDDCD5] p-5 sm:p-6 space-y-4 shadow-lg"
                >
                  <div className="relative aspect-[2/1] w-full rounded-xl overflow-hidden border border-[#DDDCD5]">
                    <Image
                      src="/images/about/zobbra-lab.jpg"
                      alt="ZOBBRA Manufacturing Facility & Print Technology"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-[#111111] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#DDDCD5] shadow-sm">
                      <span className="font-mono font-semibold text-xs">Stage: {manufacturingSteps[activeStep].tag}</span>
                      <span className="text-[#3B6FEB] font-bold text-xs">{manufacturingSteps[activeStep].highlight}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#3B6FEB] font-bold uppercase tracking-wider">
                        Stage {manufacturingSteps[activeStep].number} Specification
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-heading font-black text-[#111111]">
                      {manufacturingSteps[activeStep].title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                      {manufacturingSteps[activeStep].summary}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-[#E5E7EB]">
                    <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666]">
                      Engineering Standards & Benchmarks
                    </h4>
                    <ul className="space-y-2">
                      {manufacturingSteps[activeStep].details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#374151]">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. The 6 Enterprise Pillars (Bento Grid) ── */}
      <section className="py-10 sm:py-12 lg:py-14 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#666666] font-heading block">
              THE ZOBBRA ADVANTAGE
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-heading font-black text-[#111111] tracking-tight">
              Why 500+ Organizations Choose Us
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              We built the platform we wished existed when ordering corporate apparel: zero friction, absolute quality, and transparent pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="rounded-2xl bg-[#F8F9FC] border border-[#E5E7EB] p-5 sm:p-6 hover:border-[#3B6FEB] hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] border border-[#D9E2FF] flex items-center justify-center text-[#3B6FEB] group-hover:scale-110 group-hover:bg-[#3B6FEB] group-hover:text-white transition-all duration-300 shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#666666] bg-white border border-[#E5E7EB] px-2.5 py-0.5 rounded-md">
                        {pillar.badge}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-heading font-bold text-[#111111] group-hover:text-[#3B6FEB] transition-colors">
                      {pillar.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Industry Verticals We Power ── */}
      <section className="py-10 sm:py-12 lg:py-14 bg-[#F7F6F2] border-b border-[#DDDCD5]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-3">
            <div>
              <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#666666] font-heading block mb-1">
                CUSTOM SOLUTIONS BY INDUSTRY
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#111111] tracking-tight">
                Designed for Teams with Exacting Standards
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs sm:text-sm font-bold text-[#3B6FEB] hover:text-[#2563EB] inline-flex items-center gap-1 group"
            >
              <span>View Full Catalog</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {industryVerticals.map((vert, idx) => {
              const Icon = vert.icon;
              return (
                <motion.div
                  key={vert.title}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="p-5 rounded-2xl bg-white border border-[#DDDCD5] shadow-sm hover:shadow-md hover:border-[#3B6FEB] transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm ${vert.iconBoxBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-heading font-bold text-[#111111]">
                      {vert.title}
                    </h3>
                    <p className="text-xs text-[#666666] leading-relaxed">
                      {vert.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB]">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold mb-0.5">
                      Popular Products
                    </div>
                    <div className="text-xs font-semibold text-[#111111]">
                      {vert.examples}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. Transparent FAQ Accordion ── */}
      <section className="py-10 sm:py-12 lg:py-14 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 space-y-1.5">
            <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#666666] font-heading block">
              CLEAR & HONEST ANSWERS
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#111111] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              Everything corporate buyers and procurement officers ask about our operations.
            </p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FC] overflow-hidden hover:border-[#DDDCD5] transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-4 text-sm sm:text-base font-heading font-bold text-[#111111] hover:text-[#3B6FEB] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#666666] shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-[#3B6FEB]' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-5 pb-4 text-xs sm:text-sm text-[#4B5563] leading-relaxed border-t border-[#E5E7EB] pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 7. High-Converting Signature Brand CTA ── */}
      <section className="bg-[#F7F6F2] py-10 sm:py-12 lg:py-14">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#3B6FEB] text-white rounded-[2rem] px-6 py-8 sm:p-10 lg:px-14 lg:py-12 shadow-[0_20px_45px_-15px_rgba(59,111,235,0.4)] border border-[#5B84F1] text-center space-y-5 max-w-[1000px] mx-auto relative overflow-hidden"
          >
            {/* Subtle top ambient sheen */}
            <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-white">
                Ready to Upgrade Your Merchandise?
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-heading font-black text-white tracking-tight leading-tight max-w-2xl mx-auto">
              Get Factory-Direct Pricing and Digital Proofs in Minutes
            </h2>

            <p className="text-xs sm:text-sm text-[#D9E2FF] max-w-xl mx-auto leading-relaxed">
              Whether you need 20 welcome kits for your startup team or 5,000 corporate polos for an annual summit,
              our Bhubaneswar manufacturing team is equipped to deliver.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                id="about-footer-quote-btn"
                href="/get-quote"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white hover:bg-[#EEF2FF] text-[#111111] text-xs sm:text-sm font-extrabold tracking-wider uppercase rounded-full transition-all shadow-md hover:shadow-xl active:scale-[0.98] group"
              >
                <span>Get Free Instant Quote</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                id="about-footer-products-btn"
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold tracking-wider uppercase rounded-full border border-white/25 transition-all backdrop-blur-md active:scale-[0.98]"
              >
                <span>Browse Products</span>
              </Link>

              <a
                id="about-footer-whatsapp-btn"
                href="https://wa.me/919124449665?text=Hi%20ZOBBRA%20team,%20I%20would%20like%20to%20order%20custom%20merchandise."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:text-emerald-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Talk to an Expert</span>
              </a>
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#D9E2FF]">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-white" /> Free Digital Mockups
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-white" /> GST Invoice Included
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-white" /> 100% Quality Guarantee
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
