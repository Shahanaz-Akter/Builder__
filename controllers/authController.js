const crypto = require("crypto"); // for encryption/decryption
const bcrypt = require("bcrypt"); //hashing pin

const asyncHandler = require("express-async-handler");
//userModel import using require() method
const User = require("../models/authModel");

// these four file have to import for otp generation
const axios = require("axios");
const bodyParser = require("body-parser");


// step1 signUp route
const signUp = asyncHandler((req, res) => {
  const err_email = req.query.err_email;
  const err_mobile = req.query.err_mobile;
  const err_mbl = req.query.err_mbl;
  res.render("auth/signup", { err_email, err_mobile, err_mbl });
});

// Send OTP from signup
const sendOtp = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      user_name,
      email,
      mobile,
      otp,
      type_of_business,
      district,
      city,
      road,
      house,
      zip_code,
      password,
      pin,
      reset_pin,
    } = req.body;
    // Create a new user using the User model
    const newUser = new User({
      first_name,
      last_name,
      user_name,
      email,
      mobile,
      otp,
      type_of_business,
      district,
      city,
      road,
      house,
      zip_code,
      password,
      pin,
      reset_pin,
    });
    try {
      const savedUser = await newUser.save();
      // Check if user was saved successfully
      if (savedUser) {
        const userr = savedUser;
        // Generate OTP for the user
        const otpp = await generateOtp(userr._id);
        // Access environment variables
        const app_key = process.env.SMS_APP_KEY;
        // Send OTP via SMS
        var request = require("request");
        var options = {
          method: "POST",
          url: "https://api.sms.net.bd/sendsms",
          formData: {
            api_key: app_key,
            msg:`Your Framewiz OTP Number: ${otpp}`,
            to: userr.mobile,
          },
        };
        request(options, function (error, response) {
          if (error) throw new Error(error);
          res.redirect(`/auth/otp/${savedUser._id}`);
        });
      } else {
        res.json({ error: "User could not be saved." });
      }
    } catch (error) {
      // Check if the error is due to a duplicate key violation
      if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        // Duplicate email error
        res.redirect(
          `/auth/signup?err_email=${encodeURIComponent(
            "Email is already in use. Please choose another email."
          )}`
        );
      } else if (
        error.code === 11000 &&
        error.keyPattern &&
        error.keyPattern.mobile
      ) {
        // Duplicate mobile number error
        // res.redirect(`/signup?err_mobile=${encodeURIComponent('Mobile number is already in use. Please choose another number.')}`);
        const errMessage1 =
          "Mobile number is already in use. Please choose another number.";

        res.redirect(
          `/auth/signup?err_mobile=${encodeURIComponent(errMessage1)}`
        );
      } else {
        console.error("Error saving user:", error);
        res.status(500).json({ error: "Server Error" });
      }
    }
    //child try end
  } catch (error) {
    // console.error('Error sending OTP:', error);
    res.status(500).json({ error: "Server Error" });
  }
};

// Generate OTP
const generateOtp = async (user_id) => {
  try {
    const newOtp = Math.floor(Math.random() * (9999 - 1234 + 1) + 1234);
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { $set: { otp: newOtp } },
      { new: true }
    );
    return newOtp;
  } catch (error) {
    console.error("Error updating OTP:", error);
  }
};

const otpView = async (req, res) => {
  const id = req.params.id; // dynamically capture values from the URL
  const user = await User.findOne({ _id: id });
  // Extracting the first 2 digits
  const firstTwoDigits = user.mobile.substring(0, 2);

  // Extracting the last 3 digits
  const lastThreeDigits = user.mobile.substring(8, 11);

  const num = "+88 " + firstTwoDigits + "****** " + lastThreeDigits;

  const err = req.query.err;
  res.render("auth/otp", { id, err, num });
};

