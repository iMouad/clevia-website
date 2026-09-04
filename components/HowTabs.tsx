'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Step = {
  number: string
  title: string
  description: string
}

type Tab = {
  id: string
  label: string
  intro: string
  steps: Step[]
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  courteDuree: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  ),
  longueDuree: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  vente: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
}

const STEP_ICONS = [
  <svg key="0" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
  <svg key="1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><path d="M9 21V12h6v9" /></svg>,
  <svg key="2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>,
  <svg key="3" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M7 21h10M12 17v4" /></svg>,
  <svg key="4" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" /></svg>,
  <svg key="5" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>,
]

export default function HowTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0)
  const current = tabs[active]

  return (
    <section className="bg-creme py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Tab bar */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActive(i)}
              className={`
                relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                ${active === i
                  ? 'bg-terra text-white shadow-md'
                  : 'bg-white text-brun-mid border border-brun/10 hover:border-terra/30 hover:text-terra'
                }
              `}
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {TAB_ICONS[tab.id]}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Intro */}
        <AnimatePresence mode="wait">
          <motion.p
            key={current.id + '-intro'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="text-center text-brun-mid text-base mb-12 max-w-lg mx-auto leading-relaxed"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {current.intro}
          </motion.p>
        </AnimatePresence>

        {/* Timeline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div className="absolute left-8 top-8 bottom-8 w-px bg-terra/20 hidden md:block" />

            <div className="flex flex-col gap-6">
              {current.steps.map((step, i) => (
                <motion.div
                  key={step.number + step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className="flex gap-6 md:gap-10 items-start"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white border-2 border-terra/20 flex items-center justify-center relative z-10 shadow-sm">
                    <div className="text-terra">{STEP_ICONS[i] || STEP_ICONS[0]}</div>
                  </div>

                  <div className="flex-1 bg-white border border-brun/10 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <span
                        className="text-3xl text-terra/40 leading-none"
                        style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300 }}
                      >
                        {step.number}
                      </span>
                      <div>
                        <h3 className="text-xl text-brun mb-2">{step.title}</h3>
                        <p className="text-brun-mid text-sm leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
