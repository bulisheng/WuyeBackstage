const KEY = 'sxwy_auth_state';

function getAuthState() {
	try {
		return wx.getStorageSync(KEY) || null;
	} catch (err) {
		return null;
	}
}

function setAuthState(state) {
	const next = Object.assign({ savedAt: Date.now() }, state || {});
	wx.setStorageSync(KEY, next);
	return next;
}

function clearAuthState() {
	try {
		wx.removeStorageSync(KEY);
	} catch (err) {
		// ignore
	}
}

function isAuthed() {
	const state = getAuthState();
	return !!(state && state.isAuthed && state.token);
}

function isOwnerAuthed() {
	const state = getAuthState();
	return !!(state && state.isAuthed && state.statusCode === 'approved' && state.token);
}

function saveAuthFromProfile(profile = {}) {
	if (!profile || (!profile.isAuthed && !profile.isLoggedIn)) return null;
	const currentCommunity = profile.currentCommunity || null;
	return setAuthState({
		isAuthed: !!profile.isAuthed,
		isLoggedIn: !!profile.isLoggedIn || !!profile.isAuthed,
		token: profile.token || '',
		loginAt: profile.loginAt || Date.now(),
		statusCode: profile.statusCode || 'pending',
		schemaName: profile.schemaName || (currentCommunity && currentCommunity.schemaName) || '',
		currentCommunity: currentCommunity ? Object.assign({}, currentCommunity, {
			schemaName: currentCommunity.schemaName || profile.schemaName || ''
		}) : null,
		user: profile.user || {},
		houses: profile.houses || []
	});
}

module.exports = {
	getAuthState,
	setAuthState,
	clearAuthState,
	isAuthed,
	isOwnerAuthed,
	isLoggedIn: function () {
		const state = getAuthState();
		return !!(state && state.isLoggedIn && state.token);
	},
	saveAuthFromProfile
};
