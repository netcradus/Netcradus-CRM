// // const Deal = require("../models/Deal");

// // const normalizeRole = (role) => String(role || "").trim().toLowerCase();

// // const ensureSuperUser = (req, res) => {
// //   if (normalizeRole(req.user?.role) === "super_user") {
// //     return true;
// //   }

// //   res.status(403).json({
// //     success: false,
// //     message: "Only super users can access deals.",
// //   });
// //   return false;
// // };

// // exports.getDeals = async (req, res) => {
// //   if (!ensureSuperUser(req, res)) {
// //     return;
// //   }

// //   try {
// //     const deals = await Deal.find().sort({ createdAt: -1 });
// //     res.json({ success: true, data: deals });
// //   } catch (error) {
// //     console.error("Get Deals Error:", error.message);
// //     res.status(500).json({ success: false, message: "Server error while fetching deals", error: error.message });
// //   }
// // };

// // exports.getDeal = async (req, res) => {
// //   if (!ensureSuperUser(req, res)) {
// //     return;
// //   }

// //   try {
// //     const deal = await Deal.findById(req.params.id);
// //     if (!deal) {
// //       return res.status(404).json({ success: false, message: "Deal not found" });
// //     }
// //     res.json({ success: true, data: deal });
// //   } catch (error) {
// //     console.error("Get Deal Error:", error.message);
// //     res.status(500).json({ success: false, message: "Server error while fetching deal", error: error.message });
// //   }
// // };

// // exports.createDeal = async (req, res) => {
// //   if (!ensureSuperUser(req, res)) {
// //     return;
// //   }

// //   try {
// //     const { name, status, value, assignedTo, expectedCloseDate, sourceLead } = req.body;
// //     const newDeal = new Deal({ name, status, value, assignedTo, expectedCloseDate, sourceLead });
// //     const savedDeal = await newDeal.save();
// //     res.status(201).json({ success: true, data: savedDeal });
// //   } catch (error) {
// //     console.error("Create Deal Error:", error.message);
// //     res.status(500).json({ success: false, message: "Server error while creating deal", error: error.message });
// //   }
// // };

// // exports.updateDeal = async (req, res) => {
// //   if (!ensureSuperUser(req, res)) {
// //     return;
// //   }

// //   try {
// //     const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true });
// //     if (!deal) {
// //       return res.status(404).json({ success: false, message: "Deal not found" });
// //     }
// //     res.json({ success: true, data: deal });
// //   } catch (error) {
// //     console.error("Update Deal Error:", error.message);
// //     res.status(500).json({ success: false, message: "Server error while updating deal", error: error.message });
// //   }
// // };

// // exports.deleteDeal = async (req, res) => {
// //   if (!ensureSuperUser(req, res)) {
// //     return;
// //   }

// //   try {
// //     const deal = await Deal.findByIdAndDelete(req.params.id);
// //     if (!deal) {
// //       return res.status(404).json({ success: false, message: "Deal not found" });
// //     }
// //     res.json({ success: true, message: "Deal deleted successfully" });
// //   } catch (error) {
// //     console.error("Delete Deal Error:", error.message);
// //     res.status(500).json({ success: false, message: "Server error while deleting deal", error: error.message });
// //   }
// // };



// const Deal = require("../models/Deal");

// const normalizeRole = (role) => String(role || "").trim().toLowerCase();

// const ensureDealAccess = (req, res) => {
//   const role = normalizeRole(req.user?.role);

//   if (
//     role === "super_user" ||
//     role === "sales"
//   ) {
//     return true;
//   }

//   res.status(403).json({
//     success: false,
//     message: "Only sales and super users can access deals.",
//   });

//   return false;
// };

// exports.getDeals = async (req, res) => {
//   if (!ensureDealAccess(req, res)) {
//     return;
//   }

//   try {
//     const role = normalizeRole(req.user?.role);

//     let query = {};

//     if (role === "sales") {
//       query.status = {
//         $nin: ["Won", "Lost"],
//       };
//     }

//     if (role === "super_user") {
//       query.status = {
//         $in: ["Won", "Lost"],
//       };
//     }

//     const deals = await Deal.find(query)
//       .populate("assignedTo", "name email role")
//       .populate("dealWonBy", "name email role")
//       .sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       data: deals,
//     });
//   } catch (error) {
//     console.error("Get Deals Error:", error.message);

//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching deals",
//       error: error.message,
//     });
//   }
// };

// exports.getDeal = async (req, res) => {
//   if (!ensureDealAccess(req, res)) {
//     return;
//   }

//   try {
//     const deal = await Deal.findById(req.params.id)
//       .populate("assignedTo", "name email role")
//       .populate("dealWonBy", "name email role");
//     if (!deal) {
//       return res.status(404).json({ success: false, message: "Deal not found" });
//     }
//     res.json({ success: true, data: deal });
//   } catch (error) {
//     console.error("Get Deal Error:", error.message);
//     res.status(500).json({ success: false, message: "Server error while fetching deal", error: error.message });
//   }
// };



