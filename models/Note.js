// models/Note.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot be longer than 100 characters'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      minlength: [5, 'Content must be at least 5 characters'],
      maxlength: [5000, 'Content cannot be longer than 5000 characters'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot be longer than 50 characters'],
      default: 'General',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
