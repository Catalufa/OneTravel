var licenseKey, id;

const adminKey = "E8-8znGbtJbQMv3B";

const tiles = document.querySelector(".front-tiles");
const license = document.querySelector(".front-license");
const ticket = document.querySelector(".front-ticket");
const admin = document.querySelector(".front-admin");

document.querySelector(".front-intro").addEventListener("click", function() {
  tiles.style.display = "block";
  license.style.display = "none";
  ticket.style.display = "none";
  admin.style.display = "none";
})

document.getElementById("license").addEventListener("click", function() {
  tiles.style.display = "none";
  license.style.display = "block";
})

document.getElementById("ticket").addEventListener("click", function() {
  tiles.style.display = "none";
  ticket.style.display = "flex";
})

document.querySelector("#ticket-close").addEventListener("click", function() {
  tiles.style.display = "block";
  ticket.style.display = "none";
})

document.getElementById("admin").addEventListener("click", function() {
  tiles.style.display = "none";
  admin.style.display = "flex";
})

window.onload = async function() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  licenseKey = urlParams.get('license');
  id = urlParams.get('id');
  if (licenseKey) {
    window.localStorage.setItem("license", licenseKey)
    window.localStorage.setItem("id", id)
    window.location.href = window.location.href.split("?")[0];
  } else {
    licenseKey = window.localStorage.getItem("license")
    id = window.localStorage.getItem("id")
  }
  const l1 = document.querySelector("#license-heading");
  const l2 = document.querySelector("#license-text");
  if (!licenseKey) {
    l1.innerText = "No OneLicense Detected"
    l2.innerText = "You don't have an active OneTravel subscription. To activate your license, click the activation link."
  } else if (!window.navigator.onLine) {
    tiles.style.display = "block";
    license.style.display = "none";
    l1.innerText = "Offline mode"
    l2.innerHTML = `As you're offline, your OneLicense may be outdated. Your saved user ID is <b>${id}</b> and your OneLicense key is <b>${licenseKey}</b>`
    var offlineData = JSON.parse(localStorage.getItem("offline"));
    offlineData.plan += " - Offline"
    updatePage(offlineData)
  } else {
    ticketFetch = await fetch("https://api.github.com/repos/Catalufa/OneTravel/contents/users/" + id + "?t=" + Date.now())
      .then(response => {
        if (response.status == 404) {
          l1.innerText = "Invalid OneLicense";
          l2.innerText = "Your OneLicense has expired. Please purchase a OneTravel subscription to continue.";
          throw new Error();
        }
        return response
      })
      .then(response => response.json())
      .then(data => atob(data.content))

    l1.innerText = "Active OneLicense"
    l2.innerHTML = `You have an active OneTravel subscription. Your user ID is <b>${id}</b> and your OneLicense key is <b>${licenseKey}</b>`
    if (adminKey == id) {
      document.getElementById("admin").style.display = "block";
    }
    userData = JSON.parse(aesDecrypt(ticketFetch, licenseKey, id));
    localStorage.setItem("offline", JSON.stringify(userData))

    tiles.style.display = "block";
    license.style.display = "none";

    updatePage(userData)

  }
};

function updatePage(userData) {
  document.querySelector("#dashboard-heading").innerText = userData.username.split(" ")[0] + "'s Dashboard";
  new QRCode(document.getElementById("ticket-qr"), {
    text: userData.ticket.qrdata,
    width: 220,
    height: 220,
    colorDark: "#000000",
    colorLight: "#ffffff"
  });
  document.querySelector("#onelicensetype").innerText = userData.plan;
  document.querySelector("#ticket-heading").innerText = userData.ticket.name;
  document.querySelector("#ticket-text").innerText = userData.ticket.validity;
  var expiry = new Date(userData.ticket.expiry);
  document.querySelector("#ticket-date").innerText = "Carnet is valid till " + expiry.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });

  var _second = 1000;
  var _minute = _second * 60;
  var _hour = _minute * 60;
  var _day = _hour * 24;
  var timer;

  function showRemaining() {
    var now = new Date();
    var distance = expiry - now;
    if (distance < 0) {
      clearInterval(timer);
      return;
    }
    var days = Math.floor(distance / _day);
    var hours = Math.floor((distance % _day) / _hour);
    var minutes = Math.floor((distance % _hour) / _minute);
    var seconds = Math.floor((distance % _minute) / _second);

    var o = document.querySelectorAll(".ticket-timer-live h3");
    o[0].innerHTML = days;
    o[1].innerHTML = hours;
    o[2].innerHTML = minutes;
    o[3].innerHTML = seconds;
  }

  timer = setInterval(showRemaining, 1000);
}