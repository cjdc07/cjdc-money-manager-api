import Category from "../models/Category";

class CategoryService {
  static async createCategory(value: string, createdBy: string) {
    const category = new Category({ value, createdBy });
    await category.save();
    return category;
  }

  static async getCategoryById(id: string) {
    return await Category.findById(id);
  }

  static async getCategoryByValue(value: string) {
    return await Category.findOne({ value });
  }

  static async findOrCreateCategory(value: string, createdBy: string) {
    let category = await CategoryService.getCategoryByValue(value);

    if (!category) {
      category = await CategoryService.createCategory(value, createdBy);
    }

    return category;
  }
}

export default CategoryService;
