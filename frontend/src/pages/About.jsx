import React from "react";
import { Leaf, Droplet, Sparkles, Truck, Wallet, PackageSearch, MessageCircleQuestion } from "lucide-react";
import "../styles/about.css";

const InstagramIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600;700&display=swap');`;

const galleryImages = [
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571544/bareaya/site/gallery-img-6.jpg",
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571543/bareaya/site/gallery-img-5.jpg",
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571542/bareaya/site/gallery-img-4.jpg",
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571541/bareaya/site/gallery-img-3.jpg",
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571540/bareaya/site/gallery-img-2.jpg",
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571539/bareaya/site/gallery-img-1.jpg",
];

const features = [
  {
    icon: Droplet,
    title: "All Skin Types",
    text: "Formulated to sit gently on every skin type, from sensitive to oily, without stripping its natural balance.",
  },
  {
    icon: Leaf,
    title: "Pure Organic",
    text: "Sourced ingredients, kept as close to their natural state as possible, with nothing unnecessary added in.",
  },
  {
    icon: Sparkles,
    title: "Natural Care",
    text: "Rituals built on tradition and backed by science, so care feels familiar and results feel real.",
  },
];

const footerHighlights = [
  { icon: Truck, title: "Free Delivery", text: "For Delhi-NCR Only" },
  { icon: Wallet, title: "Easy Payment", text: "COD Available" },
  { icon: PackageSearch, title: "Track Order", text: "Easy shipping" },
  { icon: MessageCircleQuestion, title: "Have Questions?", text: "Reach Us Here" },
];

export default function AboutPage() {
  return (
    <div className="about-page bg-[#FAF6EF] text-[#20291B]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center max-w-3xl mx-auto">
        <p className="text-sm tracking-wide text-[#7A6A4E] mb-3" data-reveal>About Bareaya</p>
        <h1
          className="text-4xl sm:text-6xl leading-[1.1] mb-5"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, '--reveal-delay': '90ms' }}
          data-reveal
        >
          Pure. Purposeful. Rooted.
        </h1>
        <p className="text-[#4B5240] text-base sm:text-lg leading-relaxed" style={{ '--reveal-delay': '180ms' }} data-reveal>
          A skincare line built at the meeting point of Canadian science and
          Indian tradition — gentle enough for every skin, honest enough to
          mean something.
        </p>
      </section>

      {/* Founder */}
      <section className="px-6 pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-[0.85fr_1fr] gap-10 sm:gap-16 items-center">
          <div className="relative" data-reveal>
            <div className="absolute -inset-3 border border-[#C68A3D]/30 rounded-sm hidden sm:block" />
            <img
              src="https://res.cloudinary.com/aao6ldeb/image/upload/v1789571545/bareaya/site/founder-image.jpg"
              alt="Chandni Anand, Founder of Bareaya"
              className="w-full aspect-[4/5] object-cover rounded-sm relative"
            />
          </div>
          <div style={{ '--reveal-delay': '150ms' }} data-reveal>
            <p className="text-sm tracking-wide text-[#7A6A4E] mb-3">From the Founder</p>
            <p
              className="text-2xl sm:text-3xl leading-snug mb-6 text-[#2A331F]"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
            >
              Bareaya's philosophy is to gently nourish, heal, and enhance the
              skin's natural glow — without causing harm.
            </p>
            <p className="text-[#4B5240] leading-relaxed mb-8">
              Inspired by clean beauty and nature-led care, Bareaya turns
              everyday skincare into something fresh, healthy, and honestly
              beautiful — suitable for every skin type it meets.
            </p>
            <div className="flex items-center gap-4">
              <div className="h-px w-10 bg-[#2F3B28]" />
              <div>
                <p className="text-sm font-semibold tracking-wide">CHANDNI ANAND</p>
                <p className="text-sm text-[#7A6A4E]">Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-[#2F3B28] text-[#F3EFE3] px-6 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm tracking-wide text-[#C68A3D] mb-4" data-reveal>Our Story</p>
          <h2
            className="text-3xl sm:text-4xl mb-8 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, '--reveal-delay': '90ms' }}
            data-reveal
          >
            Born in Montreal, rooted in India
          </h2>
          <div className="space-y-5 text-[#DDE0CE] leading-relaxed text-base sm:text-lg" style={{ '--reveal-delay': '180ms' }} data-reveal>
            <p>
              Bareaya began with a simple belief — skincare should be clean,
              conscious, and rooted in tradition. Living in Canada shaped my
              love for chemical-free, science-backed skincare, while my
              upbringing kept me deeply connected to India.
            </p>
            <p>
              Growing up as the daughter of an Indian restaurant owner, I was
              surrounded by the aromas of my father's kitchen and the wisdom
              of my mother's home remedies. Turmeric, lentils, aloe, herbs —
              these were not trends, they were a way of life.
            </p>
            <p>
              Bareaya exists to reconnect Indians to their roots, without
              compromising on modern skin science. Each product is a fusion
              of Canadian skincare science and time-tested Indian
              ingredients, thoughtfully blended into one bottle.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-10 sm:gap-8">
          {features.map(({ icon: Icon, title, text }, index) => (
            <div
              key={title}
              className="text-center sm:text-left transition-transform duration-300 hover:-translate-y-1"
              style={{ '--reveal-delay': `${index * 120}ms` }}
              data-reveal
            >
              <Icon className="mx-auto sm:mx-0 mb-4" size={28} strokeWidth={1.5} color="#8B5E3C" />
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
              >
                {title}
              </h3>
              <p className="text-[#4B5240] text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Instagram gallery */}
      <section className="px-6 pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8" data-reveal>
            <InstagramIcon size={18} strokeWidth={1.5} />
            <p className="text-sm tracking-wide">Follow Us @bareaya.skin</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {galleryImages.map((src, i) => (
              <a
                key={i}
                href="https://instagram.com/bareaya.skin"
                target="_blank"
                rel="noreferrer"
                className="block aspect-square overflow-hidden"
                style={{ '--reveal-delay': `${i * 70}ms` }}
                data-reveal
              >
                <img
                  src={src}
                  alt="Bareaya on Instagram"
                  className="w-full h-full object-cover transition-all duration-300 hover:opacity-90 hover:scale-105"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer highlights strip */}
      <section className="border-t border-[#E4DCC8] px-6 py-12">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-4 gap-8">
          {footerHighlights.map(({ icon: Icon, title, text }, index) => (
            <div
              key={title}
              className="flex items-start gap-3 transition-transform duration-300 hover:-translate-y-1"
              style={{ '--reveal-delay': `${index * 90}ms` }}
              data-reveal
            >
              <Icon size={22} strokeWidth={1.5} color="#8B5E3C" className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-[#7A6A4E]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