// exports.createDeal = async (req, res) => {
//   if (!ensureDealAccess(req, res)) {
//     return;
//   }

//   try {
//     const {
//       name,

//       clientName,
//       clientPhone,
//       clientEmail,

//       companyName,
//       businessUrl,

//       description,

//       value,
//       status,

//       expectedCloseDate,
//       sourceLead,

//       initialComment,

//       meetingLink,
//       meetingTime,
//       meetingDiscussion,

//       reminderDate,
//       reminderNote,
//     } = req.body;

//     const deal = new Deal({
//       name,

//       clientName,
//       clientPhone,
//       clientEmail,

//       companyName,
//       businessUrl,

//       description,

//       value: Number(value || 0),

//       status: status || "New",

//       assignedTo: req.user?._id || null,

//       expectedCloseDate,

//       sourceLead,

//       comments: [],

//       meetings: [],

//       reminders: [],

//       activities: [],
//     });

//     if (initialComment) {
//       deal.comments.push({
//         comment: initialComment,
//         addedBy: req.user._id,
//       });

//       deal.activities.push({
//         type: "comment",
//         message: "Initial comment added",
//         performedBy: req.user._id,
//       });
//     }

//     if (meetingLink || meetingTime || meetingDiscussion) {
//       deal.meetings.push({
//         title: "Initial Meeting",
//         meetingLink,
//         meetingTime,
//         discussion: meetingDiscussion,
//         createdBy: req.user._id,
//       });

//       deal.activities.push({
//         type: "meeting",
//         message: "Initial meeting scheduled",
//         performedBy: req.user._id,
//       });
//     }

//     if (reminderDate && reminderNote) {
//       deal.reminders.push({
//         title: reminderNote,
//         remindAt: reminderDate,
//       });

//       deal.activities.push({
//         type: "reminder",
//         message: "Reminder added",
//         performedBy: req.user._id,
//       });
//     }

//     deal.activities.push({
//       type: "deal_created",
//       message: "Deal created",
//       performedBy: req.user._id,
//     });

//     const savedDeal = await deal.save();

//     return res.status(201).json({
//       success: true,
//       data: savedDeal,
//     });
//   } catch (error) {
//     console.error("Create Deal Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Server error while creating deal",
//       error: error.message,
//     });
//   }
// };

// exports.updateDeal = async (req, res) => {
//   if (!ensureDealAccess(req, res)) {
//     return;
//   }

//   try {
//     const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!deal) {
//       return res.status(404).json({ success: false, message: "Deal not found" });
//     }
//     res.json({ success: true, data: deal });
//   } catch (error) {
//     console.error("Update Deal Error:", error.message);
//     res.status(500).json({ success: false, message: "Server error while updating deal", error: error.message });
//   }
// };

// exports.deleteDeal = async (req, res) => {
//   if (!ensureDealAccess(req, res)) {
//     return;
//   }

//   try {
//     const deal = await Deal.findByIdAndDelete(req.params.id);
//     if (!deal) {
//       return res.status(404).json({ success: false, message: "Deal not found" });
//     }
//     res.json({ success: true, message: "Deal deleted successfully" });
//   } catch (error) {
//     console.error("Delete Deal Error:", error.message);
//     res.status(500).json({ success: false, message: "Server error while deleting deal", error: error.message });
//   }
// };

// exports.addComment = async (req, res) => {
//   if (!ensureDealAccess(req, res)) {
//     return;
//   }

//   try {
//     const deal = await Deal.findById(req.params.id);

//     if (!deal) {
//       return res.status(404).json({
//         success: false,
//         message: "Deal not found",
//       });
//     }

//     deal.comments.push({
//       comment: req.body.comment,
//       addedBy: req.user._id,
//     });

//     deal.activities.push({
//       type: "comment",
//       message: "Comment added",
//       performedBy: req.user._id,
//     });

//     await deal.save();

//     res.json({
//       success: true,
//       data: deal,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// exports.addMeeting = async (req, res) => {
//   if (!ensureDealAccess(req, res)) {
//     return;
//   }

//   try {
//     const deal = await Deal.findById(req.params.id);

//     if (!deal) {
//       return res.status(404).json({
//         success: false,
//         message: "Deal not found",
//       });
//     }

//     deal.meetings.push({
//       title: req.body.title,
//       meetingLink: req.body.meetingLink,
//       meetingTime: req.body.meetingTime,
//       discussion: req.body.discussion,
//       nextAction: req.body.nextAction,
//       createdBy: req.user._id,
//     });

