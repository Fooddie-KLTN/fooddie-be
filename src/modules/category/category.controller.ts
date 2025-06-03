import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'The category has been successfully created.' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Return all categories.' })
  findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.categoryService.findAll(page, pageSize);
  }
  

  @Get(':id')
  @ApiOperation({ summary: 'Get category by id' })
  @ApiResponse({ status: 200, description: 'Return category by id.' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'The category has been successfully updated.' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'The category has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}