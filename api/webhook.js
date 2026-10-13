const express = require('express');
const router = express.Router();

router.post('/webhook', express.json({type: 'application/json'}), (req, res) => {
  const event = req.body;

  // Lemon Squeezy subscription created / updated event
  if (event.meta && event.meta.event_name === 'subscription_created') {
    const customerEmail = event.data.attributes.user_email;
    // Yahan aap database mein userEmail ko Pro status mark kar sakte hain
    console.log(`Subscription active for: ${customerEmail}`);
  }

  res.status(200).json({ received: true });
});

module.exports = router;