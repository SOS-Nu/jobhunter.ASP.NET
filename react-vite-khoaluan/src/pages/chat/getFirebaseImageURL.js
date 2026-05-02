
export const getFirebaseImageUrl = (path = '', type = '') => {
    const baseURL = `https://firebasestorage.googleapis.com/v0/b/monkey-blogging-7cb78.appspot.com/o/${type}%2F`;
    const token = "9078ad10-e4e4-40d2-9837-c9bfa26ac4d4"; // Thay bằng token nếu cần

    return `${baseURL}${path}?alt=media&token=${token}`;
};