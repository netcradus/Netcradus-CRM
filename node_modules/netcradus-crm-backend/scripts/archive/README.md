# Script Archive

This directory contains one-off migration scripts that have been executed to harden the CRM schema.

## Scripts

### migrateSalarySlips.js
- **Purpose**: Extracts `salarySlips` arrays from the `Contact` model into the standalone `SalarySlip` collection.
- **Run Date**: 2026-05-04
- **Status**: Executed. Do not delete until production migration is verified.

### migratePasswordHistory.js
- **Purpose**: Extracts `previousPasswords` arrays from the `User` model into the standalone `PasswordHistory` collection.
- **Run Date**: 2026-05-04
- **Status**: Executed. Do not delete until production migration is verified.

---
**Note**: These scripts are kept for record-keeping and possible re-runs during staging/production deployment phases.
