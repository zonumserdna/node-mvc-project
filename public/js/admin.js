const deleteProduct = (btn) => {
    const productId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    const productEl = btn.closest('article');
    
    fetch(`/admin/product/${productId}`, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
    .then(res => res.json())
    .then(data => {
        productEl.remove();
        console.log(data);
    })
    .catch(err => console.log(err));
};