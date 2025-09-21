const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', (req, res) => {
  const newUser = new User({ username: req.body.username });
  newUser.save((err, data) => {
    if (err) return res.json(err);
    res.json({ username: data.username, _id: data._id });
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, data) => {
    if (err) return res.json(err);
    res.json(data);
  });
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const exerciseDate = date ? new Date(date) : new Date();

    const newExercise = new Exercise({
      userId: req.params._id,
      description,
      duration: parseInt(duration),
      date: exerciseDate
    });

    const data = await newExercise.save();
    const user = await User.findById(req.params._id);

    res.json({
      _id: user._id,
      username: user.username,
      description: data.description,
      duration: data.duration,
      date: data.date.toDateString()
    });
  } catch (err) {
    res.json(err);
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.json({ error: 'User not found' });

    let filter = { userId: req.params._id };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from + 'T00:00:00Z');
      if (to) filter.date.$lte = new Date(to + 'T23:59:59Z');
    }

    let query = Exercise.find(filter).sort({ date: 'asc' });
    if (limit) query = query.limit(parseInt(limit));

    const exercises = await query.exec();

    const log = exercises.map(e => ({
      description: e.description,
      duration: Number(e.duration),
      date: e.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log
    });
  } catch (err) {
    res.json(err);
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});