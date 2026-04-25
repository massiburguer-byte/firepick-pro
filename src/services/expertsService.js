import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';

/**
 * Follow an expert tipster
 * @param {string} followerId - User ID of the follower
 * @param {string} expertId - User ID of the expert to follow
 * @returns {Promise<void>}
 */
export const followExpert = async (followerId, expertId) => {
  const followId = `${followerId}_${expertId}`;
  const followRef = doc(db, 'user_follows', followId);

  await setDoc(followRef, {
    followerId,
    expertId,
    createdAt: serverTimestamp(),
    notificationsEnabled: true
  });

  // Increment followers count on expert's user document
  const expertRef = doc(db, 'Users', expertId);
  await updateDoc(expertRef, {
    followersCount: increment(1)
  });
};

/**
 * Unfollow an expert tipster
 * @param {string} followerId - User ID of the follower
 * @param {string} expertId - User ID of the expert to unfollow
 * @returns {Promise<void>}
 */
export const unfollowExpert = async (followerId, expertId) => {
  const followId = `${followerId}_${expertId}`;
  const followRef = doc(db, 'user_follows', followId);

  await deleteDoc(followRef);

  // Decrement followers count on expert's user document
  const expertRef = doc(db, 'Users', expertId);
  await updateDoc(expertRef, {
    followersCount: increment(-1)
  });
};

/**
 * Check if a user is following an expert
 * @param {string} followerId - User ID of the follower
 * @param {string} expertId - User ID of the expert
 * @returns {Promise<boolean>}
 */
