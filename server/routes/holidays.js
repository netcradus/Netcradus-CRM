const express = require('express');
const router = express.Router();
const rbac = require('../middleware/rbac');
const {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} = require('../controllers/holidayController');

router.get('/', getHolidays);
router.post('/', rbac(['super_user', 'hr']), createHoliday);
router.patch('/:id', rbac(['super_user', 'hr']), updateHoliday);
router.delete('/:id', rbac(['super_user', 'hr']), deleteHoliday);

module.exports = router;
