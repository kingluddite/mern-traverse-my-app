// third party dependencies
const express = require("express");
const { check, validationResult } = require("express-validator");
// const request = require('request'); // DELETE
// const config = require('config');
const axios = require("axios");
// my dependencies
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Post = require("../../models/Post");

const router = express.Router();

// @route    GET api/profile/me
// @desc     Get current user profile
// @access   Private
router.get("/me", auth, async (req, res) => {
  try {
    // Try to find the profile using the user id in the token
    // Grab the user name and avatar off the User object
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);
    console.log(profile);

    // Do we have a profile?
    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    // There is a profile so send it in the response
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(500).send("Server Error");
  }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      github_username, // eslint-disable-line camelcase
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (github_username) profileFields.github_username = github_username; // eslint-disable-line camelcase
    if (skills) {
      // Go through String of skills
      // turn them into an array with split()
      // Use map to take each array item and trim any spaces
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    // Build social object
    profileFields.social = {};

    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    // now we're ready to update
    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // Create Profile
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route.    GET api/profile/user/:user_id
// @desc.     Get Profile by user id
// @access.   PUBLIC
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route.    DELETE /api/profile
// @desc.     Delete profile, user and posts
// @access.   PRIVATE
router.delete("/", auth, async (req, res) => {
  try {
    // Remove user posts
    // Make sure you do this BEFORE you delete the user
    await Post.deleteMany({ user: req.user.id });

    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route.    PUT api/profile/experience
// @desc.     Add profile experience
// @access.   PRIVATE
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    // Create an object with the data the user submits
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        console.log("profile not found");
        return res.status(400).json({ msg: "Profile not found" });
      }
      // we use unshift to add the new experience at the end of the array (rather than beginning with push() array method)
      profile.experience.unshift(newExp);
      // console.log(profile.experience);
      // We found the profile
      // We added our new experience to the profile
      // Now we need to save it to our DB using Mongoose `save()`
      await profile.save();

      // We return the profile in the response that we'll use in the frontend (React) later on
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route.    DELETE api/profile/experience/exp_id:
// @desc.     Delete an experience
// @access.   PRIVATE
router.delete("/experience/:exp_id", auth, async (req, res) => {
  // use try catch to see if our code will work
  // if not we'll throw an error
  try {
    // Grab the user pofile
    // MAKE SURE TO USE await!
    // You'll need to get the user id from the request object
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    // we use map to create a new array
    // we look at each experience in array and
    //  grab it's id (this is the unique `_id` mongo was kind enough to create for us when we
    //  created an experience
    //  when we find the id in the URL (the last part will be the experience id and we can access that with :experience in our route))
    // if the item id matches the exp_id we will get the index of where that happened in the array
    // we store that index number inside removeIndex variable

    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    // Make sure we find a match before we delete
    if (removeIndex !== -1) {
      // find the experience item and remove it
      profile.experience.splice(removeIndex, 1);
    } else {
      console.error("Experience not found");
      return res.status(500).send("Experience not found");
    }

    // don't forget to tell Mongoose to save this
    // in your Database
    await profile.save();

    // return the profile to the client
    // we can use this with react if we want
    // to give the end user some feedback
    // make sure to check and see that the experience
    // you deleted is gone from the experience array
    res.json(profile);
  } catch (err) {
    // if we have an error show it
    console.error(err.message);
    // always return a status in the response
    // we use 500 to show server error
    res.status(500).send("Server Error");
  }
});

// @route.    PUT api/profile/education
// @desc.     Add profile education
// @access.   PRIVATE
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("field_of_study", "Field of Study is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      field_of_study, // eslint-disable-line camelcase
      from,
      to,
      current,
      description,
    } = req.body;

    // Create an object with the data the user submits
    const newEdu = {
      school,
      degree,
      field_of_study,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        console.log("profile not found");
        return res.status(400).json({ msg: "Profile not found" });
      }
      // we use unshift to add the new education at the end of the array (rather than beginning with push() array method)
      profile.education.unshift(newEdu);
      // console.log(profile.education);
      // We found the profile
      // We added our new education to the profile
      // Now we need to save it to our DB using Mongoose `save()`
      await profile.save();

      // We return the profile in the response that we'll use in the frontend (React) later on
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route.    DELETE api/profile/education/edu_id:
// @desc.     Delete an education
// @access.   PRIVATE
router.delete("/education/:edu_id", auth, async (req, res) => {
  // use try catch to see if our code will work
  // if not we'll throw an error
  try {
    // Grab the user profile
    // MAKE SURE TO USE await!
    // You'll need to get the user id from the request object
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    // we use map to create a new array
    // we look at each education in array and
    //  grab it's id (this is the unique `_id` mongo was kind enough to create for us when we
    //  created an education
    //  when we find the id in the URL (the last part will be the education id and we can access that with :education in our route))
    // if the item id matches the exp_id we will get the index of where that happened in the array
    // we store that index number inside removeIndex variable

    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    // Make sure we find a match before we delete
    if (removeIndex !== -1) {
      // find the education item and remove it
      profile.education.splice(removeIndex, 1);
    } else {
      console.error("Education not found");
      return res.status(500).send("education not found");
    }

    // don't forget to tell Mongoose to save this
    // in your Database
    await profile.save();

    // return the profile to the client
    // we can use this with react if we want
    // to give the end user some feedback
    // make sure to check and see that the education
    // you deleted is gone from the education array
    res.json(profile);
  } catch (err) {
    // if we have an error show it
    console.error(err.message);
    // always return a status in the response
    // we use 500 to show server error
    res.status(500).send("Server Error");
  }
});

// OLD WAY WITH request npm module
// @route.    GET api/profile/github/:username
// @desc.     Get user repos from GitHub
// @access.   PUBLIC
// router.get('/github/:username', (req, res) => {
//   try {
//     const options = {
//       uri: `http://api.github.com/users/${req.params.username}/repos?per_page=5=created:asc&client_id={$config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
//       method: 'GET',
//       headers: { 'user-agent': 'node.js'}
//     };

//     request(options, (error, response, body) => {
//       if (error) {
//         console.error(error);
//       }

//       if (response.statusCode !== 200) {
//         res.status(404).json({ msg: 'No GitHub profile found' });
//       }

//       // The body will just be a regular String
//       //   with escaped quotes and stuff like that
//       //   So we use JSON.parse(body) before we send it
//       res.json(JSON.parse(body));
//     });
//   } catch (err) {
//    console.error(err.message);
//    res.status(500).send('Server Error');
//   }
// })

// @route.    GET api/profile/github/:username
// @desc.     Get user repos from GitHub
// @access.   PUBLIC
router.get("/github/:username", async (req, res) => {
  try {
    const uri = encodeURI(
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
    );
    const headers = {
      "user-agent": "node.js",
      Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
    };

    const gitHubResponse = await axios.get(uri, { headers });
    return res.json(gitHubResponse.data);
  } catch (err) {
    console.error(err.message);
    res.status(404).json({ msg: "No GitHub profile found" });
  }
});
module.exports = router;
