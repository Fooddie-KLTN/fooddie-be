import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from 'src/entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
    constructor(
        @InjectRepository(Address)
        private addressRepository: Repository<Address>,
    ) {}

    async createAddress(data: CreateAddressDto) {
        const address = this.addressRepository.create(data);
        return await this.addressRepository.save(address);
    }

    async getAllAddresses() {
        return await this.addressRepository.find({ relations: ['user'] });
    }

    async getAddressById(id: string) {
        const address = await this.addressRepository.findOne({ where: { id }, relations: ['user'] });
        if (!address) throw new NotFoundException('Address not found');
        return address;
    }

    async getAddressesByUser(userId: string) {
        return await this.addressRepository
            .createQueryBuilder('address')
            .innerJoin('address.users', 'user')
            .where('user.id = :userId', { userId })
            .getMany();
    }

    async updateAddress(id: string, data: UpdateAddressDto) {
        await this.addressRepository.update(id, data);
        return this.getAddressById(id);
    }

    async deleteAddress(id: string) {
        const result = await this.addressRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException('Address not found');
        return { message: 'Address deleted successfully' };
    }
}
