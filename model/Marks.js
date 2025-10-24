import mongoose from "mongoose";

const marksSchema = new mongoose.Schema(
  {
    student: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Student",   // ✅ reference Student model, not User
      required: true, 
      index: true 
    },
    subject: { type: String, required: true, trim: true, index: true },
    marks: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
    examType: { type: String, enum: ["midterm", "final", "assignment", "quiz", "other"], default: "other", index: true },
    examLabel: { type: String, trim: true },
    examDate: { type: Date, default: Date.now, index: true },
    batch: { type: String, trim: true, index: true },
    semester: { type: Number, min: 1, max: 12, index: true },
    section: { type: String, trim: true, index: true }
  },
  { timestamps: true }
);

marksSchema.index({ student: 1, subject: 1, examLabel: 1 }, { unique: false });

export default mongoose.model("Marks", marksSchema);
