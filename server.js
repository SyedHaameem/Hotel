const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;

// =======================
// ADMIN CREDENTIALS
// =======================
// Set these in your .env file (never commit .env):
// ADMIN_USER=youruser
// ADMIN_PASS=yourpassword
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme123';

function requireAdminAuth(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {

    res.set('WWW-Authenticate', 'Basic realm="Hotel Admin"');
    return res.status(401).send('Authentication required.');

  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [user, pass] = credentials.split(':');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Hotel Admin"');
  return res.status(401).send('Invalid credentials.');

}

// =======================
// MIDDLEWARE
// =======================

app.use(cors());

app.use(bodyParser.json());

// Protect the admin page itself before static files serve it
app.get('/admin.html', requireAdminAuth, (req, res) => {
  res.sendFile(__dirname + '/admin.html');
});

app.use(express.static(__dirname));

// =======================
// MONGODB CONNECTION
// =======================
mongoose.connect(process.env.MONGODB_URI)
.then(() => {

  console.log('MongoDB Connected');

})
.catch((error) => {

  console.log(error);

});

// =======================
// BOOKING SCHEMA
// =======================

const bookingSchema = new mongoose.Schema({

  name: String,

  phone: String,

  checkin: String,

  checkout: String,

  guests: String,

  status: {

    type: String,

    default: 'Pending'

  }

}, { timestamps: true });

const Booking =
mongoose.model('Booking', bookingSchema);

// =======================
// REVIEW SCHEMA
// =======================

const reviewSchema = new mongoose.Schema({

  name: String,

  rating: {

    type: Number,

    min: 1,

    max: 5,

    required: true

  },

  comment: String,

  approved: {

    type: Boolean,

    default: false

  }

}, { timestamps: true });

const Review =
mongoose.model('Review', reviewSchema);

// =======================
// SAVE BOOKING
// =======================

app.post('/book-room', async (req, res) => {

  try {

    const booking = new Booking({

      name: req.body.name,

      phone: req.body.phone,

      checkin: req.body.checkin,

      checkout: req.body.checkout,

      guests: req.body.guests

    });

    await booking.save();

    res.json({

      success: true

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false

    });

  }

});

// =======================
// GET BOOKINGS (admin only)
// =======================

app.get('/bookings', requireAdminAuth, async (req, res) => {

  const bookings =
  await Booking.find().sort({ createdAt: -1 });

  res.json(bookings);

});

// =======================
// CONFIRM BOOKING (admin only)
// =======================

app.post('/confirm-booking/:id', requireAdminAuth, async (req, res) => {

  await Booking.findByIdAndUpdate(

    req.params.id,

    {

      status: 'Confirmed'

    }

  );

  res.json({

    success: true

  });

});

// =======================
// DELETE BOOKING (admin only)
// =======================

app.delete('/delete-booking/:id', requireAdminAuth, async (req, res) => {

  try {

    await Booking.findByIdAndDelete(req.params.id);

    res.json({

      success: true

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false

    });

  }

});

// =======================
// SUBMIT REVIEW (public)
// =======================

app.post('/submit-review', async (req, res) => {

  try {

    const review = new Review({

      name: req.body.name,

      rating: req.body.rating,

      comment: req.body.comment

    });

    await review.save();

    res.json({

      success: true

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false

    });

  }

});

// =======================
// GET APPROVED REVIEWS (public, shown on homepage)
// =======================

app.get('/reviews', async (req, res) => {

  const reviews =
  await Review.find({ approved: true }).sort({ createdAt: -1 });

  res.json(reviews);

});

// =======================
// GET ALL REVIEWS (admin only, includes pending)
// =======================

app.get('/admin/reviews', requireAdminAuth, async (req, res) => {

  const reviews =
  await Review.find().sort({ createdAt: -1 });

  res.json(reviews);

});

// =======================
// APPROVE REVIEW (admin only)
// =======================

app.post('/approve-review/:id', requireAdminAuth, async (req, res) => {

  await Review.findByIdAndUpdate(

    req.params.id,

    {

      approved: true

    }

  );

  res.json({

    success: true

  });

});

// =======================
// DELETE REVIEW (admin only)
// =======================

app.delete('/delete-review/:id', requireAdminAuth, async (req, res) => {

  try {

    await Review.findByIdAndDelete(req.params.id);

    res.json({

      success: true

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false

    });

  }

});

// =======================
// START SERVER
// =======================

app.listen(PORT, () => {

  console.log(

    `Server running on http://localhost:${PORT}`

  );

});
