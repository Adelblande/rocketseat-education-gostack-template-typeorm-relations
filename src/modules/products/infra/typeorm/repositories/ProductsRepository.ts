import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

interface IUpdateQuantities {
  id: string;
  updated_at: Date;
  quantity: number;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsIn = products.map(productFind => productFind.id);
    const product = await this.ormRepository.find({
      where: {
        id: In(productsIn),
      },
    });

    return product;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsIn = products.map(productFind => productFind.id);
    const productList = await this.ormRepository.find({
      where: {
        id: In(productsIn),
      },
    });

    const listNewQuantities: IUpdateQuantities[] = [];

    productList.map(async prod => {
      const key = products.findIndex(findProd => prod.id === findProd.id);

      const newQuantity = {
        id: prod.id,
        updated_at: new Date(),
        quantity: products[key].quantity,
      };

      listNewQuantities.push(newQuantity);
    });

    const persistQuantities = await this.ormRepository.save(listNewQuantities);
    return persistQuantities;
  }
}

export default ProductsRepository;
