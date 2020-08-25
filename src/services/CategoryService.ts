import Category from "../models/Category";

class CategoryService {
  static async createCategory(value: string, createdBy: string) {
    const category = new Category({ value, createdBy });
    await category.save();
    return category;
  }

  static async getCategory(value: string) {
    return await Category.findOne({ value });
  }

  static async findOrCreateCategory(value: string, createdBy: string) {
    let category = await CategoryService.getCategory(value);

    if (!category) {
      category = await CategoryService.createCategory(value, createdBy);
    }

    return category;
  }
}

export default CategoryService;
