import mongoose, { type Document, type Model, Schema } from 'mongoose'

import { time } from '~/utils/time'

/** One upvote per user per game; deleting the document removes the vote (toggle semantics). */
export interface IGameVote extends Document {
  gameId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  createdAt?: string | null
}

const GameVoteSchema: Schema<IGameVote> = new Schema<IGameVote>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: () => time().toISOString(),
    },
  },
  {
    timestamps: true,
  },
)

GameVoteSchema.index({ gameId: 1, userId: 1 }, { unique: true })

const GameVote = (mongoose.models.GameVote as Model<IGameVote>) || mongoose.model<IGameVote>('GameVote', GameVoteSchema)

export default GameVote