// post the otp in the database
const postOtp = async (req, res) => {
  const ottp = req.body.otp;
  // console.log(ottp);

  try {
    const One_user = await User.findOne({ otp: ottp }); //finding one single record from the database User table

    if (One_user) {
      res.redirect(`/auth/pin/${One_user._id}`);
    } else {
      // const msg = 'Your OTP is Invalid';
      res.redirect(
        `/auth/otp/${req.params.id}?err=${encodeURIComponent(
          "Your OTP is Invalid"
        )}`
      );
    }
  } catch (error) {
    console.error("Error processing OTP:", error);
    res.status(500).json({ error: "Yes Server Error" });
  }
};
const pinView = async (req, res) => {
  const id = req.params.id;
  res.render("auth/pin_generate", { id });
};
const postPin = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findOne({ _id: id });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const hashedPassword = await bcrypt.hash(req.body.new_pin, 10); //pass will be hashed using hash function

    await User.findByIdAndUpdate(user._id, {
      $set: {
        password: hashedPassword,
        pin: req.body.new_pin,
      },
    });

    // const result = await User.authenticate(user.email, req.body.new_pin);
    // Implement this authentication method in your User model

    if (user) {
      return res.redirect(`/auth/tob/${user._id}`);
    }
  } catch (error) {
    // console.error('Error in POST PIN GENERATION:', error);
    res.status(500).send("Internal Server Error");
  }
};

const tobView = async (req, res) => {
  id = req.params.id;
  res.render("auth/tob", { id });
};

const postTob = async (req, res) => {
  const { business } = req.body;
  // const business=req.body.business; //two ways to get one data
  // console.log("post Tob view ", req.params.id);
  const single_rec = await User.findOne({ _id: req.params.id }); //finding one single record from the database User table
  // console.log("Record:", single_rec);

  const updated_record = await User.findByIdAndUpdate(
    single_rec._id,
    { $set: { type_of_business: business } },
    { new: true }
  );

  if (updated_record) {
    res.redirect(`/auth/location/${updated_record._id}`);
  }

  // else {
  //     console.log('Record is not Successfully Updated..............');
  // }

  // console.log('update: ', updated_record);
};

const locationView = async (req, res) => {
  // const id = req.params.id;
  res.render("auth/business_location", { id: req.params.id });
};

const postLocation = async (req, res) => {
  const id = req.params.id;
  // console.log('vat');
  const { district, road, city, zip_code, house } = req.body;
  // User.findOne();
  const rec = await User.findById({ _id: id });

  const updated = await User.findByIdAndUpdate(
    rec._id,
    {
      $set: {
        district: district,
        road: road,
        zip_code: zip_code,
        city: city,
        house: house,
      },
    },
    { new: true }
  );

  if (updated) {
    res.redirect("/auth/dashboard");
  }
  // else {
  //     console.log('Record is not Successfully Updated..............');

  // }
};

const dashboard = async (req, res) => {
  res.redirect("http://localhost/pagebuilderztrios/views/pages.html");
};

const login = async (req, res) => {
  const err = req.query.err;

  // Render your login view, passing the error variable if it exists
  res.render("auth/login", { err });
};
const postLogin = async (req, res) => {
  const pass = req.body.pass;
  const mobile_num = req.body.mobile_num;

  try {
    // Find user by email
    const this_user = await User.findOne({ mobile: mobile_num });
    console.log(mobile_num);

    if (this_user) {
      // Check if the password is correct
      const isPasswordValid = bcrypt.compareSync(pass, this_user.password);

      if (isPasswordValid) {
        res.redirect("/auth/dashboard");
      } else {
        // Password is incorrect
        res.redirect(
          `/auth/login?err=${encodeURIComponent("Incorrect Password")}`
        );
      }
    } else {
      // User with the given email is not found
      res.redirect(`/auth/login?err=${encodeURIComponent("User Not found")}`);
    }
  } catch (error) {
    res.status(500).json({ error: " Error" });
  }
};

