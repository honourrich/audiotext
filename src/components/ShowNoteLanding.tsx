import React, { useState } from "react";
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
  LogOut,
  Instagram
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import Logo from './Logo';

const ShowNoteLanding = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

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

  const handlePlanSelect = (planName: string, price: string) => {
    if (!isSignedIn) {
      // Redirect to sign up first
      navigate('/sign-up');
      return;
    }

    if (planName === 'Free') {
      // Free plan - just go to dashboard
      navigate('/dashboard');
    } else {
      // Paid plans - redirect to billing/checkout
      // In a real app, this would integrate with Stripe
      alert(`Redirecting to checkout for ${planName} plan (${price}/month). This would integrate with Stripe in production.`);
      // For now, just go to billing page
      navigate('/billing');
    }
  };

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: "Auto Transcription",
      description: "AI-powered transcription with 99% accuracy for podcasts and videos"
    },
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "Smart Personalization",
      description: "AI learns your writing style from social media and past content to match your voice"
    },
    {
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      title: "Smart Summaries & Chapters",
      description: "Automatically generate engaging summaries and chapter markers"
    },
    {
      icon: <Share2 className="w-8 h-8 text-blue-600" />,
      title: "Social Media Analysis",
      description: "Connect your social profiles to analyze and replicate your authentic writing style"
    },
    {
      icon: <Youtube className="w-8 h-8 text-blue-600" />,
      title: "YouTube Link Support",
      description: "Just paste a YouTube URL and get instant show notes"
    },
    {
      icon: <Hash className="w-8 h-8 text-blue-600" />,
      title: "SEO Keywords",
      description: "Extract relevant keywords to boost your content's discoverability"
    },
    {
      icon: <Target className="w-8 h-8 text-blue-600" />,
      title: "Brand Voice Consistency",
      description: "Maintain consistent brand personality across all generated content"
    },
    {
      icon: <Download className="w-8 h-8 text-blue-600" />,
      title: "Multi-format Export",
      description: "Export as PDF, Word, HTML, or plain text for any platform"
    }
  ];

  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      episodes: "2 episodes",
      features: [
        "Basic transcription",
        "Simple summaries",
        "Text export only",
        "Community support"
      ],
      buttonText: "Start Free",
      popular: false
    },
    {
      name: "Starter",
      price: "$19",
      period: "/month",
      episodes: "10 episodes",
      features: [
        "High-accuracy transcription",
        "Smart summaries & chapters",
        "Basic personalization",
        "All export formats",
        "Email support",
        "SEO keywords"
      ],
      buttonText: "Choose Starter",
      popular: false
    },
    {
      name: "Pro",
      price: "$49",
      period: "/month",
      episodes: "50 episodes",
      features: [
        "Everything in Starter",
        "Advanced personalization",
        "Social media analysis",
        "Brand voice consistency",
        "Priority processing",
        "Custom templates",
        "API access",
        "Priority support"
      ],
      buttonText: "Choose Pro",
      popular: true
    },
    {
      name: "Unlimited",
      price: "$79",
      period: "/month",
      episodes: "Unlimited episodes",
      features: [
        "Everything in Pro",
        "Advanced analytics",
        "White-label options",
        "Team collaboration",
        "Dedicated support",
        "Custom integrations"
      ],
      buttonText: "Choose Unlimited",
      popular: false
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Upload audio or paste YouTube link",
      description: "Drag & drop your audio file or simply paste a YouTube URL",
      icon: <Upload className="w-12 h-12 text-blue-600" />
    },
    {
      number: "2", 
      title: "AI analyzes your style and generates content",
      description: "Our AI learns from your social media and creates personalized transcripts, summaries, chapters, and keywords",
      icon: <Brain className="w-12 h-12 text-blue-600" />
    },
    {
      number: "3",
      title: "Download and publish anywhere",
      description: "Export in your preferred format and publish to any platform with your authentic voice",
      icon: <Download className="w-12 h-12 text-blue-600" />
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Podcast Host",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      quote: "The social media analysis is incredible! It actually captures my writing style from Twitter and makes the show notes sound like me. Saves me hours every week!"
    },
    {
      name: "Mike Rodriguez",
      role: "YouTube Creator",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
      quote: "Best show notes tool for creators! The personalization engine learned my style from LinkedIn and now generates content that matches my professional tone perfectly."
    },
    {
      name: "Emma Thompson",
      role: "Content Creator",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      quote: "The brand voice consistency feature is a game-changer. All my content now has the same personality and tone across platforms. My audience loves it!"
    }
  ];

  const faqs = [
    {
      question: "How does the social media analysis work?",
      answer: "We analyze your public posts from connected social media profiles (Twitter, LinkedIn, Instagram, YouTube, TikTok) to understand your writing style, tone, and personality. This data is used to personalize AI-generated content to match your authentic voice. All analysis is done with your explicit consent and you can delete your data anytime."
    },
    {
      question: "Is my social media data secure and private?",
      answer: "Absolutely. We only analyze public posts with your explicit consent. Your data is encrypted, never shared with third parties, and automatically deleted after 90 days of inactivity. You can view, edit, or delete your data anytime from your privacy settings."
    },
    {
      question: "How accurate is the AI transcription?",
      answer: "Our AI achieves 99% accuracy for clear audio. The system continuously learns and improves, and you can always edit the transcripts if needed."
    },
    {
      question: "What social media platforms do you support?",
      answer: "We support Twitter/X, LinkedIn, Instagram, YouTube, and TikTok. The AI analyzes your writing patterns across these platforms to create a comprehensive style profile for better personalization."
    },
    {
      question: "Can I use the tool without connecting social media?",
      answer: "Yes! Social media analysis is completely optional. You can still get high-quality transcripts, summaries, and show notes without connecting any social profiles. The personalization features will work based on your podcast content alone."
    },
    {
      question: "What platforms do you support for audio/video?",
      answer: "We support all major audio formats (MP3, WAV, M4A) and YouTube videos. You can export to PDF, Word, HTML, TXT, and SRT subtitle formats."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel anytime with no questions asked. You'll retain access to your account until the end of your billing period."
    },
    {
      question: "How long does processing take?",
      answer: "Most episodes are processed within 2-5 minutes. Pro and Unlimited users get priority processing for even faster results."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-px">
              <Logo size="md" />
              <span className="text-xl font-bold text-gray-900 -ml-2">podjust</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 font-medium">FAQ</a>
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
                        avatarBox: "w-8 h-8",
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
                <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Features</a>
                <a href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Pricing</a>
                <a href="#faq" className="block px-3 py-2 text-gray-600 hover:text-gray-900">FAQ</a>
                  <div className="flex space-x-4 px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900 p-2"
                      onClick={() => window.open('https://instagram.com/podjust.app', '_blank')}
                    >
                      <Instagram className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900 p-2"
                      onClick={() => window.open('https://x.com/podjustapp', '_blank')}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900 p-2"
                      onClick={() => window.open('https://youtube.com/@podjustt', '_blank')}
                    >
                      <Youtube className="w-5 h-5" />
                    </Button>
                  </div>
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
                            avatarBox: "w-8 h-8",
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

      {/* Hero Section with Light Rays Background */}
      <section className="relative py-20 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
        {/* Light Rays Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="light-rays">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="light-ray"
                style={{
                  ["--delay" as any]: `${i * 0.5}s`,
                  ["--rotation" as any]: `${i * 45}deg`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                  <Brain className="w-4 h-4 mr-1" />
                  AI-Powered Personalization
                </Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                AI Show Notes That Sound Like
                <span className="text-blue-600"> You</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Connect your social media, upload your content, and get personalized show notes that match your authentic voice. 
                Our AI learns your writing style to create content that sounds genuinely like you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3" onClick={handleGetStarted}>
                  {isSignedIn ? 'Go to Dashboard' : 'Try Free'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-gray-900 text-lg px-8 py-3">
                  <Play className="w-5 h-5 mr-2" />
                  See Demo
                </Button>
              </div>
              <div className="flex items-center space-x-6 mt-8 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Share2 className="w-4 h-4" />
                  <span>Social Media Analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4" />
                  <span>Style Personalization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Privacy First</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-2">
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-2 bg-blue-300 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">Social media analyzed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">Writing style learned</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">Personalized content generated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Personalization Meets Professional Show Notes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced AI learns your unique writing style from social media and creates show notes that authentically represent your voice and brand.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-blue-50 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg mb-2 text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 leading-relaxed text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Personalization Showcase */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Smart Personalization Engine
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Content That Actually Sounds Like You
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect your social media profiles and watch our AI learn your unique voice, tone, and style to create perfectly personalized show notes.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Social Media Analysis</h3>
                  <p className="text-gray-600 text-sm">Connect Twitter, LinkedIn, Instagram, YouTube, and TikTok to analyze your writing patterns</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Style Learning</h3>
                  <p className="text-gray-600 text-sm">AI identifies your tone, vocabulary, humor style, and personality traits</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Brand Consistency</h3>
                  <p className="text-gray-600 text-sm">Maintains your authentic voice across all generated content</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                  <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <Brain className="w-16 h-16 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">AI</div>
                      <div className="text-sm text-gray-600">Learning</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Performance Analytics</h3>
                  <p className="text-gray-600 text-sm">Track how well personalization matches your authentic voice</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Privacy First</h3>
                  <p className="text-gray-600 text-sm">Your data is encrypted, never shared, and can be deleted anytime</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Multi-Platform</h3>
                  <p className="text-gray-600 text-sm">Works across Twitter, LinkedIn, Instagram, YouTube, and TikTok</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Get personalized show notes that sound authentically like you in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-8">
                  <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                    {step.number}
                  </div>
                  <div className="mx-auto mb-4">
                    {step.icon}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-blue-200 transform translate-x-1/2"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your content creation needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`relative bg-white flex flex-col ${tier.popular ? 'border-blue-600 shadow-xl scale-105' : 'border-gray-200'}`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-amber-400 text-amber-900 px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl mb-2 text-gray-900">{tier.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-600">{tier.period}</span>
                  </div>
                  <CardDescription className="text-lg font-medium text-blue-600">
                    {tier.episodes}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow space-y-4">
                  <ul className="space-y-3 flex-grow">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full mt-auto ${tier.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                    onClick={() => handlePlanSelect(tier.name, tier.price)}
                  >
                    {tier.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by creators worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what content creators are saying about podjust
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-gray-600 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about podjust
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to create show notes that sound like you?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of creators using AI personalization to save time while maintaining their authentic voice
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-white bg-white/20 hover:bg-white/30 text-lg px-8 py-3" onClick={handleGetStarted}>
              {isSignedIn ? 'Go to Dashboard' : 'Start Free Trial'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Logo size="md" />
                <span className="text-xl font-bold">podjust</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The first AI-powered show notes platform that learns your unique writing style from social media 
                to create personalized, authentic content that sounds genuinely like you.
              </p>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-2"
                onClick={() => window.open('https://instagram.com/podjust.app', '_blank')}
              >
                <Instagram className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-2"
                onClick={() => window.open('https://x.com/podjustapp', '_blank')}
              >
                <X className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-2"
                onClick={() => window.open('https://youtube.com/@podjustt', '_blank')}
              >
                <Youtube className="w-5 h-5" />
              </Button>
            </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 podjust. All rights reserved.
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