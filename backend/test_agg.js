const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ftafat';
  await mongoose.connect(uri);

  const User = require('./src/modules/users/user.model');
  const Order = require('./src/modules/orders/order.model');
  const DeliveryPartner = require('./src/modules/delivery/delivery.model');

  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  const userIds = users.map((u) => u._id);

  const customerCounts = await Order.aggregate([
    {
      $match: {
        $or: [
          { user: { $in: userIds } },
          { customerId: { $in: userIds } },
        ],
      },
    },
    {
      $project: {
        userId: { $ifNull: ['$user', '$customerId'] },
      },
    },
    {
      $group: {
        _id: '$userId',
        count: { $sum: 1 },
      },
    },
  ]);

  const customerOrderMap = new Map(customerCounts.map((c) => [c._id.toString(), c.count]));

  const deliveryPartners = await DeliveryPartner.find({ user: { $in: userIds } }).lean();
  const partnerMap = new Map();
  const allRiderIds = [...userIds];
  for (const dp of deliveryPartners) {
    partnerMap.set(dp.user.toString(), dp);
    allRiderIds.push(dp._id);
  }

  const riderCounts = await Order.aggregate([
    {
      $match: {
        $or: [
          { deliveryPartner: { $in: allRiderIds } },
          { 'delivery.riderId': { $in: allRiderIds } },
        ],
      },
    },
    {
      $project: {
        riderId: { $ifNull: ['$deliveryPartner', '$delivery.riderId'] },
      },
    },
    {
      $group: {
        _id: '$riderId',
        count: { $sum: 1 },
      },
    },
  ]);
  const riderOrderMap = new Map(riderCounts.map((r) => [r._id.toString(), r.count]));

  for (const u of users) {
    const uIdStr = u._id.toString();
    const custOrders = customerOrderMap.get(uIdStr) || 0;
    const dp = partnerMap.get(uIdStr);
    let riderOrders = riderOrderMap.get(uIdStr) || 0;
    if (dp) {
      const dpOrders = riderOrderMap.get(dp._id.toString()) || 0;
      const dpStats = (dp.stats?.completedDeliveries || 0) + (dp.stats?.cancelledDeliveries || 0);
      riderOrders = Math.max(riderOrders, dpOrders, dpStats);
    }
    const isRiderRole = u.role === 'delivery_partner' || u.role === 'rider';
    const totalOrders = isRiderRole && riderOrders > 0 ? riderOrders : (custOrders || riderOrders || 0);
    console.log({
      name: u.name,
      role: u.role,
      totalOrders,
      custOrders,
      riderOrders,
      hasPartnerProfile: Boolean(dp),
    });
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
