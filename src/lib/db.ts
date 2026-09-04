import mongoose, { Schema } from "mongoose";

// Connection
const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) throw new Error("MONGODB_URI not defined");
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Schemas
const ReviewSchema = new Schema(
  {
    submissionId: { type: String, required: true, unique: true },
    fileDecisions: { type: Map, of: String, default: new Map() },
    finalized: { type: Boolean, default: false },
    finalizedAt: { type: Date },
  },
  { timestamps: true }
);

const CommentSchema = new Schema(
  {
    submissionId: { type: String, required: true, index: true },
    fileId: { type: String, required: true, index: true },
    body: { type: String, required: true },
    author: { type: String, default: "You" },
    parentCommentId: { type: String },
    isRejectionReason: { type: Boolean, default: false },
  },
  { timestamps: true }
);
CommentSchema.index({ submissionId: 1, fileId: 1 });

const ActivitySchema = new Schema({
  submissionId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  finalizedAt: { type: Date, default: Date.now },
  approvedFileIds: { type: [String], default: [] },
  rejectedFileIds: { type: [String], default: [] },
});

// Models (avoid recompilation in dev)
export const Review =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);
export const Comment =
  mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
export const Activity =
  mongoose.models.Activity || mongoose.model("Activity", ActivitySchema);
