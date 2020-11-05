import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IOrdersRepository from '../repositories/IOrdersRepository';
import Order from '../infra/typeorm/entities/Order';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Cliente não encontrado.');
    }

    const productsIdOnOrder = products.map(product => ({
      id: product.id,
    }));

    const productsInStock = await this.productsRepository.findAllById(
      productsIdOnOrder,
    );

    if (productsInStock.length < productsIdOnOrder.length) {
      throw new AppError('Produto inválido.');
    }

    const listProductsOnOrder = productsInStock.map(prod => {
      const item = products.findIndex(product => product.id === prod.id);

      if (products[item].quantity > prod.quantity) {
        throw new AppError(
          'Quantidade de produto no pedido maior que quantidade em estoque.',
        );
      }
      return {
        product_id: prod.id,
        price: prod.price,
        quantity: products[item].quantity,
      };
    });

    const newOrder = await this.ordersRepository.create({
      customer,
      products: listProductsOnOrder,
    });

    const subtractedQuantity = productsInStock.map(prod => {
      const item = products.findIndex(product => product.id === prod.id);
      return {
        id: prod.id,
        quantity: prod.quantity - products[item].quantity,
      };
    });

    await this.productsRepository.updateQuantity(subtractedQuantity);

    return newOrder;
  }
}

export default CreateOrderService;
