export const products = [
  {
    id: 'prod_T4ASa0gc6NWE2O',
    priceId: 'price_1S827kDS63fnzmVBBpk36xma',
    name: 'Uplora',
    description: 'Uplora is a social media management platform designed for teams. Upload, schedule, and publish content across multiple platforms while streamlining approvals and collaboration.',
    price: 6.99,
    mode: 'subscription' as const,
    features: [
      'Multi-platform publishing',
      'Team collaboration tools',
      'Content scheduling',
      'Approval workflows',
      'Analytics dashboard',
      'Priority support'
    ],
    popular: true
  }
];

export const getProductById = (id: string) => {
  return products.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string) => {
  return products.find(product => product.priceId === priceId);
};