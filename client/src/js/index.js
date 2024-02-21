// JS FOR MAIN PAGE (index.html)
const addressUser = sessionStorage.getItem('username');
document.getElementById('username').textContent = addressUser;
document.getElementById('username').style.fontWeight = '700';

function chooseQuote() {
    var quotes = [
        `“We are what we repeatedly do. Excellence then is not an act but a habit.” -Aristotle`,
        `“Success is not final; failure is not fatal: It is the courage to continue that counts.” -Winston Churchill`,
        `“The body achieves what the mind believes.” -Napoleon Hill`,
        `“Dead last finish is greater than did not finish, which trumps did not start.” -Unknown`,
        `“All progress takes place outside the comfort zone.” -Michael John Bobak`,
        `“Motivation is what gets you started. Habit is what keeps you going.” -Jim Ryun`
    ]

    var quoteNum = Math.floor(Math.random() * quotes.length);
    console.log(quoteNum);
    console.log(quotes[quoteNum]);
    typing(quotes[quoteNum], 0);

}

document.addEventListener("DOMContentLoaded", (event) => {
    chooseQuote();
});

function typing(txt, position) {
    if (position < txt.length) {
        document.getElementById("inspire").innerHTML += txt.charAt(position);
        position++;
        setTimeout(function () {
            typing(txt, position);
        }, 35);
    }
}

const cardioBtn = document.getElementById("cardio");
const weightliftingBtn = document.getElementById("weightlifting");
const cardioPic = document.getElementById("cardioBg");
const weightPic = document.getElementById("weightBg");

weightliftingBtn.addEventListener("mouseover", function() {
    weightPic.style.display = "block";
    cardioPic.style.display = "none";
})

cardioBtn.addEventListener("mouseover", function() {
    weightPic.style.display = "none";
    cardioPic.style.display = "block";
})
