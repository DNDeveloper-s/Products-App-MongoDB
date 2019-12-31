const deleteProduct = async (btn) => {
    const prodId = btn.parentNode.querySelector('[name="productId"]').value;
    const csrfToken = btn.parentNode.querySelector('[name="_csrf"]').value;

    try {
        const result = await fetch(`/admin/product/${prodId}`, {
            method: 'DELETE',
            headers: {
                'csrf-token': csrfToken
            }
        });
        const data = await result.json();
        btn.parentNode.parentNode.remove();
        popMessage('Product Deleted Succesfully!');
        console.log(data);
    } catch (err) {
        console.log(err);
    }
};

const addToCart = async (btn) => {
    let csrfToken = btn.parentNode.querySelector('[name="_csrf"]').value;
    const prodId = btn.dataset.prodid;
    const backDrop = `<div class="back-drop"></div>`;
    const loadSpinner = `<div class="loading-spinner"><div class="spinner spinner-2"><div class="ccl-1"></div><div class="ccl-2"></div></div></div>`;
    const targetProduct = btn.closest('.product');
    const showLoader = !(btn.closest('main').dataset.id === 'detailsPage');
    let backDropEl;

    // console.log(showLoader);

    // if(showLoader) {
    //     targetProduct.insertAdjacentHTML('afterbegin', backDrop);
    //     targetProduct.insertAdjacentHTML('afterbegin', loadSpinner);
    //     backDropEl = targetProduct.querySelector('.back-drop')
    // }

    btn.classList.add('loading');
    btn.classList.add('hold');
    btn.closest('.product-btn').setAttribute('style', 'opacity: 1; margin-top: -30px');

    const removeAddedStuff = function () {
        if(targetProduct.querySelector('.loading-spinner')) {
            targetProduct.querySelector('.loading-spinner').remove();
        }
        targetProduct.classList.remove('disableHover');
        if(targetProduct.querySelector('.added-to-cart')) {
            targetProduct.querySelector('.added-to-cart').remove();
        }
        backDropEl.remove();
    };

    try {
        const result = await fetch(`/cart/${prodId}`, {
            method: "POST",
            headers: {
                'csrf-token': csrfToken
            }
        });
        // console.log(result);
        const data = await result.json();
        // console.log(data);

        btn.closest('.product-btn').removeAttribute('style');
        btn.classList.remove('loading');
        btn.classList.remove('hold');


        if(data.errors && data.errors.length > 0) {
            // if(showLoader) {
            //     removeAddedStuff();
            // }
            throw new Error(data.errors[0]);
        }

        const insertedEl = addThis(data);
        // const num = Math.ceil(Math.random() * 20);
        // console.log(`timer ${num} added`);
        setTimeout(() => {
            // console.log(`timer ${num} removed`);
            removeThis(insertedEl);
        }, 7000);

        // Manipulating Dom for adding the product added template to the specific product
        if(showLoader) {
            const addedToCart = `<div class="added-to-cart animItManually"><h4>Product Added!</h4><button class="undo-btn" type="button">Undo</button><div class="loader"></div></div>`;
            // targetProduct.querySelector('.loading-spinner').remove();
            targetProduct.insertAdjacentHTML('afterbegin', backDrop);
            backDropEl = targetProduct.querySelector('.back-drop');
            targetProduct.insertAdjacentHTML('afterbegin', addedToCart);
            targetProduct.classList.add('disableHover');
        }

        if(showLoader) {
            let timer = setTimeout(() => {
                removeAddedStuff();
            },3300);

            const undoBtn = targetProduct.querySelector('.undo-btn');
            csrfToken = targetProduct.dataset.csrftoken;

            if(!undoBtn) {
                throw new Error('Something went wrong, Try Reloading the page!');
            }
            undoBtn.addEventListener('click', () => {
                targetProduct.insertAdjacentHTML('afterbegin', loadSpinner);
                targetProduct.querySelector('.added-to-cart').remove();
                clearTimeout(timer);
                deleteCartItem({
                    prodId: prodId,
                    csrfToken: csrfToken,
                    cb: removeAddedStuff
                });
            });


            backDropEl.addEventListener('click', () => {
                clearTimeout(timer);
                removeAddedStuff();
            });
        }
    } catch(err) {
        console.log(err);
        const insertedErrorEl = addThis(err, true);

        setTimeout(() => {
            removeThis(insertedErrorEl);
        }, 7000);
    }
};