const forgottenPassword = async (req, res) => {
  // Render your login view, passing the error variable if it exists
  const error = req.query.error;
  // console.log(error);

  res.render("auth/forgotten_password", { error });
};
const postForgottenPassword = async (req, res) => {
  const mbl = req.body.mobile;
  // Render your login view, passing the error variable if it exists
  const one_user = await User.findOne({ mobile: mbl });
  // console.log(one_user);
  if (one_user) {
    // Access environment variables
    const app_key = process.env.SMS_APP_KEY;
    const number = mbl;
    const new_otp = Math.floor(Math.random() * (9999 - 1234 + 1) + 1234);

    const update_rec = await User.findByIdAndUpdate(
      one_user._id,
      { $set: { otp: new_otp, password: null, pin: null } },
      { new: true }
    ).exec();

    var request = require("request");
    var options = {
      method: "POST",
      url: "https://api.sms.net.bd/sendsms",
      formData: {
        api_key: app_key,
        msg: `Your Framewiz OTP Number: ${new_otp}`,
        to: number,
      },
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      res.redirect(`/auth/further_otp/${update_rec._id}`);
    });
  } else {
    res.redirect(
      `/auth/forgotten_password?error=${encodeURIComponent(
        "We can not find the User"
      )}`
    );
  }
};
const furtherOtp = async (req, res) => {
  const err = req.query.err;

  const userr = await User.findOne({ _id: req.params.id });
  const firstTwoDigits = userr.mobile.substring(0, 2);

  // Extracting the last 3 digits
  const lastThreeDigits = userr.mobile.substring(8, 11);

  const num1 = "+88 " + firstTwoDigits + "******" + lastThreeDigits;

  res.render("auth/further_otp", { err, num1, userr_id: userr._id });
  // console.log('further otp');
};

const postFurtherOtp = async (req, res) => {
  try {
    const otp_record = await User.findOne({ otp: req.body.otp });
    if (otp_record) {
      res.redirect(`/auth/reset_pin/${otp_record._id}`);
    } else {
      res.redirect(
        `/auth/further_otp/${req.params.id}?err=${encodeURIComponent(
          "Your OTP is Invalid"
        )}`
      );
    }
  } catch (error) {
    console.log("Error in postFurtherOtp:", error);
  }
};

const resetPin = async (req, res) => {
  const id = req.params.id;
  res.render("auth/reset_pin", { id });
};
const postResetPin = async (req, res) => {
  try {
    const id = req.params.id;
    const { pin } = req.body;
    // console.log(pin);
    const user = await User.findOne({ _id: id });
    // console.log("previous User: ", user);

    const hashedPin = await bcrypt.hash(pin, 10); // Use a salt rounds value (e.g., 10)
    // console.log(hashedPin);

    const updated_user = await User.findByIdAndUpdate(
      user._id,
      {
        $set: { password: hashedPin, pin: pin },
      },
      { new: true }
    ).exec();

    // console.log("Updated User: ", updated_user);

    if (updated_user) {
      res.redirect("/auth/dashboard");
    } else {
      res.redirect("/auth/login");
    }
  } catch (error) {
    // console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const resend = async (req, res) => {
  const id = req.params.id;
  const record = await User.findOne({ _id: id });
  // console.log(record);
  const update = await User.findByIdAndUpdate(
    record._id,
    {
      $set: { otp: null },
    },
    { new: true }
  );
  const otpp = await generateOtp(record._id);
  // Access environment variables
  const app_key = process.env.SMS_APP_KEY;
  // Send OTP via SMS

  var request = require("request");
  var options = {
    method: "POST",
    url: "https://api.sms.net.bd/sendsms",
    formData: {
      api_key: app_key,
      msg: `Your Framewiz OTP Number: ${otpp}`,
      to: number,
    },
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    res.redirect(`/auth/otp/${user._id}`);
  });
};

module.exports = {
  signUp,
  sendOtp,
  otpView,
  postOtp,
  tobView,
  postTob,
  locationView,
  postLocation,
  pinView,
  postPin,
  dashboard,
  login,
  postLogin,
  forgottenPassword,
  postForgottenPassword,
  furtherOtp,
  postFurtherOtp,
  resetPin,
  postResetPin,
  resend,
};
