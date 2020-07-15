// 3rd party dependencies
const express = require("express");
const { check, validationResult } = require("express-validator");

// custom
// authentication
const auth = require("../../middleware/auth");

// Bring in our models
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");

// We are going to place our routes in their own 'routes' folder
const router = express.Router();

// @route    POST api/posts
// @desc     Create a post
// @access   Public
router.post(
  "/",
  [auth, [check("text", "Post content is required").not().isEmpty()]],
  async (req, res) => {
    // error checking
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-hashed_password");

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
      res.status(500).send("Server Error");
    }
  }
);

// @route.    GET api/posts
// @desc.     Get all posts
// @access.   Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ data: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route.    GET api/posts/:id
// @desc.     Get post by ID
// @access.   Private
router.get("/:id", auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "No post found" });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);

    // if err.kind equals 'ObjectId' then it is not a valid object id'
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "No post found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route.    DELETE api/posts/:id
// @desc.     Delete post by ID
// @access.   Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "No post found" });
    }
    // Check user to see if they are the owner of post or not
    // post.user is an ObjectId
    // req.user.id is a String
    // To make this work we need to convert the ObjectId to a string with
    //   post.user.toString()
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await post.remove();

    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "No post found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route.    PUT api/posts/like/:id
// @desc.     Like a post
// @access.   Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    console.log(post);

    // Check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();
    //
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route.    PUT api/posts/unlike/:id
// @desc.     Unlike a post
// @access.   Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    // Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
router.post(
  "/comment/:id",
  [auth, [check("text", "Please add text").not().isEmpty()]],
  async (req, res) => {
    // error checking
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Get the user
      const user = await User.findById(req.user.id).select("-hashed_password");
      // Get a post (that we are commenting on)
      const post = await Post.findById(req.params.id);

      // Comments are not a new collection in the Database
      //  so we don't need to create a new Comment() (like we did for new Post())
      //  instead we just create a newComment object
      const newComment = {
        // all the key value properies will be the same as what we did for a new post
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      // We need to add this new comment onto the post comments array
      //  We want to place the comment not at the end but at the beginning
      //  so we use unshift() (rather than push())
      post.comments.unshift(newComment);

      // No need to save the post in a variable
      // But we do need to save it to our Database
      await post.save();

      // Send back all the comments
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route.    DELETE api/posts/comment/:id/:comment_id
// @desc.     Delete a comment
// @access.   Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    // Get the post
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      (item) => item.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    // Check user to see if they are the owner of comment or not
    // post.comments.user is an ObjectId
    // req.user.id is a String
    // To make this work we need to convert the ObjectId to a string with
    //   post.user.toString()
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Get remove index
    const removeIndex = post.comments
      .map((item) => item.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);

    // res.json({ msg: 'comment removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "No post found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route.    PUT api/posts/comment/:id/:comment_id
// @desc.     Update a comment
// @access.   Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    // Get the post
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      (item) => item.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    // Check user to see if they are the owner of comment or not
    // post.comments.user is an ObjectId
    // req.user.id is a String
    // To make this work we need to convert the ObjectId to a string with
    //   post.user.toString()
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Get remove index
    const updateIndex = post.comments
      .map((item) => item.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);

    // res.json({ msg: 'comment removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "No post found" });
    }
    res.status(500).send("Server Error");
  }
});
module.exports = router;