const removeCartItemFromPage = function(btn, data) {
    const targetItem = btn.closest('.cart-list__item');
    targetItem.remove();
    const listItemCount = document.querySelector('.cart-list').querySelectorAll('.cart-list__item').length;
    if(listItemCount === 0) {
        const orderNowBtn = document.querySelector('.order-now-container');
        orderNowBtn.classList.remove('show');
    }
};

const deleteCartItem = async function ({prodId, csrfToken, cb}) {
            try {
                const result = await fetch(`/delete-cart-item`, {
                    method: "POST",
                    headers: {
                        'csrf-token': csrfToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        productId: prodId
                    })
                });
                const data = await result.json();
                console.log(data);
                const insertedEl = addThis(data);
                setTimeout(() => {
                    removeThis(insertedEl);
                }, 7000);
                if(typeof cb === "function") {
                    return cb();
                }
                return removeCartItemFromPage(cb, data);
            } catch (err) {
                console.log(err);
            }
        };

const insertEl = (el) => {
    const popupLane = document.querySelector('.popupLane');
    const popupLaneChildren = popupLane.querySelectorAll('.popup__container');
    let totalHeight = 0;
    popupLaneChildren.forEach(cur => {
        totalHeight += getClientRect(cur).height + 20;
    });

    popupLane.insertAdjacentHTML('afterbegin', el);
    let insertedEl = popupLane.querySelector('.popup__container');
    const elHeight = getClientRect(insertedEl).height;
    insertedEl.style.bottom = `${totalHeight + 20}px`;
    insertedEl.style.right = '20px';

    popupLane.style.height = `${totalHeight + elHeight + 20}px`;
    return insertedEl;
};

const deleteEl = (btn) => {
    const popupLane = document.querySelector('.popupLane');
    const popupLaneHeight = getClientRect(popupLane).height;
    const childToBeDeleted = btn.closest('.popup__container');
    const previousElements = [];
    let loop = btn.closest('.popup__container').previousElementSibling;
    while(loop) {
        previousElements.push(loop);
        loop = loop.previousElementSibling;
    }
    childToBeDeleted.classList.add('remove');
    setTimeout(() => {
        const childToBeDeletedHeight = getClientRect(childToBeDeleted).height;
        popupLane.style.height = `${popupLaneHeight - (childToBeDeletedHeight + 20)}px`;
        childToBeDeleted.remove();
        previousElements.forEach(cur => {
            const prevBottom = parseInt(cur.style.bottom.slice(0, -2));
            cur.style.bottom = `${prevBottom - (childToBeDeletedHeight + 20)}px`;
        });
    }, 310);
};

const getClientRect = (el) => {
    const elRect = el.getBoundingClientRect(),
        width = elRect.width,
        height = elRect.height,
        top = elRect.top,
        left = elRect.left;
    return {elRect, width, height, top, left};
};

const addThis = ({message, imageUrl}, hasError) => {
    let image = `<div></div>`;
    if(imageUrl) {
        image = `<img class="popup__img" src="${imageUrl}" alt="">`
    }
    const elToInsert = `
        <div class="popup__container ${hasError ? 'error' : ''}">
            ${image}
            <p class="popup__message">${message}</p>
            <p class="popup__close" onclick="deleteEl(this)"><img src="/images/cross.png" alt=""></p>
        </div>
    `;
    return insertEl(elToInsert);
};

const removeThis = (el, num) => {
    const popupLane = document.querySelector('.popupLane');
    const popupLaneHeight = getClientRect(popupLane).height;
    const lastChildHeight = getClientRect(el).height;

    // Checking if element is already forced to be removed then it will be not go through this process
    // console.log(`timer ${num} entered!`);
    if(parseInt(el.style.bottom.slice(0, -2)) !== 20) {
        return true;
    }

    // Actually removing the last element in the lane
    el.classList.add('remove');
    setTimeout(() => {
        el.remove();
        popupLane.style.height = `${popupLaneHeight - (lastChildHeight + 20)}px`;

        const popupLaneChildren = popupLane.querySelectorAll('.popup__container');
        popupLaneChildren.forEach(cur => {
            const prevBottom = parseInt(cur.style.bottom.slice(0, -2));
            cur.style.bottom = `${prevBottom - (lastChildHeight + 20)}px`;
        });
    }, 310);
};