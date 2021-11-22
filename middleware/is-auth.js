module.exports = (req, res, next) => {
    const { session: { isLoggedIn }} = req;
    if (!isLoggedIn) {
        return res.redirect('/login');
    }
    next();
}