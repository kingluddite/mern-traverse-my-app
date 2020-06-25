const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

// Bring in our models
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

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
  }
);

module.exports = router;
