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
    // The bcrypt hash is excluded from every query by default. Callers that
    // genuinely need it (password login) must opt in with .select('+password'),
    // so no future endpoint can accidentally serialise it.
    password: {
        type: String,
        select: false
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
});

userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);