const fs = require('fs');
const Product = require('../model/Product');
const cloudinary = require('../config/cloudinary');
const { sendErrorResponse } = require('../utils/apiError');
const { normalizeImageUrl } = require('../utils/imageUrl');

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products.map((product) => normalizeImageUrl(product.toObject())));
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(normalizeImageUrl(product.toObject()));
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'bareaya/products' });
      imageUrl = result.secure_url;
      fs.unlink(req.file.path, () => {});
    }
    const product = new Product({
      name, description, price, category, stock, imageUrl
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price ?? product.price;
      product.category = category || product.category;
      product.stock = stock ?? product.stock;

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'bareaya/products' });
        product.imageUrl = result.secure_url;
        fs.unlink(req.file.path, () => {});
      }
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };