import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const customer = await this.customersRepository.findByEmail(email);

    if (customer) {
      throw new AppError('E-mail já esta sendo utilizado.');
    }

    const newCustomer = await this.customersRepository.create({ name, email });

    return newCustomer;
  }
}

export default CreateCustomerService;
