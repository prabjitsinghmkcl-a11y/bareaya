import React from "react";
import { Leaf, Droplet, Sparkles, Truck, Wallet, PackageSearch, MessageCircleQuestion } from "lucide-react";
import { optimised } from "../utils/cloudinary";
import "../styles/about.css";

// This page is styled entirely by about.css, which targets
// `.about-page > section:nth-of-type(n)`. Two consequences for this file:
//   1. Element order and nesting must not change, or the CSS stops matching.
//   2. Presentation belongs in about.css, not in utility classes or inline
//      styles here. The heading font/weight overrides that used to sit inline
//      were already being beaten by `!important` in about.css.
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
    <div className="about-page" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {/* Hero */}
      <section>
        <p data-reveal>About Bareaya</p>
        <h1 data-reveal style={{ '--reveal-delay': '90ms' }}>
          Pure. Purposeful. Rooted.
        </h1>
        <p style={{ '--reveal-delay': '180ms' }} data-reveal>
          A skincare line built at the meeting point of Canadian science and
          Indian tradition — gentle enough for every skin, honest enough to
          mean something.
        </p>
      </section>

      {/* Founder */}
      <section>
        <div>
          <div data-reveal>
            <div />
            <img
              src={optimised("https://res.cloudinary.com/aao6ldeb/image/upload/v1789571545/bareaya/site/founder-image.jpg", "founder")}
              alt="Chandni Anand, Founder of Bareaya"
              loading="lazy"
              decoding="async"
              width={900}
              height={1125}
            />
          </div>
          <div style={{ '--reveal-delay': '150ms' }} data-reveal>
            <p>From the Founder</p>
            <p>
              Bareaya's philosophy is to gently nourish, heal, and enhance the
              skin's natural glow — without causing harm.
            </p>
            <p>
              Inspired by clean beauty and nature-led care, Bareaya turns
              everyday skincare into something fresh, healthy, and honestly
              beautiful — suitable for every skin type it meets.
            </p>
            <div>
              <div />
              <div>
                <p>CHANDNI ANAND</p>
                <p>Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section>
        <div>
          <p data-reveal>Our Story</p>
          <h2 data-reveal style={{ '--reveal-delay': '90ms' }}>
            Born in Montreal, rooted in India
          </h2>
          <div style={{ '--reveal-delay': '180ms' }} data-reveal>
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
      <section>
        <div>
          {features.map(({ icon: Icon, title, text }, index) => (
            <div
              key={title}
              style={{ '--reveal-delay': `${index * 120}ms` }}
              data-reveal
            >
              <Icon size={28} strokeWidth={1.5} color="#8B5E3C" />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Instagram gallery */}
      <section>
        <div>
          <div data-reveal>
            <InstagramIcon size={18} strokeWidth={1.5} />
            <p>Follow Us @bareaya.skin</p>
          </div>
          <div>
            {galleryImages.map((src, i) => (
              <a
                key={i}
                href="https://instagram.com/bareaya.skin"
                target="_blank"
                rel="noreferrer"
                style={{ '--reveal-delay': `${i * 70}ms` }}
                data-reveal
              >
                <img
                  src={optimised(src, 'gallery')}
                  alt="Bareaya on Instagram"
                  loading="lazy"
                  decoding="async"
                  width={420}
                  height={420}
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer highlights strip */}
      <section>
        <div>
          {footerHighlights.map(({ icon: Icon, title, text }, index) => (
            <div
              key={title}
              style={{ '--reveal-delay': `${index * 90}ms` }}
              data-reveal
            >
              <Icon size={22} strokeWidth={1.5} color="#8B5E3C" />
              <div>
                <p>{title}</p>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
