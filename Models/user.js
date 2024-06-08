"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    nif: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: Number,
      required: false,
    },
    login_id: {
      type: Number,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    zipcode: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    img: {
      data: { type: Buffer },
      contentType: { type: String },
    },
  },
  { collection: "users" }
);
const User = mongoose.model("User", UserSchema);

module.exports = User;
