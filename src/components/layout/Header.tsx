"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-[#f5ede0] border-b border-[#d4b896] shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🧶</span>
            <div>
              <span className="text-xl font-bold text-[#7a4f2e] tracking-tight group-hover:text-[#5c3a1e] transition-colors">
                The Twisted Threads
              </span>
              <p className="text-xs text-[#a07850] leading-none hidden sm:block">
                Custom Crochet Florist
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-[#5c3a1e] hover:text-[#7a4f2e] font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/bouquet-builder"
              className="text-[#5c3a1e] hover:text-[#7a4f2e] font-medium transition-colors"
            >
              Build a Bouquet
            </Link>
            <Link
              href="/shop"
              className="text-[#5c3a1e] hover:text-[#7a4f2e] font-medium transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/bouquet-builder"
              className="bg-[#7a4f2e] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#5c3a1e] transition-colors"
            >
              Order Now
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-[#5c3a1e] hover:bg-[#e8d5be] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-[#d4b896] mt-2 pt-4 flex flex-col gap-3">
            <Link
              href="/"
              className="text-[#5c3a1e] hover:text-[#7a4f2e] font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/bouquet-builder"
              className="text-[#5c3a1e] hover:text-[#7a4f2e] font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Build a Bouquet
            </Link>
            <Link
              href="/shop"
              className="text-[#5c3a1e] hover:text-[#7a4f2e] font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              href="/bouquet-builder"
              className="bg-[#7a4f2e] text-white px-4 py-2 rounded-full text-sm font-semibold text-center hover:bg-[#5c3a1e] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Order Now
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
