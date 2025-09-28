const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// In-memory seats: 5 seats for demo
defaultStatus = { status: 'available' };
let seats = {
  '1': { ...defaultStatus },
  '2': { ...defaultStatus },
  '3': { ...defaultStatus },
  '4': { ...defaultStatus },
  '5': { ...defaultStatus }
};

let seatLocks = {}; // { 'seatId': timeoutHandle }

// Helper: clear lock after 1 minute
function setLockExpiry(seatId) {
  if(seatLocks[seatId]) clearTimeout(seatLocks[seatId]);
  seatLocks[seatId] = setTimeout(() => {
    if (seats[seatId] && seats[seatId].status === 'locked') {
      seats[seatId] = { status: 'available' };
    }
    delete seatLocks[seatId];
  }, 60 * 1000);
}

// GET /seats - view seat status
app.get('/seats', (req, res) => {
  res.status(200).json(seats);
});

// POST /lock/:seatId - lock a seat
function lockMsg(seatId) {
    return { message: `Seat ${seatId} locked successfully.` };
  }
  
app.post('/lock/:seatId', (req, res) => {
  const sid = req.params.seatId;
  if (!seats[sid]) return res.status(404).json({ message: 'Seat not found' });
  if (seats[sid].status === 'available') {
    seats[sid] = { status: 'locked' };
    setLockExpiry(sid);
    return res.status(200).json(lockMsg(sid));
  } else if (seats[sid].status === 'locked') {
    return res.status(400).json({ message: `Seat ${sid} is already locked. Try another.` });
  } else {
    // already booked
    return res.status(400).json({ message: `Seat ${sid} is already booked.` });
  }
});

// POST /confirm/:seatId - confirm (book) a seat
app.post('/confirm/:seatId', (req, res) => {
  const sid = req.params.seatId;
  if (!seats[sid]) return res.status(404).json({ message: 'Seat not found' });
  if (seats[sid].status === 'locked') {
    seats[sid] = { status: 'booked' };
    if(seatLocks[sid]) {
      clearTimeout(seatLocks[sid]);
      delete seatLocks[sid];
    }
    return res.status(200).json({ message: `Seat ${sid} booked successfully!` });
  } else {
    // not locked or already booked
    return res.status(400).json({ message: 'Seat is not locked and cannot be booked' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
