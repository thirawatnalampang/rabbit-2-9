import { Link } from 'react-router-dom';

function formatTHB(n) {
  const num = typeof n === 'number' ? n : Number(n);
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(num || 0);
}

export default function PetCard({ pet }) {
  // pet: { id, name, price, image }
  return (
    <div className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition p-3 text-center bg-white">
      <div className="overflow-hidden rounded-2xl">
        <img
          src={pet.image || 'https://placehold.co/600x600?text=Rabbit'}
          alt={pet.name}
          className="w-full h-56 object-cover"
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x600?text=Rabbit'; }}
        />
      </div>

      <h3 className="mt-3 text-lg font-extrabold tracking-wide">{pet.name}</h3>
      <p className="mt-1 text-gray-700">ราคา {formatTHB(pet.price)} บาท</p>

      <Link
        to={`/pets/${pet.id}`}
        className="inline-flex items-center justify-center mt-3 px-5 py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 active:scale-[.99] transition"
      >
        ดูรายละเอียด
      </Link>
    </div>
  );
}