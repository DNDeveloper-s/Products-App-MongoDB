const verifyEmail = document.querySelector('.verify-email');
const errorMessage = document.querySelector('.error_popup.success');

let verInterval = setInterval(() => {
    verifyEmail.classList.toggle('show');
}, 10000);

let errorTimeout =  setTimeout(() => {
    errorMessage.innerHTML = '';
    errorMessage.style.opacity = '0';
}, 5000);

!errorMessage ? clearTimeout(errorTimeout) : null;
!verifyEmail ? clearInterval(verInterval) : null;

const popMessage = message => {
    const errorContainer = document.querySelector('.error_popup');
    errorContainer.style.opacity = '1';
    errorContainer.classList.add('success');
    errorContainer.innerHTML = message;

    let errorTimeout =  setTimeout(() => {
        errorContainer.innerHTML = '';
        errorContainer.style.opacity = '0';
    }, 5000);

    !errorContainer ? clearTimeout(errorTimeout) : null;
};

const animateProducts = () => {
    const products = document.querySelectorAll('.products__holder .product');
    products.forEach((product, ind) => {
        product.style.animationDelay = `${(ind + 0.2) - (ind * 0.88)}s`;
    });
};

animateProducts();

const addAnimClass = () => {
    const animClasses = document.querySelectorAll(`.anim`);
    animClasses.forEach(animClass => {
        const applyToChildNodes = animClass.dataset.animtochilds || true;
        const animDirection = animClass.dataset.animdirection || 'leftToRight';
        const animDelay = animClass.dataset.animdelay || '0.2';
        const animChildDelays = (1 - animClass.dataset.animchilddelays) || 0.88;

        if(applyToChildNodes === true) {
            Object.values(animClass.children).forEach((item, ind) => {
                item.style.transition = '0s';
                item.style.opacity = '0';
                item.style.transform = `translate${animDirection === 'topToBottom' ? 'Y' : 'X'}(-20px)`;
                item.style.animation = `${animDirection} .4s ease-in-out forwards`;
                item.style.animationDelay = `${(ind + +animDelay) - (ind * animChildDelays)}s`;
                setTimeout(() => {
                    item.style.transition = 'all 0.25s ease-in-out';
                }, (ind + +animDelay) - (ind * animChildDelays))
            });
            return true;
        }
        animClass.style.opacity = '0';
        animClass.style.transform = `translate${animDirection === 'topToBottom' ? 'Y' : 'X'}(-20px)`;
        animClass.style.animation = `${animDirection} .4s ease-in-out forwards`;
        animClass.style.animationDelay = `${animDelay}s`;
    })
};

addAnimClass();

const loader = () => {
    const loaderEl = document.querySelectorAll('.loader');

    loaderEl.forEach(cur => {
        const loadingAnimation = new Moveit(cur, {
            start: '0%',
            end: '1%'
        });

        function animateLoader() {
            loadingAnimation.set({
                start: '1%',
                end: '70%',
                duration: 0.5,
                callback: function() {
                    loadingAnimation.set({
                        start: '100%',
                        end: '101%',
                        duration: 0.8,
                        follow: true,
                        callback: function () {
                            animateLoader();
                        }
                    })
                }
            })
        }
        animateLoader();
    })
};

loader();