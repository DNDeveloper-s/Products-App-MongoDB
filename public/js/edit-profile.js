let editBtns = document.querySelectorAll('.user__details button');
let editInputs = document.querySelectorAll('.user__details input');
let editTextArea = document.querySelector('.user__details textarea');
let details = document.querySelector('.details');
document.addEventListener('click', e => {
    let isValidTargetBtn = e.target.classList.contains('user__edit-btn') || e.target.classList.contains('user_input');
    if(!isValidTargetBtn) {
        editInputs.forEach(cur => {
            cur.setAttribute('readonly', true);
            cur.classList.remove('focus');
            cur.nextElementSibling.classList.remove('clicked');
        });
        editTextArea.setAttribute('readonly', true);
        editTextArea.classList.remove('focus');
        editTextArea.nextElementSibling.classList.remove('clicked');
    } else {
        e.preventDefault();
        e.target.classList.add('clicked');
        const targetInput = e.target.previousElementSibling;
        targetInput.classList.add('focus');
        targetInput.removeAttribute('readonly');
        targetInput.focus();
    }
});

const uploadDp = btn => {
    const file = btn.files;
    const label = btn.parentNode.querySelector('.dp__name');
    console.log(file);
    if(file.length > 0) {
        btn.classList.add('active');
        label.innerHTML = file[0].name;
    } else {
        btn.classList.remove('active');
        label.innerHTML = '';
    }
};