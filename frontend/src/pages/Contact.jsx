import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircleQuestion, PackageSearch, RotateCcw, Truck } from 'lucide-react';
import '../styles/contact.css';

const infoChips = [
  { icon: Truck, title: 'Track Order', text: 'Follow your parcel' },
  { icon: PackageSearch, title: 'Packaging & Delivery', text: 'Careful, safe shipping' },
  { icon: MessageCircleQuestion, title: 'FAQ Services', text: 'Quick answers' },
  { icon: RotateCcw, title: 'Returns Policy', text: 'Easy returns' },
];

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // The form sets noValidate, so nothing checked these before the round-trip.
    // Validate here to match the server's rules and give a per-field message
    // instead of one generic error.
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    if (name.length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (message.length < 5) {
      setError('Please write your message (at least 5 characters).');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not send your message. Please try again.');
      setSuccess(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err.message || 'Could not send your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="contact-page">
      <section className="contact-content">
        <div className="contact-main">
          <p className="contact-eyebrow" data-reveal>We are here to help</p>
          <h1 data-reveal style={{ '--reveal-delay': '90ms' }}>Get in Touch</h1>
          <p className="contact-intro" data-reveal style={{ '--reveal-delay': '180ms' }}>
            Have a question about your skin ritual or an order? Reach out and our team will get back to you.
          </p>

          <div className="contact-chips" data-reveal style={{ '--reveal-delay': '240ms' }}>
            {infoChips.map((chip) => (
              <div key={chip.title} className="contact-chip">
                <chip.icon size={18} strokeWidth={1.6} />
                <div>
                  <strong>{chip.title}</strong>
                  <span>{chip.text}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="contact-details" data-reveal style={{ '--reveal-delay': '280ms' }}>
            <div>
              <h2>Find Us</h2>
              <p>B-46/1 Nariana Industrial Area Phase-2,<br />New Delhi-110028, India</p>
            </div>
            <div>
              <h2>Support</h2>
              <a href="tel:+919266145378">Call: +91 92661 45378</a>
              <a href="mailto:care@bareya.in">Email: care@bareya.in</a>
            </div>
            <div>
              <h2>Working hours</h2>
              <p>Mon – Fri: 10:00 – 06:30<br />Sat &amp; Sun: 09:30 – 21:30</p>
            </div>
            <div>
              <h2>Instagram</h2>
              <a href="https://instagram.com/bareaya.skin" target="_blank" rel="noreferrer">@bareaya.skin</a>
            </div>
          </div>

          <Link className="contact-shop-link" to="/shop" data-reveal style={{ '--reveal-delay': '400ms' }}>Explore our skincare <span aria-hidden="true">↗</span></Link>
        </div>

        <div className="contact-form-wrap" data-reveal style={{ '--reveal-delay': '340ms' }}>
          <p className="contact-form-eyebrow">Send us a message</p>
          <h2>Have Any Questions?</h2>
          <p className="contact-form-intro">
            Fill in the form and our team will respond as soon as possible.
          </p>

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-field">
              <label htmlFor="contact-name">Name <span className="contact-required">*</span></label>
              <input
                id="contact-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>
            <div className="contact-field">
              <label htmlFor="contact-email">Email <span className="contact-required">*</span></label>
              <input
                id="contact-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                maxLength={120}
                required
              />
            </div>
            <div className="contact-field">
              <label htmlFor="contact-message">Comment or Message <span className="contact-required">*</span></label>
              <textarea
                id="contact-message"
                name="message"
                rows="5"
                value={form.message}
                onChange={handleChange}
                maxLength={2000}
                required
              />
            </div>

            {error && <p className="contact-error" role="alert">{error}</p>}
            {success && <p className="contact-success" role="status">Thank you! Your message has been sent successfully.</p>}

            <button type="submit" className="contact-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Submit'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Contact;