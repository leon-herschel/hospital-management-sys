// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.deleteUser = functions.https.onCall(async (data, context) => {
  console.log('Delete user function called with data:', data);
  console.log('Context auth:', context.auth ? 'authenticated' : 'not authenticated');

  // Check authentication
  if (!context.auth) {
    console.error('Unauthenticated request');
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to perform this action.');
  }

  const { userId } = data;
  const callerUid = context.auth.uid;

  // Validate input
  if (!userId) {
    console.error('No userId provided');
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
  }

  try {
    // Get caller's data to verify admin privileges
    console.log('Checking caller permissions for UID:', callerUid);
    const callerSnapshot = await admin.database().ref(`users/${callerUid}`).once('value');
    const callerData = callerSnapshot.val();
    
    console.log('Caller data:', callerData);

    // Check if caller is admin
    if (!callerData || callerData.role !== 'admin') {
      console.error('Permission denied - caller is not admin');
      throw new functions.https.HttpsError('permission-denied', 'Only administrators can delete users.');
    }

    // Check if target user exists in database
    console.log('Checking if target user exists:', userId);
    const targetUserSnapshot = await admin.database().ref(`users/${userId}`).once('value');
    const targetUserData = targetUserSnapshot.val();
    
    if (!targetUserData) {
      console.error('Target user not found in database');
      throw new functions.https.HttpsError('not-found', 'User not found in database.');
    }

    console.log('Target user data:', targetUserData);

    // Prevent deletion of admin users from Admin department
    if (targetUserData.role === 'admin' && targetUserData.department === 'Admin') {
      console.error('Attempted to delete protected admin user');
      throw new functions.https.HttpsError('permission-denied', 'Cannot delete admin users from Admin department.');
    }

    // Delete from Firebase Authentication first
    console.log('Deleting user from Firebase Auth:', userId);
    try {
      await admin.auth().deleteUser(userId);
      console.log('Successfully deleted user from Auth');
    } catch (authError) {
      console.error('Error deleting from Auth:', authError);
      // If user doesn't exist in Auth, log it but continue with database deletion
      if (authError.code !== 'auth/user-not-found') {
        throw new functions.https.HttpsError('internal', `Failed to delete from Auth: ${authError.message}`);
      }
      console.log('User not found in Auth, continuing with database deletion');
    }

    // Delete from Realtime Database
    console.log('Deleting user from database:', userId);
    await admin.database().ref(`users/${userId}`).remove();
    console.log('Successfully deleted user from database');

    console.log('User deletion completed successfully');
    return { 
      success: true, 
      message: 'User deleted successfully from both Authentication and Database.',
      deletedUserId: userId
    };

  } catch (error) {
    console.error('Error in deleteUser function:', error);
    
    // Re-throw HttpsErrors as-is
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Convert other errors to internal errors
    throw new functions.https.HttpsError('internal', `Failed to delete user: ${error.message}`);
  }
});