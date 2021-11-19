exports.get404 = (req, res, next) => {
    const { session: { isLoggedIn: isAuthenticated }} = req;
    res.status(404).render('404-not-found', {
        pageTitle: 'Page not found',
        path: undefined,
        isAuthenticated
    });
};
