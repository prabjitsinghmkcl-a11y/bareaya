const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: "Customer"
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        minlength: 10,
        maxlength: 10
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true
    },
    password: {
        type: String
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    verified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        select: false
    },
    otpExpires: {
        type: Date,
        select: false
    },
});

module.exports = mongoose.model("User", userSchema);