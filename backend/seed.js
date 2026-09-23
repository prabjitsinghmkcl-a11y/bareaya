const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./model/User');
const Product = require('./model/Product');
const Order = require('./model/Order');

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  console.error('Seeding is disabled in production. Do not create demo/users accounts with known passwords on a live site.');
  process.exit(1);
}

const seedDatabase = async () => {
	try {
		await connectDB();

		const password = await bcrypt.hash('Password123!', 10);
		const users = await User.bulkWrite([
			{
				updateOne: {
					filter: { email: 'admin@example.com' },
					update: {
						$set: {
							name: 'Demo Admin',
							phone: '9876500001',
							password,
							role: 'admin',
							verified: true
						}
					},
					upsert: true
				}
			},
			{
				updateOne: {
					filter: { email: 'maya@example.com' },
					update: {
						$set: {
							name: 'Maya Singh',
							phone: '9876500002',
							password,
							role: 'user',
							verified: true
						}
					},
					upsert: true
				}
			},
			{
				updateOne: {
					filter: { email: 'alex@example.com' },
					update: {
						$set: {
							name: 'Alex Carter',
							phone: '9876500003',
							password,
							role: 'user',
							verified: true
						}
					},
					upsert: true
				}
			}
		]);

		const seededUsers = await User.find({
			email: { $in: ['admin@example.com', 'maya@example.com', 'alex@example.com'] }
		});
		const userByEmail = Object.fromEntries(seededUsers.map((user) => [user.email, user]));
		if (seededUsers.length !== 3) {
			throw new Error('Seeded users could not be loaded after writing them to MongoDB.');
		}

		const productData = [
			{
				name: 'Linen Overshirt',
				description: 'A breathable linen overshirt for warm days and cool evenings.',
				price: 59.99,
				imageUrl: '',
				category: 'Clothing',
				stock: 24
			},
			{
				name: 'Canvas Everyday Tote',
				description: 'A durable carryall with room for daily essentials.',
				price: 29.5,
				imageUrl: '',
				category: 'Accessories',
				stock: 40
			},
			{
				name: 'Ceramic Travel Mug',
				description: 'A reusable ceramic mug with a secure silicone lid.',
				price: 18.75,
				imageUrl: '',
				category: 'Home',
				stock: 32
			},
			{
				name: 'Minimal Desk Lamp',
				description: 'A compact warm-light lamp for desks and bedside tables.',
				price: 44.0,
				imageUrl: '',
				category: 'Home',
				stock: 15
			},
			{
				name: 'Everyday Sneakers',
				description: 'Lightweight sneakers designed for comfortable daily walks.',
				price: 74.99,
				imageUrl: '',
				category: 'Footwear',
				stock: 18
			},
			{
				name: 'Cotton Hoodie',
				description: 'A soft mid-weight hoodie with a relaxed fit.',
				price: 49.95,
				imageUrl: '',
				category: 'Clothing',
				stock: 27
			}
		];

		await Promise.all(
			productData.map((product) =>
				Product.findOneAndUpdate(
					{ name: product.name },
					{ $set: product },
					{ upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
				)
			)
		);

		const products = await Product.find({ name: { $in: productData.map(({ name }) => name) } });
		const productByName = Object.fromEntries(products.map((product) => [product.name, product]));
		if (products.length !== productData.length) {
			throw new Error('Seeded products could not be loaded after writing them to MongoDB.');
		}

		const orderData = [
			{
				paymentId: 'seed-payment-1001',
				userId: userByEmail['maya@example.com']._id,
				items: [
					{
						productId: productByName['Linen Overshirt']._id,
						name: 'Linen Overshirt',
						quantity: 1,
						price: 59.99
					},
					{
						productId: productByName['Canvas Everyday Tote']._id,
						name: 'Canvas Everyday Tote',
						quantity: 1,
						price: 29.5
					}
				],
				totalAmount: 89.49,
				address: {
					street: '12 Market Street',
					city: 'New Delhi',
					postalCode: '110001',
					country: 'India'
				},
				status: 'delivered'
			},
			{
				paymentId: 'seed-payment-1002',
				userId: userByEmail['alex@example.com']._id,
				items: [
					{
						productId: productByName['Minimal Desk Lamp']._id,
						name: 'Minimal Desk Lamp',
						quantity: 1,
						price: 44.0
					}
				],
				totalAmount: 44.0,
				address: {
					street: '8 Lake Road',
					city: 'Mumbai',
					postalCode: '400001',
					country: 'India'
				},
				status: 'paid'
			}
		];

		await Promise.all(
			orderData.map((order) =>
				Order.findOneAndUpdate(
					{ paymentId: order.paymentId },
					{ $set: order },
					{ upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
				)
			)
		);

		const orderCount = await Order.countDocuments({ paymentId: { $in: orderData.map(({ paymentId }) => paymentId) } });
		console.log(`MongoDB database: ${mongoose.connection.name}`);
		console.log(`Collections: users=${await User.countDocuments()}, products=${await Product.countDocuments()}, orders=${await Order.countDocuments()}`);
		console.log(`Seeded ${users.modifiedCount + users.upsertedCount} users, ${products.length} products, and ${orderCount} orders.`);
		console.log('Demo login email/password for all seeded users: Password123!');
	} catch (error) {
		console.error('Database seeding failed:', error.message);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
	}
};

seedDatabase();
