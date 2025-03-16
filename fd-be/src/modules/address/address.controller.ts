import { Controller, Post, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('addresses')
export class AddressController {
    constructor(private readonly addressService: AddressService) {}

    @Post()
    createAddress(@Body() createAddressDto: CreateAddressDto) {
        return this.addressService.createAddress(createAddressDto);
    }

    @Get()
    getAllAddresses() {
        return this.addressService.getAllAddresses();
    }

    @Get(':id')
    getAddressById(@Param('id') id: string) {
        return this.addressService.getAddressById(id);
    }

    @Get('user/:userId')
    getAddressesByUser(@Param('userId') userId: string) {
        return this.addressService.getAddressesByUser(userId);
    }

    @Put(':id')
    updateAddress(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
        return this.addressService.updateAddress(id, updateAddressDto);
    }

    @Delete(':id')
    deleteAddress(@Param('id') id: string) {
        return this.addressService.deleteAddress(id);
    }
}
