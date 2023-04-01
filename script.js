var licenseKey, id, ticketData;

const tiles = document.querySelector(".front-tiles");
const license = document.querySelector(".front-license");
const ticket = document.querySelector(".front-ticket");

document.querySelector(".front-intro").addEventListener("click", function() {
  tiles.style.display = "block";
  license.style.display = "none";
  ticket.style.display = "none";
})

document.getElementById("license").addEventListener("click", function() {
  tiles.style.display = "none";
  license.style.display = "block";
})

document.getElementById("ticket").addEventListener("click", function() {
  tiles.style.display = "none";
  ticket.style.display = "flex";
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
    l1.innerText = "Active OneLicense"
    l2.innerHTML = `You have an active OneTravel subscription. Your user ID is <b>${id}</b> and your OneLicense key is <b>${licenseKey}</b>`
    tiles.style.display = "block";
    license.style.display = "none";
    ticketFetch = await fetch("tickets/" + id)
      .then(response => response.text());
    ticketData = JSON.parse(aesDecrypt(ticketFetch, licenseKey, id));
    document.querySelector("#onelicensetype").innerText = ticketData[0];
    document.querySelector("#ticket-heading").innerText = ticketData[1];
    document.querySelector("#ticket-text").innerText = ticketData[2];
    document.querySelector("#ticket-date").innerText = "Expires: " + ticketData[3];
    new QRCode(document.getElementById("ticket-qr"), {
    	text: ticketData[4],
    	width: 220,
    	height: 220,
    	colorDark : "#000000",
    	colorLight : "#ffffff"
    });
  }
};