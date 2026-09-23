import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import '../styles/auth.css';

const RESEND_COOLDOWN = 30;

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startTimer = () => {
    setResendIn(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const resetOtp = () => {
    setStep('phone'); setOtp(''); setError(''); setSuccess('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) {
          login(data);
          navigate('/cart');
          return;
        }
        setStep('otp');
        setSuccess(`OTP sent to ${phone.trim()}`);
        startTimer();
      } else {
        setError(data.message || 'Could not send OTP.');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        login(data); navigate('/cart');
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`OTP sent to ${phone.trim()}`);
        startTimer();
      } else {
        setError(data.message || 'Could not send OTP.');
      }
    } catch {
      setError('Unable to connect.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <form onSubmit={step === 'otp' ? handleVerifyOtp : handleSendOtp} className="auth-form" data-reveal>
        <h2>Login</h2>

        {step === 'phone' && (
          <>
            <input
              type="text"
              placeholder="Full name "
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
            <input
              type="tel"
              placeholder="Mobile Number (10 digits)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              required
              autoFocus
            />
            <button type="submit" className="btn" disabled={loading || phone.trim().length !== 10}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="auth-success">Code sent to <strong>{phone}</strong></p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              autoFocus
              required
            />
            <button type="submit" className="btn" disabled={loading || otp.trim().length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <div className="auth-row">
              <button type="button" className="link-btn" onClick={resetOtp} disabled={loading}>
                Change Number
              </button>
              <button type="button" className="link-btn" onClick={handleResend} disabled={loading || resendIn > 0}>
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
              </button>
            </div>
          </>
        )}

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}
      </form>
    </div>
  );
};

export default Login;