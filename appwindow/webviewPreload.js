window.addEventListener("keydown", function(e) {
    if (e.key == "r" && e.ctrlKey) {
        e.preventDefault();
        location.reload();
    }
});