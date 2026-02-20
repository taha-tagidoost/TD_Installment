var buttons = document.querySelectorAll(".newHeadLine");
buttons.forEach(function (button) {
    var content = button.nextElementSibling;
    var icon = button.querySelector(".fa-angle-down");

    button.addEventListener("click", function () {
        if (content.classList.contains("giveContent")) {
            content.classList.remove("giveContent");
            icon.classList.remove("active");
        } else {
            content.classList.add("giveContent");
            icon.classList.add("active");
        }
    });
});