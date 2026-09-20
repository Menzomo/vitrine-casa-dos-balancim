export type Category = 'roletado' | 'admissao' | 'escape' | 'conjunto'

export interface Application {
  vehicle: string
  years: string
  engine: string
}

export interface Product {
  id: string
  title: string
  price: number
  stock: number
  status: 'active' | 'paused'
  images: string[]
  permalink: string
  category: Category
  brand: string
  engine: string
  applications: Application[]
  createdAt: Date
  updatedAt: Date
}

const products: Product[] = [
  {
    id: '1',
    title: 'Balancim roletado linha GM, Captiva 2.4 (2008 a 2017), S10 (2015 a 2020), Malibu (2011 a 2013), Equinox (2018 a 2019) motor Flex 4 cilindros',
    price: 189.90,
    stock: 8,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/1',
    category: 'roletado',
    brand: 'GM',
    engine: 'Flex 4 cilindros',
    applications: [
      { vehicle: 'Captiva', years: '2008 a 2017', engine: '2.4L Flex' },
      { vehicle: 'S10', years: '2015 a 2020', engine: '2.4L Flex' },
      { vehicle: 'Malibu', years: '2011 a 2013', engine: '2.4L Flex' },
      { vehicle: 'Equinox', years: '2018 a 2019', engine: '2.4L Flex' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '2',
    title: 'Balancim roletado linha Renault, Master 2.3 16 válvulas, motor M9T, ano 2013 a 2016',
    price: 156.50,
    stock: 12,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/2',
    category: 'roletado',
    brand: 'Renault',
    engine: 'M9T 2.3L Diesel',
    applications: [{ vehicle: 'Master', years: '2013 a 2016', engine: 'M9T 2.3L Diesel' }],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '3',
    title: 'Conjunto eixo + balancins admissão e escape MWM 229-D',
    price: 489.90,
    stock: 5,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/3',
    category: 'conjunto',
    brand: 'MWM',
    engine: 'MWM 229-D',
    applications: [{ vehicle: 'Sprint', years: '1998 a 2005', engine: 'MWM 229-D' }],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '4',
    title: 'Balancim escape linha MWM, Sprint 4.08, MAXXIFORCE 3.0H',
    price: 142.00,
    stock: 3,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/4',
    category: 'escape',
    brand: 'MWM',
    engine: 'MWM 4.08 e 3.0H',
    applications: [
      { vehicle: 'Sprint', years: '1998 a 2005', engine: 'MWM 4.08' },
      { vehicle: 'Sprinter', years: '2005 a 2010', engine: 'MWM 3.0H' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '5',
    title: 'Balancim linha Mitsubishi, HR D4CB 2.5 DOHC Diesel, K2500',
    price: 198.75,
    stock: 7,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/5',
    category: 'roletado',
    brand: 'Mitsubishi',
    engine: 'D4CB 2.5L Diesel DOHC',
    applications: [
      { vehicle: 'HR', years: '2005 a 2012', engine: 'D4CB 2.5L Diesel' },
      { vehicle: 'K2500', years: '2010 a 2015', engine: 'D4CB 2.5L Diesel' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '6',
    title: 'Balancim roletado linha Suzuki e GM, Grand Vitara, SX4, Vitara, Tracker 2.0 motor RHZ',
    price: 167.30,
    stock: 15,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/6',
    category: 'roletado',
    brand: 'Suzuki',
    engine: 'RHZ 2.0L 4 cilindros',
    applications: [
      { vehicle: 'Grand Vitara', years: '1998 a 2005', engine: 'RHZ 2.0L' },
      { vehicle: 'SX4', years: '2006 a 2014', engine: 'RHZ 2.0L' },
      { vehicle: 'Vitara', years: '2015 a presente', engine: 'RHZ 2.0L' },
      { vehicle: 'Tracker', years: '2004 a 2008', engine: 'RHZ 2.0L' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '7',
    title: 'Balancim do Chevette, Chevy 500, Marajó, 1.0, 1.4 e 1.6',
    price: 89.90,
    stock: 0,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/7',
    category: 'roletado',
    brand: 'Chevrolet',
    engine: '1.0, 1.4 e 1.6L gasolina',
    applications: [
      { vehicle: 'Chevette', years: '1973 a 1994', engine: '1.0 a 1.6L' },
      { vehicle: 'Chevy 500', years: '1983 a 1994', engine: '1.0 a 1.6L' },
      { vehicle: 'Marajó', years: '1979 a 1986', engine: '1.0 a 1.6L' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '8',
    title: 'Balancim roletado linha Volkswagen',
    price: 134.50,
    stock: 10,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/8',
    category: 'roletado',
    brand: 'Volkswagen',
    engine: 'Variados',
    applications: [
      { vehicle: 'Gol', years: '1980 a 2020', engine: '1.0 a 2.0L' },
      { vehicle: 'Voyage', years: '1981 a 2018', engine: '1.0 a 2.0L' },
      { vehicle: 'Saveiro', years: '1993 a 2020', engine: '1.0 a 2.0L' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '9',
    title: 'Balancim admissão linha Mercedes-Benz, Sprinter 2.2 CDI',
    price: 245.00,
    stock: 6,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/9',
    category: 'admissao',
    brand: 'Mercedes-Benz',
    engine: 'OM 611 2.2L CDI',
    applications: [{ vehicle: 'Sprinter', years: '2000 a 2006', engine: 'OM 611 2.2L CDI' }],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '10',
    title: 'Balancim escape linha Audi A4, motor 1.8L turbo',
    price: 210.75,
    stock: 4,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/10',
    category: 'escape',
    brand: 'Audi',
    engine: '1.8L Turbo 20V',
    applications: [
      { vehicle: 'A4', years: '1995 a 2001', engine: '1.8L Turbo' },
      { vehicle: 'A6', years: '1997 a 2004', engine: '1.8L Turbo' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '11',
    title: 'Balancim roletado linha Fiat, Uno, Palio, Strada 1.0 e 1.4',
    price: 95.50,
    stock: 18,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/11',
    category: 'roletado',
    brand: 'Fiat',
    engine: '1.0 e 1.4L 8V',
    applications: [
      { vehicle: 'Uno', years: '1984 a 2010', engine: '1.0 a 1.4L' },
      { vehicle: 'Palio', years: '1996 a 2018', engine: '1.0 a 1.4L' },
      { vehicle: 'Strada', years: '1998 a 2013', engine: '1.0 a 1.4L' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '12',
    title: 'Balancim admissão linha Ford, Fiesta, Ka 1.0',
    price: 112.40,
    stock: 9,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/12',
    category: 'admissao',
    brand: 'Ford',
    engine: 'Zetec 1.0L 8V',
    applications: [
      { vehicle: 'Fiesta', years: '1996 a 2020', engine: 'Zetec 1.0L' },
      { vehicle: 'Ka', years: '1997 a 2008', engine: 'Zetec 1.0L' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '13',
    title: 'Balancim roletado linha Renault, Clio, Symbol 1.0 e 1.4',
    price: 128.90,
    stock: 11,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/13',
    category: 'roletado',
    brand: 'Renault',
    engine: '1.0 e 1.4L 8V',
    applications: [
      { vehicle: 'Clio', years: '1990 a 2020', engine: '1.0 a 1.4L' },
      { vehicle: 'Symbol', years: '1999 a 2012', engine: '1.0 a 1.4L' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '14',
    title: 'Balancim escape linha Hyundai, Elantra 1.6 DOHC',
    price: 149.60,
    stock: 7,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/14',
    category: 'escape',
    brand: 'Hyundai',
    engine: '1.6L DOHC 16V',
    applications: [{ vehicle: 'Elantra', years: '2001 a 2010', engine: '1.6L DOHC' }],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '15',
    title: 'Conjunto eixo + balancins GM Opala 5.0L V8',
    price: 567.80,
    stock: 2,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/15',
    category: 'conjunto',
    brand: 'GM',
    engine: 'V8 5.0L',
    applications: [{ vehicle: 'Opala', years: '1979 a 1992', engine: 'V8 5.0L' }],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '16',
    title: 'Balancim roletado linha Toyota, Corolla, Camry 1.6 e 2.0',
    price: 178.40,
    stock: 13,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/16',
    category: 'roletado',
    brand: 'Toyota',
    engine: '1.6 e 2.0L 16V',
    applications: [
      { vehicle: 'Corolla', years: '1992 a 2008', engine: '1.6 a 2.0L' },
      { vehicle: 'Camry', years: '2002 a 2011', engine: '2.0 a 2.4L' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '17',
    title: 'Balancim admissão linha Kia, Cerato 1.6 DOHC',
    price: 135.80,
    stock: 8,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/17',
    category: 'admissao',
    brand: 'Kia',
    engine: '1.6L DOHC 16V',
    applications: [{ vehicle: 'Cerato', years: '2003 a 2012', engine: '1.6L DOHC' }],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '18',
    title: 'Balancim escape linha Peugeot, 206, 307 1.4 e 1.6',
    price: 158.20,
    stock: 6,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/18',
    category: 'escape',
    brand: 'Peugeot',
    engine: '1.4 e 1.6L 8V',
    applications: [
      { vehicle: '206', years: '1998 a 2009', engine: '1.4 a 1.6L' },
      { vehicle: '307', years: '2000 a 2011', engine: '1.4 a 1.6L' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '19',
    title: 'Balancim roletado linha Citroën, C3, C4 1.4 e 1.6',
    price: 141.70,
    stock: 10,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/19',
    category: 'roletado',
    brand: 'Citroën',
    engine: '1.4 e 1.6L 16V',
    applications: [
      { vehicle: 'C3', years: '2002 a 2020', engine: '1.4 a 1.6L' },
      { vehicle: 'C4', years: '2004 a 2020', engine: '1.4 a 1.6L' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '20',
    title: 'Balancim admissão linha Chevrolet, Cruze 1.8L',
    price: 165.50,
    stock: 5,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/20',
    category: 'admissao',
    brand: 'Chevrolet',
    engine: 'Ecotec 1.8L 16V',
    applications: [{ vehicle: 'Cruze', years: '2009 a 2015', engine: 'Ecotec 1.8L' }],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '21',
    title: 'Balancim escape linha Dodge, RAM 2500 5.9L Diesel',
    price: 289.90,
    stock: 3,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/21',
    category: 'escape',
    brand: 'Dodge',
    engine: '5.9L Diesel',
    applications: [{ vehicle: 'RAM 2500', years: '1998 a 2002', engine: '5.9L Diesel' }],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '22',
    title: 'Conjunto eixo + balancins Volkswagen Fusca 1.3 e 1.6',
    price: 378.50,
    stock: 4,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/22',
    category: 'conjunto',
    brand: 'Volkswagen',
    engine: '1.3 e 1.6L Boxer',
    applications: [
      { vehicle: 'Fusca', years: '1974 a 1986', engine: '1.3 a 1.6L' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '23',
    title: 'Balancim roletado linha Honda, Civic, Accord 1.5 e 1.8',
    price: 186.30,
    stock: 9,
    status: 'active',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/23',
    category: 'roletado',
    brand: 'Honda',
    engine: '1.5 e 1.8L DOHC',
    applications: [
      { vehicle: 'Civic', years: '1997 a 2020', engine: '1.5 a 1.8L' },
      { vehicle: 'Accord', years: '1998 a 2012', engine: '1.8 a 2.0L' },
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '24',
    title: 'Balancim admissão linha Nissan, Sentra 1.8L',
    price: 152.80,
    stock: 1,
    status: 'paused',
    images: ['/placeholder.svg?height=600&width=600'],
    permalink: '/produtos/24',
    category: 'admissao',
    brand: 'Nissan',
    engine: '1.8L 16V',
    applications: [{ vehicle: 'Sentra', years: '2006 a 2017', engine: '1.8L' }],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
]

export function getProducts(
  filters?: {
    brand?: string
    category?: Category
    search?: string
    inStock?: boolean
  }
): Product[] {
  return products.filter((p) => {
    if (p.status !== 'active') return false
    if (filters?.brand && p.brand !== filters.brand) return false
    if (filters?.category && p.category !== filters.category) return false
    if (filters?.inStock && p.stock === 0) return false
    if (filters?.search) {
      const query = filters.search.toLowerCase()
      return (
        p.title.toLowerCase().includes(query) ||
        p.engine.toLowerCase().includes(query) ||
        p.applications.some((a) => a.vehicle.toLowerCase().includes(query))
      )
    }
    return true
  })
}

export function getProductById(id: string): Product | null {
  return products.find((p) => p.id === id && p.status === 'active') || null
}

export function getBrands(): string[] {
  const brands = new Set(products.filter((p) => p.status === 'active').map((p) => p.brand))
  return Array.from(brands).sort()
}

export function getCategories(): Category[] {
  return ['roletado', 'admissao', 'escape', 'conjunto']
}

export function getRelatedProducts(
  productId: string,
  limit: number = 4
): Product[] {
  const product = getProductById(productId)
  if (!product) return []

  return getProducts()
    .filter((p) => p.id !== productId && p.brand === product.brand)
    .slice(0, limit)
}

export function searchProducts(query: string): Product[] {
  return getProducts({ search: query })
}
