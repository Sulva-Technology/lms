export interface DiscussionPayload {
  courseSectionId: string;
  title: string;
  body: string;
}

export interface DiscussionReplyPayload {
  discussionId: string;
  body: string;
}
