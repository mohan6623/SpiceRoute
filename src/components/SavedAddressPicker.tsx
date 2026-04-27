import { useState, useEffect } from 'react'
import { BookmarkCheck, MapPin, Trash2, X } from 'lucide-react'
import { getSavedAddresses, deleteAddress, type SavedAddress } from '../lib/addressService'
import { useAuth } from '../context/AuthContext'

interface SavedAddressPickerProps {
  onSelect: (addr: SavedAddress) => void
}

export default function SavedAddressPicker({ onSelect }: SavedAddressPickerProps) {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const loadAddresses = async () => {
    if (!user) return
    setLoading(true)
    const data = await getSavedAddresses(user.id)
    setAddresses(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen && user) loadAddresses()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteAddress(id)
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-medium text-kraft
                 hover:text-kraft/80 transition-colors duration-200 cursor-pointer
                 px-3 py-1.5 rounded-lg bg-kraft/5 hover:bg-kraft/10 border border-kraft/20"
      >
        <BookmarkCheck className="w-3.5 h-3.5" />
        {isOpen ? 'Close' : 'Use Saved Address'}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50
                      bg-white rounded-xl shadow-kraft-lg border border-paper-border
                      animate-slide-up overflow-hidden min-w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-paper-border/50 bg-paper/50">
            <span className="text-sm font-semibold text-coffee flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-kraft" />
              Saved Addresses
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-coffee-light/50 hover:text-coffee-light cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-coffee-light/50">
                <div className="spinner spinner-sm mx-auto mb-2" />
                Loading addresses...
              </div>
            ) : addresses.length === 0 ? (
              <div className="p-6 text-center text-sm text-coffee-light/50">
                No saved addresses yet.
                <br />
                <span className="text-xs">Your addresses will be saved automatically after your first booking.</span>
              </div>
            ) : (
              addresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => {
                    onSelect(addr)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-kraft/5
                           border-b border-paper-border/30 last:border-none
                           transition-colors duration-150 cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-kraft bg-kraft/10 px-2 py-0.5 rounded">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-coffee truncate">{addr.name}</p>
                      <p className="text-xs text-coffee-light/60 truncate">{addr.address}</p>
                      <p className="text-xs text-coffee-light/50">
                        {addr.city}, {addr.state} — {addr.pincode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(addr.id, e)}
                      className="p-1.5 text-coffee-light/30 hover:text-error
                               opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                      title="Delete address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
