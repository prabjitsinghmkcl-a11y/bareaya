import React from "react";
import { Link } from "react-router-dom";
import {
  Leaf,
  Droplet,
  Sparkles,
  Truck,
  Wallet,
  PackageSearch,
  MessageCircleQuestion,
  ShieldCheck,
  FlaskConical,
  ArrowRight,
  Quote,
  CheckCircle2
} from "lucide-react";
import { optimised } from "../utils/cloudinary";
import { useSiteSettings } from "../context/SiteSettingsContext";
import "../styles/about.css";

const InstagramIcon = ({ size = 20, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Manrope:wght@400;500;600;700&display=swap');`;

const galleryImages = [
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571544/bareaya/site/gallery-img-6.jpg",
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571543/bareaya/site/gallery-img-5.jpg",
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571542/bareaya/site/gallery-img-4.jpg",
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571541/bareaya/site/gallery-img-3.jpg",
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571540/bareaya/site/gallery-img-2.jpg",
  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571539/bareaya/site/gallery-img-1.jpg",
];

const pillars = [
  {
    icon: Droplet,
    tag: "Balance & Barrier",
    title: "All Skin Types",
    text: "Formulated to sit gently on every skin type — from sensitive to oily — restoring physiological balance without stripping natural lipids.",
  },
  {
    icon: Leaf,
    tag: "Ethical Harvest",
    title: "Pure & Organic",
    text: "Responsibly sourced botanicals kept as close to their unadulterated state as possible, with zero toxic fillers or unnecessary additives.",
  },
  {
    icon: Sparkles,
    tag: "Proven Synergy",
    title: "Science Meets Ritual",
    text: "Centuries of Ayurvedic apothecary wisdom elevated by modern dermatological science, so care feels comforting and results stay real.",
  },
  {
    icon: ShieldCheck,
    tag: "Conscious Living",
    title: "Clean & Kind",
    text: "100% cruelty-free, gentle on our planet, and crafted in small fresh batches to preserve maximum antioxidant potency.",
  },
];

const cleanStandards = [
  "Dermatologically Tested",
  "Cruelty-Free & Vegan",
  "No Artificial Fragrances",
  "Paraben & Sulfate Free",
  "Small-Batch Freshness",
  "pH Balanced (5.0 - 5.5)",
];

const footerHighlights = [
  { icon: Truck, title: "Free Delivery", text: "Delhi-NCR & Pan-India" },
  { icon: Wallet, title: "Easy Payment", text: "Cash on Delivery & UPI" },
  { icon: PackageSearch, title: "Tracked Shipping", text: "Live shipment updates" },
  { icon: MessageCircleQuestion, title: "Skin Concierge", text: "Expert routine advice" },
];

export default function AboutPage() {
  const { settings } = useSiteSettings();
  return (
    <div className="about-page">
      <style>{FONT_IMPORT}</style>

      {/* ---------- 1. HERO SECTION ---------- */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <div className="about-eyebrow-pill" data-reveal>
            <Leaf size={14} className="about-eyebrow-icon" />
            <span>The Bareaya Philosophy</span>
          </div>

          <h1 className="about-hero-title" data-reveal style={{ '--reveal-delay': '90ms' }}>
            Pure. Purposeful. <em>Rooted.</em>
          </h1>

          <p className="about-hero-sub" data-reveal style={{ '--reveal-delay': '180ms' }}>
            A conscious skincare line built at the meeting point of Canadian dermatological
            science and time-honoured Indian tradition — gentle enough for every skin,
            honest enough to mean something.
          </p>

          <div className="about-hero-badges" data-reveal style={{ '--reveal-delay': '240ms' }}>
            <span className="about-hero-badge">
              <FlaskConical size={14} />
              <span>Montreal Science</span>
            </span>
            <span className="about-hero-badge-sep">•</span>
            <span className="about-hero-badge">
              <Leaf size={14} />
              <span>Indian Botanicals</span>
            </span>
            <span className="about-hero-badge-sep">•</span>
            <span className="about-hero-badge">
              <ShieldCheck size={14} />
              <span>100% Non-Toxic</span>
            </span>
          </div>
        </div>
      </section>

      {/* ---------- 2. FOUNDER SECTION ---------- */}
      <section className="about-founder">
        <div className="about-founder-container">
          {/* Founder Portrait Frame */}
          <div className="about-founder-image-col" data-reveal>
            <div className="about-founder-frame">
              <div className="about-founder-backdrop" />
              <img
                src={optimised(
                  "https://res.cloudinary.com/aao6ldeb/image/upload/v1789571545/bareaya/site/founder-image.jpg",
                  "founder"
                )}
                alt="Chandni Anand, Founder of Bareaya"
                className="about-founder-img"
                loading="lazy"
                decoding="async"
                width={900}
                height={1125}
              />
              <div className="about-founder-floating-card">
                <Quote size={18} className="about-quote-icon" />
                <span>"Skincare is a daily ritual of healing."</span>
              </div>
            </div>
          </div>

          {/* Founder Words */}
          <div className="about-founder-text-col" data-reveal style={{ '--reveal-delay': '140ms' }}>
            <span className="about-section-tag">From the Founder</span>

            <blockquote className="about-founder-quote">
              "Bareaya's philosophy is to gently nourish, heal, and enhance the
              skin's natural glow — without causing harm."
            </blockquote>

            <p className="about-founder-desc">
              Inspired by clean beauty and nature-led care, Bareaya turns everyday
              skincare into something fresh, healthy, and honestly beautiful. Every
              formulation is created to sit comfortably on your vanity and become an
              indispensable ritual for your natural skin barrier.
            </p>

            <div className="about-founder-signature">
              <div className="about-founder-line" />
              <div className="about-founder-identity">
                <strong className="about-founder-name">CHANDNI ANAND</strong>
                <span className="about-founder-title">Founder &amp; Creative Formulator</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 3. OUR STORY SECTION ---------- */}
      <section className="about-story">
        <div className="about-story-container">
          <div className="about-story-header" data-reveal>
            <span className="about-story-eyebrow">Our Origins</span>
            <h2 className="about-story-title">Born in Montreal, rooted in India</h2>
          </div>

          {/* Dual Heritage Cards */}
          <div className="about-story-dual-grid" data-reveal style={{ '--reveal-delay': '120ms' }}>
            <div className="about-heritage-card">
              <div className="about-heritage-icon-box">
                <FlaskConical size={22} />
              </div>
              <h3>Canadian Skin Science</h3>
              <p>
                Living in Canada shaped my reverence for chemical-free, science-backed
                skincare. Clean cosmetic standards, rigorous safety profiles, and
                barrier-protecting biochemistry became our standard benchmark.
              </p>
            </div>

            <div className="about-heritage-card">
              <div className="about-heritage-icon-box">
                <Leaf size={22} />
              </div>
              <h3>Indian Ayurvedic Heritage</h3>
              <p>
                Growing up as the daughter of an Indian restaurant owner, I was
                surrounded by the aromas of my father's kitchen and my mother's
                home remedies. Turmeric, aloe, and soothing herbal infusions were
                a beloved way of life.
              </p>
            </div>
          </div>

          {/* Synthesis Narrative */}
          <div className="about-story-synthesis" data-reveal style={{ '--reveal-delay': '200ms' }}>
            <p>
              Bareaya exists to reconnect you to your roots, without compromising on
              modern cosmetic science. Each botanical elixir is a harmonious blend of
              Canadian formulation research and time-tested Indian herbal extracts —
              thoughtfully bottled to honor your skin's natural rhythm.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- 4. FORMULATION PILLARS ---------- */}
      <section className="about-pillars">
        <div className="about-pillars-header" data-reveal>
          <span className="about-section-tag">Our Guiding Values</span>
          <h2 className="about-pillars-title">Formulated With Intention</h2>
          <p className="about-pillars-subtitle">
            Every bottle is an uncompromised commitment to clean efficacy, gentle healing,
            and sustainable craftsmanship.
          </p>
        </div>

        <div className="about-pillars-grid">
          {pillars.map(({ icon: Icon, tag, title, text }, index) => (
            <div
              key={title}
              className="about-pillar-card"
              style={{ '--reveal-delay': `${index * 100}ms` }}
              data-reveal
            >
              <div className="about-pillar-icon-box">
                <Icon size={26} strokeWidth={1.6} />
              </div>
              <span className="about-pillar-tag">{tag}</span>
              <h3 className="about-pillar-name">{title}</h3>
              <p className="about-pillar-text">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 5. CLEAN BEAUTY STANDARDS RIBBON ---------- */}
      <section className="about-standards" data-reveal>
        <div className="about-standards-inner">
          <span className="about-standards-label">The Bareaya Clean Promise</span>
          <div className="about-standards-list">
            {cleanStandards.map((item, idx) => (
              <div key={idx} className="about-standard-item">
                <CheckCircle2 size={16} className="about-standard-check" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 6. INSTAGRAM GALLERY ---------- */}
      <section className="about-gallery">
        <div className="about-gallery-header" data-reveal>
          <div className="about-instagram-badge">
            <InstagramIcon size={18} />
            <span>{settings.instagramHandle}</span>
          </div>
          <h2 className="about-gallery-title">Moments &amp; Rituals</h2>
          <p className="about-gallery-sub">
            Follow along for everyday skincare rituals, formulation stories, and conscious living.
          </p>
        </div>

        <div className="about-gallery-grid">
          {galleryImages.map((src, i) => (
            <a
              key={i}
              href={settings.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="about-gallery-item"
              style={{ '--reveal-delay': `${i * 60}ms` }}
              data-reveal
              aria-label={`View Bareaya ritual ${i + 1} on Instagram`}
            >
              <img
                src={optimised(src, "gallery")}
                alt={`Bareaya Skincare Instagram story ${i + 1}`}
                loading="lazy"
                decoding="async"
                width={420}
                height={420}
              />
              <div className="about-gallery-overlay">
                <InstagramIcon size={26} />
                <span>Follow on Instagram</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ---------- 7. INSPIRATIONAL CTA BANNER ---------- */}
      <section className="about-cta" data-reveal>
        <div className="about-cta-card">
          <div className="about-cta-content">
            <span className="about-cta-eyebrow">Begin Your Ritual</span>
            <h2 className="about-cta-title">
              Experience the gentle power of pure botanicals.
            </h2>
            <p className="about-cta-text">
              Handcrafted in small batches to restore balance, soothe sensitivity, and reveal
              your skin's innate luminosity.
            </p>
            <div className="about-cta-actions">
              <Link to="/shop" className="about-btn about-btn--primary">
                <span>Explore The Collection</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="about-btn about-btn--ghost">
                <span>Speak With Our Concierge</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 8. TRUST HIGHLIGHTS STRIP ---------- */}
      <section className="about-trust">
        <div className="about-trust-grid">
          {footerHighlights.map(({ icon: Icon, title, text }, index) => (
            <div
              key={title}
              className="about-trust-card"
              style={{ '--reveal-delay': `${index * 80}ms` }}
              data-reveal
            >
              <div className="about-trust-icon-box">
                <Icon size={22} strokeWidth={1.6} />
              </div>
              <div className="about-trust-info">
                <p className="about-trust-title">{title}</p>
                <p className="about-trust-desc">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
