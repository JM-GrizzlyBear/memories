export class CommentNotFoundError extends Error {
  constructor() {
    super("Comment not found");
    this.name = "CommentNotFoundError";
  }
}

export class NotAllowedToDeleteCommentError extends Error {
  constructor() {
    super("You can only delete your own comments, or comments on your memories");
    this.name = "NotAllowedToDeleteCommentError";
  }
}
