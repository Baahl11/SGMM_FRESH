'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MarketingNav } from '@/components/marketing/nav'
import { MarketingHero } from '@/components/marketing/hero'
import { MomentumStats } from '@/components/marketing/stats'
import { VideoDemo } from '@/components/marketing/video-demo'
import { PainPoints } from '@/components/marketing/pain-points'
import { FeatureNarrative } from '@/components/marketing/features'
import { WorkflowTimeline } from '@/components/marketing/workflow'
import { PremiumPricing } from '@/components/marketing/pricing'
import { TestimonialShowcase } from '@/components/marketing/testimonials'
import { MarketingFAQ } from '@/components/marketing/faq'
import { MarketingFooter } from '@/components/marketing/footer'
import { ExitIntentPopup } from '@/components/marketing/exit-intent-popup'
import { SocialProofToast } from '@/components/marketing/social-proof-toast'
import { ContactSection } from '@/components/marketing/contact-section'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if confirmed authenticated — never block the landing
    if (status === 'authenticated' && session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  return (
    <main className="min-h-screen bg-[#030614]">
      <MarketingNav />
      <MarketingHero />
      <MomentumStats />
      <VideoDemo />
      <PainPoints />
      <FeatureNarrative />
      <WorkflowTimeline />
      <PremiumPricing />
      <TestimonialShowcase />
      <MarketingFAQ />
      <ContactSection />
      <MarketingFooter />
      <ExitIntentPopup />
      <SocialProofToast />
    </main>
  )
}
