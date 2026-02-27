import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#3d2c1e] text-[#e8d5be] mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🧶</span>
              <span className="text-xl font-bold text-[#f5ede0]">
                The Twisted Threads
              </span>
            </div>
            <p className="text-sm text-[#c4a882] leading-relaxed">
              Handcrafted crochet bouquets and goods made with love. Every petal
              is stitched to last forever.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-[#f5ede0] mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-[#c4a882] hover:text-[#f5ede0] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/bouquet-builder"
                  className="text-[#c4a882] hover:text-[#f5ede0] transition-colors"
                >
                  Build a Bouquet
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="text-[#c4a882] hover:text-[#f5ede0] transition-colors"
                >
                  Shop
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-[#f5ede0] mb-3">Get in Touch</h3>
            <p className="text-sm text-[#c4a882]">
              Questions about your order? We&apos;d love to hear from you.
            </p>
            <p className="text-sm text-[#c4a882] mt-2">
              📧 hello@thepetalloop.com
            </p>
          </div>
        </div>

        <div className="border-t border-[#5c3a1e] mt-8 pt-6 text-center text-xs text-[#a07850]">
          <p>
            © {new Date().getFullYear()} The Twisted Threads. Made with 🧶 and love.
          </p>
          <p className="mt-1">
            <Link
              href="/admin/login"
              className="hover:text-[#c4a882] transition-colors"
            >
              Owner Login
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
