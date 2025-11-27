import React, { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Play, 
  FileText, 
  Zap, 
  Youtube, 
  Hash, 
  Download, 
  Upload, 
  Sparkles, 
  CheckCircle,
  Star,
  Menu,
  X,
  ArrowRight,
  Clock,
  Globe,
  Shield,
  Brain,
  Share2,
  Target,
  Users,
  BarChart3,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { createCheckoutSession } from "@/lib/stripe";
import Logo from './Logo';

// Ripple Button Component
const RippleButton = ({ children, className = "", onClick, ...props }: any) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [rippleId, setRippleId] = useState(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = {
      x,
      y,
      id: rippleId,
    };
    
    setRipples([...ripples, newRipple]);
    setRippleId(rippleId + 1);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
    
    onClick?.(e);
  };

  return (
    <Button
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          initial={{ width: 0, height: 0, x: ripple.x, y: ripple.y }}
          animate={{
            width: 300,
            height: 300,
            x: ripple.x - 150,
            y: ripple.y - 150,
            opacity: [0.5, 0.3, 0],
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </Button>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ 
  value, 
  duration = 2, 
  prefix = "", 
  suffix = "",
  decimals = 0,
  className = ""
}: { 
  value: number; 
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = value * easeOutQuart;
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isInView, value, duration]);

  const formatNumber = (num: number) => {
    // Remove decimals for formatting check
    const wholeNum = Math.floor(num);
    
    if (wholeNum >= 1000000) {
      const millions = num / 1000000;
      return millions.toFixed(decimals).replace(/\.?0+$/, '') + 'M';
    } else if (wholeNum >= 1000) {
      const thousands = num / 1000;
      return thousands.toFixed(decimals).replace(/\.?0+$/, '') + 'K';
    }
    // For numbers less than 1000, show decimals if specified
    return num.toFixed(decimals).replace(/\.?0+$/, '');
  };

  return (
    <span ref={ref} className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};

// Simple Audio Waveform - Clean and Minimal
const SimpleWaveform = ({ className = "" }: { className?: string }) => {
  const bars = [20, 35, 25, 40, 30, 45, 35, 30, 40, 25, 35, 20];
  
  return (
    <div className={`flex items-end justify-center gap-1.5 ${className}`}>
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="bg-blue-600 rounded-full"
          style={{ width: '4px' }}
          initial={{ height: 0 }}
          animate={{ 
            height: `${height}px`,
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Animated Checkmark Component
const AnimatedCheckmark = ({ className = "" }: { className?: string }) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.5,
      }}
      className={className}
    >
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M16.7071 5.29289C17.0976 5.68342 17.0976 6.31658 16.7071 6.70711L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071L3.29289 10.7071C2.90237 10.3166 2.90237 9.68342 3.29289 9.29289C3.68342 8.90237 4.31658 8.90237 4.70711 9.29289L8 12.5858L15.2929 5.29289C15.6834 4.90237 16.3166 4.90237 16.7071 5.29289Z"
          fill="currentColor"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </motion.svg>
    </motion.div>
  );
};

// Interactive Demo Section Component
const InteractiveDemoSection = () => {
  const [demoState, setDemoState] = useState<'upload' | 'processing' | 'transcribing' | 'complete'>('upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [showRestartButton, setShowRestartButton] = useState(false);
  
  const demoTranscript = `Welcome to today's podcast episode. We're going to dive deep into the fascinating world of artificial intelligence and how it's transforming content creation. 

First, let's talk about transcription accuracy. Our AI-powered system can achieve up to 99% accuracy, making it perfect for professional content creators who need reliable transcriptions.

The technology behind this is truly remarkable. We use advanced speech recognition algorithms combined with natural language processing to not only transcribe your audio but also understand the context and meaning behind the words.

Now, let's explore some of the key features. You can upload audio files in various formats - MP3, WAV, M4A, and more. The system automatically detects the format and processes it accordingly.

One of the most powerful aspects is the ability to generate summaries, extract key points, and even create Q&A sections automatically. This saves hours of manual work and allows you to focus on what matters most - creating great content.

So whether you're a podcaster, a YouTuber, or a content creator, this tool can revolutionize your workflow.`;

  const startTyping = React.useCallback(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < demoTranscript.length) {
        setTypedText(demoTranscript.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setDemoState('complete');
          setShowRestartButton(true);
        }, 1000);
      }
    }, 15); // Adjust typing speed here
  }, [demoTranscript]);

  const startUpload = React.useCallback(() => {
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setDemoState('transcribing');
          startTyping();
        }, 500);
      }
    }, 100);
  }, [startTyping]);

  useEffect(() => {
    if (demoState === 'upload') {
      // Auto-start demo after 2 seconds
      const timer = setTimeout(() => {
        setDemoState('processing');
        startUpload();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [demoState, startUpload]);

  const restartDemo = () => {
    setDemoState('upload');
    setUploadProgress(0);
    setTypedText('');
    setShowRestartButton(false);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="bg-blue-100 text-blue-800 px-4 py-2 mb-4">
            <Zap className="w-4 h-4 mr-2" />
            Live Demo
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            See It In Action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how our AI transforms your audio into professional transcripts in real-time
          </p>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          {/* Demo Header */}
          <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-gray-300 text-sm font-medium">audiotext.app</span>
            </div>
            {showRestartButton && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <RippleButton
                  size="sm"
                  variant="outline"
                  className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  onClick={restartDemo}
                >
                  <span className="relative z-10 flex items-center">
                    <motion.span
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                    </motion.span>
                    Restart Demo
                  </span>
                </RippleButton>
              </motion.div>
            )}
          </div>

          {/* Demo Content */}
          <div className="p-8">
            {demoState === 'upload' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="mb-6"
                >
                  <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-12 h-12 text-blue-600" />
                  </div>
                </motion.div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Upload Your Audio</h3>
                <p className="text-gray-600 mb-6">Drag & drop or click to upload</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 max-w-md mx-auto">
                  <div className="flex flex-col items-center">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-sm">podcast-episode.mp3</p>
                    <p className="text-gray-400 text-xs mt-2">15.2 MB</p>
                  </div>
                </div>
              </motion.div>
            )}

            {demoState === 'processing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="w-20 h-20 mx-auto mb-6 border-4 border-blue-600 border-t-transparent rounded-full"
                />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Processing Audio...</h3>
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 rounded-full h-3 mb-2">
                    <motion.div
                      className="bg-blue-600 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{uploadProgress}% uploaded</p>
                </div>
              </motion.div>
            )}

            {(demoState === 'transcribing' || demoState === 'complete') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                {/* Status Bar */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-3 h-3 bg-green-500 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {demoState === 'transcribing' ? 'Transcribing...' : 'Transcription Complete'}
                    </span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    99.2% Accuracy
                  </Badge>
                </div>

                {/* Transcript Preview */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Transcript Preview
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>2:34</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 max-h-96 overflow-y-auto">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                      {typedText}
                      {demoState === 'transcribing' && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="inline-block w-2 h-5 bg-blue-600 ml-1"
                        />
                      )}
                    </p>
                  </div>

                  {/* Stats */}
                  {demoState === 'complete' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200"
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{typedText.split(' ').length}</div>
                        <div className="text-xs text-gray-600">Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{typedText.length}</div>
                        <div className="text-xs text-gray-600">Characters</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">2:34</div>
                        <div className="text-xs text-gray-600">Duration</div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Action Buttons */}
                {demoState === 'complete' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center space-x-4 pt-4"
                  >
                    <RippleButton variant="outline" className="flex items-center hover-lift">
                      <span className="relative z-10 flex items-center">
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                        </motion.span>
                        Download
                      </span>
                    </RippleButton>
                    <RippleButton className="bg-blue-600 hover:bg-blue-700 text-white flex items-center hover-lift">
                      <span className="relative z-10 flex items-center">
                        <motion.span
                          whileHover={{ scale: 1.1, rotate: 15 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                        </motion.span>
                        Share
                      </span>
                    </RippleButton>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Animated Pricing Section Component
const PricingSection = ({ pricingTiers, handlePlanSelect }: { pricingTiers: any[], handlePlanSelect: (planName: string, price: string) => void }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white" ref={ref}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600">
            Start free or upgrade to Pro - choose what works for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch pt-6">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: index * 0.2, type: "spring", stiffness: 300, damping: 30 }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="relative flex"
            >
              <Card 
                className={`relative bg-white flex flex-col h-full w-full overflow-visible transition-all duration-300 ${
                  tier.popular 
                    ? 'border-2 border-blue-600 shadow-2xl' 
                    : 'border-gray-200 shadow-lg'
                }`}
              >
                {/* Glowing border effect for Pro plan */}
                {tier.popular && (
                  <>
                    <motion.div 
                      className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-xl opacity-75 blur-md -z-10"
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-xl opacity-50 blur-sm -z-10"></div>
                  </>
                )}
                
                {/* Most Popular badge - positioned inside card with proper spacing */}
                {tier.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <Badge className="bg-blue-600 text-white px-4 py-1 shadow-lg">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className={`text-center pb-4 relative z-10 ${tier.popular ? 'pt-8' : ''}`}>
                  <CardTitle className="text-3xl mb-2 text-gray-900">{tier.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-600 text-xl">{tier.period}</span>
                  </div>
                  <CardDescription className="text-lg font-semibold text-blue-600">
                    {tier.highlights}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow space-y-4 relative z-10">
                  <ul className="space-y-3 flex-grow">
                    {tier.features.map((feature: string, featureIndex: number) => (
                      <motion.li
                        key={featureIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                        transition={{ 
                          duration: 0.4, 
                          delay: isInView ? (index * 0.2) + (featureIndex * 0.1) : 0,
                          ease: "easeOut"
                        }}
                        className="flex items-start space-x-3"
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                          transition={{ 
                            duration: 0.5, 
                            delay: isInView ? (index * 0.2) + (featureIndex * 0.1) : 0,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }}
                          whileHover={{ scale: 1.2, rotate: 360 }}
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        </motion.div>
                        <span className="text-gray-600">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                  {tier.isEnterprise ? (
                    <RippleButton 
                      className="w-full mt-auto transition-all duration-300 relative group bg-gray-800 hover:bg-gray-900 text-white"
                      onClick={() => handlePlanSelect(tier.name, tier.price)}
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        {tier.buttonText}
                        <motion.span
                          className="ml-2"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </motion.span>
                      </span>
                    </RippleButton>
                  ) : (
                    <RippleButton 
                      className={`w-full mt-auto transition-all duration-300 relative group ${
                        tier.popular 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      onClick={() => handlePlanSelect(tier.name, tier.price)}
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        {tier.buttonText}
                        <motion.span
                          className="ml-2"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </motion.span>
                      </span>
                    </RippleButton>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ShowNoteLanding = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = React.useRef<HTMLElement>(null);
  const scrollAnimationFrameRef = React.useRef<number | null>(null);
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  
  // Smooth scroll function with easing
  const smoothScrollTo = (targetId: string, offset: number = 80) => {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    // Cancel any existing scroll animation
    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }

    const startPosition = window.pageYOffset || window.scrollY;
    const targetPosition = targetElement.getBoundingClientRect().top + startPosition - offset;
    const distance = targetPosition - startPosition;
    const duration = Math.min(Math.max(Math.abs(distance) * 0.5, 400), 1500); // Adaptive duration
    let start: number | null = null;

    // Easing function: easeInOutCubic for smooth acceleration and deceleration
    const easeInOutCubic = (t: number): number => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      const currentPosition = startPosition + distance * ease;
      window.scrollTo({
        top: currentPosition,
        behavior: 'auto' as ScrollBehavior
      });

      if (progress < 1) {
        scrollAnimationFrameRef.current = requestAnimationFrame(animation);
      } else {
        // Ensure we end exactly at the target
        window.scrollTo({
          top: targetPosition,
          behavior: 'auto' as ScrollBehavior
        });
        scrollAnimationFrameRef.current = null;
      }
    };

    scrollAnimationFrameRef.current = requestAnimationFrame(animation);
    
    // Close mobile menu if open
    setMobileMenuOpen(false);
  };

  // Handle anchor link clicks
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    smoothScrollTo(targetId);
  };
  
  // Cleanup scroll animation on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
    };
  }, []);

  // Handle scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Calculate parallax offset
  const parallaxOffset = scrollY * 0.5;
  const opacity = Math.max(0, 1 - scrollY / 500);

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/dashboard');
    } else {
      navigate('/sign-up');
    }
  };

  const handleLogin = () => {
    if (isSignedIn) {
      navigate('/dashboard');
    } else {
      navigate('/sign-in');
    }
  };

  const handlePlanSelect = async (planName: string, price: string) => {
    if (planName === 'Enterprise') {
      // Enterprise plan - open email to contact
      window.location.href = 'mailto:support@audiotext.com?subject=Enterprise Plan Inquiry&body=Hi, I\'m interested in learning more about the Enterprise plan.';
      return;
    }

    if (!isSignedIn) {
      // Redirect to sign up first
      navigate('/sign-up');
      return;
    }

    if (planName === 'Free') {
      // Free plan - just go to dashboard
      navigate('/dashboard');
    } else {
      // Paid plans - create Stripe checkout session
      try {
        const token = await getToken({ template: 'supabase' });
        const userEmail = user?.emailAddresses[0]?.emailAddress;
        
        await createCheckoutSession(planName, userEmail, token || undefined);
      } catch (error) {
        console.error('Error creating checkout session:', error);
        alert(`Failed to start checkout. Please try again or contact support.`);
      }
    }
  };

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: "AI Transcription",
      description: "High-accuracy transcription with 99% accuracy for audio and video files"
    },
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "GPT-Powered Summaries",
      description: "AI-generated intelligent summaries that capture key insights and highlights"
    },
    {
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      title: "Q&A Extraction",
      description: "Automatically extract questions and answers from your content"
    },
    {
      icon: <Upload className="w-8 h-8 text-blue-600" />,
      title: "Easy Upload",
      description: "Upload audio, video files, or paste YouTube links for instant processing"
    },
    {
      icon: <Youtube className="w-8 h-8 text-blue-600" />,
      title: "YouTube Support",
      description: "Process YouTube videos directly by pasting the link"
    },
    {
      icon: <Hash className="w-8 h-8 text-blue-600" />,
      title: "Smart Keywords",
      description: "Extract relevant keywords to boost your content's discoverability"
    },
    {
      icon: <Download className="w-8 h-8 text-blue-600" />,
      title: "Multi-format Export",
      description: "Export as PDF, Word, HTML, or plain text for any platform"
    },
    {
      icon: <Sparkles className="w-8 h-8 text-blue-600" />,
      title: "Advanced AI",
      description: "GPT-3.5-turbo powered content creation with Pro plan"
    }
  ];

  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      highlights: "30 minutes audio + 5 AI prompts",
      features: [
        "30 minutes of audio processing per month",
        "5 GPT prompts for AI content generation",
        "High-accuracy transcription",
        "GPT-powered summaries",
        "Q&A extraction",
        "Text export only",
        "Community support",
        "Upload audio & video files"
      ],
      buttonText: "Try Free",
      popular: false
    },
    {
      name: "Pro",
      price: "$7",
      period: "/week • Cancel any time",
      highlights: "500 mins/week + unlimited YouTube + 50 prompts",
      features: [
        "500 minutes of audio upload per week",
        "Unlimited YouTube transcript extraction",
        "50 GPT prompts per month",
        "GPT-powered summaries & content generation",
        "Q&A extraction",
        "Multi-format export (PDF, Word, HTML)",
        "Priority processing",
        "Email support",
        "YouTube link support"
      ],
      buttonText: "Upgrade to Pro",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      highlights: "Unlimited everything + dedicated support",
      features: [
        "Unlimited audio processing",
        "Unlimited YouTube transcript extraction",
        "Unlimited GPT prompts",
        "Advanced AI features & customization",
        "Dedicated account manager",
        "Priority support & SLA",
        "Custom integrations & API access",
        "Team collaboration features",
        "White-label options"
      ],
      buttonText: "Contact Us",
      popular: false,
      isEnterprise: true
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Upload Audio, Video, or YouTube Link",
      description: "Drag & drop audio/video files, or paste a YouTube URL for instant processing",
      icon: <Upload className="w-12 h-12 text-blue-600" />
    },
    {
      number: "2", 
      title: "AI Transcribes & Generates Content",
      description: "Get 99% accurate transcription, GPT-powered summaries, and Q&A extraction in minutes",
      icon: <Brain className="w-12 h-12 text-blue-600" />
    },
    {
      number: "3",
      title: "Export & Publish Anywhere",
      description: "Download as PDF, Word, HTML, or plain text for any platform - all ready to use",
      icon: <Download className="w-12 h-12 text-blue-600" />
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Podcast Host",
      avatar: null, // Use fallback initials instead
      quote: "The AI transcription is incredibly accurate, and the GPT-powered summaries save me hours each week. The Q&A extraction feature is perfect for turning my podcast episodes into blog posts!"
    },
    {
      name: "Mike Rodriguez",
      role: "YouTube Creator",
      avatar: null, // Use fallback initials instead
      quote: "I can upload my YouTube videos directly and get instant transcriptions. The Pro plan gives me unlimited YouTube transcripts plus 500 minutes of audio - it's a game-changer for my content workflow!"
    },
    {
      name: "Emma Thompson",
      role: "Content Creator",
      avatar: null, // Use fallback initials instead
      quote: "The transcription accuracy is incredible, and I love how easy it is to upload audio or video files. The export to multiple formats makes it perfect for all my platforms!"
    }
  ];

  const faqs = [
    {
      question: "How accurate is the AI transcription?",
      answer: "Our AI achieves 99% accuracy for clear audio and video. The system uses advanced speech recognition technology that continuously learns and improves. You can always edit the transcripts if needed."
    },
    {
      question: "What file formats do you support?",
      answer: "We support all major audio formats (MP3, WAV, M4A, FLAC) and video formats (MP4, AVI, MOV). You can also paste YouTube URLs directly for instant processing. Export is available in PDF, Word, HTML, TXT, and SRT subtitle formats."
    },
    {
      question: "What's the difference between Free and Pro?",
      answer: "Free includes 30 minutes of audio processing and 5 AI prompts per month. Pro includes 500 minutes of audio upload per week, unlimited YouTube transcript extraction, 50 GPT prompts per month, priority processing, and multi-format export."
    },
    {
      question: "How does Q&A extraction work?",
      answer: "Our AI analyzes your transcribed content to identify questions and answers throughout your audio or video. This is perfect for converting podcasts or interviews into structured Q&A content for blog posts and articles."
    },
    {
      question: "Can I process YouTube videos?",
      answer: "Yes! With a Pro plan, you can paste any YouTube URL and we'll automatically download, transcribe, and generate summaries. Free users can upload their own audio/video files."
    },
    {
      question: "How long does processing take?",
      answer: "Most audio and video files are processed within 2-5 minutes depending on length. Pro users get priority processing for even faster results."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel anytime with no questions asked. You'll retain access to your account until the end of your billing period."
    },
    {
      question: "Is my audio/video data secure?",
      answer: "Absolutely. Your files are encrypted, processed securely, and automatically deleted after 30 days. We never share your content with third parties."
    }
  ];

  return (
    <div className="min-h-screen bg-white scroll-container">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" />
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <motion.a 
                href="#features" 
                onClick={(e) => handleAnchorClick(e, 'features')}
                className="text-gray-600 hover:text-gray-900 font-medium clickable-hover"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Features
              </motion.a>
              <motion.a 
                href="#pricing" 
                onClick={(e) => handleAnchorClick(e, 'pricing')}
                className="text-gray-600 hover:text-gray-900 font-medium clickable-hover"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Pricing
              </motion.a>
              <motion.a 
                href="#faq" 
                onClick={(e) => handleAnchorClick(e, 'faq')}
                className="text-gray-600 hover:text-gray-900 font-medium clickable-hover"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                FAQ
              </motion.a>
              {isSignedIn ? (
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Dashboard
                  </Button>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 rounded-full aspect-square overflow-hidden bg-primary",
                        avatarImage: "rounded-full",
                        avatarFallback: "rounded-full bg-primary text-primary-foreground",
                      },
                    }}
                    afterSignOutUrl="/"
                  />
                </div>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900">Login</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button className="bg-gray-900 hover:bg-gray-800 text-white">Sign Up</Button>
                  </SignUpButton>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <motion.a 
                  href="#features" 
                  onClick={(e) => handleAnchorClick(e, 'features')}
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 clickable-hover"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Features
                </motion.a>
                <motion.a 
                  href="#pricing" 
                  onClick={(e) => handleAnchorClick(e, 'pricing')}
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 clickable-hover"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Pricing
                </motion.a>
                <motion.a 
                  href="#faq" 
                  onClick={(e) => handleAnchorClick(e, 'faq')}
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 clickable-hover"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  FAQ
                </motion.a>
                <div className="flex space-x-2 px-3 py-2">
                  {isSignedIn ? (
                    <div className="flex items-center space-x-2 w-full">
                      <Button 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
                        onClick={() => navigate('/dashboard')}
                      >
                        Dashboard
                      </Button>
                      <UserButton
                        appearance={{
                          elements: {
                            avatarBox: "w-8 h-8 rounded-full aspect-square overflow-hidden bg-primary",
                            avatarImage: "rounded-full",
                            avatarFallback: "rounded-full bg-primary text-primary-foreground",
                          },
                        }}
                        afterSignOutUrl="/"
                      />
                    </div>
                  ) : (
                    <>
                      <SignInButton mode="modal">
                        <Button variant="ghost" size="sm" className="flex-1 text-gray-600 hover:text-gray-900">Login</Button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <Button size="sm" className="flex-1 bg-gray-900 hover:bg-gray-800 text-white">Sign Up</Button>
                      </SignUpButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Light Background */}
      <section ref={heroRef} className="relative py-20 overflow-hidden">
        {/* Light Gradient Background */}
        <div className="absolute inset-0">
          {/* Base light gradient layer */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            style={{
              background: 'linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 25%, #fce7f3 50%, #dbeafe 75%, #e0f2fe 100%)',
            }}
          />
          
          {/* Slow-moving floating gradient orb */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(96, 165, 250, 0.6) 0%, rgba(167, 139, 250, 0.4) 50%, transparent 70%)',
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, 150, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Second slow-moving floating orb */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.5) 0%, rgba(59, 130, 246, 0.3) 50%, transparent 70%)',
            }}
            animate={{
              x: [0, -120, 0],
              y: [0, -100, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          {/* Third slow-moving floating orb */}
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full blur-[90px] opacity-25"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(14, 165, 233, 0.3) 50%, transparent 70%)',
            }}
            animate={{
              x: [0, 80, 0],
              y: [0, -80, 0],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              <motion.div 
                className="flex items-center space-x-2 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                  <Zap className="w-4 h-4 mr-1" />
                  AI-Powered Transcription
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                AI-Powered Transcription & 
                <span className="text-blue-600 block">Content Creation</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Transform audio and video into professional content with AI-powered transcription, 
                GPT-powered summaries, and intelligent Q&A extraction. Start free with 30 minutes of audio processing and 5 AI prompts.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <RippleButton size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 w-full sm:w-auto" onClick={handleGetStarted}>
                    <span className="relative z-10 flex items-center">
                      {isSignedIn ? 'Go to Dashboard' : 'Try Free'}
                      <motion.span
                        className="ml-2"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.span>
                    </span>
                  </RippleButton>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <RippleButton 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white text-lg px-8 py-3 bg-white w-full sm:w-auto"
                    onClick={() => navigate('/billing')}
                  >
                    <span className="relative z-10 flex items-center">
                      Upgrade to Pro
                      <motion.span
                        className="ml-2"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.span>
                    </span>
                  </RippleButton>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="flex items-center space-x-6 mt-8 text-sm text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Audio/Video</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4" />
                  <span>GPT-Powered AI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Instant Results</span>
                </div>
              </motion.div>
            </div>
            {/* Right Column - Simple Visual */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-12 transform rotate-2 border border-gray-100">
                <div className="space-y-8">
                  {/* Simple Audio Waveform */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <motion.div
                        className="w-3 h-3 bg-blue-600 rounded-full mr-2"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-sm font-medium text-gray-600">Processing Audio</span>
                    </div>
                    <SimpleWaveform className="h-32" />
                  </div>

                  {/* Simple Progress Indicator */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Transcription</span>
                      <span className="text-blue-600 font-semibold">99%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "99%" }}
                        transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Simple Feature Icons */}
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <motion.div
                        className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2"
                        whileHover={{ scale: 1.1 }}
                      >
                        <FileText className="w-6 h-6 text-blue-600" />
                      </motion.div>
                      <p className="text-xs text-gray-600">Transcript</p>
                    </div>
                    <div className="text-center">
                      <motion.div
                        className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Brain className="w-6 h-6 text-purple-600" />
                      </motion.div>
                      <p className="text-xs text-gray-600">AI Summary</p>
                    </div>
                    <div className="text-center">
                      <motion.div
                        className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Hash className="w-6 h-6 text-green-600" />
                      </motion.div>
                      <p className="text-xs text-gray-600">Q&A</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <InteractiveDemoSection />

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-blue-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background gradient for glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-purple-100/20 to-pink-100/30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Transcription & Content Creation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform any audio or video into professional content with GPT-powered summaries, Q&A extraction, and intelligent analysis.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
              >
                <Card className="relative overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.5)] transition-all duration-300 hover-lift cursor-pointer">
                  {/* Glassmorphism gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent pointer-events-none" />
                  
                  {/* Subtle border gradient */}
                  <div className="absolute inset-0 rounded-xl border border-white/30 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                  
                  <CardHeader className="text-center pb-4 relative z-10">
                    <motion.div 
                      className="mx-auto mb-4 p-3 bg-blue-50/80 backdrop-blur-sm rounded-full w-fit border border-blue-200/50"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <CardTitle className="text-lg mb-2 text-gray-900 font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center relative z-10">
                    <CardDescription className="text-gray-700 leading-relaxed text-sm font-medium">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upload Showcase */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 mb-4">
              <Upload className="w-4 h-4 mr-2" />
              Easy Upload & Processing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Upload Any Format in Seconds
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Support for audio files, video files, and YouTube links - all with instant AI processing.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 items-center">
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              {[
                { icon: Upload, color: 'bg-blue-600', title: 'Audio & Video Files', desc: 'Upload MP3, WAV, M4A, MP4, AVI, and more. Simply drag and drop.' },
                { icon: Youtube, color: 'bg-purple-600', title: 'YouTube Links', desc: 'Paste any YouTube URL for instant transcription and AI processing' },
                { icon: Zap, color: 'bg-green-600', title: 'Instant Processing', desc: 'Fast AI transcription that starts immediately after upload' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  <motion.div 
                    className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <item.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              className="lg:col-span-1 flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative">
                <motion.div 
                  className="w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="w-16 h-16 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">Upload</div>
                      <div className="text-sm text-gray-600">Any Format</div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className="absolute -top-4 -right-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.2, rotate: 360 }}
                >
                  <Youtube className="w-6 h-6 text-white" />
                </motion.div>
                <motion.div
                  className="absolute -bottom-4 -left-4 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.7, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.2, rotate: -360 }}
                >
                  <Zap className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              {[
                { icon: CheckCircle, color: 'bg-amber-600', title: '99% Accuracy', desc: 'Industry-leading AI transcription with near-perfect accuracy' },
                { icon: Brain, color: 'bg-red-600', title: 'GPT-Powered AI', desc: 'Advanced AI for intelligent summaries and Q&A extraction' },
                { icon: Download, color: 'bg-indigo-600', title: 'Multi-Format Export', desc: 'Download as PDF, Word, HTML, or plain text for any platform' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  <motion.div 
                    className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <item.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Transform your audio and video into professional content in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting lines - positioned absolutely relative to grid container */}
            {/* Line connecting Step 1 to Step 2 */}
            <motion.div 
              className="hidden md:block absolute h-0.5 bg-blue-200 z-0"
              style={{
                top: '2.5rem', // Vertical center of circles (w-20 = 5rem, center = 2.5rem)
                left: 'calc((100% - 4rem) / 6)', // Start from center of first column: (column_width / 2)
                width: 'calc((100% - 4rem) / 3 + 2rem)', // One column width + one gap (2rem)
                transformOrigin: 'left center',
              }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.8, 
                delay: 0.6
              }}
            />
            {/* Line connecting Step 2 to Step 3 */}
            <motion.div 
              className="hidden md:block absolute h-0.5 bg-blue-200 z-0"
              style={{
                top: '2.5rem', // Vertical center of circles
                left: 'calc((100% - 4rem) / 3 + 2rem + (100% - 4rem) / 6)', // Center of second column
                width: 'calc((100% - 4rem) / 3 + 2rem)', // One column width + one gap (2rem)
                transformOrigin: 'left center',
              }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.8, 
                delay: 0.8
              }}
            />
            
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.2,
                  ease: "easeOut"
                }}
              >
                <div className="relative mb-8">
                  {/* Circle - with higher z-index to appear above lines */}
                  <motion.div 
                    className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 relative z-10"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.2 + 0.2,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                  >
                    {step.number}
                  </motion.div>
                  {/* Icon - also above the line */}
                  <motion.div 
                    className="mx-auto mb-4 relative z-10"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.2 + 0.4,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ scale: 1.1, y: -5 }}
                  >
                    {step.icon}
                  </motion.div>
                </div>
                <motion.h3 
                  className="text-xl font-semibold text-gray-900 mb-3"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.5 }}
                >
                  {step.title}
                </motion.h3>
                <motion.p 
                  className="text-gray-600 leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.7 }}
                >
                  {step.description}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection 
        pricingTiers={pricingTiers}
        handlePlanSelect={handlePlanSelect}
      />

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 via-purple-50/30 to-blue-50 relative overflow-hidden">
        {/* Background gradient for glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-blue-100/30 to-pink-100/40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Content Creators Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See how our AI transcription and content creation helps creators save time every day
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  ease: "easeOut"
                }}
              >
                <Card className="relative overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.5)] transition-all duration-300 hover-lift cursor-pointer">
                  {/* Glassmorphism gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent pointer-events-none" />
                  
                  {/* Subtle border gradient */}
                  <div className="absolute inset-0 rounded-xl border border-white/30 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                  
                  <CardContent className="p-6 relative z-10">
                    <motion.div 
                      className="flex items-center mb-4"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.15 + 0.2 }}
                    >
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ 
                            duration: 0.3, 
                            delay: index * 0.15 + 0.3 + i * 0.1,
                            type: "spring",
                            stiffness: 200
                          }}
                        >
                          <Star className="w-5 h-5 text-amber-400 fill-current drop-shadow-sm" />
                        </motion.div>
                      ))}
                    </motion.div>
                    <motion.blockquote 
                      className="text-gray-800 mb-6 leading-relaxed font-medium"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.15 + 0.4 }}
                    >
                      "{testimonial.quote}"
                    </motion.blockquote>
                    <motion.div 
                      className="flex items-center space-x-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.15 + 0.6 }}
                    >
                      <motion.div 
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg border-2 border-white/30"
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ 
                          duration: 0.5, 
                          delay: index * 0.15 + 0.7,
                          type: "spring",
                          stiffness: 200
                        }}
                        whileHover={{ scale: 1.1, rotate: 360 }}
                      >
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </motion.div>
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                        <div className="text-gray-600 text-sm">{testimonial.role}</div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section with Animated Counters */}
      <section className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 mb-4">
              <BarChart3 className="w-4 h-4 mr-2" />
              Platform Statistics
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Creators Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See the impact we're making in the content creation community
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                value: 12500000,
                prefix: "",
                suffix: "+",
                label: "Minutes Transcribed",
                icon: Clock,
                color: "text-blue-600",
                bgColor: "bg-blue-100",
                description: "Total audio processed"
              },
              {
                value: 85000,
                prefix: "",
                suffix: "+",
                label: "Episodes Processed",
                icon: FileText,
                color: "text-purple-600",
                bgColor: "bg-purple-100",
                description: "Content created"
              },
              {
                value: 12500,
                prefix: "",
                suffix: "+",
                label: "Active Creators",
                icon: Users,
                color: "text-green-600",
                bgColor: "bg-green-100",
                description: "Trusted users"
              },
              {
                value: 99.2,
                prefix: "",
                suffix: "%",
                label: "Accuracy Rate",
                icon: Target,
                color: "text-amber-600",
                bgColor: "bg-amber-100",
                description: "Transcription precision",
                decimals: 1
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
              >
                <motion.div
                  className={`mx-auto mb-4 w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center ${stat.color}`}
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <stat.icon className="w-8 h-8" />
                </motion.div>
                <motion.div
                  className="text-4xl md:text-5xl font-bold mb-2"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                >
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals || 0}
                    duration={2.5}
                    className={stat.color}
                  />
                </motion.div>
                <motion.h3
                  className="text-lg font-semibold text-gray-900 mb-1"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                >
                  {stat.label}
                </motion.h3>
                <motion.p
                  className="text-sm text-gray-600"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.7 }}
                >
                  {stat.description}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about audiotext
            </p>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <AccordionItem value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700">
        <motion.div 
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Ready to Transform Your Audio & Video?
          </motion.h2>
          <motion.p 
            className="text-xl text-blue-100 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Join thousands of creators using AI transcription and GPT-powered content creation to save hours every week
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RippleButton size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3" onClick={handleGetStarted}>
                <span className="relative z-10 flex items-center">
                  {isSignedIn ? 'Go to Dashboard' : 'Try Free - 30 mins'}
                  <motion.span
                    className="ml-2"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </span>
              </RippleButton>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RippleButton size="lg" variant="outline" className="text-white border-2 border-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3" onClick={() => navigate('/billing')}>
                <span className="relative z-10 flex items-center">
                  Upgrade to Pro
                  <motion.span
                    className="ml-2"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.span>
                </span>
              </RippleButton>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="mb-4">
                <Logo size="md" />
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                AI-powered transcription and content creation platform. Transform audio, video, and YouTube links 
                into professional content with GPT-powered summaries and Q&A extraction.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><motion.a href="#features" onClick={(e) => handleAnchorClick(e, 'features')} className="hover:text-white clickable-hover inline-block" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400 }}>Features</motion.a></li>
                <li><motion.a href="#pricing" onClick={(e) => handleAnchorClick(e, 'pricing')} className="hover:text-white clickable-hover inline-block" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400 }}>Pricing</motion.a></li>
                <li><motion.a href="#" className="hover:text-white clickable-hover inline-block" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400 }}>API</motion.a></li>
                <li><motion.a href="#" className="hover:text-white clickable-hover inline-block" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400 }}>Integrations</motion.a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><motion.a href="#" className="hover:text-white clickable-hover inline-block" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400 }}>About</motion.a></li>
                <li><motion.a href="#" className="hover:text-white clickable-hover inline-block" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400 }}>Privacy Policy</motion.a></li>
                <li><motion.a href="#" className="hover:text-white clickable-hover inline-block" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400 }}>Terms of Service</motion.a></li>
                <li><motion.a href="#" className="hover:text-white clickable-hover inline-block" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400 }}>Contact</motion.a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 audiotext. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">Privacy-first AI personalization</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ShowNoteLanding;