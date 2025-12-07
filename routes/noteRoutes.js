// routes/noteRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');

const router = express.Router();

// Helper: send validation errors in consistent shape
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({
        field: e.param,
        message: e.msg,
      })),
    });
  }
  next();
}

// @route   GET /api/notes
// @desc    Get all notes
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ updatedAt: -1 });
    res.json({ success: true, data: notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/notes
// @desc    Create a note
router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 3 }).withMessage('Title must be at least 3 characters')
      .isLength({ max: 100 }).withMessage('Title cannot be longer than 100 characters'),
    body('content')
      .trim()
      .notEmpty().withMessage('Content is required')
      .isLength({ min: 5 }).withMessage('Content must be at least 5 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Category cannot be longer than 50 characters'),
    body('isPinned')
      .optional()
      .isBoolean().withMessage('isPinned must be true or false'),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { title, content, category, isPinned } = req.body;

      const note = await Note.create({
        title,
        content,
        category: category || 'General',
        isPinned: Boolean(isPinned),
      });

      res.status(201).json({ success: true, data: note });
    } catch (err) {
      console.error(err);
      // In case Mongoose validation fires too
      res.status(400).json({
        success: false,
        message: 'Failed to create note',
        details: err.message,
      });
    }
  }
);

// @route   PUT /api/notes/:id
// @desc    Update a note
router.put(
  '/:id',
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3 }).withMessage('Title must be at least 3 characters')
      .isLength({ max: 100 }).withMessage('Title cannot be longer than 100 characters'),
    body('content')
      .optional()
      .trim()
      .isLength({ min: 5 }).withMessage('Content must be at least 5 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Category cannot be longer than 50 characters'),
    body('isPinned')
      .optional()
      .isBoolean().withMessage('isPinned must be true or false'),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const note = await Note.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!note) {
        return res.status(404).json({ success: false, message: 'Note not found' });
      }

      res.json({ success: true, data: note });
    } catch (err) {
      console.error(err);
      res.status(400).json({
        success: false,
        message: 'Failed to update note',
        details: err.message,
      });
    }
  }
);

// @route   DELETE /api/notes/:id
// @desc    Delete a note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted' });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: 'Failed to delete note',
      details: err.message,
    });
  }
});

module.exports = router;
