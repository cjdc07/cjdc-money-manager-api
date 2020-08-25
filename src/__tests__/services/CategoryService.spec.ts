import * as sinon from 'sinon';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import Category from '../../models/Category';
import CategoryService from '../../services/CategoryService';

const mockCategoryId = '5ef0a533c192053343e57f70';
const mockUserId = '5ef0a533c192053343e57f61';

const mockCategory = new Category({
  id: mockCategoryId,
  value: 'test-category',
});

describe('CategoryService', () => {
  afterEach(() => {
    sinon.restore();
  });

  it ('should create a category', async () => {
    const { value } = mockCategory;

    sinon.stub(Category.prototype, 'save');
    const result = await CategoryService.createCategory(value, mockUserId);

    expect(result.value).to.equal(value);
  });

  it ('should return a category if it exists', async () => {
    const { value } = mockCategory;

    sinon.mock(Category).expects('findOne').returns(mockCategory);
    const result = await CategoryService.findOrCreateCategory(value, mockUserId);

    expect(result.value).to.equal(value);
  });

  it ('should create a category if it does not exist', async () => {
    const { value } = mockCategory;

    sinon.stub(Category.prototype, 'save');
    sinon.mock(Category).expects('findOne').returns(null);
    const result = await CategoryService.findOrCreateCategory(value, mockUserId);

    expect(result.value).to.equal(value);
  });
});