export const isFollowing = async (followerId, expertId) => {
  try {
    const snapshot = await getDocs(query(
      collection(db, 'user_follows'),
      where('followerId', '==', followerId),
      where('expertId', '==', expertId),
      limit(1)
    ));
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

/**
 * Get list of experts a user is following
 * @param {string} followerId - User ID
 * @returns {Promise<string[]>} Array of expert IDs
 */
export const getFollowingExperts = async (followerId) => {
  const q = query(
    collection(db, 'user_follows'),
    where('followerId', '==', followerId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().expertId);
};

/**
 * Get list of followers for an expert
 * @param {string} expertId - Expert user ID
 * @returns {Promise<string[]>} Array of follower IDs
 */
export const getExpertFollowers = async (expertId) => {
  const q = query(
    collection(db, 'user_follows'),
    where('expertId', '==', expertId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().followerId);
};

/**
 * Calculate expert stats for a user
 * @param {Array} userPicks - Array of pick documents for the user
 * @returns {Object} Expert stats
 */
export const calculateExpertStats = (userPicks) => {
  if (!userPicks || userPicks.length === 0) {
    return {
      isExpert: false,
      winRate: 0,
      totalProfit: 0,
      totalPicks: 0,
      completedPicks: 0,
      averageOdds: 0,
      dailyStreak: 0,
      weeklyProfit: 0
    };
  }

  const completedPicks = userPicks.filter(pick => pick.status !== 'pendiente');
  const wonPicks = completedPicks.filter(pick => pick.status === 'ganado');

  const totalProfit = completedPicks.reduce((sum, pick) => {
    if (pick.status === 'ganado') {
      return sum + (Number(pick.potentialWin) - Number(pick.stake));
    } else if (pick.status === 'perdido') {
      return sum - Number(pick.stake);
    }
    return sum;
  }, 0);

  const averageOdds = completedPicks.reduce((sum, pick) => {
    return sum + Math.abs(Number(pick.odds || 0));
  }, 0) / (completedPicks.length || 1);

  const totalPicks = userPicks.length;
  const winRate = completedPicks.length > 0 
    ? (wonPicks.length / completedPicks.length) * 100 
    : 0;

  // Calculate daily streak (consecutive days with at least one completed pick)
  const pickDates = completedPicks
    .map(pick => {
      const date = pick.createdAt?.toDate ? pick.createdAt.toDate() : new Date(pick.createdAt || 0);
      return date.toISOString().split('T')[0];
    })
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort()
    .reverse();

  let dailyStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  let checkDate = today;
  let streakBroken = false;

  for (let i = 0; i < pickDates.length && !streakBroken; i++) {
    if (pickDates[i] <= checkDate) {
      dailyStreak++;
      // Calculate previous date
      const prevDate = new Date(checkDate);
      prevDate.setDate(prevDate.getDate() - 1);
      checkDate = prevDate.toISOString().split('T')[0];
    } else {
      streakBroken = true;
    }
  }

  // Calculate weekly profit (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const weeklyProfit = completedPicks
    .filter(pick => {
      const pickDate = pick.createdAt?.toDate ? pick.createdAt.toDate() : new Date(pick.createdAt || 0);
      return pickDate >= sevenDaysAgo;
    })
    .reduce((sum, pick) => {
      if (pick.status === 'ganado') {
        return sum + (Number(pick.potentialWin) - Number(pick.stake));
      } else if (pick.status === 'perdido') {
        return sum - Number(pick.stake);
      }
      return sum;
    }, 0);

  return {
    isExpert: winRate >= 55 && totalPicks >= 20,
    winRate: Number(winRate.toFixed(1)),
    totalProfit: Number(totalProfit.toFixed(2)),
    totalPicks: totalPicks,
    completedPicks: completedPicks.length,
    averageOdds: Number(averageOdds.toFixed(1)),
    dailyStreak,
    weeklyProfit: Number(weeklyProfit.toFixed(2))
  };
};

/**
 * Get top experts based on criteria
 * @param {string} criteria - 'winRate' | 'profit' | 'followers' | 'streak'
 * @param {number} limitCount - Number of experts to return
 * @returns {Promise<Array>} Array of expert objects with stats
 */
export const getTopExperts = async (criteria = 'winRate', limitCount = 10) => {
  // This would require a more complex query system
  // For now, fetch all users with expert stats
  const q = query(
    collection(db, 'Users'),
    orderBy('followersCount', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  const experts = [];

  for (const userDoc of snapshot.docs) {
    const userData = userDoc.data();
    const userPicks = await getDocs(query(
      collection(db, 'picks'),
      where('userId', '==', userDoc.id)
    ));

    const picksArray = userPicks.docs.map(d => d.data());
    const stats = calculateExpertStats(picksArray);

    if (stats.completedPicks >= 10) { // Minimum threshold
      experts.push({
        id: userDoc.id,
        displayName: userData.displayName || userData.email?.split('@')[0] || 'Anonymous',
        ...stats,
        followersCount: userData.followersCount || 0
      });
    }
  }

  // Sort by criteria
  return experts.sort((a, b) => {
    switch (criteria) {
      case 'profit':
        return b.totalProfit - a.totalProfit;
      case 'followers':
        return b.followersCount - a.followersCount;
      case 'streak':
        return b.dailyStreak - a.dailyStreak;
      case 'winRate':
      default:
        return b.winRate - a.winRate;
    }
  }).slice(0, limitCount);
};

/**
 * Share a pick to social feed
 * @param {string} userId - User ID sharing the pick
 * @param {string} pickId - Pick ID to share
 * @param {string} message - Optional message/comment
 * @returns {Promise<string>} Social post ID
 */
export const sharePickToFeed = async (userId, pickId, message = '') => {
  const socialRef = doc(collection(db, 'social_posts'));
  
  await setDoc(socialRef, {
    userId,
    pickId,
    message,
    likes: 0,
    comments: 0,
    shares: 0,
    createdAt: serverTimestamp(),
    isPublic: true
  });

  // Log the share
  const pickRef = doc(db, 'picks', pickId);
  await updateDoc(pickRef, {
    shares: increment(1)
  });

  return socialRef.id;
};

/**
 * Like a social post
 * @param {string} userId - User ID liking the post
 * @param {string} postId - Social post ID
 * @returns {Promise<void>}
 */
export const likeSocialPost = async (userId, postId) => {
  const likeRef = doc(db, 'social_likes', `${userId}_${postId}`);
  
  try {
    // Check if already liked
    const existingLike = await getDocs(query(
      collection(db, 'social_likes'),
      where('userId', '==', userId),
      where('postId', '==', postId),
      limit(1)
    ));

    if (!existingLike.empty) {
      // Unlike if already liked
      await deleteDoc(likeRef);
      await updateDoc(doc(db, 'social_posts', postId), {
        likes: increment(-1)
      });
    } else {
      // Like the post
      await setDoc(likeRef, {
        userId,
        postId,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'social_posts', postId), {
        likes: increment(1)
      });
    }
  } catch (error) {
    console.error('Error liking post:', error);
  }
};

/**
 * Get social feed posts
 * @param {Array} followingUserIds - Array of user IDs to follow posts from
 * @param {number} limitCount - Number of posts to return
 * @returns {Promise<Array>} Array of social posts with user data
 */
export const getSocialFeed = async (followingUserIds, limitCount = 20) => {
  const q = query(
    collection(db, 'social_posts'),
    where('userId', 'in', followingUserIds.slice(0, 10)), // Firestore limits 'in' to 10 items
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  const posts = [];

  // Fetch user data for each post
  for (const postDoc of snapshot.docs) {
    const postData = postDoc.data();
    const userDoc = await getDocs(query(
      collection(db, 'Users'),
      where('__name__', '==', postData.userId),
      limit(1)
    ));

    let userData = {};
    if (!userDoc.empty) {
      userData = userDoc.docs[0].data();
    }

    // Fetch pick data
    const pickDoc = await getDocs(query(
      collection(db, 'picks'),
      where('__name__', '==', postData.pickId),
      limit(1)
    ));

    let pickData = {};
    if (!pickDoc.empty) {
      pickData = pickDoc.docs[0].data();
    }

    posts.push({
      id: postDoc.id,
      ...postData,
      user: {
        id: postData.userId,
        displayName: userData.displayName || userData.email?.split('@')[0] || 'Anonymous'
      },
      pick: pickData
    });
  }

  return posts;
};