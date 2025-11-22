'use client';

import React, { useState, useEffect } from 'react';
import { Roboto_Mono } from 'next/font/google';
import { ArrowRight, Box, Layers, FileJson, Maximize2, ChevronDown, LucideIcon } from 'lucide-react';

import { supabaseClient } from '@/utils/supabaseClient'; // Ensure it's a named export, otherwise use default

// Load font via Next.js optimization
const robotoMono = Roboto_Mono({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

// --- Sub-components ---

const GridBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
       style={{
         backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
         backgroundSize: '40px 40px'
       }}
  />
);

const AnimatedCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };
    window.addEventListener('mousemove', updatePosition);
    return () => window.removeEventListener('mousemove', updatePosition);
  }, [visible]);

  if (!visible) return null;

  return (
    <div 
      className="fixed w-4 h-4 border border-black rotate-45 pointer-events-none z-50 mix-blend-difference transition-transform duration-75 ease-out hidden md:block"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translate(-50%, -50%) rotate(45deg)'
      }} 
    />
  );
};

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  label: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, label, description }: FeatureCardProps) => (
  <div className="border-t border-neutral-200 p-6 md:p-8 flex flex-col h-full group hover:bg-neutral-50 transition-colors cursor-default">
    <div className="flex justify-between items-start mb-6">
      <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">{label}</span>
      <Icon className="w-5 h-5 text-neutral-900 stroke-1" />
    </div>
    <h3 className="font-mono text-lg mb-2 font-medium">{title}</h3>
    <p className="font-mono text-sm text-neutral-500 leading-relaxed mt-auto">
      {description}
    </p>
  </div>
);

// --- Main Component ---

export default function ArchIvLanding() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        
        setStatus('loading');

        const { error } = await supabaseClient
        .from('waitlist')
        .insert([{ email }]);

        if (error) {
        console.error('Submission error:', error);
        setStatus('idle');
        // Optional: Add a toast/alert here
        } else {
        setStatus('success');
        setEmail('');
        }
    };

  return (
    <div className={`min-h-screen bg-[#FAFAFA] text-neutral-900 selection:bg-neutral-900 selection:text-white relative flex flex-col ${robotoMono.className}`}>
      <style jsx global>{`
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; }
        ::-webkit-scrollbar-thumb:hover { background: #a3a3a3; }
      `}</style>

      <GridBackground />
      <AnimatedCursor />

      {/* --- Navigation --- */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-6 py-4 bg-[#FAFAFA]/80 backdrop-blur-sm border-b border-neutral-200">
        <div className="text-xs font-bold tracking-widest flex items-center gap-2">
          <img src="/images/asterisk_light.png" alt="ARCH-IV Logo" className="w-4" />
          ARCH-IV
        </div>
        <div className="flex gap-6 text-xs font-medium tracking-tight">
          <a href="#" className="hover:underline underline-offset-4">MANIFESTO</a>
          <span className="opacity-50 cursor-not-allowed">LOGIN</span>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="flex-grow flex flex-col pt-20 relative z-10">
        
        {/* Hero Section */}
        <section className="flex-grow flex flex-col justify-center items-center px-4 py-24 md:py-32 border-b border-neutral-200">
          
          <div className="absolute top-32 left-8 hidden md:block">
            <p className="text-[10px] text-neutral-400 flex flex-col gap-1">
              <span>COORDS: 6.8917° S, 107.6117° E</span>
              <span>EST: 2025</span>
              <span>STATUS: PRE-ALPHA</span>
            </p>
          </div>

          <div className="max-w-4xl w-full text-center space-y-12">
            <div className="relative inline-block">
              <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-none select-none">
                ARCH-IV
              </h1>
              <span className="absolute -top-4 -right-4 md:-right-8 text-xs bg-neutral-900 text-white px-2 py-1 rotate-12">
                BETA ACCESS
              </span>
            </div>

            <p className="text-sm md:text-base max-w-md mx-auto text-neutral-500 leading-relaxed">
              The central repository for student architectural works. 
              Storing raw 3D assets, 2D technical drawings, and project metadata in a unified whitelist-only ecosystem.
            </p>

            {/* Whitelist Form */}
            <div className="max-w-md mx-auto w-full">
              {status === 'success' ? (
                <div className="p-4 border border-neutral-900 bg-neutral-50 text-center animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-sm font-medium">Request received.</p>
                  <p className="text-xs text-neutral-500 mt-1">We will contact you once your node is ready.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 md:gap-0">
                  <input 
                    type="email" 
                    required
                    placeholder="UNIVERSITY EMAIL"
                    className="flex-grow bg-transparent border border-neutral-300 p-4 text-sm focus:outline-none focus:border-neutral-900 focus:ring-0 placeholder:text-neutral-400 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                  />
                  <button 
                    type="submit"
                    disabled={status === 'loading'}
                    className="bg-neutral-900 text-white px-8 py-4 md:py-0 text-sm font-medium hover:bg-neutral-700 active:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'loading' ? 'PROCESSING...' : 'REQUEST ACCESS'}
                    {status !== 'loading' && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              )}
              <p className="text-[10px] text-neutral-400 mt-4 text-center uppercase tracking-wider">
                compounds design knowledge.
              </p>
            </div>
          </div>

          <div className="absolute bottom-8 animate-bounce hidden md:block">
             <ChevronDown className="w-4 h-4 text-neutral-300" />
          </div>
        </section>

        {/* Data Grid Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200 border-b border-neutral-200 bg-white">
          <FeatureCard 
            title="Spatial Storage"
            label="01 — 3D"
            icon={Box}
            description="Native hosting for Rhino, Revit, and OBJ files. View models directly in the browser without heavy downloads."
          />
          <FeatureCard 
            title="Technical Sets"
            label="02 — 2D"
            icon={Layers}
            description="High-resolution vector support for plans, sections, and axonometric drawings. Zoom without quality loss."
          />
          <FeatureCard 
            title="Project Metadata"
            label="03 — DATA"
            icon={FileJson}
            description="Structured tagging system for typology, year, and materials. Making student work indexable and searchable."
          />
        </section>
        
        {/* Horizontal Ticker / Footer Area */}
        <section className="py-12 md:py-24 px-6 border-b border-neutral-200">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
               <h4 className="text-sm font-bold uppercase tracking-wider">Supported Formats</h4>
               <div className="flex flex-wrap gap-2 max-w-sm">
                 {['.3DM', '.RVT', '.DWG', '.AI', '.OBJ', '.PDF', '.IFC'].map((ext) => (
                   <span key={ext} className="text-xs border border-neutral-200 px-2 py-1 text-neutral-500">
                     {ext}
                   </span>
                 ))}
               </div>
            </div>
            <Maximize2 className="w-12 h-12 text-neutral-100 stroke-1" />
          </div>
        </section>

      </main>

      {/* --- Footer --- */}
      <footer className="bg-[#F5F5F5] py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase text-neutral-400 tracking-widest relative z-10">
        <div>
          &copy; {new Date().getFullYear()} ARCH-IV SYSTEM
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-neutral-900 transition-colors">Privacy</a>
          <a href="#" className="hover:text-neutral-900 transition-colors">Terms</a>
          <a href="#" className="hover:text-neutral-900 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}