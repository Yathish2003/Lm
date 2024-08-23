document.addEventListener('DOMContentLoaded', function () {
    const copyButton = document.getElementById('copyButton');
    const imageUrlInput = document.getElementById('imageUrl');

    if (copyButton && imageUrlInput) {
        copyButton.addEventListener('click', function () {
            imageUrlInput.select();
            document.execCommand('copy');
            alert('URL copied');
           
        });
    }
});
