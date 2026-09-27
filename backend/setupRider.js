const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ftafat').then(async () => {
  const db = mongoose.connection.db;
  let user = await db.collection('users').findOne({phone: '+919999999998'});
  if (!user) {
    const res = await db.collection('users').insertOne({phone: '+919999999998', name: 'Rider Ramesh', role: 'delivery_partner', createdAt: new Date()});
    user = {_id: res.insertedId};
  } else {
    await db.collection('users').updateOne({_id: user._id}, {$set: {role: 'delivery_partner'}});
  }
  
  const partner = await db.collection('deliverypartners').findOne({user: user._id});
  if (!partner) {
    await db.collection('deliverypartners').insertOne({
      user: user._id,
      isOnline: false,
      isAvailable: false,
      vehicle: {type: 'bike', model: 'Honda Activa', licenseNumber: 'MH01AB1234'},
      earnings: {total: 0, today: 0, pendingPayout: 0},
      stats: {completedDeliveries: 0, rating: 5},
      createdAt: new Date()
    });
  }
  console.log('Rider account +919999999998 is ready!');
  process.exit(0);
}).catch(console.error);
