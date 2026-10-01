import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProductCard from '../components/Productcart';
import {
  Leaf,
  Droplet,
  Sparkles,
  Truck,
  Wallet,
  MessageCircleQuestion,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { optimised, HERO_VIDEO, HERO_POSTER } from '../utils/cloudinary';
import '../styles/home.css';

const heroSlides = [
  {
    eyebrow: 'Welcome to Bareaya Skincare',
    title: 'Rooted in ritual.<br /><em>Made for your skin.</em>',
    text: 'Clean, conscious formulations powered by time-honoured botanicals and dermatological science — crafted to restore your natural radiance.',
    primaryLabel: 'Shop Best Sellers',
    primaryHref: '/shop',
    quizLabel: 'Skin Analysis (Women)',
    quizHref: 'https://docs.google.com/forms/d/e/1FAIpQLSeQt9H4-6SGsb-wW-2vwgv00LfRmeon7P8M7ec0BrzCjqxE1Q/viewform',
  },
  {
    eyebrow: 'Conscious Care · Proven Botanicals',
    title: 'Skincare made honest.<br /><em>Without the guesswork.</em>',
    text: 'Gentle, pH-balanced formulas that respect your skin barrier. Thoughtful care made simple for everyday healing, glow, and protection.',
    primaryLabel: 'Explore Collection',
    primaryHref: '/shop',
    quizLabel: 'Skin Analysis (Men)',
    quizHref: 'https://forms.gle/jCtcnGmPRqG6ywr38',
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
  {
    icon: Droplet,
    title: 'All Skin Types',
    text: 'Gentle, pH-balanced formulas that respect your natural barrier and skin flora.',
  },
  {
    icon: Leaf,
    title: 'Pure & Organic',
    text: 'Thoughtful botanicals kept close to nature, zero harsh toxins or fillers.',
  },
  {
    icon: Sparkles,
    title: 'Proven Botanicals',
    text: 'Traditional herbal wisdom elevated by clinically tested dermatological actives.',
  },
  {
    icon: ShieldCheck,
    title: 'Clean & Safe',
    text: '100% cruelty-free, paraben-free, and ethically formulated for everyday use.',
  },
];

const testimonials = [
  {
    quote: 'This skincare brand truly stands out. The quality, texture, and results on my sensitive skin have been nothing short of transformative.',
    name: 'Harneet Kaur',
    location: 'Chandigarh',
    product: 'Skin Tonic & Night Balm',
  },
  {
    quote: 'My dull and dry skin has become so soft, supple, and radiant. The formulations feel remarkably honest, lightweight, and gentle.',
    name: 'Neha Sabarwaal',
    location: 'New Delhi',
    product: 'Hydra Blast',
  },
  {
    quote: 'Bareaya offers natural skincare that is genuinely high quality, thoughtfully packed, and effective. The sunscreen mist is an everyday staple.',
    name: 'Navjot Singh',
    location: 'Ludhiana',
    product: 'Spray Sunscreen SPF 50',
  },
];

const skinStories = [
  {
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571531/bareaya/site/skin-story-1.jpg',
    concern: 'Acne & Blemishes',
    title: 'A calmer, clearer complexion',
    timeline: '4 weeks routine',
  },
  {
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571532/bareaya/site/skin-story-2.jpg',
    concern: 'Texture & Dark Spots',
    title: 'Smoother, visibly even tone',
    timeline: '6 weeks routine',
  },
  {
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571533/bareaya/site/skin-story-3.jpg',
    concern: 'Barrier & Dryness Care',
    title: 'Deeply nourished skin journey',
    timeline: '3 weeks routine',
  },
];

const serviceHighlights = [
  { icon: Truck, title: 'Free Delivery', text: 'All orders across India' },
  { icon: Wallet, title: 'Cash on Delivery', text: 'COD & UPI available' },
  { icon: ShieldCheck, title: '100% Authentic', text: 'Directly from formulator' },
  { icon: MessageCircleQuestion, title: 'Skin Consultation', text: 'Free routine analysis' },
];

const productFilters = ['All', 'Hydration', 'Clarity', 'Protection'];

const ingredients = [
  {
    name: 'Niacinamide',
    benefit: 'Refines Pores & Texture',
    hints: ['niacinamide'],
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1790754083/bareaya/ingredients/niacinamide.jpg',
  },
  {
    name: 'Vitamin C',
    benefit: 'Brightens & Evens Tone',
    hints: ['vitamin c', 'ascorbic'],
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1790754085/bareaya/ingredients/vitamin-c.jpg',
  },
  {
    name: 'Vitamin E',
    benefit: 'Deep Nourishment',
    hints: ['vitamin e', 'tocopherol'],
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1790754086/bareaya/ingredients/vitamin-e.jpg',
  },
  {
    name: 'Peptides',
    benefit: 'Firmness & Elasticity',
    hints: ['peptide'],
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1790754086/bareaya/ingredients/peptides.jpg',
  },
  {
    name: 'Kojic Acid',
    benefit: 'Fades Dark Spots',
    hints: ['kojic'],
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1790754088/bareaya/ingredients/kojic-acid.jpg',
  },
  {
    name: 'Tranexamic Acid',
    benefit: 'Calms Pigmentation',
    hints: ['tranexamic'],
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1790754090/bareaya/ingredients/tranexamic-acid.jpg',
  },
  {
    name: 'Liquorice Oil',
    benefit: 'Soothes & Clarifies',
    hints: ['liquorice', 'licorice', 'mulethi', 'yashtimadhu'],
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1790754092/bareaya/ingredients/liquorice-oil.jpg',
  },
  {
    name: 'Vitamin B12',
    benefit: 'Skin Barrier Repair',
    hints: ['b12', 'cyanocobalamin'],
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1790754093/bareaya/ingredients/vitamin-b12.jpg',
  },
  {
    name: 'Seabuckthorn',
    benefit: 'Rich Omega Lipids',
    hints: ['seabuckthorn', 'sea buckthorn'],
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1790754094/bareaya/ingredients/seabuckthorn.jpg',
  },
  {
    name: 'Mandarin Extract',
    benefit: 'Antioxidant Radiance',
    hints: ['mandarin', 'amrutha'],
    image: 'https://res.cloudinary.com/aao6ldeb/image/upload/v1790754096/bareaya/ingredients/mandarin-extract.jpg',
  },
];

// Match an ingredient to the first product whose name, description or
// category mentions it, so the tile can go straight to that product page.
const findIngredientProduct = (ingredient, list) => {
  if (!Array.isArray(list)) return null;
  const match = list.find((product) => {
    const haystack = `${product.name || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
    return ingredient.hints.some((hint) => haystack.includes(hint));
  });
  return match || null;
};

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const location = useLocation();
  const orderSuccess = location.state?.orderSuccess;
  const [showOrderSuccess, setShowOrderSuccess] = useState(!!orderSuccess);
  const [heroPlay, setHeroPlay] = useState(window.brPreloaded === true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const heroVideoRef = useRef(null);
  const ingredientsTrackRef = useRef(null);
  const ingredientsPauseRef = useRef(false);

  const scrollIngredients = (direction) => {
    const track = ingredientsTrackRef.current;
    const first = track && track.firstElementChild;
    if (!first) return;
    track.scrollBy({ left: direction * (first.offsetWidth + 16), behavior: 'smooth' });
  };

  useEffect(() => {
    const track = ingredientsTrackRef.current;
    if (!track || ingredients.length === 0) return undefined;
    const first = track.firstElementChild;
    if (!first) return undefined;
    const step = first.offsetWidth + 16;
    const maxScroll = track.scrollWidth - track.clientWidth;
    let paused = false;

    const timer = setInterval(() => {
      if (paused || ingredientsPauseRef.current) return;
      if (track.scrollLeft + 1 >= maxScroll) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      track.scrollBy({ left: step, behavior: 'smooth' });
    }, 2800);

    const handlePointerEnter = () => { paused = true; ingredientsPauseRef.current = true; };
    const handlePointerLeave = () => { paused = false; ingredientsPauseRef.current = false; };
    const handleMouseEnter = handlePointerEnter;
    const handleMouseLeave = handlePointerLeave;
    const handleFocusIn = () => { ingredientsPauseRef.current = true; };
    const handleFocusOut = () => { ingredientsPauseRef.current = false; };

    track.addEventListener('pointerenter', handlePointerEnter);
    track.addEventListener('pointerleave', handlePointerLeave);
    track.addEventListener('mouseenter', handleMouseEnter);
    track.addEventListener('mouseleave', handleMouseLeave);
    track.addEventListener('focusin', handleFocusIn);
    track.addEventListener('focusout', handleFocusOut);

    return () => {
      clearInterval(timer);
      track.removeEventListener('pointerenter', handlePointerEnter);
      track.removeEventListener('pointerleave', handlePointerLeave);
      track.removeEventListener('mouseenter', handleMouseEnter);
      track.removeEventListener('mouseleave', handleMouseLeave);
      track.removeEventListener('focusin', handleFocusIn);
      track.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const heroGo = (next) => {
    setHeroIndex(() => {
      const count = heroSlides.length;
      return ((next % count) + count) % count;
    });
  };

  useEffect(() => {
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % heroSlides.length), 6500);
    return () => clearInterval(id);
  }, []);

  const toggleHeroSound = () => {
    const video = heroVideoRef.current;
    if (!video) return;
    const nextMuted = soundOn;
    video.muted = nextMuted;
    video.play().catch(() => {});
    setSoundOn(!soundOn);
  };

  const toggleHeroPause = () => {
    const video = heroVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setVideoPaused(false);
    } else {
      video.pause();
      setVideoPaused(true);
    }
  };

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
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const matchesFilter = (product, filter) => {
    if (filter === 'All') return true;
    const f = filter.toLowerCase();
    const tag = (product.tag || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    return tag.includes(f) || category.includes(f) || name.includes(f);
  };

  const getFilterCount = (filter) => {
    if (filter === 'All') return products.length;
    return products.filter((p) => matchesFilter(p, filter)).length;
  };

  const visibleProducts = products.filter((p) => matchesFilter(p, activeFilter)).slice(0, 8);

  return (
    <main className="home-page">
      {orderSuccess && showOrderSuccess && (
        <div className="home-order-success" role="status">
          <span className="home-order-success-icon" aria-hidden="true">✓</span>
          <span>{orderSuccess}</span>
        </div>
      )}

      {/* HERO SECTION */}
      <section className={`home-hero${heroPlay ? ' br-anim-play' : ''}`}>
        <div className="home-hero-content">
          <div className="home-hero-copy" role="region" aria-roledescription="carousel" aria-label="Featured content">
            {heroSlides.map((slide, index) => (
              <div
                key={index}
                className={`home-hero-copy-slide${index === heroIndex ? ' is-active' : ''}`}
                aria-hidden={index !== heroIndex}
              >
                <p className="home-eyebrow br-anim" style={{ '--d': '80ms' }}>{slide.eyebrow}</p>
                <h1 className="br-anim" style={{ '--d': '220ms' }} dangerouslySetInnerHTML={{ __html: slide.title }} />
                <p className="home-hero-text br-anim" style={{ '--d': '380ms' }}>{slide.text}</p>
                
                <div className="home-hero-actions br-anim" style={{ '--d': '540ms' }}>
                  <Link className="home-primary-button" to={slide.primaryHref}>
                    <span>{slide.primaryLabel}</span>
                    <ArrowRight size={17} />
                  </Link>
                  <a
                    className="home-secondary-button"
                    href={slide.quizHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Sparkles size={16} />
                    <span>{slide.quizLabel}</span>
                    <span className="home-btn-external" aria-hidden="true">↗</span>
                  </a>
                </div>

                <div className="home-hero-trust br-anim" style={{ '--d': '660ms' }}>
                  <div className="home-trust-item">
                    <span className="home-trust-stars" aria-label="5 out of 5 stars">★★★★★</span>
                    <span>4.9/5 Rating</span>
                  </div>
                  <span className="home-trust-sep">•</span>
                  <div className="home-trust-item">
                    <span>100% Clean Actives</span>
                  </div>
                  <span className="home-trust-sep">•</span>
                  <div className="home-trust-item">
                    <span>Dermatologist Approved</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="home-hero-dots">
              {heroSlides.map((slide, index) => (
                <button
                  key={index}
                  type="button"
                  className={`home-hero-dot${index === heroIndex ? ' is-active' : ''}`}
                  onClick={() => heroGo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="home-hero-media">
            <div className="home-hero-video-frame">
              <video
                ref={heroVideoRef}
                className="home-hero-video"
                src={HERO_VIDEO}
                poster={HERO_POSTER}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onPlay={() => setVideoPaused(false)}
                onPause={() => setVideoPaused(true)}
              />
              <div className="home-hero-badge">
                <span className="home-hero-badge-dot"></span>
                <span>Pure Botanicals · Science Backed</span>
              </div>
              <div className="home-hero-controls">
                <button
                  type="button"
                  className="home-hero-control-btn"
                  onClick={toggleHeroPause}
                  aria-label={videoPaused ? 'Play video' : 'Pause video'}
                  aria-pressed={videoPaused}
                >
                  {videoPaused ? '▶' : '⏸'}
                </button>
                <button
                  type="button"
                  className="home-hero-control-btn"
                  onClick={toggleHeroSound}
                  aria-label={soundOn ? 'Mute video' : 'Unmute video'}
                >
                  {soundOn ? '🔊' : '🔇'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE BANNER */}
      <section className="br-marquee" aria-hidden="true">
        <div className="br-marquee-track">
          {[0, 1, 2, 3].map((n) => (
            <div className="br-marquee-group" key={n}>
              <span>Clean Beauty <i>✦</i></span>
              <span>Conscious Care <i>✦</i></span>
              <span>Pure Botanicals <i>✦</i></span>
              <span>Dermatologist Tested <i>✦</i></span>
              <span>Cruelty-Free <i>✦</i></span>
            </div>
          ))}
        </div>
      </section>

      {/* SKIN ANALYSIS BANNER */}
      <section className="home-quiz-banner home-section">
        <div className="home-quiz-card" data-reveal>
          <div className="home-quiz-copy">
            <div className="home-quiz-badge">
              <Sparkles size={15} />
              <span>Complimentary Consultation</span>
            </div>
            <h2>Not sure which formula suits your skin?</h2>
            <p>
              Take our quick 2-minute skin analysis quiz. Tell us about your skin concerns, climate,
              and daily exposure to receive a custom routine tailored by our skincare experts.
            </p>
          </div>
          <div className="home-quiz-buttons">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeQt9H4-6SGsb-wW-2vwgv00LfRmeon7P8M7ec0BrzCjqxE1Q/viewform"
              target="_blank"
              rel="noreferrer"
              className="home-quiz-action-btn home-quiz-action-btn--women"
            >
              <div className="home-quiz-btn-content">
                <strong>Skin Analysis for Women</strong>
                <span>Personalized ritual finder</span>
              </div>
              <ArrowRight size={18} className="home-quiz-arrow" />
            </a>
            <a
              href="https://forms.gle/jCtcnGmPRqG6ywr38"
              target="_blank"
              rel="noreferrer"
              className="home-quiz-action-btn home-quiz-action-btn--men"
            >
              <div className="home-quiz-btn-content">
                <strong>Skin Analysis for Men</strong>
                <span>Targeted care & daily shield</span>
              </div>
              <ArrowRight size={18} className="home-quiz-arrow" />
            </a>
          </div>
        </div>
      </section>

      {/* BEST SELLERS / PRODUCTS SECTION */}
      <section className="home-products home-section">
        <div className="home-section-heading">
          <div data-reveal>
            <p className="home-eyebrow">Made for your ritual</p>
            <h2>Best seller collection</h2>
          </div>
          <Link className="home-text-link" to="/shop" data-reveal style={{ '--reveal-delay': '140ms' }}>
            Shop full collection <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="home-filters" role="group" aria-label="Filter products">
          {productFilters.map((filter) => {
            const count = getFilterCount(filter);
            return (
              <button
                key={filter}
                type="button"
                className={`home-filter${activeFilter === filter ? ' is-active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                <span>{filter}</span>
                {count > 0 && <span className="home-filter-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="home-product-skeleton-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="home-skeleton-card">
                <div className="home-skeleton-img"></div>
                <div className="home-skeleton-line title"></div>
                <div className="home-skeleton-line price"></div>
              </div>
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="home-empty-products" data-reveal>
            <p>No products currently found in this category.</p>
            <button
              type="button"
              className="home-reset-filter-btn"
              onClick={() => setActiveFilter('All')}
            >
              View All Products
            </button>
          </div>
        ) : (
          <>
            <div className="home-product-grid product-grid">
              {visibleProducts.map((product, index) => (
                <div
                  key={product._id}
                  className="br-product-reveal"
                  data-reveal
                  style={{ '--reveal-delay': `${(index % 4) * 90}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {products.length > 8 && (
              <div className="home-products-footer" data-reveal>
                <Link className="home-explore-all-btn" to="/shop">
                  <span>Explore all {products.length} products</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* SHOP BY INGREDIENTS */}
      <section className="home-ingredients home-section">
        <div className="home-section-heading">
          <div data-reveal>
            <p className="home-eyebrow">Targeted Actives</p>
            <h2>Shop by <em>ingredients.</em></h2>
          </div>
          <div className="home-ingredients-nav" data-reveal style={{ '--reveal-delay': '140ms' }}>
            <button
              type="button"
              className="home-ingredients-arrow"
              onClick={() => scrollIngredients(-1)}
              aria-label="Previous ingredients"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="home-ingredients-arrow"
              onClick={() => scrollIngredients(1)}
              aria-label="Next ingredients"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <ul className="home-ingredients-track" ref={ingredientsTrackRef}>
          {ingredients.map((ingredient, index) => {
            const match = findIngredientProduct(ingredient, products);
            const to = match ? `/product/${match._id}` : `/shop?q=${encodeURIComponent(ingredient.name)}`;
            return (
              <li key={ingredient.name} data-reveal style={{ '--reveal-delay': `${index * 60}ms` }}>
                <Link className="home-ingredient" to={to}>
                  <span className="home-ingredient-image">
                    <img src={optimised(ingredient.image, 'ingredient')} alt={ingredient.name} loading="lazy" decoding="async" width={460} height={644} />
                  </span>

                  <div className="home-ingredient-info">
                    <span className="home-ingredient-name">{ingredient.name}</span>
                    <span className="home-ingredient-benefit">{ingredient.benefit}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 3-STEP REGIMEN SECTION */}
      <section className="home-regimen">
        <div className="home-regimen-inner" data-reveal>
          <p className="home-eyebrow">Your daily ritual</p>
          <h2>Flawless skincare<br /><em>made simple.</em></h2>
          <p>
            Cleanse, hydrate, protect. Build a daily ritual that gives your skin the nourishment,
            balance, and quiet care it deserves.
          </p>

          <div className="home-regimen-steps">
            <div className="home-regimen-step">
              <span className="home-regimen-step-num">01</span>
              <div>
                <strong>Cleanse & Balance</strong>
                <small>Purify without stripping your natural lipids</small>
              </div>
            </div>
            <div className="home-regimen-step">
              <span className="home-regimen-step-num">02</span>
              <div>
                <strong>Nourish & Treat</strong>
                <small>Infuse active vitamins and botanical tonics</small>
              </div>
            </div>
            <div className="home-regimen-step">
              <span className="home-regimen-step-num">03</span>
              <div>
                <strong>Seal & Shield</strong>
                <small>Lock in deep moisture & all-day UV protection</small>
              </div>
            </div>
          </div>

          <Link className="home-light-button" to="/shop">
            <span>Explore the Ritual</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* MEET THE FOUNDER */}
      <section className="home-founder home-section">
        <div className="home-founder-image-wrap" data-reveal>
          <img
            src="https://res.cloudinary.com/aao6ldeb/image/upload/v1789571545/bareaya/site/founder-image.jpg"
            alt="Chandni Anand, Founder of Bareaya"
            className="home-founder-photo"
            loading="lazy"
          />
          <div className="home-founder-badge">
            <Sparkles size={14} />
            <span>Formulated With Purpose</span>
          </div>
        </div>
        <div className="home-founder-copy" data-reveal style={{ '--reveal-delay': '150ms' }}>
          <p className="home-eyebrow">Meet the founder</p>
          <h2>Beauty that begins<br />with <em>care.</em></h2>
          <p>
            Bareaya's philosophy is to gently nourish, heal, and enhance the skin's natural glow
            without causing harm. Inspired by clean beauty and nature-led care, we make everyday
            skincare feel fresh, healthy, and honestly beautiful.
          </p>
          <div className="home-founder-quote-box">
            <p className="home-founder-quote">
              "We believe skin thrives when treated with gentleness and intention, not harsh shortcuts."
            </p>
          </div>
          <p className="home-signature">CHANDNI ANAND <span>Founder & Formulator</span></p>
          <Link className="home-text-link" to="/about">Read our full story <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      {/* VALUES / WHY BAREAYA */}
      <section className="home-values home-section">
        <p className="home-eyebrow" data-reveal>Why Bareaya</p>
        <h2 data-reveal style={{ '--reveal-delay': '90ms' }}>Simple care.<br /><em>Meaningful results.</em></h2>
        <div className="home-values-grid">
          {values.map(({ icon: Icon, title, text }, index) => (
            <article key={title} data-reveal style={{ '--reveal-delay': `${index * 110}ms` }}>
              <div className="home-value-icon-box">
                <Icon size={26} strokeWidth={1.6} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="home-testimonials home-section">
        <p className="home-eyebrow" data-reveal>Kind words</p>
        <h2 data-reveal style={{ '--reveal-delay': '90ms' }}>Loved by real skin</h2>
        <div className="home-testimonials-grid">
          {testimonials.map(({ quote, name, location: loc, product }, index) => (
            <div key={name} data-reveal style={{ '--reveal-delay': `${index * 120}ms` }}>
              <article>
                <div className="home-stars" aria-label="5 out of 5 stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#8b5e3c" color="#8b5e3c" />
                  ))}
                </div>
                <blockquote>“{quote}”</blockquote>
                <div className="home-testimonial-author">
                  <div className="home-author-info">
                    <strong>{name}</strong>
                    <small>{loc}</small>
                  </div>
                  <div className="home-verified-pill">
                    <CheckCircle2 size={13} />
                    <span>Verified</span>
                  </div>
                </div>
                {product && <span className="home-testimonial-product">Used: {product}</span>}
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* SKIN STORIES */}
      <section className="home-skin-stories home-section">
        <div className="home-section-heading">
          <div data-reveal>
            <p className="home-eyebrow">Real skin journeys</p>
            <h2>Our skin stories</h2>
          </div>
          <p className="home-skin-stories-intro" data-reveal style={{ '--reveal-delay': '140ms' }}>
            Small rituals. Visible progress. Every skin has its own story.
          </p>
        </div>
        <div className="home-skin-stories-grid">
          {skinStories.map(({ image, concern, title, timeline }, index) => (
            <div key={image} data-reveal style={{ '--reveal-delay': `${index * 130}ms` }}>
              <article className="home-skin-story">
                <div className="home-skin-story-image">
                  <img src={optimised(image, 'skinStory')} alt={`${title} skin journey`} loading="lazy" decoding="async" width={620} height={694} />
                  <span className="home-skin-story-badge">Before &amp; After</span>
                  <span className="home-skin-story-timeline">{timeline}</span>
                </div>
                <div className="home-skin-story-copy">
                  <p>{concern}</p>
                  <h3>{title}</h3>
                </div>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* INSTAGRAM GALLERY */}
      <section className="home-gallery home-section">
        <div className="home-section-heading">
          <div data-reveal>
            <p className="home-eyebrow">@bareaya.skin</p>
            <h2>Follow along on Instagram</h2>
          </div>
          <a
            className="home-text-link"
            href="https://instagram.com/bareaya.skin"
            target="_blank"
            rel="noreferrer"
            data-reveal
            style={{ '--reveal-delay': '140ms' }}
          >
            Visit Instagram <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="home-gallery-grid">
          {galleryImages.map((image, index) => (
            <a
              href="https://instagram.com/bareaya.skin"
              target="_blank"
              rel="noreferrer"
              key={image}
              data-reveal
              style={{ '--reveal-delay': `${index * 80}ms` }}
            >
              <img src={optimised(image, 'gallery')} alt="Bareaya skincare" loading="lazy" decoding="async" width={420} height={420} />
            </a>
          ))}
        </div>
      </section>

      {/* SERVICE HIGHLIGHTS */}
      <section className="home-services">
        <div className="home-services-grid">
          {serviceHighlights.map(({ icon: Icon, title, text }, index) => (
            <div key={title} data-reveal style={{ '--reveal-delay': `${index * 80}ms` }}>
              <div className="home-service-icon-wrap">
                <Icon size={24} strokeWidth={1.6} />
              </div>
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;
