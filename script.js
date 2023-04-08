var licenseKey, id, ticketData;

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
  } else {
    ticketFetch = await fetch("users/" + id)
      .then(response => {
        if (response.status == 404) {
          l1.innerText = "Invalid OneLicense";
          l2.innerText = "Your OneLicense has expired. Please purchase a OneTravel subscription to continue.";
          throw new Error();
        }
        return response
      })
      .then(response => response.text())

    l1.innerText = "Active OneLicense"
    l2.innerHTML = `You have an active OneTravel subscription. Your user ID is <b>${id}</b> and your OneLicense key is <b>${licenseKey}</b>`
    if (adminKey == id) {
      document.getElementById("admin").style.display = "block";
    }
    userData = JSON.parse(aesDecrypt(ticketFetch, licenseKey, id));
    ticketData = userData.ticket;

    tiles.style.display = "block";
    license.style.display = "none";

    document.querySelector("#onelicensetype").innerText = userData.plan;
    document.querySelector("#ticket-heading").innerText = userData.ticket.name;
    document.querySelector("#ticket-text").innerText = userData.ticket.validity;
    document.querySelector("#ticket-date").innerText = "Expires: " + userData.ticket.expiry;
    new QRCode(document.getElementById("ticket-qr"), {
      text: userData.ticket.qrdata,
      width: 220,
      height: 220,
      colorDark: "#000000",
      colorLight: "#ffffff"
    });
  }
};