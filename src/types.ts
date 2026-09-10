export type Product = {
  id: string;
  barcode: string;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  sub_barcodes: string[] | null;
};
