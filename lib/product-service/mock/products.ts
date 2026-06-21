export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

export const products: Product[] = [
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa',
    title: 'ProductOne',
    description: 'Short Product Description1',
    price: 24,
    count: 5,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a1',
    title: 'ProductTwo',
    description: 'Short Product Description2',
    price: 15,
    count: 3,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a3',
    title: 'ProductThree',
    description: 'Short Product Description7',
    price: 23,
    count: 12,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c348a80a',
    title: 'ProductFour',
    description: 'Short Product Description3',
    price: 15,
    count: 7,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c948a80a',
    title: 'ProductFive',
    description: 'Short Product Description4',
    price: 23,
    count: 6,
  },
];
