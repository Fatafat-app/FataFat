'use strict';

const LedgerEntry = require('./ledgerEntry.model');
const Settlement = require('./settlement.model');

class LedgerService {
  /**
   * Record double-entry financial impact of a delivered order
   */
  async recordOrderDelivered(order) {
    const { _id, vendorId, pricing, delivery } = order;

    const entries = [
      // Platform receives total revenue
      {
        account: 'PLATFORM_CASH',
        type: 'ORDER_REVENUE',
        creditPaise: pricing.totalPaise,
        orderId: _id,
        vendorId,
      },
      // Vendor credit for food/grocery items minus commission
      {
        account: 'VENDOR_PAYABLE',
        type: 'ORDER_REVENUE',
        creditPaise: pricing.itemsPaise - (pricing.commissionPaise || 0),
        orderId: _id,
        vendorId,
      },
      // Platform commission
      {
        account: 'PLATFORM_COMMISSION',
        type: 'COMMISSION',
        creditPaise: pricing.commissionPaise || 0,
        orderId: _id,
        vendorId,
      },
    ];

    if (delivery?.riderId) {
      entries.push({
        account: 'RIDER_PAYABLE',
        type: 'DELIVERY_FEE',
        creditPaise: pricing.deliveryPaise,
        orderId: _id,
        riderId: delivery.riderId,
      });
    }

    await LedgerEntry.insertMany(entries);
  }

  async getVendorBalance(vendorId) {
    const entries = await LedgerEntry.find({ vendorId });
    const balancePaise = entries.reduce((acc, curr) => acc + curr.creditPaise - curr.debitPaise, 0);
    return { vendorId, balancePaise };
  }
}

module.exports = new LedgerService();
