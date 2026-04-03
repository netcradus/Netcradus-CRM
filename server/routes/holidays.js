const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const rbac = require('../middleware/rbac');
const {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} = require('../controllers/holidayController');

router.use(authMiddleware);

router.get('/', getHolidays);
router.post('/', rbac(['admin']), createHoliday);
router.patch('/:id', rbac(['admin']), updateHoliday);
router.delete('/:id', rbac(['admin']), deleteHoliday);

module.exports = router;