//     deal.activities.push({
//       type: "meeting",
//       message: `Meeting scheduled: ${req.body.title}`,
//       performedBy: req.user._id,
//     });

//     await deal.save();

//     res.json({
//       success: true,
//       data: deal,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// exports.addReminder = async (req, res) => {
//   if (!ensureDealAccess(req, res)) {
//     return;
//   }

//   try {
//     const deal = await Deal.findById(req.params.id);

//     if (!deal) {
//       return res.status(404).json({
//         success: false,
//         message: "Deal not found",
//       });
//     }

//     deal.reminders.push({
//       title: req.body.title,
//       remindAt: req.body.remindAt,
//     });

//     await deal.save();

//     res.json({
//       success: true,
//       data: deal,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


// exports.markDealWon = async (req, res) => {
//   if (!ensureDealAccess(req, res)) {
//     return;
//   }

//   try {
//     const deal = await Deal.findById(req.params.id);

//     if (!deal) {
//       return res.status(404).json({
//         success: false,
//         message: "Deal not found",
//       });
//     }

//     deal.status = "Won";
//     deal.dealWonBy = req.user._id;
//     deal.dealClosedAt = new Date();

//     deal.activities.push({
//       type: "deal_won",
//       message: "Deal marked as won",
//       performedBy: req.user._id,
//     });

//     await deal.save();

//     res.json({
//       success: true,
//       data: deal,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// exports.markDealLost = async (req, res) => {
//   if (!ensureDealAccess(req, res)) return;

//   try {
//     const deal = await Deal.findById(req.params.id);

//     if (!deal) {
//       return res.status(404).json({
//         success: false,
//         message: "Deal not found",
//       });
//     }

//     deal.status = "Lost";
//     deal.dealClosedAt = new Date();

//     deal.activities.push({
//       type: "deal_lost",
//       message: "Deal marked as lost",
//       performedBy: req.user._id,
//     });

//     await deal.save();

//     res.json({
//       success: true,
//       data: deal,
//     });
//   } catch (error) {
//     console.error("Mark Deal Lost Error:", error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };













const Deal = require("../models/Deal");

const normalizeRole = (role) => String(role || "").trim().toLowerCase();
const isClosedDeal = (deal) => {
  return ["Won", "Lost"].includes(deal.status);
};

const ensureDealAccess = (req, res) => {
  const role = normalizeRole(req.user?.role);

  if (role === "super_user" || role === "sales") {
    return true;
  }

  res.status(403).json({
    success: false,
    message: "Only sales and super users can access deals.",
  });

  return false;
};

exports.getDeals = async (req, res) => {
  if (!ensureDealAccess(req, res)) {
    return;
  }

  try {
    const role = normalizeRole(req.user?.role);

    let query = {};

    // Sales sees only their own deals (all statuses including Won/Lost)
    // Super user sees every deal
    if (role === "sales") {
      query.assignedTo = req.user._id;
    }

    const deals = await Deal.find(query)
      .populate("assignedTo", "name email role")
      .populate("dealWonBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: deals,
    });
  } catch (error) {
    console.error("Get Deals Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching deals",
      error: error.message,
    });
  }
};

exports.getDeal = async (req, res) => {
  if (!ensureDealAccess(req, res)) {
    return;
  }

  try {
    const deal = await Deal.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("dealWonBy", "name email role");

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    const role = normalizeRole(req.user?.role);

    // Sales users can only see summary of Won/Lost deals
    if (role === "sales" && ["Won", "Lost"].includes(deal.status)) {
      return res.json({
        success: true,
        data: {
          _id: deal._id,
          name: deal.name,
          status: deal.status,
          dealClosedAt: deal.dealClosedAt,
        },
      });
    }

    return res.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    console.error("Get Deal Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching deal",
      error: error.message,
    });
  }
};

exports.createDeal = async (req, res) => {
  if (!ensureDealAccess(req, res)) {
    return;
  }

  try {
    const {
      name,
      clientName,
      clientPhone,
      clientEmail,
      companyName,
      businessUrl,
      description,
      value,
      status,
      expectedCloseDate,
      sourceLead,
      initialComment,
      meetingLink,
      meetingTime,
      meetingDiscussion,
      reminderDate,
      reminderNote,
    } = req.body;

    const deal = new Deal({
      name,
      clientName,
      clientPhone,
      clientEmail,
      companyName,
      businessUrl,
      description,
      value: Number(value || 0),
      status: status || "New",
      assignedTo: req.user?._id || null,
      expectedCloseDate,
      sourceLead,
      comments: [],
      meetings: [],
      reminders: [],
      activities: [],
    });

    if (initialComment) {
      deal.comments.push({
        comment: initialComment,
        addedBy: req.user._id,
      });

      deal.activities.push({
        type: "comment",
        message: "Initial comment added",
        performedBy: req.user._id,
      });
    }

    if (meetingLink || meetingTime || meetingDiscussion) {
      deal.meetings.push({
        title: "Initial Meeting",
        meetingLink,
        meetingTime,
        discussion: meetingDiscussion,
        createdBy: req.user._id,
      });

      deal.activities.push({
        type: "meeting",
        message: "Initial meeting scheduled",
        performedBy: req.user._id,
      });
    }

    if (reminderDate && reminderNote) {
      deal.reminders.push({
        title: reminderNote,
        remindAt: reminderDate,
      });

      deal.activities.push({
        type: "reminder",
        message: "Reminder added",
        performedBy: req.user._id,
      });
    }

    deal.activities.push({
      type: "deal_created",
      message: "Deal created",
      performedBy: req.user._id,
    });

    const savedDeal = await deal.save();

    return res.status(201).json({
      success: true,
      data: savedDeal,
    });
  } catch (error) {
    console.error("Create Deal Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating deal",
      error: error.message,
    });
  }
};

