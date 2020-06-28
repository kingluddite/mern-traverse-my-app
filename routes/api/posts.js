// 3rd party dependencies
const express = require('express');
const { check, validationResult } = require('express-validator');

// custom
// authentication
const auth = require('../../middleware/auth');

// Bring in our models
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

// We are going to place our routes in their own 'routes' folder
const router = express.Router();

// @route    POST api/posts
// @desc     Create a post
// @access   Public
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Post content is required')
        .not()
        .isEmpty(),
    ],
  ],
  async (req, res) => {
    // error checking
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-hashed_password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
