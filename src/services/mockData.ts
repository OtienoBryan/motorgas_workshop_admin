// Mock data for admin panel development
import { Order } from './api'
export const mockCategories = [
  {
    id: 1,
    name: 'Wine',
    description: 'Premium wines from around the world',
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Beer',
    description: 'Craft beers and traditional brews',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c2de8e?w=400',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 3,
    name: 'Spirits',
    description: 'Whiskey, vodka, rum, and other spirits',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 4,
    name: 'Non-Alcoholic',
    description: 'Soft drinks, juices, and mocktails',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
]

export const mockProducts = [
  {
    id: 1,
    name: 'Château Margaux 2015',
    description: 'Premium Bordeaux wine with exceptional depth and complexity',
    price: 899.99,
    originalPrice: 1099.99,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400',
    images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400'],
    brand: 'Château Margaux',
    alcoholContent: '13.5%',
    volume: '750ml',
    origin: 'France',
    tags: ['wine', 'premium', 'bordeaux'],
    rating: 4.8,
    reviewCount: 156,
    isActive: true,
    isFeatured: true,
    requiresAgeVerification: true,
    category: mockCategories[0],
    categoryId: 1,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Craft IPA Beer',
    description: 'Hoppy India Pale Ale with citrus notes',
    price: 8.99,
    originalPrice: 10.99,
    stock: 45,
    image: 'https://images.unsplash.com/photo-1608270586620-248524c2de8e?w=400',
    images: ['https://images.unsplash.com/photo-1608270586620-248524c2de8e?w=400'],
    brand: 'Craft Brewery',
    alcoholContent: '6.2%',
    volume: '500ml',
    origin: 'USA',
    tags: ['beer', 'ipa', 'craft'],
    rating: 4.5,
    reviewCount: 89,
    isActive: true,
    isFeatured: true,
    requiresAgeVerification: true,
    category: mockCategories[1],
    categoryId: 2,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 3,
    name: 'Premium Whiskey',
    description: 'Aged single malt whiskey with rich flavors',
    price: 129.99,
    originalPrice: 149.99,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
    images: ['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400'],
    brand: 'Highland Distillery',
    alcoholContent: '40%',
    volume: '700ml',
    origin: 'Scotland',
    tags: ['whiskey', 'premium', 'aged'],
    rating: 4.9,
    reviewCount: 234,
    isActive: true,
    isFeatured: true,
    requiresAgeVerification: true,
    category: mockCategories[2],
    categoryId: 3,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 4,
    name: 'Fresh Orange Juice',
    description: '100% pure orange juice, no added sugar',
    price: 4.99,
    stock: 67,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
    images: ['https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400'],
    brand: 'Fresh Farms',
    alcoholContent: '0%',
    volume: '1L',
    origin: 'USA',
    tags: ['juice', 'fresh', 'healthy'],
    rating: 4.3,
    reviewCount: 45,
    isActive: true,
    isFeatured: false,
    requiresAgeVerification: false,
    category: mockCategories[3],
    categoryId: 4,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
]

export const mockUsers = [
  {
    id: 1,
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1-555-0123',
    dateOfBirth: '1990-05-15',
    isActive: true,
    isEmailVerified: true,
    createdAt: '2024-01-10T08:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z'
  },
  {
    id: 2,
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1-555-0456',
    dateOfBirth: '1985-12-03',
    isActive: true,
    isEmailVerified: true,
    createdAt: '2024-01-12T11:15:00Z',
    updatedAt: '2024-01-16T09:45:00Z'
  },
  {
    id: 3,
    email: 'mike.wilson@example.com',
    firstName: 'Mike',
    lastName: 'Wilson',
    phone: '+1-555-0789',
    dateOfBirth: '1992-08-22',
    isActive: false,
    isEmailVerified: false,
    createdAt: '2024-01-14T16:20:00Z',
    updatedAt: '2024-01-17T10:30:00Z'
  },
  {
    id: 4,
    email: 'sarah.johnson@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '+1-555-0321',
    dateOfBirth: '1988-03-10',
    isActive: true,
    isEmailVerified: true,
    createdAt: '2024-01-16T13:45:00Z',
    updatedAt: '2024-01-18T15:20:00Z'
  }
]

export const mockOrders: Order[] = [
  {
    id: 1,
    orderNumber: 'ORD-2024-001',
    userId: 1,
    user: mockUsers[0],
    items: [
      {
        id: 1,
        productId: 1,
        quantity: 1,
        unitPrice: 899.99,
        totalPrice: 899.99
      }
    ],
    subtotal: 899.99,
    tax: 72.00,
    shipping: 15.00,
    total: 986.99,
    status: 'delivered' as const,
    paymentStatus: 'paid' as const,
    shippingAddress: '123 Main St, New York, NY 10001',
    billingAddress: '123 Main St, New York, NY 10001',
    notes: 'Please deliver after 5 PM',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  },
  {
    id: 2,
    orderNumber: 'ORD-2024-002',
    userId: 2,
    user: mockUsers[1],
    items: [
      {
        id: 2,
        productId: 2,
        quantity: 6,
        unitPrice: 8.99,
        totalPrice: 53.94
      },
      {
        id: 3,
        productId: 4,
        quantity: 2,
        unitPrice: 4.99,
        totalPrice: 9.98
      }
    ],
    subtotal: 63.92,
    tax: 5.11,
    shipping: 8.00,
    total: 77.03,
    status: 'processing' as const,
    paymentStatus: 'paid' as const,
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90210',
    billingAddress: '456 Oak Ave, Los Angeles, CA 90210',
    createdAt: '2024-01-16T14:15:00Z',
    updatedAt: '2024-01-17T09:30:00Z'
  },
  {
    id: 3,
    orderNumber: 'ORD-2024-003',
    userId: 4,
    user: mockUsers[3],
    items: [
      {
        id: 4,
        productId: 3,
        quantity: 1,
        unitPrice: 129.99,
        totalPrice: 129.99
      }
    ],
    subtotal: 129.99,
    tax: 10.40,
    shipping: 12.00,
    total: 152.39,
    status: 'shipped' as const,
    paymentStatus: 'paid' as const,
    shippingAddress: '789 Pine St, Chicago, IL 60601',
    billingAddress: '789 Pine St, Chicago, IL 60601',
    createdAt: '2024-01-17T16:45:00Z',
    updatedAt: '2024-01-18T11:20:00Z'
  },
  {
    id: 4,
    orderNumber: 'ORD-2024-004',
    userId: 1,
    user: mockUsers[0],
    items: [
      {
        id: 5,
        productId: 2,
        quantity: 12,
        unitPrice: 8.99,
        totalPrice: 107.88
      }
    ],
    subtotal: 107.88,
    tax: 8.63,
    shipping: 10.00,
    total: 126.51,
    status: 'pending' as const,
    paymentStatus: 'pending' as const,
    shippingAddress: '123 Main St, New York, NY 10001',
    billingAddress: '123 Main St, New York, NY 10001',
    createdAt: '2024-01-18T12:30:00Z',
    updatedAt: '2024-01-18T12:30:00Z'
  },
  {
    id: 5,
    orderNumber: 'ORD-2024-005',
    userId: 2,
    user: mockUsers[1],
    items: [
      {
        id: 6,
        productId: 1,
        quantity: 2,
        unitPrice: 899.99,
        totalPrice: 1799.98
      }
    ],
    subtotal: 1799.98,
    tax: 144.00,
    shipping: 25.00,
    total: 1968.98,
    status: 'confirmed' as const,
    paymentStatus: 'paid' as const,
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90210',
    billingAddress: '456 Oak Ave, Los Angeles, CA 90210',
    createdAt: '2024-01-19T09:15:00Z',
    updatedAt: '2024-01-19T10:45:00Z'
  }
]

export const mockDashboardStats = {
  totalProducts: mockProducts.length,
  totalCategories: mockCategories.length,
  totalOrders: mockOrders.length,
  totalUsers: mockUsers.length,
  recentOrders: mockOrders.slice(0, 5)
}
