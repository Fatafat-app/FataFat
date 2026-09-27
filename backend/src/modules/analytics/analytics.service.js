'use strict';

const mongoose = require('mongoose');
const Order = require('../orders/order.model');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../../common/constants/orderStatuses');

async function getRestaurantAnalytics(restaurantId, { days = 30 } = {}) {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - parseInt(days, 10));

  const objectId = new mongoose.Types.ObjectId(restaurantId);

  const [salesTrend, summary, topItems] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          restaurant: objectId,
          orderStatus: ORDER_STATUS.DELIVERED,
          paymentStatus: PAYMENT_STATUS.PAID,
          createdAt: { $gte: sinceDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$subtotal' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Order.aggregate([
      {
        $match: {
          restaurant: objectId,
          orderStatus: ORDER_STATUS.DELIVERED,
          paymentStatus: PAYMENT_STATUS.PAID,
          createdAt: { $gte: sinceDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$subtotal' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$subtotal' },
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          restaurant: objectId,
          orderStatus: ORDER_STATUS.DELIVERED,
          createdAt: { $gte: sinceDate },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalSales: { $sum: '$items.totalPrice' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const stats = summary[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

  return {
    periodDays: days,
    totalRevenue: stats.totalRevenue,
    totalOrders: stats.totalOrders,
    averageOrderValue: Math.round(stats.avgOrderValue || 0),
    salesTrend,
    topItems,
  };
}

async function getPlatformAnalytics({ days = 30 } = {}) {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - parseInt(days, 10));

  const [dailyGrowth, statusBreakdown] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalGmv: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    periodDays: days,
    dailyGrowth,
    statusBreakdown: Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count])),
  };
}

module.exports = {
  getRestaurantAnalytics,
  getPlatformAnalytics,
};
