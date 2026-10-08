import React, { useState, useRef } from 'react';
import { Send, CheckCircle2, Sparkles, Zap, X, Check, BellRing, Rocket, Utensils } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Smooth parallax on mouse move
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://formspree.io/f/myekebyl', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setIsSubmitted(true);
        setIsModalOpen(true);

        // Multi-burst celebratory confetti
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#eb232d', '#ff7a00', '#ffd700', '#ffffff', '#22c55e']
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 60,
            origin: { x: 0.1, y: 0.6 },
            colors: ['#eb232d', '#ffaa00', '#ffffff']
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 60,
            origin: { x: 0.9, y: 0.6 },
            colors: ['#eb232d', '#ffaa00', '#ffffff']
          });
        }, 200);
      } else {
        const data = await response.json();
        if (data && data.errors && data.errors.length > 0) {
          setError(data.errors.map(err => err.message).join(', '));
        } else {
          setError('Oops! There was a problem submitting your email. Please try again.');
        }
      }
    } catch (err) {
      setError('Unable to connect. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[100dvh] h-[100dvh] w-screen overflow-hidden bg-red-texture flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 font-body select-none"
    >
      {/* Ambient Lighting & Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-72 h-72 bg-orange-500/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-6 right-6 w-72 h-72 bg-red-700/30 rounded-full blur-[80px] pointer-events-none" />

      {/* Floating Red Hot Chili Peppers (Top Right) */}
      <div
        className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-4 md:right-[6%] lg:right-[8%] z-30 pointer-events-none animate-float-reverse transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * 25}px, ${mousePos.y * 25}px, 0) rotate(12deg)`
        }}
      >
        <img
          src="/assets/chili.png"
          alt="Vibrant red chili peppers"
          className="w-24 sm:w-28 md:w-36 lg:w-44 xl:w-52 float-shadow object-contain"
        />
      </div>

      {/* Flying Motion-Blurred Tomato Slice (Bottom Left/Center) */}
      <div
        className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-[20%] sm:left-[28%] md:left-[30%] z-30 pointer-events-none animate-float-subtle transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * -30}px, ${mousePos.y * -30}px, 0) rotate(-18deg)`
        }}
      >
        <img
          src="/assets/tomato.png"
          alt="Juicy tomato slice"
          className="w-14 sm:w-16 md:w-20 lg:w-24 float-shadow object-contain opacity-95 blur-[0.3px]"
        />
      </div>

      {/* Central Interactive Poster Card (Optimized Height for Mobile Portrait & Desktop) */}
      <div className="relative z-20 w-full max-w-[960px] lg:max-w-[1020px] h-[86vh] sm:h-[84vh] md:h-auto max-h-[94vh] sm:max-h-[90vh] flex items-center justify-center">
        <div className="relative w-full h-full md:h-auto card-paper rounded-[28px] sm:rounded-[34px] md:rounded-[40px] card-shadow px-5 sm:px-8 md:px-12 lg:px-14 py-6 sm:py-6 md:py-6 lg:py-7 flex flex-col justify-between border-[2.5px] border-[#151515] overflow-visible">

          {/* Top Brand & Header Section */}
          <div className="w-full flex items-center justify-between z-40 mb-2 sm:mb-2">
            {/* Official Ftafat Brand Logo */}
            <div className="flex items-center">
              <a href="#" className="group inline-flex items-center transition-transform hover:scale-105 active:scale-95 duration-200">
                <img
                  src="/ftafat-logo.png"
                  alt="Ftafat Food Delivery Logo"
                  className="h-9 sm:h-10 md:h-12 lg:h-14 w-auto object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                />
              </a>
            </div>

            {/* Live Launch Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-[#ffede6] border border-[#ff5722]/35 rounded-full shadow-xs text-xs md:text-sm font-semibold text-[#d8222b]">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-600"></span>
              </span>
              <span className="tracking-wide font-outfit font-bold">⚡ Launching Soon</span>
            </div>
          </div>

          {/* Center Main Stage / Hero Content (Generous Portrait Height & Vertical Breathing Room) */}
          <div className="w-full flex flex-col items-center justify-center my-auto py-4 sm:py-3 md:py-3 text-center z-20">

            {/* Brush Stroke Banner Container */}
            <div className="relative w-full max-w-[460px] sm:max-w-[540px] md:max-w-[620px] lg:max-w-[680px] flex items-center justify-center min-h-[105px] sm:min-h-[115px] md:min-h-[125px] lg:min-h-[135px] mb-3 sm:mb-3">
              
              {/* Floating Basil Leaf */}
              <div
                className="absolute -top-8 sm:-top-9 md:-top-11 lg:-top-12 -left-2 sm:-left-5 md:-left-8 z-30 pointer-events-none animate-float-slow transition-transform duration-300 ease-out"
                style={{
                  transform: `translate3d(${mousePos.x * -15}px, ${mousePos.y * -15}px, 0) rotate(-14deg)`
                }}
              >
                <img
                  src="/assets/basil.png"
                  alt="Fresh basil leaf"
                  className="w-14 sm:w-16 md:w-22 lg:w-26 float-shadow object-contain"
                />
              </div>

              {/* Authentic Paint Brush Background */}
              <img
                src="/assets/brush_banner.png"
                alt="Red brush banner"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow-[0_6px_14px_rgba(180,20,30,0.35)]"
              />

              {/* Bold Distressed Headline "COMING SOON" */}
              <h1 className="relative z-10 font-bebas text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] tracking-wider text-white distressed-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] translate-y-[-2px]">
                COMING SOON
              </h1>

              {/* Cursive Calligraphy Overlay "Cravings" */}
              <div
                className="absolute -bottom-4 sm:-bottom-4 md:-bottom-5 lg:-bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none font-script text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#121212] tracking-wide"
                style={{
                  transform: 'translateX(-48%) rotate(-4.5deg)',
                  textShadow: '0 2px 8px rgba(255, 255, 255, 0.6), 0 3px 10px rgba(0,0,0,0.15)'
                }}
              >
                Cravings
              </div>
            </div>

            {/* Stylized Subtitle Message */}
            <div className="mt-7 sm:mt-7 md:mt-8 mb-4 sm:mb-4 md:mb-5 flex items-center justify-center gap-1.5 sm:gap-2 text-[#242424] font-medium text-xs sm:text-sm md:text-base tracking-wide">
              <span className="text-[#d8222b] font-bold text-sm sm:text-base md:text-lg">*</span>
              <p className="italic font-semibold tracking-wider text-slate-800">
                Notify me when App is launched
              </p>
              <span className="text-[#d8222b] font-bold text-sm sm:text-base md:text-lg">*</span>
            </div>

            {/* Email Subscription Bar / Form */}
            <div className="w-full max-w-[400px] sm:max-w-[460px] md:max-w-[500px]">
              {!isSubmitted ? (
                <form
                  action="https://formspree.io/f/myekebyl"
                  method="POST"
                  onSubmit={handleSubmit}
                  className="relative w-full"
                >
                  <div className="flex items-center bg-white rounded-full p-1 sm:p-1.5 border border-slate-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.07),0_2px_6px_rgba(0,0,0,0.03)] focus-within:shadow-[0_0_0_3px_rgba(235,35,45,0.22),0_10px_28px_rgba(0,0,0,0.1)] focus-within:border-[#eb232d]/60 transition-all duration-300">
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Please enter your email"
                      className="w-full bg-transparent px-4 sm:px-5 py-2.5 sm:py-2.5 text-sm sm:text-sm md:text-base text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                      required
                      aria-label="Email Address"
                    />

                    {/* Submit Red Button with Paper Plane Icon */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      aria-label="Subscribe"
                      className="flex-shrink-0 flex items-center justify-center h-9 w-11 sm:h-10 sm:w-12 bg-gradient-to-br from-[#eb232d] to-[#c91820] text-white rounded-full hover:brightness-110 active:scale-95 shadow-[0_3px_10px_rgba(235,35,45,0.4)] hover:shadow-[0_5px_16px_rgba(235,35,45,0.55)] transition-all duration-200 cursor-pointer disabled:opacity-75"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 sm:w-4 sm:h-4 -translate-x-0.5 translate-y-0.5 fill-current" />
                      )}
                    </button>
                  </div>

                  {error && (
                    <p className="text-red-600 text-xs font-semibold mt-1.5 text-left px-3 animate-shake">
                      {error}
                    </p>
                  )}
                </form>
              ) : (
                /* Inline Success Pill */
                <div 
                  onClick={() => setIsModalOpen(true)}
                  className="cursor-pointer bg-white/95 backdrop-blur border border-emerald-300/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-[0_10px_25px_rgba(16,185,129,0.15)] flex items-center justify-between gap-2 transition-transform hover:scale-[1.02] active:scale-98"
                >
                  <div className="flex items-center gap-2 text-left">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">You're on the VIP list! 🎉</p>
                      <p className="text-[11px] text-slate-500">We'll notify you as soon as we launch.</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#ffede6] text-[#eb232d] text-xs font-bold rounded-lg border border-[#ff5722]/30 flex-shrink-0">
                    Confirmed ✓
                  </span>
                </div>
              )}
            </div>

            {/* Express Perk Pill */}
            <div className="mt-5 sm:mt-5 flex items-center justify-center text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/75 rounded-full border border-slate-200/60 shadow-xs">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span className="text-xs">Express 10-Min Fast Food Delivery</span>
              </div>
            </div>

          </div>

          {/* Bottom Card Footer */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between pt-3 sm:pt-3 border-t border-slate-200/60 text-[11px] sm:text-xs text-slate-500 font-medium gap-1 z-20">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>100% Fresh & Hot Delivery Guarantee</span>
            </div>
            <div>
              <span>© {new Date().getFullYear()} Ftafat. All rights reserved.</span>
            </div>
          </div>

          {/* Giant Hero Burger (Left Side Overlapping Card) */}
          <div
            className="absolute -left-6 sm:-left-16 md:-left-20 lg:-left-24 xl:-left-28 -bottom-1 sm:bottom-4 md:bottom-6 z-30 pointer-events-none transition-transform duration-300 ease-out"
            style={{
              transform: `translate3d(${mousePos.x * -15}px, ${mousePos.y * -15}px, 0)`
            }}
          >
            <div className="relative">
              <img
                src="/assets/burger.png"
                alt="Gourmet double smash cheeseburger"
                className="w-36 sm:w-48 md:w-56 lg:w-68 xl:w-76 burger-shadow object-contain transform -rotate-3 hover:rotate-0 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Loaded Gourmet Pizza (Bottom Right Overlapping Card) */}
          <div
            className="absolute -right-6 sm:-right-14 md:-right-18 lg:-right-24 xl:-right-28 -bottom-4 sm:-bottom-10 md:-bottom-12 lg:-bottom-14 z-30 pointer-events-none transition-transform duration-300 ease-out"
            style={{
              transform: `translate3d(${mousePos.x * 18}px, ${mousePos.y * 18}px, 0)`
            }}
          >
            <div className="relative">
              <img
                src="/assets/pizza.png"
                alt="Stone baked pepperoni pizza"
                className="w-40 sm:w-52 md:w-64 lg:w-76 xl:w-88 pizza-shadow object-contain transform rotate-6 hover:rotate-12 transition-transform duration-500"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Floating Sparkles */}
      <div className="absolute top-1/2 left-6 text-white/20 pointer-events-none hidden lg:block">
        <Sparkles className="w-6 h-6 animate-pulse" />
      </div>
      <div className="absolute top-1/3 right-8 text-white/20 pointer-events-none hidden lg:block">
        <Sparkles className="w-5 h-5 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Premium Launch Confirmation Popup / Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          {/* Modal Container */}
          <div 
            className="relative w-full max-w-[420px] bg-white rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-slate-100 flex flex-col items-center text-center transform scale-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close 'X' button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Mascot Icon Badge */}
            <div className="relative mb-3 flex items-center justify-center">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-amber-400 to-red-500 p-1 shadow-lg shadow-red-500/25 animate-bounce-subtle">
                <img
                  src="/favicon.png"
                  alt="Ftafat Mascot"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            {/* Modal Heading */}
            <h2 className="font-outfit font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-2">
              You're All Set! 🎉
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-[320px]">
              Thank you for signing up! We'll send you an exclusive early-access link the moment <strong>Ftafat</strong> goes live.
            </p>

            {/* Confirmation Highlights */}
            <div className="w-full space-y-2.5 my-5 text-left text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-[#d8222b]">
                  <Rocket className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Priority Launch Access</p>
                  <p className="text-[11px] text-slate-500">First in line when delivery starts</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">10-Minute Fast Delivery</p>
                  <p className="text-[11px] text-slate-500">Hot, fresh food delivered rapidly</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">500+ Top Food Spots</p>
                  <p className="text-[11px] text-slate-500">Your favorite local cravings</p>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#eb232d] to-[#c91820] text-white font-bold text-sm sm:text-base shadow-[0_8px_20px_rgba(235,35,45,0.4)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              Can't Wait for Launch! 🚀
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
