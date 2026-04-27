import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Confirmation from './pages/Confirmation'
import TrackParcel from './pages/TrackParcel'
import MyBookings from './pages/MyBookings'

export default function App() {
  return (
    <div className="min-h-screen relative">
      {/* Fixed Watermark Logo — visible on every page */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none no-print">
        <img
          src="/logo.png"
          alt=""
          className="w-[500px] h-[500px] object-contain opacity-[0.04]"
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/track" element={<TrackParcel />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  )
}
