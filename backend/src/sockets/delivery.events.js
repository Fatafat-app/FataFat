'use strict';

function registerDeliveryEvents(socket, io) {
  socket.on('delivery:location_update', ({ orderId, lat, lng }) => {
    if (socket.user.role !== 'delivery_partner') return;

    io.to(`order:${orderId}`).emit('delivery:location_update', {
      orderId,
      lat,
      lng,
      timestamp: new Date().toISOString(),
    });
  });
}

module.exports = { registerDeliveryEvents };
