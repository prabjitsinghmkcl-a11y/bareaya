import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProductCard from '../components/Productcart';
import { Leaf, Droplet, Sparkles, Truck, Wallet, PackageSearch, MessageCircleQuestion, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/home.css';

const heroSlides = [
  {
    image: 'https://theskinstory.in/cdn/shop/articles/pre-wedding-skincare-routine-for-flawless-glowing-skin-8672657.png?v=1770809021',
    eyebrow: 'Welcome to Bareaya',
    title: 'Skincare that feels<br /><em>like coming home.</em>',
    text: 'Clean, conscious care rooted in tradition and made for every kind of skin.',
    label: 'Get Your Skin Analysis',
    href: 'https://docs.google.com/forms/d/e/1FAIpQLSeQt9H4-6SGsb-wW-2vwgv00LfRmeon7P8M7ec0BrzCjqxE1Q/viewform',
    external: true,
  },
  {
    image: 'https://e-fillers.com/storage/uploads/blogs/5-signs-its-time-for-a-skincare-update-when-to-consider-aesthetic-treatments/1725549249841_rendered-photo-beautiful-model-applying-skin-care-products-flat-illustration.webp',
    eyebrow: 'Clean beauty',
    title: 'Rituals rooted in <br /><em>nature.</em>',
    text: 'Thoughtful ingredients kept close to the earth, honest to your skin and to the planet.',
    label: 'Explore the ritual',
    href: '/shop',
    external: false,
  },
  {
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkHe4s29cwFrRK-p6LV7Eh1Mcuyv162sNSLE9szGPG8sAW8oOs4OKmhyA&s=10',
    eyebrow: 'Pure organic',
    title: 'Beauty that begins <br /><em>with care.</em>',
    text: 'Everyday rituals that gently nourish, heal and enhance your skin’s natural glow.',
    label: 'Meet the founder',
    href: '/about',
    external: false,
  },
];

const galleryImages = [
  'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571544/bareaya/site/gallery-img-6.jpg',
  'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571543/bareaya/site/gallery-img-5.jpg',
  'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571542/bareaya/site/gallery-img-4.jpg',
  'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571541/bareaya/site/gallery-img-3.jpg',
  'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571540/bareaya/site/gallery-img-2.jpg',
];

const values = [
  { icon: Droplet, title: 'All Skin Types', text: 'Gentle care that respects every skin type and its natural balance.' },
  { icon: Leaf, title: 'Pure Organic', text: 'Thoughtful ingredients kept close to nature, without anything unnecessary.' },
  { icon: Sparkles, title: 'Natural Care', text: 'Traditional wisdom and modern science blended into daily rituals.' },
];

const testimonials = [
  { quote: 'This skincare brand truly stands out. The quality, texture and the results are amazing.', name: 'Harneet Kaur' },
  { quote: 'My dull and dry skin has become soft and glowing. The products feel gentle and honest.', name: 'Neha Sabarwaal' },
  { quote: 'Bareaya offers natural products that are good quality, nicely packed and safe for skin.', name: 'Navjot Singh' },
];

const skinStories = [
  {
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571531/bareaya/site/skin-story-1.jpg',
    title: 'Acne & blemishes',
    name: 'A calmer-looking complexion',
  },
  {
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571532/bareaya/site/skin-story-2.jpg',
    title: 'Texture & spots',
    name: 'Smoother-looking skin',
  },
  {
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571533/bareaya/site/skin-story-3.jpg',
    title: 'Breakout care',
    name: 'A fresh skin journey',
  },
];

const serviceHighlights = [
  { icon: Truck, title: 'Free Delivery', text: 'Across India' },
  { icon: Wallet, title: 'Easy Payment', text: 'COD Available' },
  { icon: PackageSearch, title: 'Track Order', text: 'Easy shipping' },
  { icon: MessageCircleQuestion, title: 'Have Questions?', text: 'Ask us' },
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const orderSuccess = location.state?.orderSuccess;
  const [showOrderSuccess, setShowOrderSuccess] = useState(!!orderSuccess);
  const [heroPlay, setHeroPlay] = useState(window.brPreloaded === true);
  const [heroIndex, setHeroIndex] = useState(0);
  const activeSlide = heroSlides[heroIndex] || heroSlides[0];

  const heroGo = (next) => {
    setHeroIndex(() => {
      const count = heroSlides.length;
      return ((next % count) + count) % count;
    });
  };

  useEffect(() => {
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % heroSlides.length), 6000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!orderSuccess) return;
    const timer = setTimeout(() => setShowOrderSuccess(false), 5000);
    window.history.replaceState({}, document.title);
    return () => clearTimeout(timer);
  }, [orderSuccess]);

  useEffect(() => {
    if (heroPlay) return undefined;
    const play = () => setHeroPlay(true);
    window.addEventListener('br-preloader-done', play);
    const fallback = setTimeout(play, 2200);
    return () => {
      window.removeEventListener('br-preloader-done', play);
      clearTimeout(fallback);
    };
  }, [heroPlay]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data.slice(0, 4)); // Featured products
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main className="home-page">
      {orderSuccess && showOrderSuccess && (
        <div className="home-order-success" role="status">
          <span className="home-order-success-icon" aria-hidden="true">✓</span>
          <span>{orderSuccess}</span>
        </div>
      )}
      <section className={`home-hero${heroPlay ? ' br-anim-play' : ''}`}>
        <div className="home-hero-slides" role="region" aria-roledescription="carousel" aria-label="Featured">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.image}
              className={`home-hero-slide${index === heroIndex ? ' is-active' : ''}`}
              aria-hidden={index !== heroIndex}
            >
              <div className="home-hero-bg" style={{ backgroundImage: `url("${slide.image}")` }} aria-hidden="true" />
            </div>
          ))}

          <div className="home-hero-copy">
            <p className="home-eyebrow br-anim" style={{ '--d': '80ms' }}>{activeSlide.eyebrow}</p>
            <h1 className="br-anim" style={{ '--d': '220ms' }} dangerouslySetInnerHTML={{ __html: activeSlide.title }} />
            <p className="home-hero-text br-anim" style={{ '--d': '380ms' }}>{activeSlide.text}</p>
            {activeSlide.external ? (
              <a
                className="home-primary-button br-anim"
                style={{ '--d': '540ms' }}
                href={activeSlide.href}
                target="_blank"
                rel="noreferrer"
              >
                {activeSlide.label}
              </a>
            ) : (
              <Link className="home-primary-button br-anim" style={{ '--d': '540ms' }} to={activeSlide.href}>
                {activeSlide.label}
              </Link>
            )}
          </div>

          <button type="button" className="home-hero-arrow home-hero-arrow-prev" onClick={() => heroGo(heroIndex - 1)} aria-label="Previous slide">
            <ChevronLeft size={28} strokeWidth={1.5} />
          </button>
          <button type="button" className="home-hero-arrow home-hero-arrow-next" onClick={() => heroGo(heroIndex + 1)} aria-label="Next slide">
            <ChevronRight size={28} strokeWidth={1.5} />
          </button>
          <div className="home-hero-dots">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                className={`home-hero-dot${index === heroIndex ? ' is-active' : ''}`}
                onClick={() => heroGo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="br-marquee" aria-hidden="true">
        <div className="br-marquee-track">
          {[0, 1].map((n) => (
            <div className="br-marquee-group" key={n}>
              <span>Clean Beauty <i>✦</i></span>
              <span>Natural Care <i>✦</i></span>
              <span>Pure Organic <i>✦</i></span>
              <span>Made for every skin <i>✦</i></span>
            </div>
          ))}
        </div>
      </section>

      <section className="home-skin-stories home-section">
        <div className="home-section-heading">
          <div data-reveal>
            <p className="home-eyebrow">Real skin journeys</p>
            <h2>Our skin stories</h2>
          </div>
          <p className="home-skin-stories-intro" data-reveal style={{ '--reveal-delay': '140ms' }}>Small rituals. Visible progress. Every skin has its own story.</p>
        </div>
        <div className="home-skin-stories-grid">
          {skinStories.map(({ image, title, name }, index) => (
            <div key={image} data-reveal style={{ '--reveal-delay': `${index * 130}ms` }}>
              <article className="home-skin-story">
                <div className="home-skin-story-image">
                  <img src={image} alt={`${title} before and after skin journey`} />
                  <span>Before &amp; after</span>
                </div>
                <div className="home-skin-story-copy">
                  <p>{title}</p>
                  <h3>{name}</h3>
                </div>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section className="home-founder home-section">
        <div className="home-founder-image" data-reveal />
        <div className="home-founder-copy" data-reveal style={{ '--reveal-delay': '150ms' }}>
          <p className="home-eyebrow">Meet the founder</p>
          <h2>Beauty that begins<br />with <em>care.</em></h2>
          <p>Bareaya's philosophy is to gently nourish, heal, and enhance the skin's natural glow without causing harm. Inspired by clean beauty and nature-led care, we make everyday skincare feel fresh, healthy, and honestly beautiful.</p>
          <p className="home-signature">CHANDNI ANAND <span>Founder</span></p>
          <Link className="home-text-link" to="/about">Read more <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className="home-values home-section">
        <p className="home-eyebrow" data-reveal>Why Bareaya</p>
        <h2 data-reveal style={{ '--reveal-delay': '90ms' }}>Simple care.<br /><em>Meaningful results.</em></h2>
        <div className="home-values-grid">
          {values.map(({ icon: Icon, title, text }, index) => (
            <article key={title} data-reveal style={{ '--reveal-delay': `${index * 140}ms` }}>
              <Icon size={28} strokeWidth={1.5} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-regimen">
        <div data-reveal>
          <p className="home-eyebrow">Your daily ritual</p>
          <h2>Flawless skincare<br /><em>made simple.</em></h2>
          <p>Cleanse, hydrate, protect. Build a ritual that gives your skin the time and attention it deserves.</p>
          <Link className="home-light-button" to="/shop">Explore the ritual</Link>
        </div>
      </section>

      <section className="home-testimonials home-section">
        <p className="home-eyebrow" data-reveal>Kind words</p>
        <h2 data-reveal style={{ '--reveal-delay': '90ms' }}>What our customers say</h2>
        <div className="home-testimonials-grid">
          {testimonials.map(({ quote, name }, index) => (
            <div key={name} data-reveal style={{ '--reveal-delay': `${index * 120}ms` }}>
              <article>
                <div className="home-stars" aria-label="5 out of 5 stars">★★★★★</div>
                <blockquote>“{quote}”</blockquote>
                <p>{name}</p>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section className="home-products home-section">
        <div className="home-section-heading">
          <div data-reveal>
            <p className="home-eyebrow">Made for your ritual</p>
            <h2>Best seller</h2>
          </div>
          <Link className="home-text-link" to="/shop" data-reveal style={{ '--reveal-delay': '140ms' }}>Shop now <span aria-hidden="true">↗</span></Link>
        </div>
        {loading ? (
          <p className="home-status" data-reveal>Loading products...</p>
        ) : (
          <div className="home-product-grid product-grid">
            {products.map((product, index) => (
              <div key={product._id} className="br-product-reveal" data-reveal style={{ '--reveal-delay': `${index * 110}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="home-gallery home-section">
        <div className="home-section-heading">
          <div data-reveal>
            <p className="home-eyebrow">@bareaya.skin</p>
            <h2>Follow along</h2>
          </div>
          <a className="home-text-link" href="https://instagram.com/bareaya.skin" target="_blank" rel="noreferrer" data-reveal style={{ '--reveal-delay': '140ms' }}>Instagram <span aria-hidden="true">↗</span></a>
        </div>
        <div className="home-gallery-grid">
          {galleryImages.map((image, index) => (
            <a href="https://instagram.com/bareaya.skin" target="_blank" rel="noreferrer" key={image} data-reveal style={{ '--reveal-delay': `${index * 80}ms` }}>
              <img src={image} alt="Bareaya skincare" />
            </a>
          ))}
        </div>
      </section>

      <section className="home-services">
        <div className="home-services-grid">
          {serviceHighlights.map(({ icon: Icon, title, text }, index) => (
            <div key={title} data-reveal style={{ '--reveal-delay': `${index * 90}ms` }}>
              <Icon size={24} strokeWidth={1.5} />
              <span><strong>{title}</strong><small>{text}</small></span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;