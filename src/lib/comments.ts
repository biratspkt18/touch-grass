import { db } from './backend';

export type SpotComment = {
  id: number;
  spot_id: number | string;
  user_id: string;
  content: string;
  created_at: string;
  /** Embedded author profile; null for deleted accounts. */
  profiles: { username: string } | null;
};

const COMMENT_SELECT = 'id, spot_id, user_id, content, created_at, profiles(username)';

/** All comments on a spot, oldest first (conversation order). */
export async function fetchComments(spotId: number | string): Promise<SpotComment[]> {
  const { data, error } = await db
    .from('Comments')
    .select(COMMENT_SELECT)
    .eq('spot_id', spotId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as unknown as SpotComment[]) || [];
}

/** Post a comment as the signed-in user and return it with its author embedded. */
export async function addComment(
  spotId: number | string,
  userId: string,
  content: string
): Promise<SpotComment> {
  const { data, error } = await db
    .from('Comments')
    .insert({ spot_id: spotId, user_id: userId, content: content.trim() })
    .select(COMMENT_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as SpotComment;
}

/** Delete one of your own comments (RLS blocks deleting anyone else's). */
export async function deleteComment(id: number): Promise<void> {
  const { error } = await db.from('Comments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
