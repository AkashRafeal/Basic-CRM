import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, AlertCircle } from 'lucide-react';
import { LightRays } from '../components/LightRays';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailInputRef = React.useRef<HTMLInputElement>(null);

  // Check if redirected from expired session
  const queryParams = new URLSearchParams(location.search);
  const sessionExpired = queryParams.get('session_expired');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed) {
      if (emailInputRef.current) {
        emailInputRef.current.setCustomValidity('Please enter an email address.');
        emailInputRef.current.reportValidity();
      }
      return;
    }

    if (!emailTrimmed.includes('@')) {
      if (emailInputRef.current) {
        emailInputRef.current.setCustomValidity(`Please include an '@' in the email address. '${email.trim()}' is missing an '@'.`);
        emailInputRef.current.reportValidity();
      }
      return;
    }

    const parts = emailTrimmed.split('@');
    const domain = parts[1] || '';
    if (domain !== 'gmail.com') {
      if (emailInputRef.current) {
        emailInputRef.current.setCustomValidity(`Email address must end with @gmail.com (e.g. ${parts[0] || 'user'}@gmail.com). '${domain}' is not recognized.`);
        emailInputRef.current.reportValidity();
      }
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(emailTrimmed)) {
      if (emailInputRef.current) {
        emailInputRef.current.setCustomValidity('Please enter a valid Gmail address (e.g. user@gmail.com).');
        emailInputRef.current.reportValidity();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email: emailTrimmed, password });
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Invalid email or password'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden bg-[#070b14]">
      {/* Ambient Gradient Spotlight */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 10%, rgba(99, 102, 241, 0.18) 0%, rgba(15, 23, 42, 0.4) 60%, #030712 100%)'
        }}
      />

      {/* Interactive LightRays Animated Background with Balanced Visibility */}
      <div className="absolute inset-0 z-0 opacity-80">
        <LightRays
          raysOrigin="top-center"
          raysColor="#93c5fd"
          raysSpeed={1.2}
          lightSpread={1.0}
          rayLength={2.4}
          pulsating={false}
          followMouse={true}
          mouseInfluence={0.2}
          noiseAmount={0.05}
          distortion={0.04}
          saturation={1.3}
        />
      </div>

      <div className="max-w-sm w-full relative z-10 my-auto p-6 sm:p-8 rounded-3xl bg-slate-950/40 backdrop-blur-md border border-slate-800/60 shadow-2xl shadow-black/60">
        {/* User Icon Circle with Original Indigo Gradient */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 border-2 border-indigo-400/50 shadow-2xl shadow-indigo-600/50 flex items-center justify-center backdrop-blur-md">
            <User className="w-10 h-10 text-white stroke-[1.5]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-light tracking-[0.25em] text-slate-100 uppercase text-center mb-8 select-none">
          USER LOGIN
        </h1>

        {sessionExpired && (
          <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Your session has expired. Please sign in again.</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form with Underline Inputs in Original Slate & Indigo Accents */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email ID Field */}
          <div className="relative border-b border-slate-700/90 focus-within:border-indigo-500 transition-colors duration-200 pb-1.5 flex items-center gap-3">
            <Mail className="w-5 h-5 text-indigo-400 shrink-0 stroke-[1.8]" />
            <input
              ref={emailInputRef}
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                e.target.setCustomValidity('');
                if (error) setError(null);
              }}
              pattern="^[a-zA-Z0-9._%+-]+@gmail\.com$"
              title="Email address must end with @gmail.com (e.g. user@gmail.com)"
              placeholder="Email ID"
              style={{ colorScheme: 'dark', WebkitTextFillColor: '#ffffff' }}
              className="w-full bg-transparent text-white caret-white placeholder:text-slate-500 text-sm focus:outline-none border-none py-1 tracking-wide"
            />
          </div>

          {/* Password Field */}
          <div className="relative border-b border-slate-700/90 focus-within:border-indigo-500 transition-colors duration-200 pb-1.5 flex items-center gap-3">
            <Lock className="w-5 h-5 text-indigo-400 shrink-0 stroke-[1.8]" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Password"
              style={{ colorScheme: 'dark', WebkitTextFillColor: '#ffffff' }}
              className="w-full bg-transparent text-white caret-white placeholder:text-slate-500 text-sm focus:outline-none border-none py-1 tracking-wide"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 relative overflow-hidden group bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:via-purple-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-bold text-xs tracking-[0.25em] uppercase rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-[0_12px_35px_-5px_rgba(99,102,241,0.75),0_0_25px_rgba(168,85,247,0.5)] hover:-translate-y-1 hover:scale-[1.015] hover:brightness-110 active:translate-y-0 active:scale-[0.98] border border-indigo-400/40 hover:border-indigo-300/70 flex items-center justify-center disabled:opacity-60 cursor-pointer"
            >
              {/* Shimmer gleam streak on hover */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="relative z-10">LOGIN</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