exports.updateDeal = async (req, res) => {
  if (!ensureDealAccess(req, res)) {
    return;
  }

  try {
    const existingDeal = await Deal.findById(req.params.id);

    if (!existingDeal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    if (isClosedDeal(existingDeal)) {
      return res.status(400).json({
        success: false,
        message: "Closed deals cannot be modified.",
      });
    }

    const deal = await Deal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    console.error("Update Deal Error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteDeal = async (req, res) => {
  if (!ensureDealAccess(req, res)) {
    return;
  }

  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    if (isClosedDeal(deal)) {
      return res.status(400).json({
        success: false,
        message: "Closed deals cannot be deleted.",
      });
    }

    await Deal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    console.error("Delete Deal Error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addComment = async (req, res) => {
  if (!ensureDealAccess(req, res)) {
    return;
  }

  try {
    const deal = await Deal.findById(req.params.id);

if (!deal) {
  return res.status(404).json({
    success: false,
    message: "Deal not found",
  });
}

if (isClosedDeal(deal)) {
  return res.status(400).json({
    success: false,
    message: "Closed deals cannot be modified.",
  });
}

    deal.comments.push({
      comment: req.body.comment,
      addedBy: req.user._id,
    });

    deal.activities.push({
      type: "comment",
      message: "Comment added",
      performedBy: req.user._id,
    });

    await deal.save();

    res.json({ success: true, data: deal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMeeting = async (req, res) => {
  if (!ensureDealAccess(req, res)) {
    return;
  }

  try {
    const deal = await Deal.findById(req.params.id);

    if (isClosedDeal(deal)) {
  return res.status(400).json({
    success: false,
    message: "Closed deals cannot be modified.",
  });
}

    deal.meetings.push({
      title: req.body.title,
      meetingLink: req.body.meetingLink,
      meetingTime: req.body.meetingTime,
      discussion: req.body.discussion,
      nextAction: req.body.nextAction,
      createdBy: req.user._id,
    });

    deal.activities.push({
      type: "meeting",
      message: `Meeting scheduled: ${req.body.title}`,
      performedBy: req.user._id,
    });

    await deal.save();

    res.json({ success: true, data: deal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addReminder = async (req, res) => {
  if (!ensureDealAccess(req, res)) {
    return;
  }

  try {
    const deal = await Deal.findById(req.params.id);

    if (isClosedDeal(deal)) {
  return res.status(400).json({
    success: false,
    message: "Closed deals cannot be modified.",
  });
}

    deal.reminders.push({
      title: req.body.title,
      remindAt: req.body.remindAt,
    });

    await deal.save();

    res.json({ success: true, data: deal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markDealWon = async (req, res) => {
  if (!ensureDealAccess(req, res)) {
    return;
  }

  try {
    const deal = await Deal.findById(req.params.id);
    if (isClosedDeal(deal)) {
  return res.status(400).json({
    success: false,
    message: "Deal already closed.",
  });
}
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }

    deal.status = "Won";
    deal.dealWonBy = req.user._id;
    deal.dealClosedAt = new Date();

    deal.activities.push({
      type: "deal_won",
      message: "Deal marked as won",
      performedBy: req.user._id,
    });

    await deal.save();

    res.json({ success: true, data: deal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markDealLost = async (req, res) => {
  if (!ensureDealAccess(req, res)) {
    return;
  }

  try {
    const deal = await Deal.findById(req.params.id);
    if (isClosedDeal(deal)) {
  return res.status(400).json({
    success: false,
    message: "Deal already closed.",
  });
}

    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }

    deal.status = "Lost";
    deal.dealClosedAt = new Date();

    deal.activities.push({
      type: "deal_lost",
      message: "Deal marked as lost",
      performedBy: req.user._id,
    });

    await deal.save();

    res.json({ success: true, data: deal });
  } catch (error) {
    console.error("Mark Deal Lost Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};