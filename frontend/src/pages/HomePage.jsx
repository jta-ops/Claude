import { useState, useEffect } from 'react'
import { LIST_TOTAL } from '../data'
import Masthead from '../components/Masthead'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import StatsRow from '../components/StatsRow'
import ListSection from '../components/ListSection'
import WeekSection from '../components/WeekSection'
import ChangelogSection from '../components/ChangelogSection'
import FormatsSection from '../components/FormatsSection'
import HowSection from '../components/HowSection'
import SubmitSection from '../components/SubmitSection'
import Footer from '../components/Footer'

export default function HomePage() {
  const [count, setCount] = useState(LIST_TOTAL)
  useEffect(() => {
    const id = setInterval(() => { if (Math.random() > 0.6) setCount(c => c + 1) }, 4200)
    return () => clearInterval(id)
  }, [])
  return (
    <>
      <Masthead /><Nav />
      <main className="shell">
        <Hero count={count} /><StatsRow count={count} /><ListSection /><WeekSection />
        <ChangelogSection /><FormatsSection /><HowSection /><SubmitSection />
      </main>
      <Footer />
    </>
  )
}
