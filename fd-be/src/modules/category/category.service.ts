import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from 'src/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
    ) { }

    /**
     * Create a new category
     * 
     * @param createCategoryDto The category data to create
     * @returns The created category
     */
    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        try {
            const category = this.categoryRepository.create(createCategoryDto);
            return await this.categoryRepository.save(category);
        } catch (error) {
            throw new Error(`Failed to create category: ${error.message}`);
        }
    }

    /**
     * Get all categories with pagination
     * 
     * @param page The page number
     * @param pageSize The number of items per page
     * @returns List of all categories with pagination metadata
     */
    async findAll(page = 1, pageSize = 10): Promise<{
        items: Category[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const [items, totalItems] = await this.categoryRepository.findAndCount({
            relations: ['foods'],
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        return {
            items,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Get a specific category by ID
     * 
     * @param id The category ID
     * @returns The category details
     */
    async findOne(id: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['foods'],
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return category;
    }

    /**
     * Update a category
     * 
     * @param id The category ID
     * @param updateCategoryDto The updated category data
     * @returns The updated category
     */
    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);

        // Update category with new values
        Object.assign(category, updateCategoryDto);

        return await this.categoryRepository.save(category);
    }

    /**
     * Delete a category
     * 
     * @param id The category ID
     */
    async remove(id: string): Promise<void> {
        const result = await this.categoryRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
    }
}