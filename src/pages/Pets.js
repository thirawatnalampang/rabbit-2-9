import { useState, useEffect } from 'react'
import PetCard from '../components/PetCard'

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000'

export default function Pets() {
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const petsPerPage = 8

  useEffect(() => {
    const loadPets = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/api/admin/rabbits`)
        if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
        const data = await res.json()
        setPets(data.items || [])
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadPets()
  }, [])

  const totalPages = Math.ceil(pets.length / petsPerPage) || 1
  const indexOfLastPet = currentPage * petsPerPage
  const indexOfFirstPet = indexOfLastPet - petsPerPage
  const currentPets = pets.slice(indexOfFirstPet, indexOfLastPet)

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return
    setCurrentPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <p className="text-center mt-10">กำลังโหลด...</p>
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8 text-center">🐇 รายการกระต่าย</h1>

      {pets.length === 0 && (
        <p className="text-center text-gray-500">ยังไม่มีกระต่ายในระบบ</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {currentPets.map((pet) => (
          <PetCard
            key={pet.rabbit_id}
            pet={{
              id: pet.rabbit_id,
              name: pet.name,
              price: pet.price,
              image: pet.image_url || 'https://placehold.co/400x400?text=Rabbit',
            }}
          />
        ))}
      </div>

      {pets.length > petsPerPage && (
        <div className="flex justify-center items-center space-x-2 mb-12">
          <button
            onClick={() => goToPage(currentPage - 1)}
            className="px-3 py-1 border rounded-full"
            disabled={currentPage === 1}
          >
            &laquo;
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={
                'px-3 py-1 border rounded-full ' +
                (currentPage === p ? 'bg-black text-white' : '')
              }
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            className="px-3 py-1 border rounded-full"
            disabled={currentPage === totalPages}
          >
            &raquo;
          </button>
        </div>
      )}
    </div>
  )
}
