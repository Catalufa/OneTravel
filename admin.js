import QrScanner from './qr-scanner.min.js';
import { Octokit } from "https://cdn.skypack.dev/octokit";

const octokit = new Octokit({
  auth: localStorage.getItem("token"),
});

const owner = "Catalufa";
const repo = "OneTravel";

async function upload(filePath, fileContents) {
  // Use the Octokit API to get the SHA of the file, if it exists
  octokit.rest.repos.getContent({
    owner: owner,
    repo: repo,
    path: filePath,
  })
    .then(({ data }) => {
      // If the file exists, update its contents
      const fileSha = data.sha;
      octokit.rest.repos.createOrUpdateFileContents({
        owner: owner,
        repo: repo,
        path: filePath,
        message: "Update file",
        content: btoa(fileContents),
        sha: fileSha,
      });
    })
    .catch(() => {
      // If the file does not exist, create it
      octokit.rest.repos.createOrUpdateFileContents({
        owner: owner,
        repo: repo,
        path: filePath,
        message: "Create file",
        content: btoa(fileContents),
      });
    });
}

async function get(filePath) {
  const { data } = await octokit.rest.repos.getContent({
    owner: owner,
    repo: repo,
    path: filePath
  });

  const content = data.content;
  const decodedContent = atob(content);
  return decodedContent;
}

var qrOn = false;
const container = document.querySelector(".admin-qr-container")
const play = container.querySelector("i")
const video = container.querySelector("video")
const data = document.querySelector("#admin-qr-text")

const qrScanner = new QrScanner(
  video,
  result => {
    data.value = result.data;
    container.click();
  },
  {
    returnDetailedScanResult: true
  }
);

container.addEventListener("click", function() {
  if (qrOn) {
    qrScanner.stop();
    video.style.opacity = "0";
    play.style.display = "block";
    qrOn = false;
  } else {
    qrScanner.start();
    video.style.opacity = "1";
    play.style.display = "none";
    qrOn = true;
  }
})


const table = document.querySelector(".admin-table");

async function getTableData() {
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }
  const m = await get("master")
  const masterData = JSON.parse(aesDecrypt(m, licenseKey, id));
  for (let x of masterData) {
    const user = await get("users/" + x[0])
    const u = JSON.parse(aesDecrypt(user, x[1], x[0]))
    addRow([u.username, u.plan, u.ticket.expiry])
  }
}

document.querySelector("#admin").addEventListener("click", function() {
  getTableData();
});

document.querySelector("#admin-refresh-table").addEventListener("click", function() {
  getTableData();
});

function addRow(data, buttonMsg = "Go") {

  var newItem = document.createElement("tr");
  newItem.innerHTML = `
            <td>
              <div>${data[0]}</div>
            </td>
            <td>
              <div>${data[1]}</div>
            </td>
            <td>
              <div>${data[2]}</div>
            </td>
            <td><button>${buttonMsg}</button></td>`
  table.appendChild(newItem)
}

document.querySelector("#admin-new-user").addEventListener("click", function() {
  addUser(prompt("username"), prompt("plan"))
})

const updateToken = document.querySelector("#admin-token");
const token = localStorage.getItem("token");
updateToken.value = token;
document.querySelector("#admin-token-update").addEventListener("click", function() {
  localStorage.setItem("token", updateToken.value);
  window.location.reload();
})

async function addUser(username, plan) {
  const newData = { username, plan, ticket: { name: null, validity: null, expiry: null, qrdata: null, notes: null } }
  const enc = aesEncrypt(JSON.stringify(newData))
  upload("users/" + enc.iv, enc.data)
  const master = await get("master")
  var newMaster = JSON.parse(aesDecrypt(master, licenseKey, id))
  newMaster.push([enc.iv, enc.key])
  upload("master", aesEncrypt(JSON.stringify(newMaster), licenseKey, id).data)
}