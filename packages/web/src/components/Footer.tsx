"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className=" text-white"
    >
      {/* Decorative gradient top border */}
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-pink-500" />

      {/* Main footer */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-3xl">🎯</span>
              <span className="text-2xl font-bold text-white">Jobloom</span>
            </div>
            <p className="text-sm leading-relaxed">
              Revealing the hidden job market, one sponsored listing at a time.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/#how-it-works"
                  className="hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>

              <li>
                <a
                  href="https://chrome.google.com/webstore/detail/jobloom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Chrome Extension
                </a>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-white transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="hover:text-white transition-colors"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <Separator className="bg-gray-800" />
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center justify-between text-sm bg-secondary gap-2">
          <p className="text-gray-900">
            © {currentYear} Jobloom. All rights reserved.
          </p>

          <div className="flex space-x-6 mt-4 md:mt-0">
            {/* GitHub */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-black"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12a12 12 0 008.21 11.44c.6.11.82-.26.82-.57v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.86 2.83 1.32 3.52 1 .11-.78.42-1.32.76-1.63-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.25-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.52 11.52 0 016 0c2.3-1.55 3.29-1.23 3.29-1.23.66 1.65.25 2.87.12 3.17.78.84 1.25 1.91 1.25 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.22.69.82.57A12 12 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>

            {/* Twitter */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-black"
                aria-hidden="true"
              >
                <path d="M23.954 4.569c-.885.392-1.83.656-2.825.775 1.014-.611 1.794-1.574 2.163-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.126 1.124C7.69 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.708.87 3.213 2.19 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.956 2.445 3.377 4.604 3.419-1.68 1.318-3.808 2.105-6.102 2.105-.395 0-.779-.023-1.17-.067C2.29 19.292 5.017 20 7.87 20c9.405 0 14.55-7.788 14.55-14.542 0-.22-.004-.439-.014-.657.996-.719 1.86-1.62 2.544-2.657z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-black"
                aria-hidden="true"
              >
                <path d="M20.447 20.452H17.4v-5.569c0-1.328-.024-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.941v5.665H10.36V9h2.915v1.561h.041c.406-.77 1.398-1.58 2.877-1.58 3.072 0 3.638 2.021 3.638 4.654v6.817zM5.337 7.433a1.688 1.688 0 110-3.376 1.688 1.688 0 010 3.376zM6.856 20.452H3.814V9h3.042v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.225.792 24 1.771 24h20.451C23.2 24 24 23.225 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
