const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.use(auth);

// search user by username
router.get('/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) return res.status(400).json({ message: 'Search term is required' });

  try {
    const users = await User.find({ username: new RegExp(`^${query}`, 'i') }).limit(20).select('username email isOnline');
    const filtered = users
      .filter((u) => u._id.toString() !== req.user._id.toString())
      .map((u) => ({ id: u._id, username: u.username, email: u.email, isOnline: u.isOnline }));

    return res.json(filtered);
  } catch (err) {
    console.error('Search error', err);
    return res.status(500).json({ message: 'Search failed' });
  }
});

// get friends list
router.get('/', async (req, res) => {
  try {
    await req.user.populate('friends', 'username email isOnline').execPopulate();
    const friends = req.user.friends.map((f) => ({ id: f._id, username: f.username, email: f.email, isOnline: f.isOnline }));
    return res.json({ friends });
  } catch (err) {
    console.error('Friends list error', err);
    return res.status(500).json({ message: 'Could not fetch friends' });
  }
});

// get friend requests received
router.get('/requests', async (req, res) => {
  try {
    await req.user.populate('friendRequests.from', 'username email').execPopulate();
    const requests = req.user.friendRequests.map((r) => ({ id: r.from._id, username: r.from.username, email: r.from.email, createdAt: r.createdAt }));
    return res.json({ requests });
  } catch (err) {
    console.error('Requests fetch error', err);
    return res.status(500).json({ message: 'Could not fetch requests' });
  }
});

// send friend request
router.post('/request', async (req, res) => {
  const targetUsername = (req.body.username || '').trim();
  if (!targetUsername) return res.status(400).json({ message: 'Username is required' });

  if (targetUsername.toLowerCase() === req.user.username.toLowerCase()) {
    return res.status(400).json({ message: 'Cannot send friend request to yourself' });
  }

  try {
    const target = await User.findOne({ username: targetUsername });
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (req.user.friends.some((f) => f.toString() === target._id.toString())) {
      return res.status(400).json({ message: 'Already a friend' });
    }

    if (target.friendRequests.some((r) => r.from.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    target.friendRequests.push({ from: req.user._id });
    await target.save();

    res.json({ message: 'Friend request sent' });
  } catch (err) {
    console.error('Send request error', err);
    res.status(500).json({ message: 'Could not send request' });
  }
});

// accept request
router.post('/request/:id/accept', async (req, res) => {
  const fromUserId = req.params.id;

  try {
    const requestIndex = req.user.friendRequests.findIndex((r) => r.from.toString() === fromUserId);
    if (requestIndex === -1) return res.status(404).json({ message: 'Friend request not found' });

    const fromUser = await User.findById(fromUserId);
    if (!fromUser) return res.status(404).json({ message: 'Request sender not found' });

    // Add each as friends (if not already)
    if (!req.user.friends.some((f) => f.toString() === fromUserId)) req.user.friends.push(fromUserId);
    if (!fromUser.friends.some((f) => f.toString() === req.user._id.toString())) fromUser.friends.push(req.user._id);

    // Remove friend request
    req.user.friendRequests = req.user.friendRequests.filter((r) => r.from.toString() !== fromUserId);

    await req.user.save();
    await fromUser.save();

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('Accept request error', err);
    res.status(500).json({ message: 'Could not accept friend request' });
  }
});

// reject request
router.post('/request/:id/reject', async (req, res) => {
  const fromUserId = req.params.id;

  try {
    if (!req.user.friendRequests.some((r) => r.from.toString() === fromUserId)) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    req.user.friendRequests = req.user.friendRequests.filter((r) => r.from.toString() !== fromUserId);
    await req.user.save();

    return res.json({ message: 'Friend request rejected' });
  } catch (err) {
    console.error('Reject request error', err);
    res.status(500).json({ message: 'Could not reject friend request' });
  }
});

module.exports = router;