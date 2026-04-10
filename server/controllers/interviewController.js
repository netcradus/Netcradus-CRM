const Interview = require("../models/Interview");

const populateInterviewUsers = (query) =>
  query.populate("createdBy", "name role email").populate("updatedBy", "name role email");

exports.listInterviews = async (req, res) => {
  try {
    const interviews = await populateInterviewUsers(
      Interview.find().sort({ updatedAt: -1, createdAt: -1 })
    );

    return res.json({ data: interviews });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load interviews",
      error: error.message,
    });
  }
};

exports.createInterview = async (req, res) => {
  try {
    const interview = await Interview.create({
      ...req.body,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    const savedInterview = await populateInterviewUsers(Interview.findById(interview._id));
    return res.status(201).json({
      message: "Interview record created successfully",
      data: savedInterview,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to create interview record",
      error: error.message,
    });
  }
};

exports.updateInterview = async (req, res) => {
  try {
    const updatedInterview = await populateInterviewUsers(
      Interview.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          updatedBy: req.user?._id,
        },
        { new: true, runValidators: true }
      )
    );

    if (!updatedInterview) {
      return res.status(404).json({ message: "Interview record not found" });
    }

    return res.json({
      message: "Interview record updated successfully",
      data: updatedInterview,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update interview record",
      error: error.message,
    });
  }
};

exports.deleteInterview = async (req, res) => {
  try {
    const deletedInterview = await Interview.findByIdAndDelete(req.params.id);

    if (!deletedInterview) {
      return res.status(404).json({ message: "Interview record not found" });
    }

    return res.json({ message: "Interview record deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete interview record",
      error: error.message,
    });
  }
};
