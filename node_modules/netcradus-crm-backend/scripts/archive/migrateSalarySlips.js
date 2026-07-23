const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Contact = require("../models/Contact");
const SalarySlip = require("../models/SalarySlip");

const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

const migrateSalarySlips = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for SalarySlips migration.");

    const contacts = await Contact.find({ salarySlips: { $exists: true, $ne: [] } });
    console.log(`Found ${contacts.length} contacts with salary slips to migrate.`);

    let totalMigrated = 0;

    for (const contact of contacts) {
      if (contact.salarySlips && contact.salarySlips.length > 0) {
        const slipDocs = contact.salarySlips.map((slip) => ({
          contactId: contact._id,
          filename: slip.filename,
          path: slip.path,
          uploadedAt: slip.uploadedAt,
          month: slip.month,
          year: slip.year,
          payDate: slip.payDate,
          basicSalary: slip.basicSalary,
          hra: slip.hra,
          conveyance: slip.conveyance,
          bonus: slip.bonus,
          specialAllowance: slip.specialAllowance,
          providentFund: slip.providentFund,
          professionalTax: slip.professionalTax,
          otherDeductions: slip.otherDeductions,
          grossPay: slip.grossPay,
          netPay: slip.netPay,
          notes: slip.notes,
          generatedBy: slip.generatedBy,
        }));

        await SalarySlip.insertMany(slipDocs);
        totalMigrated += slipDocs.length;
        
        // Unset salarySlips field from the contact
        await Contact.updateOne({ _id: contact._id }, { $unset: { salarySlips: "" } });
      }
    }

    console.log(`Migration complete. Migrated ${totalMigrated} salary slips records.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

migrateSalarySlips();
