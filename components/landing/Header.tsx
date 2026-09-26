'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '/dashboard', label: 'New Risk' },
  { href: '/dashboard/portfolio', label: 'Portfolio' },
  { href: '/dashboard/explore', label: 'Explore' },
  { href: '#faq', label: 'FAQ' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border3/50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zenblue to-zenpurple flex">
            <span className="text-[20px] font-brand text-center mx-auto rotate-[-10deg] ml-[5px] mt-[1px]">W</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Wayfind</span>
        </Link>

        <nav className="hidden md:flex font-display items-center gap-7 text-[13px] text-white/50 font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/dashboard" className="text-[13px] font-display font-medium bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors">
            Launch App
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-white/60 hover:text-white transition-colors">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border3/50 bg-surface px-6 py-4 space-y-3 overflow-hidden"
          >
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block text-[14px] text-white/50 hover:text-white font-display font-medium transition-colors">{link.label}</Link>
            ))}
            <Link href="/dashboard" onClick={() => setOpen(false)} className="block mt-4 text-center text-[13px] font-display font-medium bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors">
              Launch App
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
